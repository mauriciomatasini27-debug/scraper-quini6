/**
 * Script para importar datos históricos de Quini 6 a Supabase
 * Recorre los archivos JSON de 2020-2025 y realiza upsert masivo
 */

// Cargar variables de entorno desde .env
import * as dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ResultadoScraping, SorteoQuini6 } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface SupabaseConfig {
  url: string;
  key: string;
}

/**
 * Obtiene la configuración de Supabase desde variables de entorno
 */
function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      '❌ Variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas.\n' +
      '   Configúralas en tu archivo .env o como variables de entorno.'
    );
  }

  return { url, key };
}

/**
 * Mapea un sorteo de Quini 6 al formato de Supabase
 */
function mapearSorteoASupabase(sorteo: SorteoQuini6, año: number): any {
  return {
    sorteo_numero: sorteo.numeroSorteo,
    fecha: sorteo.fechaISO,
    fecha_texto: sorteo.fecha,
    año: año,
    tradicional: [
      sorteo.tradicional.numeros.numero1,
      sorteo.tradicional.numeros.numero2,
      sorteo.tradicional.numeros.numero3,
      sorteo.tradicional.numeros.numero4,
      sorteo.tradicional.numeros.numero5,
      sorteo.tradicional.numeros.numero6
    ],
    la_segunda: [
      sorteo.segunda.numeros.numero1,
      sorteo.segunda.numeros.numero2,
      sorteo.segunda.numeros.numero3,
      sorteo.segunda.numeros.numero4,
      sorteo.segunda.numeros.numero5,
      sorteo.segunda.numeros.numero6
    ],
    revancha: [
      sorteo.revancha.numeros.numero1,
      sorteo.revancha.numeros.numero2,
      sorteo.revancha.numeros.numero3,
      sorteo.revancha.numeros.numero4,
      sorteo.revancha.numeros.numero5,
      sorteo.revancha.numeros.numero6
    ],
    siempre_sale: [
      sorteo.siempreSale.numeros.numero1,
      sorteo.siempreSale.numeros.numero2,
      sorteo.siempreSale.numeros.numero3,
      sorteo.siempreSale.numeros.numero4,
      sorteo.siempreSale.numeros.numero5,
      sorteo.siempreSale.numeros.numero6
    ],
    pozo_extra: sorteo.pozoExtra ? {
      ganadores: sorteo.pozoExtra.ganadores,
      premio: sorteo.pozoExtra.premio
    } : null,
    url: sorteo.url,
    extraido_en: sorteo.extraidoEn,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Realiza upsert masivo de sorteos en Supabase
 */
async function upsertSorteos(
  supabase: SupabaseClient,
  sorteos: any[],
  año: number,
  batchSize: number = 100
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  // Eliminar duplicados primero (mantener el último por sorteo_numero)
  const sorteosUnicos = new Map<number, any>();
  for (const sorteo of sorteos) {
    sorteosUnicos.set(sorteo.sorteo_numero, sorteo);
  }
  const sorteosSinDuplicados = Array.from(sorteosUnicos.values());
  
  if (sorteosSinDuplicados.length < sorteos.length) {
    console.log(`⚠️  Se encontraron ${sorteos.length - sorteosSinDuplicados.length} sorteos duplicados, se procesarán ${sorteosSinDuplicados.length} únicos`);
  }

  console.log(`\n📤 Insertando ${sorteosSinDuplicados.length} sorteos del año ${año} en lotes de ${batchSize}...`);

  // Procesar en lotes para evitar límites de tamaño
  for (let i = 0; i < sorteosSinDuplicados.length; i += batchSize) {
    const batch = sorteosSinDuplicados.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sorteosSinDuplicados.length / batchSize);

    try {
      const { data, error } = await supabase
        .from('resultados_quini')
        .upsert(batch, {
          onConflict: 'sorteo_numero',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error en lote ${batchNumber}/${totalBatches}:`, error.message);
        errors += batch.length;
      } else {
        success += batch.length;
        console.log(`✅ Lote ${batchNumber}/${totalBatches} procesado: ${batch.length} sorteos`);
      }
    } catch (error) {
      console.error(`❌ Excepción en lote ${batchNumber}/${totalBatches}:`, error);
      errors += batch.length;
    }

    // Pequeña pausa entre lotes para no sobrecargar
    if (i + batchSize < sorteos.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, errors };
}

/**
 * Procesa un archivo JSON de un año específico
 */
async function procesarArchivo(
  supabase: SupabaseClient,
  archivoPath: string,
  año: number
): Promise<{ procesados: number; exitosos: number; errores: number }> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📂 Procesando archivo: ${path.basename(archivoPath)}`);
  console.log(`📅 Año: ${año}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(archivoPath)) {
    console.log(`⚠️  Archivo no encontrado: ${archivoPath}`);
    return { procesados: 0, exitosos: 0, errores: 0 };
  }

  try {
    // Leer y parsear el archivo JSON
    console.log('📖 Leyendo archivo JSON...');
    const contenido = fs.readFileSync(archivoPath, 'utf-8');
    const resultado: ResultadoScraping = JSON.parse(contenido);

    console.log(`📊 Total de sorteos en archivo: ${resultado.totalSorteos}`);

    if (resultado.sorteos.length === 0) {
      console.log('⚠️  No hay sorteos para procesar');
      return { procesados: 0, exitosos: 0, errores: 0 };
    }

    // Mapear todos los sorteos al formato de Supabase
    console.log('🔄 Mapeando sorteos al formato de Supabase...');
    const sorteosMapeados = resultado.sorteos.map(sorteo => 
      mapearSorteoASupabase(sorteo, año)
    );

    // Realizar upsert masivo
    const { success, errors } = await upsertSorteos(
      supabase,
      sorteosMapeados,
      año,
      100 // Lotes de 100 sorteos
    );

    return {
      procesados: resultado.sorteos.length,
      exitosos: success,
      errores: errors
    };

  } catch (error) {
    console.error(`❌ Error procesando archivo ${archivoPath}:`, error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    return { procesados: 0, exitosos: 0, errores: 1 };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Importador Histórico de Quini 6 a Supabase');
  console.log('='.repeat(60));
  console.log('');

  // Verificar configuración de Supabase
  let config: SupabaseConfig;
  try {
    config = getSupabaseConfig();
    console.log('✅ Configuración de Supabase encontrada');
    console.log(`   URL: ${config.url}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Crear cliente de Supabase
  const supabase = createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Verificar conexión
  console.log('\n🔍 Verificando conexión con Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('resultados_quini')
    .select('sorteo_numero')
    .limit(1);

  if (testError) {
    console.error('❌ Error de conexión con Supabase:', testError.message);
    console.error('   Verifica que la tabla "resultados_quini" exista y tengas permisos');
    process.exit(1);
  }

  console.log('✅ Conexión con Supabase establecida');

  // Directorio de datos
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Directorio de datos no encontrado: ${dataDir}`);
    process.exit(1);
  }

  // Años a procesar
  const años = [2020, 2021, 2022, 2023, 2024, 2025];
  const resumen: { año: number; procesados: number; exitosos: number; errores: number }[] = [];

  // Procesar cada año
  for (const año of años) {
    const archivoPath = path.join(dataDir, `quini_${año}_completo.json`);
    const resultado = await procesarArchivo(supabase, archivoPath, año);
    
    resumen.push({
      año,
      ...resultado
    });

    // Pausa entre años
    if (año !== años[años.length - 1]) {
      console.log('\n⏳ Esperando 2 segundos antes del siguiente año...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Mostrar resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN FINAL DE IMPORTACIÓN');
  console.log('='.repeat(60));
  
  let totalProcesados = 0;
  let totalExitosos = 0;
  let totalErrores = 0;

  resumen.forEach(r => {
    console.log(`\n📅 Año ${r.año}:`);
    console.log(`   - Procesados: ${r.procesados}`);
    console.log(`   - Exitosos: ${r.exitosos} ✅`);
    console.log(`   - Errores: ${r.errores} ${r.errores > 0 ? '❌' : ''}`);
    
    totalProcesados += r.procesados;
    totalExitosos += r.exitosos;
    totalErrores += r.errores;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('📈 TOTALES:');
  console.log(`   - Total procesados: ${totalProcesados}`);
  console.log(`   - Total exitosos: ${totalExitosos} ✅`);
  console.log(`   - Total errores: ${totalErrores} ${totalErrores > 0 ? '❌' : ''}`);
  console.log('='.repeat(60));

  if (totalErrores === 0) {
    console.log('\n✅ Importación completada exitosamente!');
  } else {
    console.log('\n⚠️  Importación completada con algunos errores');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
}

export { main };

