/**
 * Módulo Statistical Core
 * 
 * Calcula estadísticas fundamentales:
 * - Frecuencias y frecuencias relativas
 * - Desviación estándar (σ)
 * - Atrasos (Delays)
 * - Medias móviles
 */

import {
  SorteoNormalizado,
  EstadisticaFrecuencia,
  NumeroQuini,
  AnalisisEstadistico,
  EstadisticasAmplitud
} from '../types';
import { calcularScoreProbabilidad, calcularLambda } from './PoissonDistribution';

/**
 * Clase principal para cálculos estadísticos
 */
export class StatisticalCore {
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;

  /**
   * Calcula el análisis estadístico completo
   */
  public calcularAnalisis(
    sorteos: SorteoNormalizado[],
    ventanasMediaMovil: number[] = [5, 10, 20]
  ): AnalisisEstadistico {
    if (sorteos.length === 0) {
      throw new Error('No hay sorteos para analizar');
    }

    const frecuencias = this.calcularFrecuencias(sorteos);
    const { media, desviacionEstandar } = this.calcularMediaYDesviacion(frecuencias);
    const mediasMoviles = this.calcularMediasMoviles(sorteos, ventanasMediaMovil);
    const matrizTransicion = this.calcularMatrizTransicion(sorteos);
    const estadisticasAmplitud = this.calcularEstadisticasAmplitud(sorteos);

    const fechas = sorteos.map(s => s.fecha).sort((a, b) => a.getTime() - b.getTime());

    return {
      periodo: {
        fechaInicio: fechas[0],
        fechaFin: fechas[fechas.length - 1],
        totalSorteos: sorteos.length
      },
      frecuencias,
      desviacionEstandar,
      media,
      mediasMoviles,
      matrizTransicion,
      estadisticasAmplitud
    };
  }

  /**
   * Calcula frecuencias, atrasos y estadísticas por número
   */
  private calcularFrecuencias(sorteos: SorteoNormalizado[]): Map<NumeroQuini, EstadisticaFrecuencia> {
    const frecuencias = new Map<NumeroQuini, EstadisticaFrecuencia>();
    const apariciones: Map<NumeroQuini, Date[]> = new Map();
    const totalSorteos = sorteos.length;

    // Inicializar mapas
    for (let num = this.RANGO_MIN; num <= this.RANGO_MAX; num++) {
      apariciones.set(num, []);
    }

    // Recopilar todas las apariciones
    for (const sorteo of sorteos) {
      for (const numero of sorteo.numeros) {
        const aparicionesNum = apariciones.get(numero);
        if (aparicionesNum) {
          aparicionesNum.push(sorteo.fecha);
        }
      }
    }

    // Calcular estadísticas para cada número
    for (let num = this.RANGO_MIN; num <= this.RANGO_MAX; num++) {
      const aparicionesNum = apariciones.get(num) || [];
      const frecuencia = aparicionesNum.length;
      const frecuenciaRelativa = totalSorteos > 0 ? frecuencia / totalSorteos : 0;
      
      const ultimaAparicion = aparicionesNum.length > 0 
        ? aparicionesNum[aparicionesNum.length - 1] 
        : null;

      // Calcular atraso actual
      const ultimoSorteo = sorteos[sorteos.length - 1];
      let atraso = 0;
      if (ultimaAparicion) {
        const ultimoSorteoFecha = ultimoSorteo.fecha;
        const sorteosDesdeUltima = sorteos.filter(
          s => s.fecha > ultimaAparicion && s.fecha <= ultimoSorteoFecha
        ).length;
        atraso = sorteosDesdeUltima;
      } else {
        // Si nunca apareció, el atraso es el total de sorteos
        atraso = totalSorteos;
      }

      // Calcular promedio y desviación de atrasos
      const { promedio, desviacion } = this.calcularEstadisticasAtraso(
        aparicionesNum,
        sorteos
      );

      // Calcular Score de Probabilidad usando Distribución de Poisson
      // Usar los últimos 20 sorteos como intervalo actual
      const sorteosEnIntervalo = Math.min(20, totalSorteos);
      const lambda = calcularLambda(frecuencia, totalSorteos, sorteosEnIntervalo);
      const scoreProbabilidad = calcularScoreProbabilidad(
        frecuencia,
        totalSorteos,
        sorteosEnIntervalo
      );

      frecuencias.set(num, {
        numero: num,
        frecuencia,
        frecuenciaRelativa,
        ultimaAparicion,
        atraso,
        promedioAtraso: promedio,
        desviacionAtraso: desviacion,
        scoreProbabilidad,
        lambda
      });
    }

    return frecuencias;
  }

  /**
   * Calcula promedio y desviación estándar de los atrasos
   */
  private calcularEstadisticasAtraso(
    apariciones: Date[],
    todosLosSorteos: SorteoNormalizado[]
  ): { promedio: number; desviacion: number } {
    if (apariciones.length < 2) {
      return { promedio: 0, desviacion: 0 };
    }

    const atrasos: number[] = [];
    const sorteosOrdenados = [...todosLosSorteos].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    for (let i = 1; i < apariciones.length; i++) {
      const fechaAnterior = apariciones[i - 1];
      const fechaActual = apariciones[i];
      
      const sorteosEntre = sorteosOrdenados.filter(
        s => s.fecha > fechaAnterior && s.fecha <= fechaActual
      ).length;
      
      atrasos.push(sorteosEntre);
    }

    if (atrasos.length === 0) {
      return { promedio: 0, desviacion: 0 };
    }

    const promedio = atrasos.reduce((acc, val) => acc + val, 0) / atrasos.length;
    const varianza = atrasos.reduce(
      (acc, val) => acc + Math.pow(val - promedio, 2),
      0
    ) / atrasos.length;
    const desviacion = Math.sqrt(varianza);

    return { promedio, desviacion };
  }

  /**
   * Calcula media y desviación estándar de las frecuencias
   */
  private calcularMediaYDesviacion(
    frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>
  ): { media: number; desviacionEstandar: number } {
    const valores = Array.from(frecuencias.values()).map(f => f.frecuencia);
    
    if (valores.length === 0) {
      return { media: 0, desviacionEstandar: 0 };
    }

    const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;
    const varianza = valores.reduce(
      (acc, val) => acc + Math.pow(val - media, 2),
      0
    ) / valores.length;
    const desviacionEstandar = Math.sqrt(varianza);

    return { media, desviacionEstandar };
  }

  /**
   * Calcula medias móviles para diferentes ventanas
   */
  private calcularMediasMoviles(
    sorteos: SorteoNormalizado[],
    ventanas: number[]
  ): AnalisisEstadistico['mediasMoviles'] {
    const sorteosOrdenados = [...sorteos].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    const resultado: AnalisisEstadistico['mediasMoviles'] = {
      ventana5: [],
      ventana10: [],
      ventana20: []
    };

    for (const ventana of ventanas) {
      const medias: number[] = [];
      
      for (let i = ventana - 1; i < sorteosOrdenados.length; i++) {
        const ventanaSorteos = sorteosOrdenados.slice(i - ventana + 1, i + 1);
        const sumaPromedio = ventanaSorteos.reduce(
          (acc, s) => acc + s.suma,
          0
        ) / ventana;
        medias.push(sumaPromedio);
      }

      // Asignar a la propiedad correspondiente
      if (ventana === 5) {
        resultado.ventana5 = medias;
      } else if (ventana === 10) {
        resultado.ventana10 = medias;
      } else if (ventana === 20) {
        resultado.ventana20 = medias;
      }
    }

    return resultado;
  }

  /**
   * Calcula la matriz de transición de Markov
   * Nota: Esta es una versión simplificada. El módulo Markov tendrá la implementación completa
   */
  private calcularMatrizTransicion(sorteos: SorteoNormalizado[]): Map<NumeroQuini, Map<NumeroQuini, number>> {
    // Esta es una implementación básica. El módulo Markov tendrá la lógica completa
    const matriz = new Map<NumeroQuini, Map<NumeroQuini, number>>();

    // Inicializar matriz
    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      const fila = new Map<NumeroQuini, number>();
      for (let j = this.RANGO_MIN; j <= this.RANGO_MAX; j++) {
        fila.set(j, 0);
      }
      matriz.set(i, fila);
    }

    // La implementación completa estará en el módulo Markov
    return matriz;
  }

  /**
   * Identifica números con atraso alto (mayor a σ)
   */
  public identificarAtrasosAltos(
    frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>,
    umbralDesviaciones: number = 1
  ): NumeroQuini[] {
    const numerosConAtrasoAlto: NumeroQuini[] = [];

    for (const estadistica of frecuencias.values()) {
      const umbral = estadistica.promedioAtraso + (umbralDesviaciones * estadistica.desviacionAtraso);
      
      if (estadistica.atraso > umbral) {
        numerosConAtrasoAlto.push(estadistica.numero);
      }
    }

    return numerosConAtrasoAlto;
  }

  /**
   * Calcula estadísticas de amplitud (rango: diferencia entre máximo y mínimo)
   * Protocolo Lyra Fase 2: Históricamente, en dominio 00-45, la amplitud suele estar entre 32 y 43
   */
  public calcularEstadisticasAmplitud(sorteos: SorteoNormalizado[]): EstadisticasAmplitud {
    const amplitudes: number[] = [];

    for (const sorteo of sorteos) {
      // Si ya tiene amplitud calculada, usarla
      if (sorteo.amplitud !== undefined) {
        amplitudes.push(sorteo.amplitud);
      } else {
        // Calcular amplitud
        const numeros = [...sorteo.numeros].sort((a, b) => a - b);
        const amplitud = numeros[numeros.length - 1] - numeros[0];
        amplitudes.push(amplitud);
      }
    }

    if (amplitudes.length === 0) {
      return {
        media: 0,
        desviacionEstandar: 0,
        min: 0,
        max: 0,
        percentil25: 0,
        percentil50: 0,
        percentil75: 0
      };
    }

    // Ordenar para calcular percentiles
    const amplitudesOrdenadas = [...amplitudes].sort((a, b) => a - b);

    // Calcular media
    const media = amplitudes.reduce((sum, val) => sum + val, 0) / amplitudes.length;

    // Calcular desviación estándar
    const varianza = amplitudes.reduce(
      (sum, val) => sum + Math.pow(val - media, 2),
      0
    ) / amplitudes.length;
    const desviacionEstandar = Math.sqrt(varianza);

    // Calcular percentiles
    const percentil25 = this.calcularPercentil(amplitudesOrdenadas, 25);
    const percentil50 = this.calcularPercentil(amplitudesOrdenadas, 50);
    const percentil75 = this.calcularPercentil(amplitudesOrdenadas, 75);

    return {
      media,
      desviacionEstandar,
      min: amplitudesOrdenadas[0],
      max: amplitudesOrdenadas[amplitudesOrdenadas.length - 1],
      percentil25,
      percentil50,
      percentil75
    };
  }

  /**
   * Calcula un percentil de un array ordenado
   */
  private calcularPercentil(arrayOrdenado: number[], percentil: number): number {
    if (arrayOrdenado.length === 0) return 0;
    if (arrayOrdenado.length === 1) return arrayOrdenado[0];

    const indice = (percentil / 100) * (arrayOrdenado.length - 1);
    const indiceBajo = Math.floor(indice);
    const indiceAlto = Math.ceil(indice);
    const peso = indice - indiceBajo;

    return arrayOrdenado[indiceBajo] * (1 - peso) + arrayOrdenado[indiceAlto] * peso;
  }
}

