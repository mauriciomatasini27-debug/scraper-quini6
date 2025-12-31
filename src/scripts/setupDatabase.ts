/**
 * Script para configurar la base de datos de Supabase
 * Ejecuta todos los pasos en orden: tablas, funciones y triggers
 */

// Cargar variables de entorno desde .env
import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
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
      '   Configura una de estas opciones en tu archivo .env:\n' +
      '   1. DATABASE_URL o POSTGRES_URL (connection string completo)\n' +
      '   2. DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (componentes individuales)\n' +
      '   Ejemplo: postgresql://user:password@host:5432/database\n\n' +
      '   Obtén la connection string desde: Supabase Dashboard → Settings → Database'
    );
  }

  return { connectionString };
}

/**
 * Lee y ejecuta un archivo SQL
 */
async function executeSqlFile(client: Client, filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n📄 Ejecutando script SQL: ${path.basename(filePath)}...`);

  try {
    // Ejecutar el SQL completo de una vez
    // PostgreSQL puede manejar múltiples statements en una sola ejecución
    await client.query(sql);
    console.log(' ✅ Script ejecutado exitosamente');
  } catch (error) {
    // Algunos errores son esperados (como "already exists")
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('duplicate')
      ) {
        // Estos son errores esperados cuando se ejecuta múltiples veces
        console.log(' ⚠️  Algunos objetos ya existen (esto es normal si se ejecuta múltiples veces)');
        return;
      }
      console.error(`\n❌ Error ejecutando SQL:`, error.message);
      throw error;
    }
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Configurador de Base de Datos Supabase');
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

    // Verificar que el archivo SQL completo existe
    const sqlFilePath = path.join(process.cwd(), 'setup_database_complete.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`\n❌ Archivo SQL no encontrado: ${sqlFilePath}`);
      console.error('   Asegúrate de que el archivo setup_database_complete.sql existe en la raíz del proyecto');
      process.exit(1);
    }

    console.log('\n📋 Ejecutando script SQL completo...');
    console.log('   Esto puede tomar unos momentos...\n');

    // Ejecutar el script SQL completo
    await executeSqlFile(client, sqlFilePath);

    console.log('\n✅ Script SQL ejecutado exitosamente');

    // Verificar que todo se creó correctamente
    console.log('\n🔍 Verificando configuración...');

    // Verificar tablas
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_name IN ('resultados_quini', 'ai_predictions')
      ORDER BY table_name;
    `);

    console.log(`\n📊 Tablas encontradas: ${tablesResult.rows.length}/2`);
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Verificar funciones
    const functionsResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('update_updated_at_column', 'calcular_aciertos', 'update_aciertos_on_resultado_real')
      ORDER BY routine_name;
    `);

    console.log(`\n⚙️  Funciones encontradas: ${functionsResult.rows.length}/3`);
    functionsResult.rows.forEach(row => {
      console.log(`   ✅ ${row.routine_name}`);
    });

    // Verificar triggers
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table IN ('resultados_quini', 'ai_predictions')
      ORDER BY event_object_table, trigger_name;
    `);

    console.log(`\n🔔 Triggers encontrados: ${triggersResult.rows.length}`);
    triggersResult.rows.forEach(row => {
      console.log(`   ✅ ${row.trigger_name} en ${row.event_object_table}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuración de base de datos completada exitosamente!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error durante la configuración:');
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    } else {
      console.error('   Error desconocido:', error);
    }
    process.exit(1);
  } finally {
    // Cerrar conexión
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar si se llama directamente
main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

export { main as setupDatabase };

