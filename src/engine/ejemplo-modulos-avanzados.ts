/**
 * Ejemplo de uso de los módulos avanzados del Motor de Probabilidades
 * 
 * Demuestra:
 * - PatternAnalyzer (Análisis de Deltas)
 * - StatisticalCore con Distribución de Poisson
 * - WheelingEngine (Sistemas Reducidos)
 * - ChiSquareTest (Validación de sesgos)
 */

import { MotorProbabilidades, ConfiguracionMotor } from './index';
import { PatternAnalyzer } from './pattern/PatternAnalyzer';
import { WheelingEngine } from './wheeling/WheelingEngine';
import { ChiSquareTest } from './statistical/ChiSquareTest';
import { DataIngestion } from './ingestion/DataIngestion';

async function ejemploModulosAvanzados() {
  console.log('🚀 DEMOSTRACIÓN DE MÓDULOS AVANZADOS\n');
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

  // 3. Análisis de Deltas
  console.log('🔍 3. ANÁLISIS DE DELTAS (Pattern Analyzer)\n');
  const patternAnalyzer = new PatternAnalyzer();
  const distribucionDeltas = patternAnalyzer.calcularDistribucionDeltas(sorteosTradicional);
  console.log(patternAnalyzer.generarReporte());
  
  // Probar algunas combinaciones
  const combinacionesPrueba: Array<[number, number, number, number, number, number]> = [
    [0, 6, 13, 23, 30, 44],
    [1, 5, 12, 20, 35, 42],
    [2, 8, 15, 25, 33, 40]
  ];
  
  console.log('\n   Análisis de combinaciones de prueba:\n');
  for (const comb of combinacionesPrueba) {
    const analisis = patternAnalyzer.analizarCombinacion(comb);
    console.log(`   Combinación: ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    console.log(`   Deltas: ${analisis.deltas.join(', ')}`);
    console.log(`   Score: ${analisis.score.toFixed(4)}`);
    console.log(`   Cumple distribución: ${analisis.cumpleDistribucion ? '✅' : '❌'}\n`);
  }

  // 4. Motor con Poisson
  console.log('📈 4. MOTOR CON DISTRIBUCIÓN DE POISSON\n');
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

  const motor = new MotorProbabilidades(configuracion);
  const resultado = await motor.ejecutarAnalisis([2020, 2021, 2022, 2023, 2024, 2025]);

  console.log('   Top 10 números con mayor Score de Probabilidad (Poisson):\n');
  const numerosConScore = Array.from(resultado.analisis.frecuencias.values())
    .filter(e => e.scoreProbabilidad !== undefined)
    .sort((a, b) => (b.scoreProbabilidad || 0) - (a.scoreProbabilidad || 0))
    .slice(0, 10);

  console.log('   | Número | Score Poisson | Lambda | Frecuencia |');
  console.log('   ' + '-'.repeat(50));
  for (const estadistica of numerosConScore) {
    console.log(`   |   ${estadistica.numero.toString().padStart(2, '0')}   | ` +
      `${(estadistica.scoreProbabilidad || 0).toFixed(4).padStart(12)} | ` +
      `${(estadistica.lambda || 0).toFixed(2).padStart(6)} | ` +
      `${estadistica.frecuencia.toString().padStart(10)} |`);
  }
  console.log('   ' + '-'.repeat(50) + '\n');

  // 5. Wheeling Engine (Sistemas Reducidos)
  console.log('🎯 5. WHEELING ENGINE (Sistemas Reducidos)\n');
  const wheelingEngine = new WheelingEngine();
  
  // Usar los números del Top 5 de presión del análisis anterior
  const top5Presion = [30, 6, 43, 23, 9];
  const numerosBase = [...top5Presion, 12, 15, 20, 25, 35, 40]; // Agregar más números
  
  console.log(`   Números base (${numerosBase.length}): ${numerosBase.map(n => n.toString().padStart(2, '0')).join(', ')}\n`);
  
  try {
    const sistema = wheelingEngine.generarSistemaReducidoOptimizado(numerosBase, 15);
    
    console.log(`   ✓ Sistema generado: ${sistema.totalCombinaciones} combinaciones\n`);
    console.log(`   Garantía: ${sistema.garantia.garantiaAciertos} aciertos si salen ${sistema.garantia.numerosQueDebenSalir} del set\n`);
    
    console.log('   Combinaciones del sistema:\n');
    for (let i = 0; i < Math.min(5, sistema.combinaciones.length); i++) {
      const comb = sistema.combinaciones[i];
      console.log(`   ${(i + 1).toString().padStart(2)}. ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    }
    if (sistema.combinaciones.length > 5) {
      console.log(`   ... y ${sistema.combinaciones.length - 5} más\n`);
    }

    // Validar sistema
    const validacion = wheelingEngine.validarSistema(sistema);
    console.log(`   Validación: ${validacion.mensaje}\n`);
    
  } catch (error) {
    console.log(`   ⚠️  Error al generar sistema: ${error instanceof Error ? error.message : 'Error desconocido'}\n`);
  }

  console.log('='.repeat(70));
  console.log('✅ Demostración completada\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejemploModulosAvanzados()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { ejemploModulosAvanzados };

