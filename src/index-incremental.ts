/**
 * Script para ejecución incremental - solo extrae sorteos nuevos
 * Usado por GitHub Actions para actualizar solo los sorteos faltantes
 */

import { Quini6Scraper } from './scraper';
import { ValidadorSorteos } from './validator';
import { ResultadoScraping } from './types';
import { guardarEnSupabaseBatch } from './supabase-client';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Obtiene los sorteos nuevos comparando con el archivo existente
 */
async function obtenerSorteosNuevos(
  scraper: Quini6Scraper,
  año: number
): Promise<ResultadoScraping> {
  const archivoPath = path.join(process.cwd(), 'data', `quini_${año}_completo.json`);
  
  // Leer archivo existente si existe
  let sorteosExistentes: Set<number> = new Set();
  let resultadoExistente: ResultadoScraping | null = null;
  
  if (fs.existsSync(archivoPath)) {
    try {
      const contenido = fs.readFileSync(archivoPath, 'utf-8');
      resultadoExistente = JSON.parse(contenido) as ResultadoScraping;
      sorteosExistentes = new Set(resultadoExistente.sorteos.map(s => s.numeroSorteo));
      console.log(`📄 Archivo existente encontrado con ${resultadoExistente.sorteos.length} sorteos`);
    } catch (error) {
      console.warn('⚠️  Error al leer archivo existente, se procesará todo el año');
    }
  } else {
    console.log('📄 No se encontró archivo existente, se procesará todo el año');
  }

  // Obtener todos los sorteos del año
  const resultadoCompleto = await scraper.procesarTodosLosSorteos();

  // Si hay archivo existente, filtrar solo los nuevos
  if (resultadoExistente && sorteosExistentes.size > 0) {
    const sorteosNuevos = resultadoCompleto.sorteos.filter(
      s => !sorteosExistentes.has(s.numeroSorteo)
    );

    if (sorteosNuevos.length > 0) {
      console.log(`\n🆕 Se encontraron ${sorteosNuevos.length} sorteo(s) nuevo(s)`);
      
      // Combinar sorteos existentes con nuevos
      const todosLosSorteos = [...resultadoExistente.sorteos, ...sorteosNuevos];
      todosLosSorteos.sort((a, b) => a.numeroSorteo - b.numeroSorteo);

      // Crear resultado actualizado
      const resultadoActualizado: ResultadoScraping = {
        año: resultadoExistente.año,
        totalSorteos: todosLosSorteos.length,
        sorteos: todosLosSorteos,
        sorteosPendientes: [...new Set([...resultadoExistente.sorteosPendientes, ...resultadoCompleto.sorteosPendientes])].sort((a, b) => a - b),
        errores: [...resultadoExistente.errores, ...resultadoCompleto.errores],
        fechaInicio: todosLosSorteos.length > 0 ? todosLosSorteos[0].fechaISO : resultadoExistente.fechaInicio,
        fechaFin: todosLosSorteos.length > 0 ? todosLosSorteos[todosLosSorteos.length - 1].fechaISO : resultadoExistente.fechaFin,
        metadata: {
          version: resultadoExistente.metadata.version,
          fechaExtraccion: new Date().toISOString()
        }
      };

      return resultadoActualizado;
    } else {
      console.log(`\n✅ No se encontraron sorteos nuevos (ya están actualizados)`);
      return resultadoExistente;
    }
  }

  // Si no hay archivo existente, retornar todos los sorteos
  return resultadoCompleto;
}

/**
 * Función principal para ejecución incremental
 */
async function main() {
  const añoObjetivo = parseInt(process.argv[2]) || new Date().getFullYear();
  
  console.log(`🔄 Scraper Incremental de Quini 6 - Año ${añoObjetivo}`);
  console.log('='.repeat(60));
  console.log('');

  const scraper = new Quini6Scraper(añoObjetivo);
  const validador = new ValidadorSorteos();

  try {
    // Inicializar navegador
    await scraper.inicializar();

    // Obtener solo sorteos nuevos
    const resultado = await obtenerSorteosNuevos(scraper, añoObjetivo);

    if (resultado.sorteos.length > 0) {
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

      console.log('\n✅ Proceso incremental completado exitosamente!');
      console.log(`📊 Resumen:`);
      console.log(`   - Total de sorteos en archivo: ${resultado.totalSorteos}`);
      console.log(`   - Validación: ${validacion.valido ? '✅ Válido' : '⚠️  Con problemas'}`);
    } else {
      console.log('\n✅ No hay sorteos nuevos para procesar');
    }

  } catch (error) {
    console.error('\n❌ Error fatal durante el scraping:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await scraper.cerrar();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error no manejado:', error);
    process.exit(1);
  });
}

export { main };

