import { Quini6Scraper } from './scraper';
import { ValidadorSorteos } from './validator';
import { ResultadoScraping } from './types';

/**
 * Script automatizado para extraer múltiples años de resultados del Quini 6
 * Procesa los años 2020-2023 de forma secuencial con manejo de errores
 */
async function main() {
  const años: number[] = [2023, 2022, 2021, 2020];
  const delayEntreAños = 3000; // 3 segundos entre años (2-4 segundos como se solicitó)
  
  console.log('🎲 Scraper Masivo de Quini 6 - Años 2020-2023');
  console.log('='.repeat(60));
  console.log(`📅 Años a procesar: ${años.join(', ')}`);
  console.log('');

  const resultados: Array<{
    año: number;
    exitoso: boolean;
    totalSorteos: number;
    errores: number;
    archivo?: string;
    mensaje?: string;
  }> = [];

  const validador = new ValidadorSorteos();

  for (let i = 0; i < años.length; i++) {
    const año = años[i];
    const scraper = new Quini6Scraper(año);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Procesando año ${año} (${i + 1}/${años.length})`);
    console.log('='.repeat(60));

    try {
      // Inicializar navegador para este año
      await scraper.inicializar();

      // Procesar todos los sorteos del año
      const resultado = await scraper.procesarTodosLosSorteos();

      // Validar resultados
      console.log(`\n🔍 Validando sorteos del año ${año}...`);
      const validacion = await validador.validarSorteos(resultado);
      const reporte = validador.generarReporte(validacion);
      console.log(reporte);

      // Guardar resultados
      await scraper.guardarResultados(resultado);

      // Cerrar navegador antes de continuar
      await scraper.cerrar();

      resultados.push({
        año,
        exitoso: true,
        totalSorteos: resultado.totalSorteos,
        errores: resultado.errores.length,
        archivo: `quini_${año}_completo.json`
      });

      console.log(`\n✅ Año ${año} completado exitosamente!`);
      console.log(`   - Sorteos extraídos: ${resultado.totalSorteos}`);
      console.log(`   - Validación: ${validacion.valido ? '✅ Válido' : '⚠️  Con problemas'}`);

    } catch (error) {
      // Cerrar navegador en caso de error
      try {
        await scraper.cerrar();
      } catch (closeError) {
        // Ignorar errores al cerrar
      }

      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`\n❌ Error al procesar año ${año}:`, mensajeError);
      
      resultados.push({
        año,
        exitoso: false,
        totalSorteos: 0,
        errores: 1,
        mensaje: mensajeError
      });

      console.log(`⚠️  Continuando con el siguiente año...`);
    }

    // Delay incremental entre años (excepto después del último)
    if (i < años.length - 1) {
      const delay = delayEntreAños + (i * 500); // Delay incremental: 3s, 3.5s, 4s, 4.5s
      console.log(`\n⏳ Esperando ${delay / 1000} segundos antes del siguiente año...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 RESUMEN FINAL DE EXTRACCIÓN');
  console.log('='.repeat(60));
  
  const exitosos = resultados.filter(r => r.exitoso);
  const fallidos = resultados.filter(r => !r.exitoso);
  const totalSorteos = resultados.reduce((sum, r) => sum + r.totalSorteos, 0);

  console.log(`\n✅ Años procesados exitosamente: ${exitosos.length}/${años.length}`);
  exitosos.forEach(r => {
    console.log(`   - ${r.año}: ${r.totalSorteos} sorteos → ${r.archivo}`);
  });

  if (fallidos.length > 0) {
    console.log(`\n❌ Años con errores: ${fallidos.length}`);
    fallidos.forEach(r => {
      console.log(`   - ${r.año}: ${r.mensaje || 'Error desconocido'}`);
    });
  }

  console.log(`\n📊 Total de sorteos extraídos: ${totalSorteos}`);
  console.log(`📁 Archivos generados en: data/`);
  console.log(`\n✅ Proceso masivo completado!`);

  // Si hubo errores, salir con código de error
  if (fallidos.length > 0) {
    process.exit(1);
  }
}

// Ejecutar el scraper masivo
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Error fatal en el proceso masivo:', error);
    process.exit(1);
  });
}

export { main };

