/**
 * Motor de Probabilidades para Análisis de Lotería (Quiniela)
 * 
 * Punto de entrada principal del motor. Coordina todos los módulos:
 * - Data Ingestion
 * - Statistical Core (con Distribución de Poisson)
 * - Markov Chain Engine
 * - Heuristic Filters
 * - Pattern Analyzer (Análisis de Deltas)
 * - Wheeling Engine (Sistemas Reducidos)
 * - Chi-Square Test (Validación de sesgos)
 */

import { DataIngestion } from './ingestion/DataIngestion';
import { StatisticalCore } from './statistical/StatisticalCore';
import { MarkovChainEngine } from './markov/MarkovChainEngine';
import { HeuristicFilters } from './filters/HeuristicFilters';
import { PatternAnalyzer } from './pattern/PatternAnalyzer';
import { WheelingEngine } from './wheeling/WheelingEngine';
import { ChiSquareTest } from './statistical/ChiSquareTest';
import {
  ConfiguracionMotor,
  ResultadoAnalisis,
  FiltrosHeuristicos,
  SorteoNormalizado,
  AnalisisEstadistico,
  NumeroQuini
} from './types';

/**
 * Clase principal del Motor de Probabilidades
 */
export class MotorProbabilidades {
  private dataIngestion: DataIngestion;
  private statisticalCore: StatisticalCore;
  private markovEngine: MarkovChainEngine;
  private heuristicFilters: HeuristicFilters;
  private configuracion: ConfiguracionMotor;

  constructor(configuracion: ConfiguracionMotor) {
    this.configuracion = configuracion;
    this.dataIngestion = new DataIngestion();
    this.statisticalCore = new StatisticalCore();
    this.markovEngine = new MarkovChainEngine();
    this.heuristicFilters = new HeuristicFilters();
  }

  /**
   * Ejecuta el análisis completo del motor
   * @param años Array de años a analizar (2020-2025)
   * @param filtros Filtros heurísticos opcionales
   */
  public async ejecutarAnalisis(
    años: number[],
    filtros?: FiltrosHeuristicos
  ): Promise<ResultadoAnalisis> {
    // 1. Cargar datos históricos
    console.log(`[Motor] Cargando datos históricos para años: ${años.join(', ')}`);
    const sorteos = this.dataIngestion.cargarDatosHistoricos(años);
    
    // 2. Filtrar por modalidad
    const sorteosFiltrados = this.dataIngestion.filtrarPorModalidad(
      this.configuracion.modalidad,
      sorteos
    );

    console.log(`[Motor] Sorteos cargados: ${sorteosFiltrados.length}`);

    // 3. Calcular análisis estadístico
    console.log('[Motor] Calculando análisis estadístico...');
    const analisis = this.statisticalCore.calcularAnalisis(
      sorteosFiltrados,
      this.configuracion.ventanasMediaMovil
    );

    // 4. Construir matriz de Markov
    console.log('[Motor] Construyendo matriz de transición de Markov...');
    const matrizTransicion = this.markovEngine.construirMatrizTransicion(sorteosFiltrados);
    analisis.matrizTransicion = matrizTransicion;

    // 5. Identificar anomalías
    console.log('[Motor] Identificando anomalías...');
    const numerosConAtrasoAlto = this.statisticalCore.identificarAtrasosAltos(
      analisis.frecuencias,
      this.configuracion.umbralDesviacion
    );

    // 6. Aplicar filtros heurísticos (si se proporcionan)
    let resultadoFiltrado;
    if (filtros) {
      console.log('[Motor] Aplicando filtros heurísticos...');
      
      // Generar combinaciones de prueba (o usar las proporcionadas)
      // Por ahora, generamos un conjunto de prueba
      const combinacionesPrueba = this.heuristicFilters.generarCombinacionesAleatorias(10000);
      
      // Actualizar filtros con números de atraso alto
      const filtrosCompletos: FiltrosHeuristicos = {
        ...filtros,
        atraso: {
          ...filtros.atraso,
          numerosConAtrasoAlto
        }
      };

      resultadoFiltrado = this.heuristicFilters.aplicarFiltros(
        combinacionesPrueba,
        filtrosCompletos,
        analisis
      );
    } else {
      resultadoFiltrado = {
        combinacionesValidas: [],
        combinacionesFiltradas: 0,
        porcentajeReduccion: 0,
        criteriosAplicados: []
      };
    }

    // 7. Identificar combinaciones atípicas
    const combinacionesAtipicas = this.identificarCombinacionesAtipicas(
      sorteosFiltrados,
      analisis
    );

    // 8. Identificar desviaciones significativas
    const desviacionesSignificativas = this.identificarDesviacionesSignificativas(analisis);

    // 9. Construir resultado final
    const resultado: ResultadoAnalisis = {
      analisis,
      filtros: filtros || {},
      resultadoFiltrado,
      anomalias: {
        numerosConAtrasoAlto,
        combinacionesAtipicas,
        desviacionesSignificativas
      },
      timestamp: new Date()
    };

    console.log('[Motor] Análisis completado exitosamente');
    return resultado;
  }

  /**
   * Identifica combinaciones atípicas basadas en desviaciones estadísticas
   */
  private identificarCombinacionesAtipicas(
    sorteos: SorteoNormalizado[],
    analisis: AnalisisEstadistico
  ): SorteoNormalizado[] {
    const atipicas: SorteoNormalizado[] = [];
    const mediaSuma = 141; // Media típica
    const desviacionSuma = 20;

    for (const sorteo of sorteos) {
      const desviacionSumaZ = Math.abs(sorteo.suma - mediaSuma) / desviacionSuma;
      
      // Considerar atípica si la suma está a más de 2σ de la media
      if (desviacionSumaZ > 2) {
        atipicas.push(sorteo);
      }
    }

    return atipicas;
  }

  /**
   * Identifica números con desviaciones significativas en frecuencia
   */
  private identificarDesviacionesSignificativas(
    analisis: AnalisisEstadistico
  ): Array<{ numero: NumeroQuini; desviacion: number }> {
    const desviaciones: Array<{ numero: NumeroQuini; desviacion: number }> = [];

    for (const estadistica of analisis.frecuencias.values()) {
      const desviacionZ = Math.abs(estadistica.frecuencia - analisis.media) / analisis.desviacionEstandar;
      
      if (desviacionZ > this.configuracion.umbralDesviacion) {
        desviaciones.push({
          numero: estadistica.numero,
          desviacion: desviacionZ
        });
      }
    }

    return desviaciones.sort((a, b) => b.desviacion - a.desviacion);
  }

  /**
   * Obtiene estadísticas de un número específico
   */
  public obtenerEstadisticasNumero(numero: NumeroQuini): AnalisisEstadistico['frecuencias'] extends Map<infer K, infer V> ? V | undefined : never {
    // Este método se implementaría con acceso a los datos del análisis
    // Por ahora es un placeholder
    return undefined as any;
  }

  /**
   * Actualiza la configuración del motor
   */
  public actualizarConfiguracion(configuracion: Partial<ConfiguracionMotor>): void {
    this.configuracion = { ...this.configuracion, ...configuracion };
  }

  /**
   * Obtiene la configuración actual
   */
  public obtenerConfiguracion(): ConfiguracionMotor {
    return { ...this.configuracion };
  }
}

// Exportar todos los tipos y clases
export * from './types';
export { DataIngestion } from './ingestion/DataIngestion';
export { StatisticalCore } from './statistical/StatisticalCore';
export { MarkovChainEngine } from './markov/MarkovChainEngine';
export { HeuristicFilters } from './filters/HeuristicFilters';
export { PatternAnalyzer } from './pattern/PatternAnalyzer';
export { WheelingEngine } from './wheeling/WheelingEngine';
export { ChiSquareTest } from './statistical/ChiSquareTest';

// Exportar utilidades estadísticas
export * from './statistical/PoissonDistribution';

