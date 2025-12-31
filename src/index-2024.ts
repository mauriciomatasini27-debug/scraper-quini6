import { Quini6Scraper } from './scraper';
import { ValidadorSorteos } from './validator';
import { ResultadoScraping } from './types';

/**
 * Script específico para extraer los resultados del Quini 6 del año 2024
 */
async function main() {
  const año = 2024;
  
  console.log(`🎲 Scraper de Quini 6 - Año ${año}`);
  console.log('='.repeat(60));
  console.log('');

  const scraper = new Quini6Scraper(año);
  const validador = new ValidadorSorteos();

  try {
    // Inicializar navegador
    await scraper.inicializar();

    // Procesar todos los sorteos
    const resultado = await scraper.procesarTodosLosSorteos();

    // Validar resultados
    console.log('\n🔍 Iniciando validación de sorteos...');
    const validacion = await validador.validarSorteos(resultado);
    const reporte = validador.generarReporte(validacion);
    console.log(reporte);

    // Validar fechas esperadas
    if (resultado.sorteos.length > 0) {
      const primerSorteo = resultado.sorteos[0];
      const ultimoSorteo = resultado.sorteos[resultado.sorteos.length - 1];
      
      console.log('\n📅 Validación de fechas:');
      console.log(`   Primer sorteo: #${primerSorteo.numeroSorteo} - ${primerSorteo.fecha}`);
      console.log(`   Último sorteo: #${ultimoSorteo.numeroSorteo} - ${ultimoSorteo.fecha}`);
      
      // Verificar que el primer sorteo sea cercano al 03/01/2024
      const fechaPrimera = new Date(primerSorteo.fechaISO);
      const fechaEsperadaInicio = new Date('2024-01-03');
      const diferenciaInicio = Math.abs(fechaPrimera.getTime() - fechaEsperadaInicio.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diferenciaInicio <= 7) {
        console.log(`   ✅ Primer sorteo está dentro del rango esperado (diferencia: ${diferenciaInicio.toFixed(1)} días)`);
      } else {
        console.log(`   ⚠️  Primer sorteo puede estar fuera del rango esperado (diferencia: ${diferenciaInicio.toFixed(1)} días)`);
      }
      
      // Verificar que el último sorteo sea cercano al 29/12/2024
      const fechaUltima = new Date(ultimoSorteo.fechaISO);
      const fechaEsperadaFin = new Date('2024-12-29');
      const diferenciaFin = Math.abs(fechaUltima.getTime() - fechaEsperadaFin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diferenciaFin <= 7) {
        console.log(`   ✅ Último sorteo está dentro del rango esperado (diferencia: ${diferenciaFin.toFixed(1)} días)`);
      } else {
        console.log(`   ⚠️  Último sorteo puede estar fuera del rango esperado (diferencia: ${diferenciaFin.toFixed(1)} días)`);
      }
    }

    // Guardar resultados
    await scraper.guardarResultados(resultado);

    // Si hay sorteos faltantes, intentar obtenerlos manualmente
    if (validacion.sorteosFaltantes.length > 0) {
      console.log('\n⚠️  ATENCIÓN: Se detectaron sorteos faltantes.');
      console.log('   Revisa el archivo JSON para ver los detalles.');
      console.log('   Puedes ejecutar el scraper nuevamente para intentar obtenerlos.');
    }

    console.log('\n✅ Proceso completado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Sorteos extraídos: ${resultado.totalSorteos}`);
    console.log(`   - Sorteos pendientes: ${resultado.sorteosPendientes.length}`);
    console.log(`   - Errores: ${resultado.errores.length}`);
    console.log(`   - Validación: ${validacion.valido ? '✅ Válido' : '⚠️  Con problemas'}`);

  } catch (error) {
    console.error('\n❌ Error fatal durante el scraping:', error);
    
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }

    process.exit(1);
  } finally {
    // Cerrar navegador
    await scraper.cerrar();
  }
}

// Ejecutar el scraper
if (require.main === module) {
  main().catch((error) => {
    console.error('Error no manejado:', error);
    process.exit(1);
  });
}

export { main };

