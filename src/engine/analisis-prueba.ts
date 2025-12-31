/**
 * Script de Análisis de Prueba
 * 
 * Ejecuta un análisis completo con los datos históricos y genera
 * una combinación de 6 números basada en el análisis estadístico.
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos, ResultadoAnalisis } from './index';
import { NumeroQuini, Combinacion } from './types';

/**
 * Genera una combinación recomendada basada en el análisis
 */
function generarCombinacionRecomendada(resultado: ResultadoAnalisis): Combinacion {
  const combinacion: NumeroQuini[] = [];
  const numerosUsados = new Set<NumeroQuini>();
  
  // Estrategia 1: Incluir números con atraso alto (prioridad alta)
  const numerosAtrasoAlto = resultado.anomalias.numerosConAtrasoAlto;
  console.log(`\n📊 Números con atraso alto: ${numerosAtrasoAlto.length}`);
  
  // Tomar hasta 3 números con atraso alto
  for (const numero of numerosAtrasoAlto.slice(0, 3)) {
    if (!numerosUsados.has(numero) && combinacion.length < 6) {
      combinacion.push(numero);
      numerosUsados.add(numero);
    }
  }
  
  // Estrategia 2: Incluir números con frecuencia alta pero no excesiva
  const frecuencias = Array.from(resultado.analisis.frecuencias.values())
    .sort((a, b) => {
      // Priorizar números con frecuencia media-alta (no extremos)
      const scoreA = a.frecuenciaRelativa * (1 - Math.abs(a.frecuenciaRelativa - resultado.analisis.media / resultado.analisis.periodo.totalSorteos));
      const scoreB = b.frecuenciaRelativa * (1 - Math.abs(b.frecuenciaRelativa - resultado.analisis.media / resultado.analisis.periodo.totalSorteos));
      return scoreB - scoreA;
    });
  
  for (const estadistica of frecuencias) {
    if (!numerosUsados.has(estadistica.numero) && combinacion.length < 6) {
      // Evitar números con frecuencia extremadamente alta o baja
      const frecuenciaNormalizada = estadistica.frecuenciaRelativa;
      if (frecuenciaNormalizada > 0.01 && frecuenciaNormalizada < 0.1) {
        combinacion.push(estadistica.numero);
        numerosUsados.add(estadistica.numero);
      }
    }
  }
  
  // Estrategia 3: Completar con números balanceados (si faltan)
  if (combinacion.length < 6) {
    const todosLosNumeros = Array.from({ length: 46 }, (_, i) => i + 1) as NumeroQuini[];
    const numerosDisponibles = todosLosNumeros.filter(n => !numerosUsados.has(n));
    
    // Seleccionar números que no estén en atraso extremo pero tampoco aparezcan constantemente
    const numerosBalanceados = numerosDisponibles
      .map(numero => {
        const estadistica = resultado.analisis.frecuencias.get(numero);
        if (!estadistica) return { numero, score: 0.5 };
        
        // Score basado en frecuencia y atraso
        const scoreFrecuencia = estadistica.frecuenciaRelativa;
        const scoreAtraso = estadistica.atraso > estadistica.promedioAtraso 
          ? 0.3 // Penalizar atraso muy alto
          : 0.7; // Favorecer números cerca del promedio
        
        return {
          numero,
          score: scoreFrecuencia * scoreAtraso
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6 - combinacion.length);
    
    for (const { numero } of numerosBalanceados) {
      if (combinacion.length < 6) {
        combinacion.push(numero);
        numerosUsados.add(numero);
      }
    }
  }
  
  // Ordenar la combinación
  combinacion.sort((a, b) => a - b);
  
  return combinacion as Combinacion;
}

/**
 * Función principal de análisis
 */
async function ejecutarAnalisisCompleto() {
  console.log('🚀 Iniciando análisis del Motor de Probabilidades...\n');
  
  // Configuración del motor
  const configuracion: ConfiguracionMotor = {
    modalidad: 'tradicional',
    rangoNumeros: {
      min: 1,
      max: 46
    },
    ventanasMediaMovil: [5, 10, 20],
    umbralDesviacion: 1.5, // Identificar anomalías a más de 1.5σ
    habilitarFiltros: {
      paridad: true,
      suma: true,
      espaciado: true,
      atraso: true
    }
  };

  // Filtros heurísticos basados en análisis histórico
  const filtros: FiltrosHeuristicos = {
    paridad: {
      minPares: 2,
      maxPares: 4,
      minImpares: 2,
      maxImpares: 4
    },
    suma: {
      desviacionesEstandar: 2.5 // Aceptar sumas dentro de ±2.5σ (rango más amplio)
    },
    espaciado: {
      minDistancia: 1,
      maxDistancia: 20
    }
  };

  // Crear instancia del motor
  const motor = new MotorProbabilidades(configuracion);

  try {
    console.log('📥 Cargando datos históricos (2020-2025)...');
    
    // Ejecutar análisis con todos los años disponibles
    const resultado = await motor.ejecutarAnalisis(
      [2020, 2021, 2022, 2023, 2024, 2025],
      filtros
    );

    // Mostrar resultados del análisis
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESULTADOS DEL ANÁLISIS ESTADÍSTICO');
    console.log('='.repeat(60));
    
    console.log(`\n📅 Período analizado:`);
    console.log(`   Desde: ${resultado.analisis.periodo.fechaInicio.toLocaleDateString('es-AR')}`);
    console.log(`   Hasta: ${resultado.analisis.periodo.fechaFin.toLocaleDateString('es-AR')}`);
    console.log(`   Total de sorteos: ${resultado.analisis.periodo.totalSorteos}`);
    
    console.log(`\n📊 Estadísticas generales:`);
    console.log(`   Media de frecuencias: ${resultado.analisis.media.toFixed(2)}`);
    console.log(`   Desviación estándar (σ): ${resultado.analisis.desviacionEstandar.toFixed(2)}`);
    
    console.log(`\n🔍 Números con atraso alto (${resultado.anomalias.numerosConAtrasoAlto.length}):`);
    if (resultado.anomalias.numerosConAtrasoAlto.length > 0) {
      const primeros10 = resultado.anomalias.numerosConAtrasoAlto.slice(0, 10);
      console.log(`   ${primeros10.join(', ')}${resultado.anomalias.numerosConAtrasoAlto.length > 10 ? '...' : ''}`);
      
      // Mostrar detalles de los primeros 5
      console.log(`\n   Detalles de los primeros 5:`);
      for (const numero of resultado.anomalias.numerosConAtrasoAlto.slice(0, 5)) {
        const estadistica = resultado.analisis.frecuencias.get(numero);
        if (estadistica) {
          console.log(`   Número ${numero.toString().padStart(2, '0')}:`);
          console.log(`     - Atraso actual: ${estadistica.atraso} sorteos`);
          console.log(`     - Promedio de atraso: ${estadistica.promedioAtraso.toFixed(2)}`);
          console.log(`     - Última aparición: ${estadistica.ultimaAparicion ? estadistica.ultimaAparicion.toLocaleDateString('es-AR') : 'Nunca'}`);
        }
      }
    } else {
      console.log('   No se encontraron números con atraso significativo');
    }
    
    console.log(`\n📉 Desviaciones significativas (${resultado.anomalias.desviacionesSignificativas.length}):`);
    if (resultado.anomalias.desviacionesSignificativas.length > 0) {
      const primeros10 = resultado.anomalias.desviacionesSignificativas.slice(0, 10);
      for (const dev of primeros10) {
        const estadistica = resultado.analisis.frecuencias.get(dev.numero);
        console.log(`   Número ${dev.numero.toString().padStart(2, '0')}: ${dev.desviacion.toFixed(2)}σ (frecuencia: ${estadistica?.frecuencia || 0})`);
      }
    }
    
    console.log(`\n🎯 Filtros aplicados:`);
    console.log(`   Reducción del espacio de búsqueda: ${resultado.resultadoFiltrado.porcentajeReduccion.toFixed(2)}%`);
    console.log(`   Combinaciones filtradas: ${resultado.resultadoFiltrado.combinacionesFiltradas.toLocaleString()}`);
    console.log(`   Criterios: ${resultado.resultadoFiltrado.criteriosAplicados.join(', ')}`);
    
    // Generar combinación recomendada
    console.log('\n' + '='.repeat(60));
    console.log('🎲 COMBINACIÓN RECOMENDADA (Basada en Análisis Estadístico)');
    console.log('='.repeat(60));
    
    const combinacion = generarCombinacionRecomendada(resultado);
    
    console.log(`\n✨ Los 6 números recomendados son:`);
    console.log(`   ${combinacion.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
    
    // Calcular estadísticas de la combinación
    const suma = combinacion.reduce((acc, n) => acc + n, 0);
    const pares = combinacion.filter(n => n % 2 === 0).length;
    const impares = combinacion.length - pares;
    
    console.log(`\n📊 Características de la combinación:`);
    console.log(`   Suma total: ${suma}`);
    console.log(`   Pares: ${pares} | Impares: ${impares}`);
    console.log(`   Rango: ${combinacion[0]} - ${combinacion[combinacion.length - 1]}`);
    
    // Verificar si incluye números con atraso alto
    const numerosAtrasoIncluidos = combinacion.filter(n => 
      resultado.anomalias.numerosConAtrasoAlto.includes(n)
    );
    if (numerosAtrasoIncluidos.length > 0) {
      console.log(`   ✅ Incluye ${numerosAtrasoIncluidos.length} número(s) con atraso alto: ${numerosAtrasoIncluidos.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANTE: Esta combinación es el resultado de un análisis estadístico.');
    console.log('   El azar sigue siendo el factor determinante en los sorteos.');
    console.log('   Este motor NO garantiza predicciones, solo reduce el espacio de búsqueda.');
    console.log('='.repeat(60) + '\n');
    
    return {
      combinacion,
      resultado,
      estadisticas: {
        suma,
        pares,
        impares,
        numerosAtrasoIncluidos: numerosAtrasoIncluidos.length
      }
    };
    
  } catch (error) {
    console.error('\n❌ Error al ejecutar análisis:', error);
    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarAnalisisCompleto()
    .then(() => {
      console.log('✅ Análisis completado exitosamente\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarAnalisisCompleto, generarCombinacionRecomendada };

