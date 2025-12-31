/**
 * Entropy Filter - Protocolo Lyra Fase 2
 * 
 * Implementa cálculo de Entropía de Shannon para combinaciones de números.
 * La entropía mide la "aleatoriedad" o "dispersión" de una combinación.
 * 
 * Fórmula de Shannon: H(X) = -Σ P(x) * log2(P(x))
 * 
 * Para una combinación, calculamos la entropía basada en:
 * - Distribución de números (frecuencia relativa)
 * - Espaciado entre números
 * - Variabilidad de las deltas
 */

import { Combinacion, NumeroQuini, EstadisticaFrecuencia } from '../types';

/**
 * Resultado del análisis de entropía
 */
export interface AnalisisEntropia {
  combinacion: Combinacion;
  entropia: number;
  entropiaNormalizada: number; // 0-1
  cumpleUmbral: boolean;
}

/**
 * Clase para cálculo de entropía de Shannon
 */
export class EntropyFilter {
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;
  private readonly TOTAL_NUMEROS = 46;

  /**
   * Calcula la entropía de Shannon para una combinación
   * 
   * @param combinacion Combinación de 6 números
   * @param frecuencias Map opcional con frecuencias históricas para ponderar
   */
  public calcularEntropia(
    combinacion: Combinacion,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): number {
    // Método 1: Entropía basada en distribución de probabilidades
    // Si tenemos frecuencias, usamos probabilidades empíricas
    // Si no, asumimos distribución uniforme

    let entropia = 0;

    if (frecuencias) {
      // Calcular entropía usando frecuencias relativas
      for (const numero of combinacion) {
        const estadistica = frecuencias.get(numero);
        if (estadistica && estadistica.frecuenciaRelativa > 0) {
          const probabilidad = estadistica.frecuenciaRelativa;
          entropia -= probabilidad * Math.log2(probabilidad);
        }
      }
    } else {
      // Distribución uniforme: cada número tiene probabilidad 1/46
      const probabilidadUniforme = 1 / this.TOTAL_NUMEROS;
      const entropiaMaxima = -this.TOTAL_NUMEROS * probabilidadUniforme * Math.log2(probabilidadUniforme);
      
      // Para la combinación específica, calcular entropía
      // Basada en qué tan "dispersa" está
      const numerosUnicos = new Set(combinacion);
      const probabilidadPorNumero = 1 / numerosUnicos.size;
      entropia = -numerosUnicos.size * probabilidadPorNumero * Math.log2(probabilidadPorNumero);
    }

    return entropia;
  }

  /**
   * Calcula entropía basada en espaciado (deltas)
   * Mide la variabilidad de las diferencias entre números consecutivos
   */
  public calcularEntropiaEspaciado(combinacion: Combinacion): number {
    const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
    const deltas: number[] = [];

    // Calcular deltas
    for (let i = 1; i < numerosOrdenados.length; i++) {
      deltas.push(numerosOrdenados[i] - numerosOrdenados[i - 1]);
    }

    if (deltas.length === 0) {
      return 0;
    }

    // Contar frecuencia de cada delta
    const frecuenciaDelta = new Map<number, number>();
    for (const delta of deltas) {
      frecuenciaDelta.set(delta, (frecuenciaDelta.get(delta) || 0) + 1);
    }

    // Calcular entropía de Shannon sobre las deltas
    let entropia = 0;
    const totalDeltas = deltas.length;

    for (const frecuencia of frecuenciaDelta.values()) {
      const probabilidad = frecuencia / totalDeltas;
      if (probabilidad > 0) {
        entropia -= probabilidad * Math.log2(probabilidad);
      }
    }

    return entropia;
  }

  /**
   * Calcula entropía combinada (distribución + espaciado)
   */
  public calcularEntropiaCombinada(
    combinacion: Combinacion,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): number {
    const entropiaDistribucion = this.calcularEntropia(combinacion, frecuencias);
    const entropiaEspaciado = this.calcularEntropiaEspaciado(combinacion);

    // Promedio ponderado (puede ajustarse)
    return (entropiaDistribucion * 0.6 + entropiaEspaciado * 0.4);
  }

  /**
   * Normaliza la entropía a un rango 0-1
   */
  public normalizarEntropia(entropia: number): number {
    // Entropía máxima teórica para 6 números únicos
    // H_max = log2(6) ≈ 2.585
    const entropiaMaxima = Math.log2(6);
    
    // Normalizar
    return Math.min(1, Math.max(0, entropia / entropiaMaxima));
  }

  /**
   * Analiza una combinación y determina si cumple con el umbral de entropía
   */
  public analizarCombinacion(
    combinacion: Combinacion,
    umbralMinimo: number = 0.3,
    umbralMaximo: number = 0.9,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): AnalisisEntropia {
    const entropia = this.calcularEntropiaCombinada(combinacion, frecuencias);
    const entropiaNormalizada = this.normalizarEntropia(entropia);
    const cumpleUmbral = entropiaNormalizada >= umbralMinimo && entropiaNormalizada <= umbralMaximo;

    return {
      combinacion,
      entropia,
      entropiaNormalizada,
      cumpleUmbral
    };
  }

  /**
   * Filtra combinaciones según umbral de entropía
   */
  public filtrarPorEntropia(
    combinaciones: Combinacion[],
    umbralMinimo: number = 0.3,
    umbralMaximo: number = 0.9,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): Combinacion[] {
    return combinaciones.filter(combinacion => {
      const analisis = this.analizarCombinacion(combinacion, umbralMinimo, umbralMaximo, frecuencias);
      return analisis.cumpleUmbral;
    });
  }

  /**
   * Ordena combinaciones por entropía (mayor a menor)
   */
  public ordenarPorEntropia(
    combinaciones: Combinacion[],
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): Array<{ combinacion: Combinacion; entropia: number; entropiaNormalizada: number }> {
    const combinacionesConEntropia = combinaciones.map(combinacion => {
      const entropia = this.calcularEntropiaCombinada(combinacion, frecuencias);
      const entropiaNormalizada = this.normalizarEntropia(entropia);
      
      return {
        combinacion,
        entropia,
        entropiaNormalizada
      };
    });

    // Ordenar por entropía normalizada descendente
    combinacionesConEntropia.sort((a, b) => b.entropiaNormalizada - a.entropiaNormalizada);

    return combinacionesConEntropia;
  }
}

