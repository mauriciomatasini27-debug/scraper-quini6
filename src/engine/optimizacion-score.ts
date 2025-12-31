/**
 * Optimización de Score - Análisis y Mejoras
 * 
 * Analiza cómo aumentar el score de priorización de las combinaciones
 * mediante ajustes en pesos, algoritmos y selección de números.
 */

import { DataIngestion } from './ingestion/DataIngestion';
import { CoOccurrenceEngine } from './cooccurrence/CoOccurrenceEngine';
import { EntropyFilter } from './filters/EntropyFilter';
import { WheelingEngine, PesosPriorizacion } from './wheeling/WheelingEngine';
import { StatisticalCore } from './statistical/StatisticalCore';
import { MotorProbabilidades, ConfiguracionMotor } from './index';

/**
 * Analiza y optimiza el score de combinaciones
 */
async function analizarYOptimizarScore() {
  console.log('🔍 ANÁLISIS Y OPTIMIZACIÓN DE SCORE\n');
  console.log('='.repeat(70) + '\n');

  // Cargar datos
  const dataIngestion = new DataIngestion();
  const sorteos = dataIngestion.cargarDatosHistoricos([2020, 2021, 2022, 2023, 2024, 2025]);
  const sorteosTradicional = dataIngestion.filtrarPorModalidad('tradicional', sorteos);

  // Análisis estadístico
  const statisticalCore = new StatisticalCore();
  const analisis = statisticalCore.calcularAnalisis(sorteosTradicional);

  // Co-Occurrence
  const coOccurrenceEngine = new CoOccurrenceEngine();
  coOccurrenceEngine.calcularMatrizCoOcurrencia(sorteosTradicional);

  // Entropy Filter
  const entropyFilter = new EntropyFilter();

  // Identificar números con mayor presión
  const top5Presion = Array.from(analisis.frecuencias.values())
    .sort((a, b) => {
      const presionA = (a.atraso / (a.promedioAtraso || 1)) * analisis.desviacionEstandar;
      const presionB = (b.atraso / (b.promedioAtraso || 1)) * analisis.desviacionEstandar;
      return presionB - presionA;
    })
    .slice(0, 5);

  console.log('📊 1. ANÁLISIS DE COMPONENTES DEL SCORE\n');
  
  // Analizar cada componente del score
  const numerosBase = top5Presion.map(e => e.numero);
  const numerosAdicionales = [12, 15, 20, 25, 35, 40];
  const todosLosNumeros = [...new Set([...numerosBase, ...numerosAdicionales])];

  console.log(`   Números base: ${todosLosNumeros.map(n => n.toString().padStart(2, '0')).join(', ')}\n`);

  // Generar combinaciones de prueba
  const wheelingEngine = new WheelingEngine();
  wheelingEngine.configurarPriorizacion(coOccurrenceEngine, analisis.frecuencias);

  // Pesos actuales
  const pesosActuales: PesosPriorizacion = {
    coOcurrencia: 0.3,
    entropia: 0.3,
    amplitud: 0.2,
    frecuencia: 0.2
  };

  console.log('   Pesos actuales:');
  console.log(`   - Co-ocurrencia: ${(pesosActuales.coOcurrencia || 0) * 100}%`);
  console.log(`   - Entropía: ${(pesosActuales.entropia || 0) * 100}%`);
  console.log(`   - Amplitud: ${(pesosActuales.amplitud || 0) * 100}%`);
  console.log(`   - Frecuencia: ${(pesosActuales.frecuencia || 0) * 100}%\n`);

  // Generar sistema y analizar
  const sistema = wheelingEngine.generarSistemaReducidoOptimizado(todosLosNumeros, 10, pesosActuales);

  console.log('   Análisis de componentes por combinación:\n');
  
  const combinacionesAnalizadas: Array<{
    combinacion: number[];
    scoreTotal: number;
    scoreCoOcurrencia: number;
    scoreEntropia: number;
    scoreAmplitud: number;
    scoreFrecuencia: number;
    detalles: any;
  }> = [];

  for (const comb of sistema.combinaciones) {
    // Calcular cada componente
    const scoreAfinidad = coOccurrenceEngine.calcularScoreAfinidad(comb);
    const entropia = entropyFilter.calcularEntropiaCombinada(comb, analisis.frecuencias);
    const entropiaNorm = entropyFilter.normalizarEntropia(entropia);
    
    const numerosOrdenados = [...comb].sort((a, b) => a - b);
    const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];
    let scoreAmplitud = 0;
    if (amplitud >= 32 && amplitud <= 43) {
      scoreAmplitud = 1.0;
    } else if (amplitud >= 28 && amplitud < 32) {
      scoreAmplitud = 0.7;
    } else if (amplitud > 43 && amplitud <= 45) {
      scoreAmplitud = 0.7;
    } else {
      scoreAmplitud = 0.3;
    }

    let scoreFrecuencia = 0;
    for (const numero of comb) {
      const estadistica = analisis.frecuencias.get(numero);
      if (estadistica) {
        const freqRel = estadistica.frecuenciaRelativa;
        if (freqRel >= 0.01 && freqRel <= 0.1) {
          scoreFrecuencia += 1.0;
        } else {
          scoreFrecuencia += 0.5;
        }
      }
    }
    scoreFrecuencia = scoreFrecuencia / comb.length;

    const scoreTotal = 
      scoreAfinidad * (pesosActuales.coOcurrencia || 0) +
      entropiaNorm * (pesosActuales.entropia || 0) +
      scoreAmplitud * (pesosActuales.amplitud || 0) +
      scoreFrecuencia * (pesosActuales.frecuencia || 0);

    combinacionesAnalizadas.push({
      combinacion: comb,
      scoreTotal,
      scoreCoOcurrencia: scoreAfinidad,
      scoreEntropia: entropiaNorm,
      scoreAmplitud,
      scoreFrecuencia,
      detalles: {
        suma: comb.reduce((a, b) => a + b, 0),
        amplitud,
        pares: comb.filter(n => n % 2 === 0).length
      }
    });
  }

  // Ordenar por score total
  combinacionesAnalizadas.sort((a, b) => b.scoreTotal - a.scoreTotal);

  // Mostrar top 5
  console.log('   Top 5 combinaciones (score actual):\n');
  for (let i = 0; i < Math.min(5, combinacionesAnalizadas.length); i++) {
    const c = combinacionesAnalizadas[i];
    console.log(`   ${i + 1}. ${c.combinacion.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    console.log(`      Score Total: ${c.scoreTotal.toFixed(4)}`);
    console.log(`      - Co-ocurrencia: ${c.scoreCoOcurrencia.toFixed(4)} (${(c.scoreCoOcurrencia * (pesosActuales.coOcurrencia || 0) * 100).toFixed(1)}%)`);
    console.log(`      - Entropía: ${c.scoreEntropia.toFixed(4)} (${(c.scoreEntropia * (pesosActuales.entropia || 0) * 100).toFixed(1)}%)`);
    console.log(`      - Amplitud: ${c.scoreAmplitud.toFixed(4)} (${(c.scoreAmplitud * (pesosActuales.amplitud || 0) * 100).toFixed(1)}%)`);
    console.log(`      - Frecuencia: ${c.scoreFrecuencia.toFixed(4)} (${(c.scoreFrecuencia * (pesosActuales.frecuencia || 0) * 100).toFixed(1)}%)`);
    console.log(`      Suma: ${c.detalles.suma} | Amplitud: ${c.detalles.amplitud} | Pares: ${c.detalles.pares}\n`);
  }

  // 2. Estrategias de optimización
  console.log('🚀 2. ESTRATEGIAS PARA AUMENTAR EL SCORE\n');
  console.log('   A. Optimización de Pesos:\n');
  
  // Calcular promedios de cada componente
  const promedioCoOcurrencia = combinacionesAnalizadas.reduce((sum, c) => sum + c.scoreCoOcurrencia, 0) / combinacionesAnalizadas.length;
  const promedioEntropia = combinacionesAnalizadas.reduce((sum, c) => sum + c.scoreEntropia, 0) / combinacionesAnalizadas.length;
  const promedioAmplitud = combinacionesAnalizadas.reduce((sum, c) => sum + c.scoreAmplitud, 0) / combinacionesAnalizadas.length;
  const promedioFrecuencia = combinacionesAnalizadas.reduce((sum, c) => sum + c.scoreFrecuencia, 0) / combinacionesAnalizadas.length;

  console.log(`   Promedios actuales:`);
  console.log(`   - Co-ocurrencia: ${promedioCoOcurrencia.toFixed(4)}`);
  console.log(`   - Entropía: ${promedioEntropia.toFixed(4)}`);
  console.log(`   - Amplitud: ${promedioAmplitud.toFixed(4)}`);
  console.log(`   - Frecuencia: ${promedioFrecuencia.toFixed(4)}\n`);

  // Proponer pesos optimizados (dar más peso a componentes con mejor desempeño)
  const maxPromedio = Math.max(promedioCoOcurrencia, promedioEntropia, promedioAmplitud, promedioFrecuencia);
  
  const pesosOptimizados: PesosPriorizacion = {
    coOcurrencia: promedioCoOcurrencia / maxPromedio * 0.35,
    entropia: promedioEntropia / maxPromedio * 0.35,
    amplitud: promedioAmplitud / maxPromedio * 0.20,
    frecuencia: promedioFrecuencia / maxPromedio * 0.10
  };

  // Normalizar para que sumen 1.0
  const sumaPesos = (pesosOptimizados.coOcurrencia || 0) + 
                    (pesosOptimizados.entropia || 0) + 
                    (pesosOptimizados.amplitud || 0) + 
                    (pesosOptimizados.frecuencia || 0);
  
  if (sumaPesos > 0) {
    pesosOptimizados.coOcurrencia = (pesosOptimizados.coOcurrencia || 0) / sumaPesos;
    pesosOptimizados.entropia = (pesosOptimizados.entropia || 0) / sumaPesos;
    pesosOptimizados.amplitud = (pesosOptimizados.amplitud || 0) / sumaPesos;
    pesosOptimizados.frecuencia = (pesosOptimizados.frecuencia || 0) / sumaPesos;
  }

  console.log('   Pesos optimizados sugeridos:');
  console.log(`   - Co-ocurrencia: ${((pesosOptimizados.coOcurrencia || 0) * 100).toFixed(1)}%`);
  console.log(`   - Entropía: ${((pesosOptimizados.entropia || 0) * 100).toFixed(1)}%`);
  console.log(`   - Amplitud: ${((pesosOptimizados.amplitud || 0) * 100).toFixed(1)}%`);
  console.log(`   - Frecuencia: ${((pesosOptimizados.frecuencia || 0) * 100).toFixed(1)}%\n`);

  // Recalcular con pesos optimizados
  console.log('   B. Recalcular con pesos optimizados:\n');
  
  for (let i = 0; i < Math.min(5, combinacionesAnalizadas.length); i++) {
    const c = combinacionesAnalizadas[i];
    const scoreOptimizado = 
      c.scoreCoOcurrencia * (pesosOptimizados.coOcurrencia || 0) +
      c.scoreEntropia * (pesosOptimizados.entropia || 0) +
      c.scoreAmplitud * (pesosOptimizados.amplitud || 0) +
      c.scoreFrecuencia * (pesosOptimizados.frecuencia || 0);
    
    const mejora = ((scoreOptimizado - c.scoreTotal) / c.scoreTotal) * 100;
    
    console.log(`   ${i + 1}. ${c.combinacion.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    console.log(`      Score actual: ${c.scoreTotal.toFixed(4)} → Score optimizado: ${scoreOptimizado.toFixed(4)} (${mejora > 0 ? '+' : ''}${mejora.toFixed(1)}%)\n`);
  }

  // 3. Mejoras en selección de números
  console.log('   C. Mejoras en selección de números:\n');
  
  // Identificar números con mejor score de afinidad promedio
  const scoresAfinidadPorNumero = new Map<number, number[]>();
  for (const num of todosLosNumeros) {
    const afinidades = coOccurrenceEngine.obtenerAfinidades(num, 10);
    const scorePromedio = afinidades.reduce((sum, a) => sum + a.jaccard, 0) / afinidades.length;
    scoresAfinidadPorNumero.set(num, [scorePromedio]);
  }

  const numerosMejorAfinidad = Array.from(scoresAfinidadPorNumero.entries())
    .sort((a, b) => b[1][0] - a[1][0])
    .slice(0, 8)
    .map(([num]) => num);

  console.log(`   Números con mejor afinidad promedio: ${numerosMejorAfinidad.map(n => n.toString().padStart(2, '0')).join(', ')}`);
  console.log(`   (Usar estos números puede aumentar el score de co-ocurrencia)\n`);

  // 4. Generar combinaciones optimizadas
  console.log('✨ 3. COMBINACIONES OPTIMIZADAS (Con mejoras aplicadas)\n');
  
  const numerosOptimizados = [...new Set([...top5Presion.map(e => e.numero), ...numerosMejorAfinidad])].slice(0, 12);
  const sistemaOptimizado = wheelingEngine.generarSistemaReducidoOptimizado(numerosOptimizados, 5, pesosOptimizados);

  console.log(`   Números seleccionados (${numerosOptimizados.length}): ${numerosOptimizados.map(n => n.toString().padStart(2, '0')).join(', ')}\n`);

  for (let i = 0; i < sistemaOptimizado.combinaciones.length; i++) {
    const comb = sistemaOptimizado.combinaciones[i];
    const scoreAfinidad = coOccurrenceEngine.calcularScoreAfinidad(comb);
    const entropia = entropyFilter.calcularEntropiaCombinada(comb, analisis.frecuencias);
    const entropiaNorm = entropyFilter.normalizarEntropia(entropia);
    
    const numerosOrdenados = [...comb].sort((a, b) => a - b);
    const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];
    let scoreAmplitud = 0;
    if (amplitud >= 32 && amplitud <= 43) {
      scoreAmplitud = 1.0;
    } else if (amplitud >= 28 && amplitud < 32 || amplitud > 43 && amplitud <= 45) {
      scoreAmplitud = 0.7;
    } else {
      scoreAmplitud = 0.3;
    }

    let scoreFrecuencia = 0;
    for (const numero of comb) {
      const estadistica = analisis.frecuencias.get(numero);
      if (estadistica && estadistica.frecuenciaRelativa >= 0.01 && estadistica.frecuenciaRelativa <= 0.1) {
        scoreFrecuencia += 1.0;
      } else {
        scoreFrecuencia += 0.5;
      }
    }
    scoreFrecuencia = scoreFrecuencia / comb.length;

    const scoreTotal = 
      scoreAfinidad * (pesosOptimizados.coOcurrencia || 0) +
      entropiaNorm * (pesosOptimizados.entropia || 0) +
      scoreAmplitud * (pesosOptimizados.amplitud || 0) +
      scoreFrecuencia * (pesosOptimizados.frecuencia || 0);

    console.log(`   COMBINACIÓN ${i + 1}:`);
    console.log(`   ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    console.log(`   Score Total: ${scoreTotal.toFixed(4)} ⬆️`);
    console.log(`   Suma: ${comb.reduce((a, b) => a + b, 0)} | Amplitud: ${amplitud} | Pares: ${comb.filter(n => n % 2 === 0).length}\n`);
  }

  console.log('='.repeat(70));
  console.log('📋 RESUMEN DE MEJORAS:\n');
  console.log('   1. Ajustar pesos según desempeño de cada componente');
  console.log('   2. Seleccionar números con mejor afinidad promedio');
  console.log('   3. Priorizar combinaciones con amplitud en rango 32-43');
  console.log('   4. Optimizar entropía (mantener entre 0.7-0.9)');
  console.log('   5. Incluir números del Top 5 de presión estadística');
  console.log('='.repeat(70) + '\n');
}

// Ejecutar
if (require.main === module) {
  analizarYOptimizarScore()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { analizarYOptimizarScore };

