/**
 * Script para importar datos históricos de Quini 6 a Supabase usando PostgreSQL directo
 * Recorre los archivos JSON de 2020-2025 y realiza upsert masivo
 * Usa conexión directa de PostgreSQL para mejor rendimiento
 */

// Cargar variables de entorno desde .env
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool, Client } from 'pg';
import { ResultadoScraping, SorteoQuini6 } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface PostgresConfig {
  connectionString: string;
}

/**
 * Obtiene la configuración de PostgreSQL desde variables de entorno
 */
function getPostgresConfig(): PostgresConfig {
  // Opción 1: Connection string completo
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  // Opción 2: Construir desde componentes individuales
  if (!connectionString) {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME || 'postgres';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD;

    if (host && user && password) {
      return {
        connectionString: `postgresql://${user}:${password}@${host}:${port}/${database}`
      };
    }
  }

  if (!connectionString) {
    throw new Error(
      '❌ Configuración de PostgreSQL no encontrada.\n' +
      '   Configura una de estas opciones:\n' +
      '   1. DATABASE_URL o POSTGRES_URL (connection string completo)\n' +
      '   2. DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (componentes individuales)\n' +
      '   Ejemplo: postgresql://user:password@host:5432/database'
    );
  }

  return { connectionString };
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
      parseInt(sorteo.tradicional.numeros.numero1),
      parseInt(sorteo.tradicional.numeros.numero2),
      parseInt(sorteo.tradicional.numeros.numero3),
      parseInt(sorteo.tradicional.numeros.numero4),
      parseInt(sorteo.tradicional.numeros.numero5),
      parseInt(sorteo.tradicional.numeros.numero6)
    ],
    la_segunda: [
      parseInt(sorteo.segunda.numeros.numero1),
      parseInt(sorteo.segunda.numeros.numero2),
      parseInt(sorteo.segunda.numeros.numero3),
      parseInt(sorteo.segunda.numeros.numero4),
      parseInt(sorteo.segunda.numeros.numero5),
      parseInt(sorteo.segunda.numeros.numero6)
    ],
    revancha: [
      parseInt(sorteo.revancha.numeros.numero1),
      parseInt(sorteo.revancha.numeros.numero2),
      parseInt(sorteo.revancha.numeros.numero3),
      parseInt(sorteo.revancha.numeros.numero4),
      parseInt(sorteo.revancha.numeros.numero5),
      parseInt(sorteo.revancha.numeros.numero6)
    ],
    siempre_sale: [
      parseInt(sorteo.siempreSale.numeros.numero1),
      parseInt(sorteo.siempreSale.numeros.numero2),
      parseInt(sorteo.siempreSale.numeros.numero3),
      parseInt(sorteo.siempreSale.numeros.numero4),
      parseInt(sorteo.siempreSale.numeros.numero5),
      parseInt(sorteo.siempreSale.numeros.numero6)
    ],
    pozo_extra: sorteo.pozoExtra ? sorteo.pozoExtra : null,
    url: sorteo.url,
    extraido_en: sorteo.extraidoEn ? new Date(sorteo.extraidoEn).toISOString() : null
  };
}

/**
 * Realiza upsert masivo de sorteos usando PostgreSQL
 */
async function upsertSorteos(
  client: Client,
  sorteos: any[],
  año: number,
  batchSize: number = 100
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  console.log(`\n📤 Insertando ${sorteos.length} sorteos del año ${año} en lotes de ${batchSize}...`);

  // Procesar en lotes
  for (let i = 0; i < sorteos.length; i += batchSize) {
    const batch = sorteos.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sorteos.length / batchSize);

    try {
      // Construir query de UPSERT usando ON CONFLICT
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      batch.forEach((sorteo, idx) => {
        const rowPlaceholders: string[] = [];
        [
          sorteo.sorteo_numero,
          sorteo.fecha,
          sorteo.fecha_texto,
          sorteo.año,
          sorteo.tradicional, // PostgreSQL maneja arrays de JavaScript directamente
          sorteo.la_segunda,
          sorteo.revancha,
          sorteo.siempre_sale,
          sorteo.pozo_extra, // El driver pg convierte objetos JavaScript a JSONB automáticamente
          sorteo.url,
          sorteo.extraido_en
        ].forEach(val => {
          rowPlaceholders.push(`$${paramIndex++}`);
          values.push(val);
        });
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      });

      // Construir query con cast explícito para pozo_extra (JSONB)
      // Los arrays de enteros se pasan directamente - el driver pg los convierte automáticamente
      const query = `
        INSERT INTO resultados_quini (
          sorteo_numero, fecha, fecha_texto, año,
          tradicional, la_segunda, revancha, siempre_sale,
          pozo_extra, url, extraido_en,
          created_at, updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (sorteo_numero) 
        DO UPDATE SET
          fecha = EXCLUDED.fecha,
          fecha_texto = EXCLUDED.fecha_texto,
          año = EXCLUDED.año,
          tradicional = EXCLUDED.tradicional,
          la_segunda = EXCLUDED.la_segunda,
          revancha = EXCLUDED.revancha,
          siempre_sale = EXCLUDED.siempre_sale,
          pozo_extra = EXCLUDED.pozo_extra,
          url = EXCLUDED.url,
          extraido_en = EXCLUDED.extraido_en,
          updated_at = NOW()
      `;

      const result = await client.query(query, values);
      success += batch.length;
      console.log(`✅ Lote ${batchNumber}/${totalBatches} procesado: ${batch.length} sorteos`);

    } catch (error) {
      console.error(`❌ Error en lote ${batchNumber}/${totalBatches}:`, error);
      if (error instanceof Error) {
        console.error(`   Mensaje: ${error.message}`);
      }
      errors += batch.length;
    }

    // Pequeña pausa entre lotes
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
  client: Client,
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
      client,
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
  console.log('🚀 Importador Histórico de Quini 6 a Supabase (PostgreSQL)');
  console.log('='.repeat(60));
  console.log('');

  // Verificar configuración
  let config: PostgresConfig;
  try {
    config = getPostgresConfig();
    console.log('✅ Configuración de PostgreSQL encontrada');
    // No mostrar la contraseña completa por seguridad
    const maskedUrl = config.connectionString.replace(/:[^:@]+@/, ':***@');
    console.log(`   Connection: ${maskedUrl}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Crear cliente de PostgreSQL
  const client = new Client({
    connectionString: config.connectionString,
    ssl: {
      rejectUnauthorized: false // Necesario para Supabase
    }
  });

  try {
    // Conectar a la base de datos
    console.log('\n🔍 Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conexión establecida');

    // Verificar que la tabla existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'resultados_quini'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ La tabla "resultados_quini" no existe');
      console.error('   Ejecuta el SQL de creación en Supabase (ver src/scripts/README.md)');
      process.exit(1);
    }

    console.log('✅ Tabla "resultados_quini" encontrada');

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
      const resultado = await procesarArchivo(client, archivoPath, año);
      
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

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    process.exit(1);
  } finally {
    // Cerrar conexión
    await client.end();
    console.log('\n🔌 Conexión cerrada');
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

