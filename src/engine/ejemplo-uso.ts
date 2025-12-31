/**
 * Ejemplo de uso del Motor de Probabilidades
 * 
 * Este archivo muestra cómo utilizar el motor para analizar
 * los datos históricos de la Quiniela.
 */

import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos } from './index';

/**
 * Ejemplo básico de uso
 */
async function ejemploBasico() {
  // 1. Configurar el motor
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

  // 2. Crear instancia del motor
  const motor = new MotorProbabilidades(configuracion);

  // 3. Definir filtros heurísticos
  const filtros: FiltrosHeuristicos = {
    paridad: {
      minPares: 2,
      maxPares: 4,
      minImpares: 2,
      maxImpares: 4
    },
    suma: {
      desviacionesEstandar: 2 // Aceptar sumas dentro de ±2σ
    },
    espaciado: {
      minDistancia: 1,
      maxDistancia: 15
    }
  };

  // 4. Ejecutar análisis
  try {
    const resultado = await motor.ejecutarAnalisis([2020, 2021, 2022, 2023, 2024, 2025], filtros);

    // 5. Mostrar resultados
    console.log('\n=== RESULTADOS DEL ANÁLISIS ===\n');
    console.log(`Período analizado: ${resultado.analisis.periodo.fechaInicio.toLocaleDateString()} - ${resultado.analisis.periodo.fechaFin.toLocaleDateString()}`);
    console.log(`Total de sorteos: ${resultado.analisis.periodo.totalSorteos}`);
    console.log(`\nNúmeros con atraso alto (${resultado.anomalias.numerosConAtrasoAlto.length}):`);
    console.log(resultado.anomalias.numerosConAtrasoAlto.join(', '));
    
    console.log(`\nReducción del espacio de búsqueda: ${resultado.resultadoFiltrado.porcentajeReduccion.toFixed(2)}%`);
    console.log(`Criterios aplicados: ${resultado.resultadoFiltrado.criteriosAplicados.join(', ')}`);
    
    console.log(`\nDesviaciones significativas encontradas: ${resultado.anomalias.desviacionesSignificativas.length}`);
    resultado.anomalias.desviacionesSignificativas.slice(0, 10).forEach(dev => {
      console.log(`  Número ${dev.numero}: ${dev.desviacion.toFixed(2)}σ`);
    });

  } catch (error) {
    console.error('Error al ejecutar análisis:', error);
  }
}

/**
 * Ejemplo avanzado: Análisis por modalidad específica
 */
async function ejemploPorModalidad() {
  const modalidades: Array<'tradicional' | 'segunda' | 'revancha' | 'siempreSale'> = [
    'tradicional',
    'segunda',
    'revancha',
    'siempreSale'
  ];

  for (const modalidad of modalidades) {
    console.log(`\n=== Análisis para modalidad: ${modalidad} ===\n`);
    
    const configuracion: ConfiguracionMotor = {
      modalidad,
      rangoNumeros: { min: 1, max: 46 },
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
    
    try {
      const resultado = await motor.ejecutarAnalisis([2024, 2025]);
      
      console.log(`Sorteos analizados: ${resultado.analisis.periodo.totalSorteos}`);
      console.log(`Números con atraso alto: ${resultado.anomalias.numerosConAtrasoAlto.length}`);
      
    } catch (error) {
      console.error(`Error en modalidad ${modalidad}:`, error);
    }
  }
}

// Ejecutar ejemplos si este archivo se ejecuta directamente
if (require.main === module) {
  ejemploBasico()
    .then(() => {
      console.log('\nEjemplo básico completado');
      return ejemploPorModalidad();
    })
    .then(() => {
      console.log('\nTodos los ejemplos completados');
    })
    .catch(error => {
      console.error('Error en ejemplos:', error);
      process.exit(1);
    });
}

export { ejemploBasico, ejemploPorModalidad };

