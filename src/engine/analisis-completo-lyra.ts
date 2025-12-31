/**
 * Análisis Completo con Protocolo Lyra Fase 2
 * 
 * Ejecuta el motor completo con todos los módulos avanzados:
 * - Co-Occurrence Engine (Jaccard)
 * - Entropy Filter (Shannon)
 * - Statistical Core con Amplitud
 * - Wheeling Engine con priorización
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos } from './index';
import { CoOccurrenceEngine } from './cooccurrence/CoOccurrenceEngine';
import { EntropyFilter } from './filters/EntropyFilter';
import { PatternAnalyzer } from './pattern/PatternAnalyzer';
import { ChiSquareTest } from './statistical/ChiSquareTest';
import { WheelingEngine, PesosPriorizacion } from './wheeling/WheelingEngine';
import { DataIngestion } from './ingestion/DataIngestion';

async function ejecutarAnalisisCompletoLyra() {
  console.log('🚀 MOTOR DE PROBABILIDADES - PROTOCOLO LYRA FASE 2\n');
  console.log('='.repeat(70));
  console.log('📋 Módulos activos:');
  console.log('   • Co-Occurrence Engine (Jaccard)');
  console.log('   • Entropy Filter (Shannon)');
  console.log('   • Pattern Analyzer (Deltas)');
  console.log('   • Chi-Square Test');
  console.log('   • Wheeling Engine (Priorización)');
  console.log('   • Statistical Core (Amplitud + Poisson)');
  console.log('='.repeat(70) + '\n');

  // 1. Cargar datos
  console.log('📥 1. CARGANDO DATOS HISTÓRICOS...\n');
  const dataIngestion = new DataIngestion();
  const sorteos = dataIngestion.cargarDatosHistoricos([2020, 2021, 2022, 2023, 2024, 2025]);
  const sorteosTradicional = dataIngestion.filtrarPorModalidad('tradicional', sorteos);
  console.log(`   ✓ ${sorteosTradicional.length} sorteos cargados\n`);

  // 2. Test de Chi-Cuadrado
  console.log('📊 2. TEST DE CHI-CUADRADO (Validación de Sesgos)\n');
  const chiSquareTest = new ChiSquareTest();
  const resultadoChiSquare = chiSquareTest.realizarTest(sorteosTradicional);
  console.log(chiSquareTest.generarReporte(resultadoChiSquare));
  console.log('\n');

  // 3. Motor principal
  console.log('🔬 3. ANÁLISIS ESTADÍSTICO PRINCIPAL\n');
  const configuracion: ConfiguracionMotor = {
    modalidad: 'tradicional',
    rangoNumeros: { min: 0, max: 45 },
    ventanasMediaMovil: [5, 10, 20],
    umbralDesviacion: 1.5,
    habilitarFiltros: {
      paridad: true,
      suma: true,
      espaciado: true,
      atraso: true
    }
  };

  const filtros: FiltrosHeuristicos = {
    paridad: {
      minPares: 2,
      maxPares: 4,
      minImpares: 2,
      maxImpares: 4
    },
    suma: {
      min: 105,
      max: 165
    },
    espaciado: {
      minDistancia: 1,
      maxDistancia: 20
    },
    entropia: {
      umbralMinimo: 0.3,
      umbralMaximo: 0.9
    },
    amplitud: {
      min: 32,
      max: 43
    }
  };

  const motor = new MotorProbabilidades(configuracion);
  const resultado = await motor.ejecutarAnalisis([2020, 2021, 2022, 2023, 2024, 2025], filtros);

  console.log('   📈 Estadísticas de Amplitud:');
  if (resultado.analisis.estadisticasAmplitud) {
    const amp = resultado.analisis.estadisticasAmplitud;
    console.log(`   Media: ${amp.media.toFixed(2)}`);
    console.log(`   Desviación estándar: ${amp.desviacionEstandar.toFixed(2)}`);
    console.log(`   Rango: ${amp.min} - ${amp.max}`);
    console.log(`   Percentiles: P25=${amp.percentil25.toFixed(1)}, P50=${amp.percentil50.toFixed(1)}, P75=${amp.percentil75.toFixed(1)}`);
    console.log(`   ✓ Rango histórico (32-43): ${amp.min >= 32 && amp.max <= 43 ? 'DENTRO' : 'FUERA'}\n`);
  }

  // 4. Co-Occurrence Engine
  console.log('🔗 4. ANÁLISIS DE CO-OCURRENCIA (Índice de Jaccard)\n');
  const coOccurrenceEngine = new CoOccurrenceEngine();
  const matrizCoOcurrencia = coOccurrenceEngine.calcularMatrizCoOcurrencia(sorteosTradicional);
  console.log(coOccurrenceEngine.generarReporteAfinidades(15));
  
  // Top 5 números con mayor presión
  const top5Presion = Array.from(resultado.analisis.frecuencias.values())
    .sort((a, b) => {
      const presionA = (a.atraso / (a.promedioAtraso || 1)) * resultado.analisis.desviacionEstandar;
      const presionB = (b.atraso / (b.promedioAtraso || 1)) * resultado.analisis.desviacionEstandar;
      return presionB - presionA;
    })
    .slice(0, 5);

  console.log('   Top 5 números con mayor presión estadística:');
  for (const estadistica of top5Presion) {
    const presion = (estadistica.atraso / (estadistica.promedioAtraso || 1)) * resultado.analisis.desviacionEstandar;
    const afinidades = coOccurrenceEngine.obtenerAfinidades(estadistica.numero, 5);
    console.log(`   Número ${estadistica.numero.toString().padStart(2, '0')} (Presión: ${presion.toFixed(2)}):`);
    console.log(`     Afinidades: ${afinidades.map(a => `${a.numero.toString().padStart(2, '0')}(${a.jaccard.toFixed(3)})`).join(', ')}\n`);
  }

  // 5. Pattern Analyzer (Deltas)
  console.log('📐 5. ANÁLISIS DE DELTAS (Pattern Analyzer)\n');
  const patternAnalyzer = new PatternAnalyzer();
  const distribucionDeltas = patternAnalyzer.calcularDistribucionDeltas(sorteosTradicional);
  console.log(patternAnalyzer.generarReporte());
  console.log('\n');

  // 6. Entropy Filter
  console.log('🎲 6. ANÁLISIS DE ENTROPÍA (Shannon)\n');
  const entropyFilter = new EntropyFilter();
  
  // Generar combinaciones de prueba basadas en top 5
  const numerosTop5 = top5Presion.map(e => e.numero);
  const combinacionesPrueba: Array<[number, number, number, number, number, number]> = [
    [numerosTop5[0], numerosTop5[1], 12, 25, 35, 42],
    [numerosTop5[0], numerosTop5[2], 15, 28, 38, 44],
    [numerosTop5[1], numerosTop5[3], 18, 30, 40, 45]
  ];

  console.log('   Análisis de entropía para combinaciones de prueba:\n');
  for (const comb of combinacionesPrueba) {
    const analisis = entropyFilter.analizarCombinacion(comb, 0.3, 0.9, resultado.analisis.frecuencias);
    console.log(`   Combinación: ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    console.log(`   Entropía: ${analisis.entropia.toFixed(4)}`);
    console.log(`   Entropía normalizada: ${analisis.entropiaNormalizada.toFixed(4)}`);
    console.log(`   Cumple umbral: ${analisis.cumpleUmbral ? '✅' : '❌'}\n`);
  }

  // 7. Generar combinaciones recomendadas
  console.log('✨ 7. COMBINACIONES RECOMENDADAS (Con Priorización Lyra)\n');
  
  // Configurar Wheeling Engine con priorización
  const wheelingEngine = new WheelingEngine();
  wheelingEngine.configurarPriorizacion(coOccurrenceEngine, resultado.analisis.frecuencias);
  
  const pesos: PesosPriorizacion = {
    coOcurrencia: 0.3,
    entropia: 0.3,
    amplitud: 0.2,
    frecuencia: 0.2
  };

  // Usar números del top 5 + algunos adicionales
  const numerosBase = [...numerosTop5, 12, 15, 20, 25, 30, 35, 40];
  
  try {
    const sistema = await wheelingEngine.generarSistemaReducidoOptimizado(numerosBase, 5, pesos);
    
    console.log(`   Números base (${numerosBase.length}): ${numerosBase.map(n => n.toString().padStart(2, '0')).join(', ')}\n`);
    console.log(`   Sistema generado: ${sistema.totalCombinaciones} combinaciones\n`);
    
    for (let i = 0; i < sistema.combinaciones.length; i++) {
      const comb = sistema.combinaciones[i];
      const suma = comb.reduce((acc, n) => acc + n, 0);
      const pares = comb.filter(n => n % 2 === 0).length;
      const amplitud = comb[comb.length - 1] - comb[0];
      const scoreAfinidad = coOccurrenceEngine.calcularScoreAfinidad(comb);
      const analisisEntropia = entropyFilter.analizarCombinacion(comb, 0.3, 0.9, resultado.analisis.frecuencias);
      const scorePriorizacion = (wheelingEngine as any).calcularScorePriorizacion(comb, pesos);
      
      console.log(`   COMBINACIÓN ${i + 1}:`);
      console.log(`   Números: ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
      console.log(`   Suma: ${suma} | Pares: ${pares} | Amplitud: ${amplitud}`);
      console.log(`   Score Afinidad (Jaccard): ${scoreAfinidad.toFixed(4)}`);
      console.log(`   Entropía: ${analisisEntropia.entropiaNormalizada.toFixed(4)}`);
      console.log(`   Score Priorización Total: ${scorePriorizacion.toFixed(4)}`);
      console.log('');
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error instanceof Error ? error.message : 'Error desconocido'}\n`);
  }

  // 8. Resumen final
  console.log('='.repeat(70));
  console.log('📊 RESUMEN FINAL\n');
  console.log(`   Período analizado: ${resultado.analisis.periodo.fechaInicio.toLocaleDateString('es-AR')} - ${resultado.analisis.periodo.fechaFin.toLocaleDateString('es-AR')}`);
  console.log(`   Total sorteos: ${resultado.analisis.periodo.totalSorteos}`);
  console.log(`   Números con atraso alto: ${resultado.anomalias.numerosConAtrasoAlto.length}`);
  console.log(`   Reducción del espacio: ${resultado.resultadoFiltrado.porcentajeReduccion.toFixed(2)}%`);
  console.log(`   Criterios aplicados: ${resultado.resultadoFiltrado.criteriosAplicados.join(', ')}`);
  console.log(`   Sesgo detectado: ${resultadoChiSquare.haySesgo ? '⚠️  SÍ' : '✅ NO'}`);
  console.log('='.repeat(70));
  console.log('⚠️  RECORDATORIO: Análisis estadístico - El azar es determinante\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarAnalisisCompletoLyra()
    .then(() => {
      console.log('✅ Análisis completo finalizado\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarAnalisisCompletoLyra };

