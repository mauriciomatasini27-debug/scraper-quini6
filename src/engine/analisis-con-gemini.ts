/**
 * Análisis con Gemini AI
 * 
 * Integra Google Gemini para análisis avanzado de combinaciones
 */

import { DataIngestion } from './ingestion/DataIngestion';
import { StatisticalCore } from './statistical/StatisticalCore';
import { GeminiAnalyzer } from './ai/GeminiAnalyzer';
import * as dotenv from 'dotenv';

dotenv.config();

async function ejecutarAnalisisConGemini() {
  console.log('🤖 ANÁLISIS CON GEMINI AI\n');
  console.log('='.repeat(70) + '\n');

  // Verificar API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY no está configurada en .env');
    console.log('   Por favor, agrega GEMINI_API_KEY=tu_api_key en tu archivo .env\n');
    process.exit(1);
  }

  // Cargar datos
  console.log('📥 Cargando datos históricos...\n');
  const dataIngestion = new DataIngestion();
  const sorteos = dataIngestion.cargarDatosHistoricos([2020, 2021, 2022, 2023, 2024, 2025]);
  const sorteosTradicional = dataIngestion.filtrarPorModalidad('tradicional', sorteos);

  // Análisis estadístico
  const statisticalCore = new StatisticalCore();
  const analisis = statisticalCore.calcularAnalisis(sorteosTradicional);

  // Top números con presión
  const top5Presion = Array.from(analisis.frecuencias.values())
    .sort((a, b) => {
      const presionA = (a.atraso / (a.promedioAtraso || 1)) * analisis.desviacionEstandar;
      const presionB = (b.atraso / (b.promedioAtraso || 1)) * analisis.desviacionEstandar;
      return presionB - presionA;
    })
    .slice(0, 5)
    .map(e => e.numero);

  console.log(`✓ ${sorteosTradicional.length} sorteos cargados\n`);

  // Inicializar Gemini
  console.log('🤖 Inicializando Gemini AI...\n');
  const geminiAnalyzer = new GeminiAnalyzer({ apiKey });

  // Generar insights generales
  console.log('💡 Generando insights generales con Gemini...\n');
  try {
    const insights = await geminiAnalyzer.generarInsights(analisis, top5Presion);
    console.log('📊 INSIGHTS DE GEMINI:\n');
    console.log(insights);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error generando insights:', error);
  }

  // Analizar combinaciones de ejemplo
  console.log('🔍 Analizando combinaciones de ejemplo...\n');
  
  const combinacionesEjemplo: Array<[number, number, number, number, number, number]> = [
    [6, 9, 30, 35, 40, 43],
    [0, 2, 30, 39, 43, 44],
    [9, 19, 23, 26, 30, 39]
  ];

  for (let i = 0; i < combinacionesEjemplo.length; i++) {
    const comb = combinacionesEjemplo[i];
    console.log(`\n📋 Combinación ${i + 1}: ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    
    try {
      const analisisGemini = await geminiAnalyzer.analizarCombinacion(comb, {
        analisisEstadistico: analisis,
        topNumeros: top5Presion,
        estadisticasRelevantes: `Amplitud histórica: ${analisis.estadisticasAmplitud?.media.toFixed(1)} (rango: ${analisis.estadisticasAmplitud?.min}-${analisis.estadisticasAmplitud?.max})`
      });

      console.log(`\n   Score IA: ${analisisGemini.scoreIA || 'N/A'}/100`);
      console.log(`   Recomendación: ${analisisGemini.recomendacion.toUpperCase()}`);
      console.log(`   Análisis: ${analisisGemini.analisis.substring(0, 200)}...`);
      if (analisisGemini.razones.length > 0) {
        console.log(`   Razones:`);
        analisisGemini.razones.forEach((razon, idx) => {
          console.log(`     ${idx + 1}. ${razon}`);
        });
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    // Pausa entre análisis
    if (i < combinacionesEjemplo.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Comparar dos combinaciones
  console.log('\n\n⚖️  Comparando combinaciones...\n');
  try {
    const comparacion = await geminiAnalyzer.compararCombinaciones(
      combinacionesEjemplo[0],
      combinacionesEjemplo[1],
      { analisisEstadistico: analisis }
    );

    console.log(`   Combinación ganadora: ${comparacion.ganadora}`);
    console.log(`   Razón: ${comparacion.razon}`);
    console.log(`   Diferencia principal: ${comparacion.diferencia}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}\n`);
  }

  console.log('='.repeat(70));
  console.log('✅ Análisis con Gemini completado\n');
}

// Ejecutar
if (require.main === module) {
  ejecutarAnalisisConGemini()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarAnalisisConGemini };

