/**
 * Análisis Completo - Protocolo Lyra
 * 
 * Ejecuta el análisis completo del Protocolo Lyra con el Juez Final
 * como punto de salida definitivo.
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

async function ejecutarProtocoloLyra() {
  console.log('🚀 PROTOCOLO LYRA - ANÁLISIS COMPLETO\n');
  console.log('='.repeat(70));
  console.log('📋 Flujo del Protocolo:');
  console.log('   1. Data Ingestion');
  console.log('   2. Statistical Core (Poisson + Amplitud)');
  console.log('   3. Markov Chain Engine');
  console.log('   4. Pattern Analyzer (Deltas)');
  console.log('   5. Co-Occurrence Engine (Jaccard)');
  console.log('   6. Entropy Filter (Shannon)');
  console.log('   7. Heuristic Filters');
  console.log('   8. Wheeling Engine (Sistemas Reducidos)');
  console.log('   9. 🤖 JUEZ FINAL (AI Predictor) ← PUNTO DE SALIDA');
  console.log('='.repeat(70) + '\n');

  // Configuración
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

  // Filtros heurísticos
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

  // Crear motor con Juez Final habilitado
  const motor = new MotorProbabilidades(configuracion, true);

  try {
    // Ejecutar análisis completo (el resultado se mostrará automáticamente al final)
    const resultado = await motor.ejecutarAnalisis(
      [2020, 2021, 2022, 2023, 2024, 2025],
      filtros
    );

    // El resultado ya se mostró en mostrarResultadoFinal()
    // Aquí solo retornamos el resultado para uso programático
    return resultado;

  } catch (error) {
    console.error('\n❌ Error en Protocolo Lyra:', error);
    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);
    }
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarProtocoloLyra()
    .then(() => {
      console.log('✅ Protocolo Lyra completado\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarProtocoloLyra };
