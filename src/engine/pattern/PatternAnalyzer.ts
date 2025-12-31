/**
 * Pattern Analyzer - Análisis de Deltas
 * 
 * Calcula la distribución histórica de las diferencias entre números
 * consecutivos (deltas) y filtra combinaciones que no sigan la
 * distribución normal esperada (frecuencia de deltas bajas > deltas altas).
 */

import { SorteoNormalizado, Combinacion, NumeroQuini } from '../types';

/**
 * Estadísticas de una delta específica
 */
export interface EstadisticaDelta {
  delta: number;
  frecuencia: number;
  frecuenciaRelativa: number;
}

/**
 * Distribución completa de deltas
 */
export interface DistribucionDeltas {
  deltas: Map<number, EstadisticaDelta>;
  media: number;
  desviacionEstandar: number;
  totalDeltas: number;
}

/**
 * Resultado del análisis de deltas para una combinación
 */
export interface AnalisisDeltaCombinacion {
  combinacion: Combinacion;
  deltas: number[];
  score: number; // Score basado en qué tan bien sigue la distribución
  cumpleDistribucion: boolean;
}

/**
 * Clase principal para análisis de patrones de deltas
 */
export class PatternAnalyzer {
  private distribucion: DistribucionDeltas | null = null;

  /**
   * Calcula la distribución histórica de deltas desde los sorteos
   */
  public calcularDistribucionDeltas(sorteos: SorteoNormalizado[]): DistribucionDeltas {
    const conteoDeltas = new Map<number, number>();
    let totalDeltas = 0;

    // Recopilar todas las deltas de todos los sorteos
    for (const sorteo of sorteos) {
      const numeros = [...sorteo.numeros].sort((a, b) => a - b);
      
      for (let i = 1; i < numeros.length; i++) {
        const delta = numeros[i] - numeros[i - 1];
        conteoDeltas.set(delta, (conteoDeltas.get(delta) || 0) + 1);
        totalDeltas++;
      }
    }

    // Calcular frecuencias relativas
    const deltas = new Map<number, EstadisticaDelta>();
    for (const [delta, frecuencia] of conteoDeltas.entries()) {
      deltas.set(delta, {
        delta,
        frecuencia,
        frecuenciaRelativa: frecuencia / totalDeltas
      });
    }

    // Calcular media y desviación estándar
    const valoresDelta = Array.from(conteoDeltas.entries());
    const media = valoresDelta.reduce(
      (sum, [delta, freq]) => sum + (delta * freq),
      0
    ) / totalDeltas;

    const varianza = valoresDelta.reduce(
      (sum, [delta, freq]) => {
        const contribucion = (delta - media) ** 2 * freq;
        return sum + contribucion;
      },
      0
    ) / totalDeltas;

    const desviacionEstandar = Math.sqrt(varianza);

    this.distribucion = {
      deltas,
      media,
      desviacionEstandar,
      totalDeltas
    };

    return this.distribucion;
  }

  /**
   * Obtiene la distribución calculada
   */
  public obtenerDistribucion(): DistribucionDeltas | null {
    return this.distribucion;
  }

  /**
   * Analiza una combinación y determina si cumple con la distribución de deltas
   */
  public analizarCombinacion(combinacion: Combinacion): AnalisisDeltaCombinacion {
    if (!this.distribucion) {
      throw new Error('Debe calcular la distribución de deltas primero');
    }

    const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
    const deltas: number[] = [];

    // Calcular deltas de la combinación
    for (let i = 1; i < numerosOrdenados.length; i++) {
      deltas.push(numerosOrdenados[i] - numerosOrdenados[i - 1]);
    }

    // Calcular score basado en qué tan bien sigue la distribución
    let score = 0;
    let deltasBajas = 0;
    let deltasAltas = 0;

    for (const delta of deltas) {
      const estadistica = this.distribucion.deltas.get(delta);
      
      if (estadistica) {
        // Sumar al score la frecuencia relativa (deltas comunes = mayor score)
        score += estadistica.frecuenciaRelativa;
      }

      // Clasificar como delta baja (< media) o alta (>= media)
      if (delta < this.distribucion.media) {
        deltasBajas++;
      } else {
        deltasAltas++;
      }
    }

    // Normalizar score (máximo posible sería 5 deltas con frecuencia 1.0)
    score = score / deltas.length;

    // La combinación cumple si tiene más deltas bajas que altas
    // (distribución normal: frecuencia de deltas bajas > deltas altas)
    const cumpleDistribucion = deltasBajas > deltasAltas;

    return {
      combinacion,
      deltas,
      score,
      cumpleDistribucion
    };
  }

  /**
   * Filtra combinaciones que no cumplan con la distribución de deltas
   */
  public filtrarCombinaciones(
    combinaciones: Combinacion[],
    requerirCumplimiento: boolean = true
  ): Combinacion[] {
    if (!this.distribucion) {
      throw new Error('Debe calcular la distribución de deltas primero');
    }

    return combinaciones.filter(combinacion => {
      const analisis = this.analizarCombinacion(combinacion);
      
      if (requerirCumplimiento) {
        return analisis.cumpleDistribucion;
      }
      
      // Si no se requiere cumplimiento estricto, usar score mínimo
      return analisis.score > 0.1; // Score mínimo arbitrario
    });
  }

  /**
   * Obtiene estadísticas de deltas más comunes
   */
  public obtenerDeltasMasComunes(cantidad: number = 10): EstadisticaDelta[] {
    if (!this.distribucion) {
      return [];
    }

    const deltasArray = Array.from(this.distribucion.deltas.values());
    deltasArray.sort((a, b) => b.frecuenciaRelativa - a.frecuenciaRelativa);

    return deltasArray.slice(0, cantidad);
  }

  /**
   * Obtiene estadísticas de deltas menos comunes
   */
  public obtenerDeltasMenosComunes(cantidad: number = 10): EstadisticaDelta[] {
    if (!this.distribucion) {
      return [];
    }

    const deltasArray = Array.from(this.distribucion.deltas.values());
    deltasArray.sort((a, b) => a.frecuenciaRelativa - b.frecuenciaRelativa);

    return deltasArray.slice(0, cantidad);
  }

  /**
   * Genera un reporte de la distribución de deltas
   */
  public generarReporte(): string {
    if (!this.distribucion) {
      return 'No hay distribución calculada';
    }

    const deltasMasComunes = this.obtenerDeltasMasComunes(10);
    const deltasMenosComunes = this.obtenerDeltasMenosComunes(10);

    let reporte = '📊 DISTRIBUCIÓN DE DELTAS\n';
    reporte += '='.repeat(50) + '\n\n';
    reporte += `Total de deltas analizadas: ${this.distribucion.totalDeltas}\n`;
    reporte += `Media: ${this.distribucion.media.toFixed(2)}\n`;
    reporte += `Desviación estándar: ${this.distribucion.desviacionEstandar.toFixed(2)}\n\n`;
    
    reporte += 'Top 10 Deltas Más Comunes:\n';
    for (const delta of deltasMasComunes) {
      reporte += `  Delta ${delta.delta.toString().padStart(2)}: ${(delta.frecuenciaRelativa * 100).toFixed(2)}% (${delta.frecuencia} ocurrencias)\n`;
    }
    
    reporte += '\nTop 10 Deltas Menos Comunes:\n';
    for (const delta of deltasMenosComunes) {
      reporte += `  Delta ${delta.delta.toString().padStart(2)}: ${(delta.frecuenciaRelativa * 100).toFixed(2)}% (${delta.frecuencia} ocurrencias)\n`;
    }

    return reporte;
  }
}

