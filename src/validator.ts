import { ResultadoScraping, SorteoQuini6 } from './types';

/**
 * Valida que no se hayan saltado sorteos usando Sequential Thinking
 * Implementa validación exhaustiva para asegurar integridad de datos
 */
export class ValidadorSorteos {
  /**
   * Valida la integridad de los sorteos extraídos
   */
  async validarSorteos(resultado: ResultadoScraping): Promise<{
    valido: boolean;
    sorteosFaltantes: number[];
    advertencias: string[];
  }> {
    const sorteosFaltantes: number[] = [];
    const advertencias: string[] = [];

    if (resultado.sorteos.length === 0) {
      return {
        valido: false,
        sorteosFaltantes: [],
        advertencias: ['No se encontraron sorteos para validar']
      };
    }

    // Ordenar sorteos por número
    const sorteosOrdenados = [...resultado.sorteos].sort(
      (a, b) => a.numeroSorteo - b.numeroSorteo
    );

    // Encontrar el rango de números de sorteo
    const primerSorteo = sorteosOrdenados[0].numeroSorteo;
    const ultimoSorteo = sorteosOrdenados[sorteosOrdenados.length - 1].numeroSorteo;

    console.log(`\n🔍 Validando sorteos del #${primerSorteo} al #${ultimoSorteo}...`);

    // Verificar que no falten sorteos en el rango
    const numerosSorteos = new Set(sorteosOrdenados.map(s => s.numeroSorteo));
    
    for (let num = primerSorteo; num <= ultimoSorteo; num++) {
      if (!numerosSorteos.has(num)) {
        sorteosFaltantes.push(num);
      }
    }

    // Validar que cada sorteo tenga todos los datos requeridos
    for (const sorteo of sorteosOrdenados) {
      const problemas = this.validarSorteoIndividual(sorteo, resultado.año);
      if (problemas.length > 0) {
        advertencias.push(
          `Sorteo #${sorteo.numeroSorteo}: ${problemas.join(', ')}`
        );
      }
    }

    // Validar fechas (deben estar en orden cronológico)
    for (let i = 1; i < sorteosOrdenados.length; i++) {
      const fechaAnterior = new Date(sorteosOrdenados[i - 1].fechaISO);
      const fechaActual = new Date(sorteosOrdenados[i].fechaISO);
      
      if (fechaActual < fechaAnterior) {
        advertencias.push(
          `Sorteo #${sorteosOrdenados[i].numeroSorteo} tiene fecha anterior al sorteo #${sorteosOrdenados[i - 1].numeroSorteo}`
        );
      }
    }

    // Validar que los números de sorteo sean consecutivos (con tolerancia para días sin sorteo)
    for (let i = 1; i < sorteosOrdenados.length; i++) {
      const diferencia = sorteosOrdenados[i].numeroSorteo - sorteosOrdenados[i - 1].numeroSorteo;
      
      // Normalmente los sorteos son cada 3-4 días, pero pueden haber saltos mayores
      // Alertar si hay un salto mayor a 10 (puede indicar un sorteo faltante)
      if (diferencia > 10) {
        advertencias.push(
          `Salto grande entre sorteo #${sorteosOrdenados[i - 1].numeroSorteo} y #${sorteosOrdenados[i].numeroSorteo} (diferencia: ${diferencia})`
        );
      }
    }

    const valido = sorteosFaltantes.length === 0 && advertencias.length === 0;

    return {
      valido,
      sorteosFaltantes,
      advertencias
    };
  }

  /**
   * Valida un sorteo individual
   */
  private validarSorteoIndividual(sorteo: SorteoQuini6, añoEsperado?: number): string[] {
    const problemas: string[] = [];

    // Validar que todas las modalidades tengan números
    const modalidades = [
      { nombre: 'Tradicional', datos: sorteo.tradicional },
      { nombre: 'Segunda', datos: sorteo.segunda },
      { nombre: 'Revancha', datos: sorteo.revancha },
      { nombre: 'Siempre Sale', datos: sorteo.siempreSale }
    ];

    for (const modalidad of modalidades) {
      if (!modalidad.datos.numeros) {
        problemas.push(`${modalidad.nombre} sin números`);
        continue;
      }

      const nums = modalidad.datos.numeros;
      const numeros = [nums.numero1, nums.numero2, nums.numero3, nums.numero4, nums.numero5, nums.numero6];
      
      // Validar que todos los números estén presentes
      if (numeros.some(n => !n || n.trim() === '')) {
        problemas.push(`${modalidad.nombre} con números faltantes`);
      }

      // Validar formato de números (deben ser 2 dígitos)
      if (numeros.some(n => !/^\d{2}$/.test(n))) {
        problemas.push(`${modalidad.nombre} con formato de números inválido`);
      }

      // Validar que los números estén en el rango válido (00-45 para Quini 6)
      const numerosInvalidos = numeros.filter(n => {
        const num = parseInt(n, 10);
        return isNaN(num) || num < 0 || num > 45;
      });
      
      if (numerosInvalidos.length > 0) {
        problemas.push(`${modalidad.nombre} con números fuera de rango: ${numerosInvalidos.join(', ')}`);
      }
    }

      // Validar fecha
      if (!sorteo.fecha || !sorteo.fechaISO) {
        problemas.push('Fecha faltante o inválida');
      } else {
        const fecha = new Date(sorteo.fechaISO);
        if (isNaN(fecha.getTime())) {
          problemas.push('Fecha ISO inválida');
        }
        
        // Validar que la fecha esté en el año esperado
        if (añoEsperado && fecha.getFullYear() !== añoEsperado) {
          problemas.push(`Fecha fuera del año ${añoEsperado}: ${sorteo.fecha}`);
        }
      }

    return problemas;
  }

  /**
   * Genera un reporte de validación
   */
  generarReporte(validacion: {
    valido: boolean;
    sorteosFaltantes: number[];
    advertencias: string[];
  }): string {
    let reporte = '\n' + '='.repeat(60) + '\n';
    reporte += '📋 REPORTE DE VALIDACIÓN\n';
    reporte += '='.repeat(60) + '\n\n';

    if (validacion.valido) {
      reporte += '✅ Validación exitosa: Todos los sorteos están completos\n\n';
    } else {
      reporte += '⚠️  Validación con problemas encontrados\n\n';
    }

    if (validacion.sorteosFaltantes.length > 0) {
      reporte += `❌ Sorteos faltantes (${validacion.sorteosFaltantes.length}):\n`;
      reporte += `   ${validacion.sorteosFaltantes.join(', ')}\n\n`;
    }

    if (validacion.advertencias.length > 0) {
      reporte += `⚠️  Advertencias (${validacion.advertencias.length}):\n`;
      validacion.advertencias.slice(0, 10).forEach(adv => {
        reporte += `   - ${adv}\n`;
      });
      if (validacion.advertencias.length > 10) {
        reporte += `   ... y ${validacion.advertencias.length - 10} advertencias más\n`;
      }
      reporte += '\n';
    }

    reporte += '='.repeat(60) + '\n';

    return reporte;
  }
}

