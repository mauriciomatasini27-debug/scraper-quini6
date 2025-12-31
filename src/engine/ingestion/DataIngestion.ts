/**
 * Módulo de Data Ingestion
 * 
 * Responsable de cargar, normalizar y preparar los datos históricos
 * para el análisis estadístico.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { ResultadoScraping, SorteoQuini6, ModalidadSorteo as ModalidadScraping } from '../../types';
import {
  SorteoNormalizado,
  ModalidadSorteo,
  Combinacion,
  NumeroQuini
} from '../types';

/**
 * Clase principal para la ingesta de datos
 */
export class DataIngestion {
  private datosCargados: SorteoNormalizado[] = [];

  /**
   * Carga datos históricos desde archivos JSON
   * @param años Array de años a cargar (2020-2025)
   * @param rutaBase Ruta base donde se encuentran los archivos JSON
   */
  public cargarDatosHistoricos(
    años: number[],
    rutaBase: string = join(process.cwd(), 'data')
  ): SorteoNormalizado[] {
    this.datosCargados = [];

    for (const año of años) {
      const rutaArchivo = join(rutaBase, `quini_${año}_completo.json`);
      
      try {
        const contenido = readFileSync(rutaArchivo, 'utf-8');
        const datos: ResultadoScraping = JSON.parse(contenido);
        
        const sorteosNormalizados = this.normalizarSorteos(datos);
        this.datosCargados.push(...sorteosNormalizados);
      } catch (error) {
        throw new Error(
          `Error al cargar datos del año ${año}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    // Ordenar por fecha (más antiguo primero)
    this.datosCargados.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    return this.datosCargados;
  }

  /**
   * Normaliza los sorteos del formato de scraping al formato de análisis
   */
  private normalizarSorteos(datos: ResultadoScraping): SorteoNormalizado[] {
    const sorteosNormalizados: SorteoNormalizado[] = [];

    for (const sorteo of datos.sorteos) {
      // Procesar cada modalidad
      const modalidades: Array<{ key: keyof SorteoQuini6; tipo: ModalidadSorteo }> = [
        { key: 'tradicional', tipo: 'tradicional' },
        { key: 'segunda', tipo: 'segunda' },
        { key: 'revancha', tipo: 'revancha' },
        { key: 'siempreSale', tipo: 'siempreSale' }
      ];

      for (const { key, tipo } of modalidades) {
        let modalidad: ModalidadScraping | undefined;
        
        if (key === 'tradicional') modalidad = sorteo.tradicional;
        else if (key === 'segunda') modalidad = sorteo.segunda;
        else if (key === 'revancha') modalidad = sorteo.revancha;
        else if (key === 'siempreSale') modalidad = sorteo.siempreSale;
        
        if (modalidad && modalidad.numeros) {
          const numeros = this.extraerNumeros(modalidad.numeros);
          
          if (numeros.length === 6) {
            const combinacion = numeros as Combinacion;
            const suma = numeros.reduce((acc, n) => acc + n, 0);
            const paridad = this.calcularParidad(numeros);
            const espaciado = this.calcularEspaciado(numeros);

            // Calcular amplitud (diferencia entre máximo y mínimo)
            const amplitud = numeros[numeros.length - 1] - numeros[0];

            sorteosNormalizados.push({
              numeroSorteo: sorteo.numeroSorteo,
              fecha: new Date(sorteo.fechaISO),
              fechaISO: sorteo.fechaISO,
              modalidad: tipo,
              numeros: combinacion,
              suma,
              paridad,
              espaciado,
              amplitud
            });
          }
        }
      }
    }

    return sorteosNormalizados;
  }

  /**
   * Extrae los números de un objeto NumerosSorteo y los convierte a números
   */
  private extraerNumeros(numeros: { numero1: string; numero2: string; numero3: string; numero4: string; numero5: string; numero6: string }): NumeroQuini[] {
    const numerosArray: NumeroQuini[] = [];
    
    const valores = [
      numeros.numero1,
      numeros.numero2,
      numeros.numero3,
      numeros.numero4,
      numeros.numero5,
      numeros.numero6
    ];
    
    for (const valor of valores) {
      if (valor) {
        const numero = parseInt(valor, 10);
        // Aceptar números del 0-45 (dominio recalibrado)
        if (!isNaN(numero) && numero >= 0 && numero <= 45) {
          numerosArray.push(numero);
        }
      }
    }

    // Ordenar números de menor a mayor
    return numerosArray.sort((a, b) => a - b);
  }

  /**
   * Calcula la paridad de una combinación
   */
  private calcularParidad(numeros: NumeroQuini[]): { pares: number; impares: number } {
    let pares = 0;
    let impares = 0;

    for (const numero of numeros) {
      if (numero % 2 === 0) {
        pares++;
      } else {
        impares++;
      }
    }

    return { pares, impares };
  }

  /**
   * Calcula el espaciado entre números consecutivos
   */
  private calcularEspaciado(numeros: NumeroQuini[]): number[] {
    const espaciados: number[] = [];

    for (let i = 1; i < numeros.length; i++) {
      espaciados.push(numeros[i] - numeros[i - 1]);
    }

    return espaciados;
  }

  /**
   * Filtra sorteos por modalidad
   */
  public filtrarPorModalidad(
    modalidad: ModalidadSorteo,
    datos?: SorteoNormalizado[]
  ): SorteoNormalizado[] {
    const datosAFiltrar = datos || this.datosCargados;
    return datosAFiltrar.filter(s => s.modalidad === modalidad);
  }

  /**
   * Obtiene los datos cargados
   */
  public obtenerDatos(): SorteoNormalizado[] {
    return [...this.datosCargados];
  }

  /**
   * Limpia los datos cargados de memoria
   */
  public limpiar(): void {
    this.datosCargados = [];
  }
}

