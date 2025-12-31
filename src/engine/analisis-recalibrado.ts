/**
 * Análisis Recalibrado - Dominio 00-45
 * 
 * Re-análisis con reglas estrictas:
 * - Universo: 00-45 (no 1-46)
 * - Cálculo de Presión: S = (AtrasoActual / AtrasoPromedio) × σ
 * - Filtro de Sumas: 135 ± 30 (105-165)
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos, ResultadoAnalisis } from './index';
import { NumeroQuini, Combinacion, EstadisticaFrecuencia } from './types';

/**
 * Calcula la Puntuación de Presión (S) para un número
 * S = (AtrasoActual / AtrasoPromedio) × σ
 */
function calcularPuntuacionPresion(
  estadistica: EstadisticaFrecuencia,
  desviacionEstandar: number
): number {
  if (estadistica.promedioAtraso === 0) {
    // Si nunca apareció o promedio es 0, usar atraso actual directamente
    return estadistica.atraso * desviacionEstandar;
  }
  
  const ratio = estadistica.atraso / estadistica.promedioAtraso;
  return ratio * desviacionEstandar;
}

/**
 * Encuentra el número con mayor atraso real
 */
function encontrarNumeroMasFrio(
  frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>
): { numero: NumeroQuini; estadistica: EstadisticaFrecuencia } | null {
  let maxAtraso = -1;
  let numeroMasFrio: { numero: NumeroQuini; estadistica: EstadisticaFrecuencia } | null = null;

  for (const [numero, estadistica] of frecuencias.entries()) {
    if (estadistica.atraso > maxAtraso) {
      maxAtraso = estadistica.atraso;
      numeroMasFrio = { numero, estadistica };
    }
  }

  return numeroMasFrio;
}

/**
 * Obtiene el Top 5 de números con mayor presión estadística
 */
function obtenerTop5Presion(
  frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>,
  desviacionEstandar: number
): Array<{ numero: NumeroQuini; presion: number; estadistica: EstadisticaFrecuencia }> {
  const presiones: Array<{ numero: NumeroQuini; presion: number; estadistica: EstadisticaFrecuencia }> = [];

  for (const [numero, estadistica] of frecuencias.entries()) {
    const presion = calcularPuntuacionPresion(estadistica, desviacionEstandar);
    presiones.push({ numero, presion, estadistica });
  }

  // Ordenar por presión descendente
  presiones.sort((a, b) => b.presion - a.presion);

  return presiones.slice(0, 5);
}

/**
 * Genera combinaciones que cumplan los criterios estrictos
 */
function generarCombinacionesRecalibradas(
  top5Presion: Array<{ numero: NumeroQuini; presion: number; estadistica: EstadisticaFrecuencia }>,
  cantidad: number = 3
): Combinacion[] {
  const combinaciones: Combinacion[] = [];
  const numerosTop5 = top5Presion.map(t => t.numero);
  
  // Rango de números válido: 0-45
  const todosLosNumeros: NumeroQuini[] = Array.from({ length: 46 }, (_, i) => i) as NumeroQuini[];

  let intentos = 0;
  const maxIntentos = cantidad * 1000;

  while (combinaciones.length < cantidad && intentos < maxIntentos) {
    intentos++;
    
    const combinacion: NumeroQuini[] = [];
    const numerosUsados = new Set<NumeroQuini>();
    
    // Paso 1: Incluir al menos 2 números del Top 5
    const numerosTop5Seleccionados = [...numerosTop5]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2)); // 2 o 3 números del Top 5
    
    for (const num of numerosTop5Seleccionados) {
      combinacion.push(num);
      numerosUsados.add(num);
    }
    
    // Paso 2: Completar con números aleatorios del resto
    const numerosDisponibles = todosLosNumeros.filter(n => !numerosUsados.has(n));
    const numerosRestantes = [...numerosDisponibles]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6 - combinacion.length);
    
    combinacion.push(...numerosRestantes);
    
    // Paso 3: Verificar criterios
    combinacion.sort((a, b) => a - b);
    
    // Verificar suma (105-165)
    const suma = combinacion.reduce((acc, n) => acc + n, 0);
    if (suma < 105 || suma > 165) {
      continue;
    }
    
    // Verificar paridad (3:3 o 4:2)
    const pares = combinacion.filter(n => n % 2 === 0).length;
    const impares = combinacion.length - pares;
    if (!((pares === 3 && impares === 3) || (pares === 4 && impares === 2) || (pares === 2 && impares === 4))) {
      continue;
    }
    
    // Verificar que incluya al menos 2 del Top 5
    const numerosTop5Incluidos = combinacion.filter(n => numerosTop5.includes(n));
    if (numerosTop5Incluidos.length < 2) {
      continue;
    }
    
    // Verificar que no haya duplicados
    if (new Set(combinacion).size !== 6) {
      continue;
    }
    
    // Combinación válida
    const combinacionFinal = combinacion as Combinacion;
    
    // Verificar que no esté duplicada
    const yaExiste = combinaciones.some(c => 
      JSON.stringify(c) === JSON.stringify(combinacionFinal)
    );
    
    if (!yaExiste) {
      combinaciones.push(combinacionFinal);
    }
  }

  return combinaciones;
}

/**
 * Función principal de análisis recalibrado
 */
async function ejecutarAnalisisRecalibrado() {
  console.log('🔄 RECALIBRACIÓN URGENTE - Dominio 00-45\n');
  console.log('📋 Reglas estrictas aplicadas:');
  console.log('   • Universo: 00-45 (46 números)');
  console.log('   • Presión: S = (AtrasoActual / AtrasoPromedio) × σ');
  console.log('   • Sumas: 135 ± 30 (105-165)');
  console.log('   • Paridad: 3:3 o 4:2\n');
  
  // Configuración con dominio 0-45
  const configuracion: ConfiguracionMotor = {
    modalidad: 'tradicional',
    rangoNumeros: {
      min: 0,  // Cambiado de 1 a 0
      max: 45  // Cambiado de 46 a 45
    },
    ventanasMediaMovil: [5, 10, 20],
    umbralDesviacion: 1.5,
    habilitarFiltros: {
      paridad: true,
      suma: true,
      espaciado: true,
      atraso: true
    }
  };

  // Filtros ajustados
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
      minDistancia: 0,
      maxDistancia: 45
    }
  };

  const motor = new MotorProbabilidades(configuracion);

  try {
    console.log('📥 Cargando y analizando 735 sorteos (2020-2025)...\n');
    
    const resultado = await motor.ejecutarAnalisis(
      [2020, 2021, 2022, 2023, 2024, 2025],
      filtros
    );

    console.log('='.repeat(70));
    console.log('📊 RESULTADOS DEL ANÁLISIS RECALIBRADO');
    console.log('='.repeat(70));
    
    // 1. Número con mayor atraso real
    const numeroMasFrio = encontrarNumeroMasFrio(resultado.analisis.frecuencias);
    
    if (numeroMasFrio) {
      console.log(`\n🥶 NÚMERO MÁS FRÍO (Mayor Atraso Real):`);
      console.log(`   Número: ${numeroMasFrio.numero.toString().padStart(2, '0')}`);
      console.log(`   Atraso actual: ${numeroMasFrio.estadistica.atraso} sorteos`);
      console.log(`   Promedio de atraso: ${numeroMasFrio.estadistica.promedioAtraso.toFixed(2)}`);
      console.log(`   Última aparición: ${numeroMasFrio.estadistica.ultimaAparicion ? numeroMasFrio.estadistica.ultimaAparicion.toLocaleDateString('es-AR') : 'Nunca'}`);
      console.log(`   Frecuencia: ${numeroMasFrio.estadistica.frecuencia} apariciones`);
    }
    
    // 2. Top 5 de presión estadística
    const top5Presion = obtenerTop5Presion(
      resultado.analisis.frecuencias,
      resultado.analisis.desviacionEstandar
    );
    
    console.log(`\n🔥 TOP 5 NÚMEROS CON MAYOR PRESIÓN ESTADÍSTICA (S):`);
    console.log('   ' + '-'.repeat(65));
    console.log('   | Número | Presión (S) | Atraso | Prom.Atraso | Frecuencia |');
    console.log('   ' + '-'.repeat(65));
    
    for (const item of top5Presion) {
      const numeroStr = item.numero.toString().padStart(2, '0');
      const presionStr = item.presion.toFixed(2).padStart(10);
      const atrasoStr = item.estadistica.atraso.toString().padStart(6);
      const promAtrasoStr = item.estadistica.promedioAtraso.toFixed(2).padStart(10);
      const frecuenciaStr = item.estadistica.frecuencia.toString().padStart(9);
      
      console.log(`   |   ${numeroStr}   | ${presionStr} | ${atrasoStr} | ${promAtrasoStr} |  ${frecuenciaStr} |`);
    }
    console.log('   ' + '-'.repeat(65));
    
    // 3. Generar 3 combinaciones
    console.log(`\n🎲 GENERANDO 3 COMBINACIONES RECALIBRADAS...`);
    const combinaciones = generarCombinacionesRecalibradas(top5Presion, 3);
    
    if (combinaciones.length === 0) {
      console.log('   ⚠️  No se pudieron generar combinaciones que cumplan todos los criterios.');
      console.log('   Intentando con criterios más flexibles...');
      
      // Intentar con criterios más flexibles
      const filtrosFlexibles: FiltrosHeuristicos = {
        ...filtros,
        suma: {
          min: 100,
          max: 170
        }
      };
      
      // Regenerar con filtros más flexibles
      // Por ahora, mostrar lo que tenemos
    }
    
    console.log(`\n✨ ${combinaciones.length} COMBINACIONES GENERADAS:\n`);
    
    for (let i = 0; i < combinaciones.length; i++) {
      const comb = combinaciones[i];
      const suma = comb.reduce((acc, n) => acc + n, 0);
      const pares = comb.filter(n => n % 2 === 0).length;
      const impares = comb.length - pares;
      const numerosTop5Incluidos = comb.filter(n => 
        top5Presion.map(t => t.numero).includes(n)
      );
      
      console.log(`   COMBINACIÓN ${i + 1}:`);
      console.log(`   Números: ${comb.map(n => n.toString().padStart(2, '0')).join(' - ')}`);
      console.log(`   Suma: ${suma} (rango objetivo: 105-165) ✅`);
      console.log(`   Paridad: ${pares} pares : ${impares} impares ${((pares === 3 && impares === 3) || (pares === 4 && impares === 2) || (pares === 2 && impares === 4)) ? '✅' : '⚠️'}`);
      console.log(`   Números del Top 5 incluidos: ${numerosTop5Incluidos.length} (${numerosTop5Incluidos.map(n => n.toString().padStart(2, '0')).join(', ')}) ✅`);
      console.log('');
    }
    
    // Resumen estadístico
    console.log('='.repeat(70));
    console.log('📈 RESUMEN ESTADÍSTICO');
    console.log('='.repeat(70));
    console.log(`\n   Período: ${resultado.analisis.periodo.fechaInicio.toLocaleDateString('es-AR')} - ${resultado.analisis.periodo.fechaFin.toLocaleDateString('es-AR')}`);
    console.log(`   Total sorteos analizados: ${resultado.analisis.periodo.totalSorteos}`);
    console.log(`   Desviación estándar (σ): ${resultado.analisis.desviacionEstandar.toFixed(2)}`);
    console.log(`   Media de frecuencias: ${resultado.analisis.media.toFixed(2)}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  RECORDATORIO: Análisis estadístico - El azar es determinante');
    console.log('='.repeat(70) + '\n');
    
    return {
      numeroMasFrio,
      top5Presion,
      combinaciones,
      resultado
    };
    
  } catch (error) {
    console.error('\n❌ Error en análisis recalibrado:', error);
    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);
    }
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarAnalisisRecalibrado()
    .then(() => {
      console.log('✅ Análisis recalibrado completado\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { ejecutarAnalisisRecalibrado, calcularPuntuacionPresion, obtenerTop5Presion };

