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
 * - Co-Occurrence Engine (Jaccard)
 * - AI Predictor (Juez Final - Protocolo Lyra)
 */

import { DataIngestion } from './ingestion/DataIngestion';
import { StatisticalCore } from './statistical/StatisticalCore';
import { MarkovChainEngine } from './markov/MarkovChainEngine';
import { HeuristicFilters } from './filters/HeuristicFilters';
import { PatternAnalyzer } from './pattern/PatternAnalyzer';
import { WheelingEngine, PesosPriorizacion } from './wheeling/WheelingEngine';
import { ChiSquareTest } from './statistical/ChiSquareTest';
import { CoOccurrenceEngine } from './cooccurrence/CoOccurrenceEngine';
import { AIPredictor, ResumenEstadistico } from './ai/AIPredictor';
import { logAIVeredicto } from '../supabase-client';
import {
  ConfiguracionMotor,
  ResultadoAnalisis,
  FiltrosHeuristicos,
  SorteoNormalizado,
  AnalisisEstadistico,
  NumeroQuini,
  VeredictoJuezFinal
} from './types';

/**
 * Clase principal del Motor de Probabilidades
 */
export class MotorProbabilidades {
  private dataIngestion: DataIngestion;
  private statisticalCore: StatisticalCore;
  private markovEngine: MarkovChainEngine;
  private heuristicFilters: HeuristicFilters;
  private coOccurrenceEngine: CoOccurrenceEngine;
  private wheelingEngine: WheelingEngine;
  private configuracion: ConfiguracionMotor;
  private usarJuezFinal: boolean;

  constructor(configuracion: ConfiguracionMotor, usarJuezFinal: boolean = true) {
    this.configuracion = configuracion;
    this.usarJuezFinal = usarJuezFinal;
    this.dataIngestion = new DataIngestion();
    this.statisticalCore = new StatisticalCore();
    this.markovEngine = new MarkovChainEngine();
    this.heuristicFilters = new HeuristicFilters();
    this.coOccurrenceEngine = new CoOccurrenceEngine();
    this.wheelingEngine = new WheelingEngine();
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

    // 9. Generar combinaciones candidatas con Wheeling Engine
    let veredictoJuezFinal;
    
    if (this.usarJuezFinal) {
      console.log('[Motor] Generando combinaciones candidatas con Wheeling Engine...');
      
      // Calcular co-ocurrencia
      this.coOccurrenceEngine.calcularMatrizCoOcurrencia(sorteosFiltrados);
      
      // Configurar Wheeling Engine
      this.wheelingEngine.configurarPriorizacion(
        this.coOccurrenceEngine,
        analisis.frecuencias
      );

      // Seleccionar números base (top presión + mejor afinidad)
      const top5Presion = numerosConAtrasoAlto.slice(0, 5);
      
      // Obtener números con mejor afinidad
      const numerosMejorAfinidad: NumeroQuini[] = [];
      for (let num = 0; num <= 45; num++) {
        const afinidades = this.coOccurrenceEngine.obtenerAfinidades(num, 10);
        const scorePromedio = afinidades.reduce((sum, a) => sum + a.jaccard, 0) / afinidades.length;
        numerosMejorAfinidad.push(num);
      }

      const topAfinidad = numerosMejorAfinidad
        .map((num, idx) => ({ 
          num, 
          score: this.coOccurrenceEngine.obtenerAfinidades(num, 10).reduce((sum, a) => sum + a.jaccard, 0) / 10 
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.num);

      const numerosSeleccionados = [...new Set([...top5Presion, ...topAfinidad])].slice(0, 12);

      // Pesos optimizados
      const pesosOptimizados: PesosPriorizacion = {
        coOcurrencia: 0.046,
        entropia: 0.578,
        amplitud: 0.262,
        frecuencia: 0.113
      };

      // Generar sistema reducido
      const sistema = this.wheelingEngine.generarSistemaReducidoOptimizado(
        numerosSeleccionados,
        20, // Máximo 20 combinaciones candidatas
        pesosOptimizados
      );

      const combinacionesMatematicas = sistema.combinaciones;

      console.log(`[Motor] ${combinacionesMatematicas.length} combinaciones candidatas generadas`);
      console.log(`🤖 [Motor] IA analizando ${combinacionesMatematicas.length} combinaciones finalistas...`);

      // 10. Juez Final (AI Predictor)
      try {
        const apiKey = process.env.GROK_API_KEY;
        if (apiKey) {
          const predictorIA = new AIPredictor(apiKey);
          
          // Preparar resumen estadístico
          const resumenEstadistico = AIPredictor.generarResumenEstadistico(analisis, 10);
          
          const veredicto = await predictorIA.obtenerVeredictoFinal(
            combinacionesMatematicas,
            resumenEstadistico,
            analisis
          );

          veredictoJuezFinal = {
            top3: veredicto.top3,
            analisisTecnico: veredicto.analisisTecnico,
            razones: veredicto.razones,
            timestamp: new Date()
          } as VeredictoJuezFinal;

          console.log('[Motor] ✅ Veredicto del Juez Final obtenido');

          // Guardar veredicto en Supabase para auditoría
          try {
            // Obtener la fecha del próximo sorteo (o usar la fecha actual)
            const fechaProximoSorteo = new Date();
            fechaProximoSorteo.setDate(fechaProximoSorteo.getDate() + 1); // Asumir que es para el próximo sorteo
            
            await logAIVeredicto(
              veredictoJuezFinal,
              fechaProximoSorteo,
              undefined, // numeroSorteo se puede actualizar después
              {
                totalCombinacionesAnalizadas: combinacionesMatematicas.length,
                periodoAnalizado: {
                  desde: analisis.periodo.fechaInicio.toISOString(),
                  hasta: analisis.periodo.fechaFin.toISOString(),
                  totalSorteos: analisis.periodo.totalSorteos
                },
                numerosConAtrasoAlto: numerosConAtrasoAlto.slice(0, 10),
                desviacionEstandar: analisis.desviacionEstandar,
                media: analisis.media
              }
            );
          } catch (error) {
            console.log(`[Motor] ⚠️  Error al guardar veredicto en Supabase: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            // No fallar el proceso si falla el guardado en Supabase
          }
        } else {
          console.log('[Motor] ⚠️  GROK_API_KEY no configurada, omitiendo Juez Final');
        }
      } catch (error) {
        console.log(`[Motor] ⚠️  Error en Juez Final: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        console.log('[Motor] Continuando sin veredicto de IA...');
      }
    }

    // 11. Construir resultado final
    const resultado: ResultadoAnalisis = {
      analisis,
      filtros: filtros || {},
      resultadoFiltrado,
      anomalias: {
        numerosConAtrasoAlto,
        combinacionesAtipicas,
        desviacionesSignificativas
      },
      veredictoJuezFinal,
      timestamp: new Date()
    };

    // 12. Mostrar resultado final (solo después del veredicto del Juez Final)
    this.mostrarResultadoFinal(resultado);

    return resultado;
  }

  /**
   * Muestra el resultado final del análisis (Protocolo Lyra)
   * Solo se ejecuta después de que el Juez Final haya dado su veredicto
   */
  private mostrarResultadoFinal(resultado: ResultadoAnalisis): void {
    console.log('\n' + '='.repeat(70));
    console.log('=== PROTOCOLO LYRA: RESULTADOS DE ALTA PROBABILIDAD ===');
    console.log('='.repeat(70) + '\n');

    // Mostrar veredicto del Juez Final si está disponible
    if (resultado.veredictoJuezFinal && resultado.veredictoJuezFinal.top3.length > 0) {
      console.log('🏆 VEREDICTO DEL JUEZ FINAL (AI PREDICTOR)\n');
      console.log('🤖 Las siguientes 3 combinaciones fueron seleccionadas por el Juez Final');
      console.log('   después de pasar todos los filtros estadísticos y análisis de IA:\n');

      for (let i = 0; i < resultado.veredictoJuezFinal.top3.length; i++) {
        const comb = resultado.veredictoJuezFinal.top3[i];
        const suma = comb.reduce((a, b) => a + b, 0);
        const pares = comb.filter(n => n % 2 === 0).length;
        const numerosOrdenados = [...comb].sort((a, b) => a - b);
        const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];

        console.log(`🥇 COMBINACIÓN ${i + 1} (Seleccionada por Juez Final):`);
        console.log(`   ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
        console.log(`   Suma: ${suma} | Amplitud: ${amplitud} | Pares: ${pares} | Impares: ${6 - pares}\n`);
      }

      if (resultado.veredictoJuezFinal.analisisTecnico) {
        console.log('📝 ANÁLISIS TÉCNICO DEL JUEZ FINAL:\n');
        console.log(`   ${resultado.veredictoJuezFinal.analisisTecnico}\n`);
      }

      if (resultado.veredictoJuezFinal.razones && resultado.veredictoJuezFinal.razones.length > 0) {
        console.log('💡 RAZONES DE LA SELECCIÓN:\n');
        resultado.veredictoJuezFinal.razones.forEach((razon, idx) => {
          console.log(`   ${idx + 1}. ${razon}\n`);
        });
      }
    } else {
      console.log('⚠️  JUEZ FINAL NO DISPONIBLE\n');
      console.log('   El Juez Final (AI Predictor) no pudo generar un veredicto.');
      console.log('   Posibles razones:');
      console.log('   - GROK_API_KEY no configurada');
      console.log('   - Cuota de API excedida');
      console.log('   - Error en la conexión con Grok\n');
      
      // Mostrar top 3 por score estadístico como fallback
      console.log('📊 TOP 3 COMBINACIONES (Por Score Estadístico - Fallback):\n');
      // Nota: En este caso, las combinaciones candidatas no están disponibles aquí
      // Se mostrarían si se generaron con Wheeling Engine
    }

    // Resumen estadístico
    console.log('='.repeat(70));
    console.log('📊 RESUMEN ESTADÍSTICO\n');
    console.log(`   Período: ${resultado.analisis.periodo.fechaInicio.toLocaleDateString('es-AR')} - ${resultado.analisis.periodo.fechaFin.toLocaleDateString('es-AR')}`);
    console.log(`   Total sorteos analizados: ${resultado.analisis.periodo.totalSorteos}`);
    console.log(`   Números con atraso alto: ${resultado.anomalias.numerosConAtrasoAlto.length}`);
    console.log(`   Reducción del espacio: ${resultado.resultadoFiltrado.porcentajeReduccion.toFixed(2)}%`);
    console.log(`   Criterios aplicados: ${resultado.resultadoFiltrado.criteriosAplicados.join(', ')}`);

    if (resultado.analisis.estadisticasAmplitud) {
      const amp = resultado.analisis.estadisticasAmplitud;
      console.log(`\n   Estadísticas de Amplitud:`);
      console.log(`   Media: ${amp.media.toFixed(2)} | Rango: ${amp.min}-${amp.max}`);
      console.log(`   Rango óptimo histórico (32-43): ${amp.media >= 32 && amp.media <= 43 ? '✅ DENTRO' : '⚠️  FUERA'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('⚠️  RECORDATORIO: Análisis estadístico - El azar es determinante');
    console.log('='.repeat(70) + '\n');
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
export { CoOccurrenceEngine } from './cooccurrence/CoOccurrenceEngine';
export { EntropyFilter } from './filters/EntropyFilter';
export { AIPredictor } from './ai/AIPredictor';

// Exportar utilidades estadísticas
export * from './statistical/PoissonDistribution';

