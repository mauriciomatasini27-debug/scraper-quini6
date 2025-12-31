/**
 * Análisis con Juez Final (AI Predictor)
 * 
 * Ejecuta el análisis completo y usa el AI Predictor como juez final
 * para seleccionar las 3 mejores combinaciones.
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos } from './index';
import { AIPredictor, ResumenEstadistico } from './ai/AIPredictor';
import { CoOccurrenceEngine } from './cooccurrence/CoOccurrenceEngine';
import { WheelingEngine, PesosPriorizacion } from './wheeling/WheelingEngine';
import { DataIngestion } from './ingestion/DataIngestion';
import { StatisticalCore } from './statistical/StatisticalCore';
import { logAIVeredicto } from '../supabase-client';
import * as dotenv from 'dotenv';

dotenv.config();

async function ejecutarAnalisisJuezFinal() {
  console.log('⚖️  ANÁLISIS CON JUEZ FINAL (AI PREDICTOR)\n');
  console.log('='.repeat(70));
  console.log('🧠 El Juez Final evaluará las combinaciones candidatas');
  console.log('   usando Groq AI para seleccionar las 3 mejores\n');
  console.log('='.repeat(70) + '\n');

  // Verificar API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY no está configurada en .env');
    console.log('   Por favor, agrega GROQ_API_KEY=tu_api_key en tu archivo .env\n');
    process.exit(1);
  }

  // 1. Cargar datos y análisis estadístico
  console.log('📥 1. CARGANDO DATOS Y ANÁLISIS ESTADÍSTICO...\n');
  const dataIngestion = new DataIngestion();
  const sorteos = dataIngestion.cargarDatosHistoricos([2020, 2021, 2022, 2023, 2024, 2025]);
  const sorteosTradicional = dataIngestion.filtrarPorModalidad('tradicional', sorteos);

  const statisticalCore = new StatisticalCore();
  const analisis = statisticalCore.calcularAnalisis(sorteosTradicional);

  console.log(`   ✓ ${sorteosTradicional.length} sorteos analizados\n`);

  // 2. Generar combinaciones candidatas
  console.log('🎯 2. GENERANDO COMBINACIONES CANDIDATAS...\n');
  
  const coOccurrenceEngine = new CoOccurrenceEngine();
  coOccurrenceEngine.calcularMatrizCoOcurrencia(sorteosTradicional);

  // Top números con presión
  const top5Presion = Array.from(analisis.frecuencias.values())
    .sort((a, b) => {
      const presionA = (a.atraso / (a.promedioAtraso || 1)) * analisis.desviacionEstandar;
      const presionB = (b.atraso / (b.promedioAtraso || 1)) * analisis.desviacionEstandar;
      return presionB - presionA;
    })
    .slice(0, 5)
    .map(e => e.numero);

  // Números con mejor afinidad
  const numerosMejorAfinidad: number[] = [];
  for (const num of Array.from({ length: 46 }, (_, i) => i)) {
    const afinidades = coOccurrenceEngine.obtenerAfinidades(num, 10);
    const scorePromedio = afinidades.reduce((sum, a) => sum + a.jaccard, 0) / afinidades.length;
    numerosMejorAfinidad.push(num);
  }

  const topAfinidad = numerosMejorAfinidad
    .map((num, idx) => ({ 
      num, 
      score: coOccurrenceEngine.obtenerAfinidades(num, 10).reduce((sum, a) => sum + a.jaccard, 0) / 10 
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.num);

  const numerosOptimizados = [...new Set([...top5Presion, ...topAfinidad])].slice(0, 12);

  // Generar sistema con pesos optimizados
  const wheelingEngine = new WheelingEngine();
  wheelingEngine.configurarPriorizacion(coOccurrenceEngine, analisis.frecuencias);

  const pesosOptimizados: PesosPriorizacion = {
    coOcurrencia: 0.046,
    entropia: 0.578,
    amplitud: 0.262,
    frecuencia: 0.113
  };

  const sistema = await wheelingEngine.generarSistemaReducidoOptimizado(
    numerosOptimizados, 
    15, 
    pesosOptimizados
  );

  console.log(`   ✓ ${sistema.combinaciones.length} combinaciones candidatas generadas\n`);

  // 3. Preparar resumen estadístico
  console.log('📊 3. PREPARANDO RESUMEN ESTADÍSTICO...\n');
  const resumenEstadistico = AIPredictor.generarResumenEstadistico(analisis, 10);

  console.log(`   Top 10 números con presión:\n`);
  for (const item of resumenEstadistico.topPresion.slice(0, 10)) {
    console.log(`     ${item.numero.toString().padStart(2, '0')}: Presión=${item.presion.toFixed(2)}, Atraso=${item.atraso}\n`);
  }

  // 4. Juez Final
  console.log('⚖️  4. JUEZ FINAL - EVALUANDO CON GROQ AI...\n');
  
  const aiPredictor = new AIPredictor(apiKey);

  try {
    const veredicto = await aiPredictor.obtenerVeredictoFinal(
      sistema.combinaciones,
      resumenEstadistico,
      analisis
    );

    console.log('='.repeat(70));
    console.log('🏆 VEREDICTO FINAL - TOP 3 COMBINACIONES\n');
    console.log('='.repeat(70) + '\n');

    for (let i = 0; i < veredicto.top3.length; i++) {
      const comb = veredicto.top3[i];
      const suma = comb.reduce((a, b) => a + b, 0);
      const pares = comb.filter(n => n % 2 === 0).length;
      const numerosOrdenados = [...comb].sort((a, b) => a - b);
      const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];

      console.log(`🥇 COMBINACIÓN ${i + 1} (Seleccionada por Juez Final):`);
      console.log(`   ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
      console.log(`   Suma: ${suma} | Amplitud: ${amplitud} | Pares: ${pares} | Impares: ${6 - pares}\n`);
    }

    console.log('📝 ANÁLISIS TÉCNICO DEL JUEZ FINAL:\n');
    console.log(`   ${veredicto.analisisTecnico}\n`);

    if (veredicto.razones.length > 0) {
      console.log('💡 RAZONES DE LA SELECCIÓN:\n');
      veredicto.razones.forEach((razon, idx) => {
        console.log(`   ${idx + 1}. ${razon}\n`);
      });
    }

    console.log('='.repeat(70));
    
    // 5. Guardar en Supabase
    console.log('\n💾 5. GUARDANDO PREDICCIÓN EN SUPABASE...\n');
    const fechaSorteo = new Date();
    
    // Convertir VeredictoFinal a formato compatible con logAIVeredicto
    // logAIVeredicto espera VeredictoJuezFinal que tiene timestamp como Date
    const veredictoParaGuardar = {
      top3: veredicto.top3,
      analisisTecnico: veredicto.analisisTecnico,
      razones: veredicto.razones,
      timestamp: new Date()
    };
    
    const guardado = await logAIVeredicto(
      veredictoParaGuardar,
      fechaSorteo,
      undefined, // numeroSorteo será null para predicciones futuras
      {
        totalCombinacionesEvaluadas: sistema.combinaciones.length,
        timestamp: new Date().toISOString()
      }
    );

    if (guardado) {
      console.log('✅ Predicción guardada exitosamente en Supabase\n');
    } else {
      console.log('⚠️  No se pudo guardar en Supabase (puede que no esté configurado)\n');
    }

    console.log('='.repeat(70));
    console.log('✅ Análisis con Juez Final completado\n');

    return veredicto;

  } catch (error) {
    console.error('❌ Error en Juez Final:', error);
    console.log('\n   ⚠️  Usando combinaciones por score estadístico como fallback\n');
    
    // Fallback: top 3 por score
    const top3Fallback = sistema.combinaciones.slice(0, 3);
    
    console.log('🏆 TOP 3 COMBINACIONES (Fallback - Por Score Estadístico):\n');
    for (let i = 0; i < top3Fallback.length; i++) {
      const comb = top3Fallback[i];
      console.log(`   ${i + 1}. ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}\n`);
    }

    return {
      top3: top3Fallback,
      analisisTecnico: 'Fallback: Error al obtener veredicto de Groq. Usando top 3 por score estadístico.',
      razones: ['Seleccionadas por score de priorización', 'Basadas en análisis estadístico local']
    };
  }
}

// Ejecutar
if (require.main === module) {
  ejecutarAnalisisJuezFinal()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarAnalisisJuezFinal };

