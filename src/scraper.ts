import { Browser, Page, chromium } from 'playwright';
import { SorteoQuini6, ResultadoScraping, ModalidadSorteo, NumerosSorteo } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Clase principal para el scraping de resultados del Quini 6
 */
export class Quini6Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://www.quini-6.com.ar';
  private año: number;
  private resultados: SorteoQuini6[] = [];
  private sorteosPendientes: number[] = [];
  private errores: ResultadoScraping['errores'] = [];
  private maxReintentos = 3;
  private delayEntreRequests = 2000; // 2 segundos

  /**
   * Constructor que acepta el año como parámetro
   */
  constructor(año: number = 2025) {
    this.año = año;
  }

  /**
   * Inicializa el navegador y la página
   */
  async inicializar(): Promise<void> {
    console.log('🚀 Inicializando navegador...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    this.page = await context.newPage();
    
    console.log('✅ Navegador inicializado');
  }

  /**
   * Cierra el navegador
   */
  async cerrar(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Navegador cerrado');
    }
  }

  /**
   * Obtiene todos los enlaces de sorteos del año especificado
   * Navega por cada mes para obtener todos los enlaces
   */
  async obtenerEnlacesSorteos(): Promise<string[]> {
    if (!this.page) throw new Error('Página no inicializada');

    console.log(`📋 Obteniendo lista de sorteos del año ${this.año}...`);
    
    const urlAño = `${this.baseUrl}/${this.año}/`;
    await this.page.goto(urlAño, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.delay(3000); // Esperar a que cargue completamente

    // Obtener enlaces de la página principal del año
    const enlacesSet = new Set<string>();
    const añoStr = this.año.toString();
    
    const enlacesIniciales = await this.page.evaluate((año) => {
      const links: string[] = [];
      const elementos = document.querySelectorAll('a[href*="/resultados-del-"]');
      
      elementos.forEach((el: Element) => {
        const href = (el as HTMLAnchorElement).href;
        if (href && href.includes(`/${año}/`)) {
          links.push(href);
        }
      });
      
      return links;
    }, añoStr);

    enlacesIniciales.forEach(link => enlacesSet.add(link));

    // Navegar por cada mes para obtener todos los enlaces
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    for (const mes of meses) {
      try {
        const urlMes = `${this.baseUrl}/${this.año}/${mes}/`;
        console.log(`  📅 Procesando mes ${mes}...`);
        
        await this.page.goto(urlMes, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await this.delay(2000);

        const enlacesMes = await this.page.evaluate((año) => {
          const links: string[] = [];
          const elementos = document.querySelectorAll('a[href*="/resultados-del-"]');
          
          elementos.forEach((el: Element) => {
            const href = (el as HTMLAnchorElement).href;
            if (href && href.includes(`/${año}/`)) {
              links.push(href);
            }
          });
          
          return links;
        }, añoStr);

        enlacesMes.forEach(link => enlacesSet.add(link));
        console.log(`    ✅ Encontrados ${enlacesMes.length} enlaces en ${mes}`);
      } catch (error) {
        console.warn(`    ⚠️  Error al procesar mes ${mes}:`, error instanceof Error ? error.message : 'Error desconocido');
      }
    }

    const enlaces = Array.from(enlacesSet);
    console.log(`✅ Total de enlaces únicos encontrados: ${enlaces.length}`);
    return enlaces;
  }

  /**
   * Extrae los números de una modalidad específica
   */
  private extraerNumerosModalidad(
    page: Page,
    selectorHeading: string
  ): Promise<NumerosSorteo | null> {
    return page.evaluate((headingText) => {
      // Buscar el heading que contiene el nombre de la modalidad
      const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
      let modalidadHeading: HTMLElement | null = null;

      for (const heading of headings as HTMLElement[]) {
        const texto = heading.textContent?.trim() || '';
        if (texto.includes(headingText)) {
          modalidadHeading = heading;
          break;
        }
      }

      if (!modalidadHeading) return null;

      // Buscar la lista de números después del heading
      let elemento = modalidadHeading.nextElementSibling;
      let intentos = 0;
      const maxIntentos = 10; // Limitar búsqueda para evitar loops infinitos

      while (elemento && intentos < maxIntentos) {
        intentos++;
        
        if (elemento.tagName === 'UL' || elemento.tagName === 'OL') {
          const items = Array.from(elemento.querySelectorAll('li'));
          const numeros: string[] = [];
          
          items.forEach((item: Element) => {
            const texto = item.textContent?.trim() || '';
            // Buscar números de 2 dígitos (00-45)
            const match = texto.match(/\b(\d{2})\b/);
            if (match && numeros.length < 6) {
              const num = parseInt(match[1], 10);
              if (num >= 0 && num <= 45) {
                numeros.push(match[1]);
              }
            }
          });
          
          if (numeros.length === 6) {
            return {
              numero1: numeros[0],
              numero2: numeros[1],
              numero3: numeros[2],
              numero4: numeros[3],
              numero5: numeros[4],
              numero6: numeros[5]
            };
          }
        }
        
        elemento = elemento.nextElementSibling;
      }

      return null;
    }, selectorHeading);
  }

  /**
   * Extrae información completa de un sorteo desde su URL
   */
  async extraerSorteo(url: string, reintento: number = 0): Promise<SorteoQuini6 | null> {
    if (!this.page) throw new Error('Página no inicializada');

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.delay(this.delayEntreRequests);

      // Extraer número de sorteo y fecha
      const infoBasica = await this.page.evaluate(() => {
        // Buscar el número de sorteo (formato: "Sorteo: 3333 - 24/12/2025")
        const sorteoMatch = document.body.textContent?.match(/Sorteo:\s*(\d+)\s*-?\s*(\d{1,2}\/\d{1,2}\/\d{4})?/i);
        let numeroSorteo = sorteoMatch ? parseInt(sorteoMatch[1], 10) : null;
        let fecha = sorteoMatch?.[2] || null;

        // Si no se encontró, buscar en el título
        if (!numeroSorteo || !fecha) {
          const titulo = document.querySelector('h1, h2, h3')?.textContent || '';
          const tituloMatch = titulo.match(/Sorteo:\s*(\d+)\s*-?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
          if (tituloMatch) {
            numeroSorteo = parseInt(tituloMatch[1], 10);
            fecha = tituloMatch[2];
          }
        }

        // Buscar la fecha en el formato "Resultados del 24/12/2025"
        if (!fecha) {
          const fechaMatch = document.body.textContent?.match(
            /Resultados del (\d{1,2}\/\d{1,2}\/\d{4})/i
          );
          fecha = fechaMatch ? fechaMatch[1] : null;
        }

        // Buscar en el título también
        if (!fecha) {
          const titulo = document.querySelector('h1, h2, h3')?.textContent || '';
          const fechaTitulo = titulo.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          fecha = fechaTitulo?.[1] || null;
        }

        return {
          numeroSorteo,
          fecha
        };
      });

      if (!infoBasica.numeroSorteo || !infoBasica.fecha) {
        throw new Error('No se pudo extraer número de sorteo o fecha');
      }

      // Convertir fecha DD/MM/YYYY a ISO
      const [dia, mes, año] = infoBasica.fecha.split('/');
      const fechaISO = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

      // Extraer números de cada modalidad
      const tradicional = await this.extraerNumerosModalidad(
        this.page,
        'Tradicional Primer Sorteo'
      );
      const segunda = await this.extraerNumerosModalidad(
        this.page,
        'Tradicional la Segunda'
      );
      const revancha = await this.extraerNumerosModalidad(
        this.page,
        'Quini6 Revancha'
      );
      const siempreSale = await this.extraerNumerosModalidad(
        this.page,
        'El Quini que Siempre Sale'
      );

      // Extraer información del Pozo Extra
      const pozoExtra = await this.page.evaluate(() => {
        // Buscar la tabla del POZO EXTRA
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        let pozoHeading: HTMLElement | null = null;

        for (const heading of headings as HTMLElement[]) {
          if (heading.textContent?.includes('POZO EXTRA')) {
            pozoHeading = heading;
            break;
          }
        }

        if (!pozoHeading) return null;

        // Buscar la tabla después del heading
        let elemento = pozoHeading.closest('table') || pozoHeading.parentElement;
        if (!elemento) return null;

        // Buscar en la tabla
        const tabla = elemento.querySelector('table');
        if (tabla) {
          const filas = tabla.querySelectorAll('tr');
          for (const fila of Array.from(filas) as HTMLTableRowElement[]) {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length >= 2) {
              const texto = fila.textContent || '';
              // Buscar fila con números (ganadores y premio)
              const match = texto.match(/(\d+)\s+([\d.,]+)/);
              if (match && !texto.includes('Ganadores') && !texto.includes('Premio')) {
                return {
                  ganadores: parseInt(match[1], 10),
                  premio: match[2].trim()
                };
              }
            }
          }
        }

        // Fallback: buscar en el texto
        const pozoText = document.body.textContent || '';
        const pozoMatch = pozoText.match(/POZO EXTRA[\s\S]{0,500}?(\d+)[\s\S]{0,200}?([\d.,]+)/i);
        
        if (pozoMatch) {
          return {
            ganadores: parseInt(pozoMatch[1], 10),
            premio: pozoMatch[2].trim()
          };
        }
        return null;
      });

      if (!tradicional || !segunda || !revancha || !siempreSale) {
        throw new Error('No se pudieron extraer todos los números de las modalidades');
      }

      const sorteo: SorteoQuini6 = {
        numeroSorteo: infoBasica.numeroSorteo,
        fecha: infoBasica.fecha,
        fechaISO,
        tradicional: {
          nombre: 'Tradicional Primer Sorteo',
          numeros: tradicional
        },
        segunda: {
          nombre: 'Tradicional la Segunda',
          numeros: segunda
        },
        revancha: {
          nombre: 'Quini6 Revancha',
          numeros: revancha
        },
        siempreSale: {
          nombre: 'El Quini que Siempre Sale',
          numeros: siempreSale
        },
        pozoExtra: pozoExtra || undefined,
        url,
        extraidoEn: new Date().toISOString()
      };

      console.log(`✅ Sorteo #${sorteo.numeroSorteo} extraído: ${sorteo.fecha}`);
      return sorteo;

    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ Error al extraer sorteo de ${url} (reintento ${reintento + 1}):`, mensajeError);

      if (reintento < this.maxReintentos) {
        console.log(`🔄 Reintentando en ${(reintento + 1) * 2} segundos...`);
        await this.delay((reintento + 1) * 2000);
        return this.extraerSorteo(url, reintento + 1);
      }

      // Intentar extraer al menos el número de sorteo para marcarlo como pendiente
      try {
        if (this.page) {
          const infoBasica = await this.page.evaluate(() => {
            const sorteoMatch = document.body.textContent?.match(/Sorteo:\s*(\d+)/i);
            return sorteoMatch ? parseInt(sorteoMatch[1], 10) : null;
          });
          if (infoBasica) {
            this.sorteosPendientes.push(infoBasica);
          }
        }
      } catch {
        // Ignorar errores al intentar extraer número de sorteo
      }

      this.errores.push({
        error: mensajeError,
        timestamp: new Date().toISOString()
      });

      return null;
    }
  }

  /**
   * Procesa todos los sorteos del año especificado
   */
  async procesarTodosLosSorteos(): Promise<ResultadoScraping> {
    console.log(`🎯 Iniciando extracción de sorteos del año ${this.año}...`);

    const enlaces = await this.obtenerEnlacesSorteos();
    
    if (enlaces.length === 0) {
      throw new Error('No se encontraron enlaces de sorteos');
    }

    // Ordenar enlaces para procesarlos en orden cronológico
    enlaces.sort();

    console.log(`📊 Procesando ${enlaces.length} sorteos...`);

    for (let i = 0; i < enlaces.length; i++) {
      const enlace = enlaces[i];
      console.log(`\n[${i + 1}/${enlaces.length}] Procesando: ${enlace}`);
      
      const sorteo = await this.extraerSorteo(enlace);
      
      if (sorteo) {
        this.resultados.push(sorteo);
      }

      // Pequeña pausa entre requests para no sobrecargar el servidor
      if (i < enlaces.length - 1) {
        await this.delay(this.delayEntreRequests);
      }
    }

    // Ordenar resultados por número de sorteo
    this.resultados.sort((a, b) => a.numeroSorteo - b.numeroSorteo);

    const resultado: ResultadoScraping = {
      año: this.año,
      totalSorteos: this.resultados.length,
      sorteos: this.resultados,
      sorteosPendientes: [...new Set(this.sorteosPendientes)].sort((a, b) => a - b),
      errores: this.errores,
      fechaInicio: this.resultados.length > 0 ? this.resultados[0].fechaISO : '',
      fechaFin: this.resultados.length > 0 ? this.resultados[this.resultados.length - 1].fechaISO : '',
      metadata: {
        version: '1.0.0',
        fechaExtraccion: new Date().toISOString()
      }
    };

    return resultado;
  }

  /**
   * Guarda los resultados en un archivo JSON
   * El nombre del archivo incluye el año para evitar sobrescribir archivos de otros años
   */
  async guardarResultados(resultado: ResultadoScraping): Promise<void> {
    const directorioData = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(directorioData)) {
      fs.mkdirSync(directorioData, { recursive: true });
    }

    const archivo = path.join(directorioData, `quini_${this.año}_completo.json`);
    fs.writeFileSync(archivo, JSON.stringify(resultado, null, 2), 'utf-8');
    
    console.log(`\n💾 Resultados guardados en: ${archivo}`);
    console.log(`📊 Total de sorteos extraídos: ${resultado.totalSorteos}`);
    console.log(`⚠️  Sorteos pendientes: ${resultado.sorteosPendientes.length}`);
    console.log(`❌ Errores: ${resultado.errores.length}`);
  }

  /**
   * Utilidad para delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

