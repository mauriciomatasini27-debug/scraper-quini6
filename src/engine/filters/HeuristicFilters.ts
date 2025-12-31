/**
 * Módulo Heuristic Filters
 * 
 * Implementa filtros heurísticos para reducir el espacio de búsqueda:
 * - Paridad (Par/Impar)
 * - Sumas (Campana de Gauss)
 * - Espaciado
 * - Atrasos
 * - Entropía (Shannon) - Protocolo Lyra Fase 2
 * - Amplitud (Rango)
 */

import {
  Combinacion,
  FiltrosHeuristicos,
  ResultadoFiltrado,
  NumeroQuini,
  AnalisisEstadistico
} from '../types';
import { EntropyFilter } from './EntropyFilter';

/**
 * Clase principal para filtros heurísticos
 */
export class HeuristicFilters {
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;
  private entropyFilter: EntropyFilter;

  constructor() {
    this.entropyFilter = new EntropyFilter();
  }

  /**
   * Aplica todos los filtros configurados a un conjunto de combinaciones
   */
  public aplicarFiltros(
    combinaciones: Combinacion[],
    filtros: FiltrosHeuristicos,
    analisis?: AnalisisEstadistico
  ): ResultadoFiltrado {
    const criteriosAplicados: string[] = [];
    let combinacionesFiltradas = [...combinaciones];

    // Filtro de paridad
    if (filtros.paridad) {
      const antes = combinacionesFiltradas.length;
      combinacionesFiltradas = this.filtrarPorParidad(combinacionesFiltradas, filtros.paridad);
      if (combinacionesFiltradas.length < antes) {
        criteriosAplicados.push('Paridad');
      }
    }

    // Filtro de suma
    if (filtros.suma && analisis) {
      const antes = combinacionesFiltradas.length;
      combinacionesFiltradas = this.filtrarPorSuma(
        combinacionesFiltradas,
        filtros.suma,
        analisis
      );
      if (combinacionesFiltradas.length < antes) {
        criteriosAplicados.push('Suma (Campana de Gauss)');
      }
    }

    // Filtro de espaciado
    if (filtros.espaciado) {
      const antes = combinacionesFiltradas.length;
      combinacionesFiltradas = this.filtrarPorEspaciado(combinacionesFiltradas, filtros.espaciado);
      if (combinacionesFiltradas.length < antes) {
        criteriosAplicados.push('Espaciado');
      }
    }

    // Filtro de atraso
    if (filtros.atraso && analisis) {
      const antes = combinacionesFiltradas.length;
      combinacionesFiltradas = this.filtrarPorAtraso(
        combinacionesFiltradas,
        filtros.atraso,
        analisis
      );
      if (combinacionesFiltradas.length < antes) {
        criteriosAplicados.push('Atraso');
      }
    }

    const combinacionesFiltradasCount = combinaciones.length - combinacionesFiltradas.length;
    const porcentajeReduccion = combinaciones.length > 0
      ? (combinacionesFiltradasCount / combinaciones.length) * 100
      : 0;

    return {
      combinacionesValidas: combinacionesFiltradas,
      combinacionesFiltradas: combinacionesFiltradasCount,
      porcentajeReduccion,
      criteriosAplicados
    };
  }

  /**
   * Filtra combinaciones por paridad (cantidad de pares/impares)
   */
  private filtrarPorParidad(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['paridad']>
  ): Combinacion[] {
    return combinaciones.filter(combinacion => {
      let pares = 0;
      let impares = 0;

      for (const numero of combinacion) {
        if (numero % 2 === 0) {
          pares++;
        } else {
          impares++;
        }
      }

      const cumpleMinPares = filtro.minPares === undefined || pares >= filtro.minPares;
      const cumpleMaxPares = filtro.maxPares === undefined || pares <= filtro.maxPares;
      const cumpleMinImpares = filtro.minImpares === undefined || impares >= filtro.minImpares;
      const cumpleMaxImpares = filtro.maxImpares === undefined || impares <= filtro.maxImpares;

      return cumpleMinPares && cumpleMaxPares && cumpleMinImpares && cumpleMaxImpares;
    });
  }

  /**
   * Filtra combinaciones por suma usando distribución normal (Campana de Gauss)
   */
  private filtrarPorSuma(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['suma']>,
    analisis: AnalisisEstadistico
  ): Combinacion[] {
    // Calcular media y desviación estándar de las sumas históricas
    // Por simplicidad, usamos valores empíricos típicos
    // En una implementación completa, calcularíamos esto desde los datos
    
    const mediaSuma = 141; // Media típica para 6 números del 1-46
    const desviacionSuma = 20; // Desviación típica aproximada

    let minSuma = filtro.min;
    let maxSuma = filtro.max;

    // Si se especifica desviaciones estándar, calcular rango
    if (filtro.desviacionesEstandar !== undefined) {
      const desviaciones = filtro.desviacionesEstandar;
      minSuma = mediaSuma - (desviaciones * desviacionSuma);
      maxSuma = mediaSuma + (desviaciones * desviacionSuma);
    }

    return combinaciones.filter(combinacion => {
      const suma = combinacion.reduce((acc, n) => acc + n, 0);
      
      if (minSuma !== undefined && suma < minSuma) {
        return false;
      }
      
      if (maxSuma !== undefined && suma > maxSuma) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filtra combinaciones por espaciado entre números
   */
  private filtrarPorEspaciado(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['espaciado']>
  ): Combinacion[] {
    return combinaciones.filter(combinacion => {
      const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
      
      for (let i = 1; i < numerosOrdenados.length; i++) {
        const distancia = numerosOrdenados[i] - numerosOrdenados[i - 1];
        
        if (filtro.minDistancia !== undefined && distancia < filtro.minDistancia) {
          return false;
        }
        
        if (filtro.maxDistancia !== undefined && distancia > filtro.maxDistancia) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filtra combinaciones priorizando números con atraso alto
   */
  private filtrarPorAtraso(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['atraso']>,
    analisis: AnalisisEstadistico
  ): Combinacion[] {
    if (!filtro.numerosConAtrasoAlto || filtro.numerosConAtrasoAlto.length === 0) {
      return combinaciones;
    }

    // Priorizar combinaciones que incluyan números con atraso alto
    // Opción 1: Filtrar solo combinaciones que incluyan al menos un número con atraso alto
    // Opción 2: Ordenar por cantidad de números con atraso alto
    
    // Implementamos opción 1: mantener solo combinaciones con al menos un número con atraso alto
    const numerosAtrasoAlto = new Set(filtro.numerosConAtrasoAlto);
    
    return combinaciones.filter(combinacion => {
      return combinacion.some(numero => numerosAtrasoAlto.has(numero));
    });
  }

  /**
   * Genera todas las combinaciones posibles (útil para testing)
   * ADVERTENCIA: Esto genera 9,366,819 combinaciones. Usar con precaución.
   */
  public generarTodasLasCombinaciones(): Combinacion[] {
    const combinaciones: Combinacion[] = [];

    const generar = (actual: NumeroQuini[], inicio: NumeroQuini): void => {
      if (actual.length === 6) {
        combinaciones.push(actual as Combinacion);
        return;
      }

      for (let num = inicio; num <= this.RANGO_MAX; num++) {
        generar([...actual, num], num + 1);
      }
    };

    generar([], this.RANGO_MIN);
    return combinaciones;
  }

  /**
   * Filtra combinaciones por entropía de Shannon
   */
  private filtrarPorEntropia(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['entropia']>,
    analisis?: AnalisisEstadistico
  ): Combinacion[] {
    const umbralMinimo = filtro.umbralMinimo ?? 0.3;
    const umbralMaximo = filtro.umbralMaximo ?? 0.9;
    const frecuencias = analisis?.frecuencias;

    return this.entropyFilter.filtrarPorEntropia(
      combinaciones,
      umbralMinimo,
      umbralMaximo,
      frecuencias
    );
  }

  /**
   * Filtra combinaciones por rango de amplitud
   */
  private filtrarPorAmplitud(
    combinaciones: Combinacion[],
    filtro: NonNullable<FiltrosHeuristicos['amplitud']>
  ): Combinacion[] {
    return combinaciones.filter(combinacion => {
      const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
      const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];
      
      if (filtro.min !== undefined && amplitud < filtro.min) {
        return false;
      }
      
      if (filtro.max !== undefined && amplitud > filtro.max) {
        return false;
      }

      return true;
    });
  }

  /**
   * Genera combinaciones aleatorias para testing (sin repetición)
   */
  public generarCombinacionesAleatorias(cantidad: number): Combinacion[] {
    const combinacionesSet = new Set<string>();
    const maxIntentos = cantidad * 100; // Evitar loops infinitos
    let intentos = 0;

    while (combinacionesSet.size < cantidad && intentos < maxIntentos) {
      const combinacion: NumeroQuini[] = [];
      const numerosUsados = new Set<NumeroQuini>();

      while (combinacion.length < 6 && intentos < maxIntentos) {
        const num = Math.floor(Math.random() * (this.RANGO_MAX - this.RANGO_MIN + 1)) + this.RANGO_MIN;
        
        if (!numerosUsados.has(num)) {
          numerosUsados.add(num);
          combinacion.push(num);
        }
        intentos++;
      }

      if (combinacion.length === 6) {
        combinacion.sort((a, b) => a - b);
        combinacionesSet.add(JSON.stringify(combinacion));
      }
    }

    return Array.from(combinacionesSet).map(c => JSON.parse(c) as Combinacion);
  }
}

