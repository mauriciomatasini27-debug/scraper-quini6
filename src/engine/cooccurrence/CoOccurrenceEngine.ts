/**
 * Co-Occurrence Engine - Protocolo Lyra Fase 2
 * 
 * Calcula una matriz de 46x46 usando el Índice de Jaccard para identificar
 * afinidades entre números que aparecen en el mismo sorteo.
 * 
 * Índice de Jaccard: J(A,B) = |A ∩ B| / |A ∪ B|
 * En este contexto: J(i,j) = veces que i y j aparecen juntos / veces que i o j aparecen
 */

import { SorteoNormalizado, NumeroQuini } from '../types';

/**
 * Matriz de co-ocurrencia usando Índice de Jaccard
 * M[i][j] = Jaccard(i, j) = afinidad entre número i y número j
 */
export type MatrizCoOcurrencia = Map<NumeroQuini, Map<NumeroQuini, number>>;

/**
 * Estadísticas de co-ocurrencia para un par de números
 */
export interface EstadisticaCoOcurrencia {
  numeroA: NumeroQuini;
  numeroB: NumeroQuini;
  jaccard: number;
  ocurrenciasConjuntas: number;
  ocurrenciasA: number;
  ocurrenciasB: number;
}

/**
 * Clase principal para análisis de co-ocurrencia
 */
export class CoOccurrenceEngine {
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;
  private matrizCoOcurrencia: MatrizCoOcurrencia = new Map();

  /**
   * Calcula la matriz de co-ocurrencia usando Índice de Jaccard
   */
  public calcularMatrizCoOcurrencia(sorteos: SorteoNormalizado[]): MatrizCoOcurrencia {
    // Inicializar matriz
    this.inicializarMatriz();

    // Contar ocurrencias individuales
    const ocurrenciasIndividuales = new Map<NumeroQuini, number>();
    
    // Contar ocurrencias conjuntas (pares que aparecen juntos)
    const ocurrenciasConjuntas = new Map<string, number>();

    // Inicializar contadores
    for (let num = this.RANGO_MIN; num <= this.RANGO_MAX; num++) {
      ocurrenciasIndividuales.set(num, 0);
    }

    // Procesar todos los sorteos
    for (const sorteo of sorteos) {
      const numeros = sorteo.numeros;
      const numerosSet = new Set(numeros);

      // Contar ocurrencias individuales
      for (const numero of numeros) {
        ocurrenciasIndividuales.set(
          numero,
          (ocurrenciasIndividuales.get(numero) || 0) + 1
        );
      }

      // Contar ocurrencias conjuntas (todos los pares en el mismo sorteo)
      const numerosArray = Array.from(numerosSet);
      for (let i = 0; i < numerosArray.length; i++) {
        for (let j = i + 1; j < numerosArray.length; j++) {
          const numA = numerosArray[i];
          const numB = numerosArray[j];
          
          // Ordenar para tener clave única
          const clave = numA < numB ? `${numA}-${numB}` : `${numB}-${numA}`;
          ocurrenciasConjuntas.set(
            clave,
            (ocurrenciasConjuntas.get(clave) || 0) + 1
          );
        }
      }
    }

    // Calcular Índice de Jaccard para cada par
    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      for (let j = this.RANGO_MIN; j <= this.RANGO_MAX; j++) {
        if (i === j) {
          // Un número siempre co-ocurre consigo mismo
          this.matrizCoOcurrencia.get(i)!.set(j, 1.0);
          continue;
        }

        const ocurrenciasA = ocurrenciasIndividuales.get(i) || 0;
        const ocurrenciasB = ocurrenciasIndividuales.get(j) || 0;
        
        // Clave para el par
        const clave = i < j ? `${i}-${j}` : `${j}-${i}`;
        const ocurrenciasConjuntasPar = ocurrenciasConjuntas.get(clave) || 0;

        // Calcular Índice de Jaccard
        // J(A,B) = |A ∩ B| / |A ∪ B|
        // |A ∩ B| = ocurrencias conjuntas
        // |A ∪ B| = ocurrenciasA + ocurrenciasB - ocurrenciasConjuntas
        const union = ocurrenciasA + ocurrenciasB - ocurrenciasConjuntasPar;
        
        let jaccard = 0;
        if (union > 0) {
          jaccard = ocurrenciasConjuntasPar / union;
        }

        this.matrizCoOcurrencia.get(i)!.set(j, jaccard);
      }
    }

    return this.matrizCoOcurrencia;
  }

  /**
   * Inicializa la matriz de co-ocurrencia
   */
  private inicializarMatriz(): void {
    this.matrizCoOcurrencia = new Map();

    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      const fila = new Map<NumeroQuini, number>();
      for (let j = this.RANGO_MIN; j <= this.RANGO_MAX; j++) {
        fila.set(j, 0);
      }
      this.matrizCoOcurrencia.set(i, fila);
    }
  }

  /**
   * Obtiene el Índice de Jaccard entre dos números
   */
  public obtenerJaccard(numeroA: NumeroQuini, numeroB: NumeroQuini): number {
    return this.matrizCoOcurrencia.get(numeroA)?.get(numeroB) || 0;
  }

  /**
   * Obtiene los números con mayor afinidad (mayor Jaccard) con un número dado
   */
  public obtenerAfinidades(
    numero: NumeroQuini,
    cantidad: number = 10
  ): Array<{ numero: NumeroQuini; jaccard: number }> {
    const fila = this.matrizCoOcurrencia.get(numero);
    
    if (!fila) {
      return [];
    }

    const afinidades: Array<{ numero: NumeroQuini; jaccard: number }> = [];

    for (const [otroNumero, jaccard] of fila.entries()) {
      if (otroNumero !== numero) {
        afinidades.push({ numero: otroNumero, jaccard });
      }
    }

    // Ordenar por Jaccard descendente
    afinidades.sort((a, b) => b.jaccard - a.jaccard);

    return afinidades.slice(0, cantidad);
  }

  /**
   * Calcula el score de afinidad para una combinación completa
   * Suma los Jaccard de todos los pares en la combinación
   */
  public calcularScoreAfinidad(combinacion: NumeroQuini[]): number {
    let score = 0;
    let pares = 0;

    for (let i = 0; i < combinacion.length; i++) {
      for (let j = i + 1; j < combinacion.length; j++) {
        const jaccard = this.obtenerJaccard(combinacion[i], combinacion[j]);
        score += jaccard;
        pares++;
      }
    }

    // Promedio de afinidad
    return pares > 0 ? score / pares : 0;
  }

  /**
   * Obtiene la matriz completa
   */
  public obtenerMatriz(): MatrizCoOcurrencia {
    return this.matrizCoOcurrencia;
  }

  /**
   * Exporta estadísticas de co-ocurrencia en formato legible
   */
  public exportarEstadisticas(): EstadisticaCoOcurrencia[] {
    const estadisticas: EstadisticaCoOcurrencia[] = [];

    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      for (let j = i + 1; j <= this.RANGO_MAX; j++) {
        const jaccard = this.obtenerJaccard(i, j);
        
        if (jaccard > 0) {
          estadisticas.push({
            numeroA: i,
            numeroB: j,
            jaccard,
            ocurrenciasConjuntas: 0, // Se calcularía desde datos originales
            ocurrenciasA: 0,
            ocurrenciasB: 0
          });
        }
      }
    }

    // Ordenar por Jaccard descendente
    estadisticas.sort((a, b) => b.jaccard - a.jaccard);

    return estadisticas;
  }

  /**
   * Genera un reporte de las afinidades más fuertes
   */
  public generarReporteAfinidades(cantidad: number = 20): string {
    const estadisticas = this.exportarEstadisticas();
    const topAfinidades = estadisticas.slice(0, cantidad);

    let reporte = '🔗 TOP AFINIDADES (Índice de Jaccard)\n';
    reporte += '='.repeat(60) + '\n\n';
    reporte += '| Número A | Número B | Jaccard |\n';
    reporte += '-'.repeat(60) + '\n';

    for (const afinidad of topAfinidades) {
      reporte += `|    ${afinidad.numeroA.toString().padStart(2, '0')}    | `;
      reporte += `   ${afinidad.numeroB.toString().padStart(2, '0')}    | `;
      reporte += `${afinidad.jaccard.toFixed(4).padStart(7)} |\n`;
    }

    reporte += '-'.repeat(60) + '\n';

    return reporte;
  }
}

