import { Quini6Scraper } from './scraper';
import { ValidadorSorteos } from './validator';
import { ResultadoScraping } from './types';
import { guardarEnSupabaseBatch } from './supabase-client';

/**
 * Función principal del scraper
 * Acepta el año como argumento de línea de comandos o usa 2025 por defecto
 */
async function main(año?: number) {
  const añoObjetivo = año || parseInt(process.argv[2]) || 2025;
  
  console.log(`🎲 Scraper de Quini 6 - Año ${añoObjetivo}`);
  console.log('=' .repeat(60));
  console.log('');

  const scraper = new Quini6Scraper(añoObjetivo);
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

    // Guardar resultados en archivo JSON
    await scraper.guardarResultados(resultado);

    // Guardar en Supabase si está configurado
    const guardadoEnSupabase = await guardarEnSupabaseBatch(resultado);
    if (guardadoEnSupabase) {
      console.log('✅ Resultados también guardados en Supabase');
    }

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
  const añoArg = process.argv[2];
  const año = añoArg ? parseInt(añoArg, 10) : undefined;
  
  main(año).catch((error) => {
    console.error('Error no manejado:', error);
    process.exit(1);
  });
}

export { main };

