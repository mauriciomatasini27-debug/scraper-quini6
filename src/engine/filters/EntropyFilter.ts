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
   * Calcula la entropía de Shannon basada en distribución de números.
   * Este método es una alternativa que usa frecuencias históricas si están disponibles.
   * 
   * @param combinacion Combinación de 6 números
   * @param frecuencias Map opcional con frecuencias históricas para ponderar
   * @returns Entropía basada en distribución
   */
  public calcularEntropiaDistribucion(
    combinacion: Combinacion,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): number {
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
   * Calcula la entropía de Shannon para una combinación.
   * Por defecto usa el método de espaciado (deltas), que es más directo para detectar patrones regulares.
   * 
   * @param combinacion Combinación de 6 números
   * @param frecuencias Map opcional (no usado en la versión simplificada basada en deltas, mantenido por compatibilidad)
   */
  public calcularEntropiaCombinacion(
    combinacion: Combinacion,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): number {
    // Usar el método de espaciado por defecto (más efectivo para detectar patrones regulares)
    return this.calcularEntropiaEspaciado(combinacion);
  }

  /**
   * Calcula la entropía de Shannon basada en los intervalos entre números.
   * Esta es la implementación principal que mide qué tan "caótica" es una combinación.
   * Una entropía baja indica un patrón demasiado regular/ordenado (ej. 05, 10, 15, 20, 25, 30).
   * 
   * Este filtro calculará qué tan "caótica" es una combinación. Si los números están
   * demasiado ordenados (ej. 05, 10, 15, 20, 25, 30), la entropía será baja y el filtro la descartará.
   * 
   * @param combinacion Combinación de números (debe estar ordenada)
   * @returns Entropía de Shannon (rango típico para 6 números: 1.5 a 2.5)
   */
  public calcularEntropiaEspaciado(combinacion: Combinacion): number {
    // Convertir Combinacion a array para compatibilidad
    const combinacionArray: number[] = [...combinacion];
    return this.calcularEntropia(combinacionArray);
  }

  /**
   * Calcula la entropía de Shannon basada en los intervalos entre números.
   * Implementación simplificada y directa que detecta patrones regulares.
   * 
   * @param combinacion Array de números (puede estar ordenado o no)
   * @returns Entropía de Shannon (rango típico para 6 números: 1.5 a 2.5)
   */
  public calcularEntropia(combinacion: number[]): number {
    const n = combinacion.length;
    const deltas: number[] = [];
    
    // Calcular los intervalos (deltas) entre números consecutivos
    // Ordenar primero para asegurar cálculo correcto de deltas
    const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
    
    for (let i = 1; i < n; i++) {
      deltas.push(numerosOrdenados[i] - numerosOrdenados[i - 1]);
    }

    if (deltas.length === 0) {
      return 0;
    }

    // Contar frecuencia de cada delta
    const frecuencias: { [key: number]: number } = {};
    deltas.forEach(d => {
      frecuencias[d] = (frecuencias[d] || 0) + 1;
    });

    // Calcular entropía de Shannon
    let entropia = 0;
    const numDeltas = deltas.length;

    for (const valor in frecuencias) {
      const p = frecuencias[valor] / numDeltas;
      if (p > 0) {
        entropia -= p * Math.log2(p);
      }
    }

    return entropia;
  }
  
  /**
   * Filtra combinaciones que no cumplen con el umbral de desorden estadístico.
   * Este método calcula qué tan "caótica" es una combinación. Si los números están
   * demasiado ordenados (ej. 05, 10, 15, 20, 25, 30), la entropía será baja y el
   * filtro la descartará.
   * 
   * Rango típico para 6 números: 1.5 a 2.5
   * 
   * @param combinacion Combinación a validar
   * @param umbralMin Umbral mínimo de entropía (default: 1.2)
   * @returns true si la combinación cumple con el umbral de entropía
   */
  public esValida(combinacion: Combinacion, umbralMin: number = 1.2): boolean {
    const h = this.calcularEntropia([...combinacion]);
    return h >= umbralMin;
  }

  /**
   * Calcula entropía combinada (distribución + espaciado)
   * Por defecto, ahora usa principalmente el método de espaciado que es más efectivo.
   * 
   * @param combinacion Combinación de 6 números
   * @param frecuencias Map opcional con frecuencias históricas
   * @returns Entropía combinada
   */
  public calcularEntropiaCombinada(
    combinacion: Combinacion,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): number {
    // Priorizar el método de espaciado (deltas) que detecta mejor patrones regulares
    const entropiaEspaciado = this.calcularEntropiaEspaciado(combinacion);
    
    // Si hay frecuencias, combinar con distribución (peso menor)
    if (frecuencias) {
      const entropiaDistribucion = this.calcularEntropiaDistribucion(combinacion, frecuencias);
      // Peso mayor al espaciado (0.8) ya que es más efectivo para detectar regularidades
      return (entropiaEspaciado * 0.8 + entropiaDistribucion * 0.2);
    }
    
    // Si no hay frecuencias, usar solo espaciado (método principal simplificado)
    return entropiaEspaciado;
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

