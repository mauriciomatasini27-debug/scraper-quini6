/**
 * Cliente para guardar datos en Supabase
 * Requiere SUPABASE_URL y SUPABASE_KEY en variables de entorno
 */

import { ResultadoScraping, SorteoQuini6 } from './types';

interface SupabaseConfig {
  url: string;
  key: string;
}

/**
 * Obtiene la configuración de Supabase desde variables de entorno
 */
function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

/**
 * Guarda los resultados del scraping en Supabase
 */
export async function guardarEnSupabase(resultado: ResultadoScraping): Promise<boolean> {
  const config = getSupabaseConfig();

  if (!config) {
    console.warn('⚠️  Supabase no configurado. Saltando guardado en base de datos.');
    return false;
  }

  try {
    console.log('💾 Guardando resultados en Supabase...');

    // Usar fetch nativo para evitar dependencias adicionales
    // Nota: En producción, considera usar @supabase/supabase-js para mejor tipado
    
    // Guardar cada sorteo individualmente
    for (const sorteo of resultado.sorteos) {
      const response = await fetch(`${config.url}/rest/v1/sorteos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          numero_sorteo: sorteo.numeroSorteo,
          fecha: sorteo.fechaISO,
          fecha_texto: sorteo.fecha,
          año: resultado.año,
          tradicional: JSON.stringify(sorteo.tradicional),
          segunda: JSON.stringify(sorteo.segunda),
          revancha: JSON.stringify(sorteo.revancha),
          siempre_sale: JSON.stringify(sorteo.siempreSale),
          pozo_extra: sorteo.pozoExtra ? JSON.stringify(sorteo.pozoExtra) : null,
          url: sorteo.url,
          extraido_en: sorteo.extraidoEn,
          fecha_extraccion: resultado.metadata.fechaExtraccion
        })
      });

      if (!response.ok && response.status !== 409) {
        // 409 = conflicto (ya existe), lo cual está bien
        console.error(`Error al guardar sorteo #${sorteo.numeroSorteo}: ${response.statusText}`);
      }
    }

    console.log('✅ Resultados guardados en Supabase exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error al guardar en Supabase:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    return false;
  }
}

/**
 * Usa UPSERT para insertar o actualizar sorteos
 * Más eficiente que insertar uno por uno
 */
export async function guardarEnSupabaseBatch(resultado: ResultadoScraping): Promise<boolean> {
  const config = getSupabaseConfig();

  if (!config) {
    console.warn('⚠️  Supabase no configurado. Saltando guardado en base de datos.');
    return false;
  }

  try {
    console.log(`💾 Guardando ${resultado.sorteos.length} sorteos en Supabase (batch)...`);

    // Preparar datos para inserción batch
    const sorteosParaInsertar = resultado.sorteos.map(sorteo => ({
      numero_sorteo: sorteo.numeroSorteo,
      fecha: sorteo.fechaISO,
      fecha_texto: sorteo.fecha,
      año: resultado.año,
      tradicional: JSON.stringify(sorteo.tradicional),
      segunda: JSON.stringify(sorteo.segunda),
      revancha: JSON.stringify(sorteo.revancha),
      siempre_sale: JSON.stringify(sorteo.siempreSale),
      pozo_extra: sorteo.pozoExtra ? JSON.stringify(sorteo.pozoExtra) : null,
      url: sorteo.url,
      extraido_en: sorteo.extraidoEn,
      fecha_extraccion: resultado.metadata.fechaExtraccion
    }));

    // Usar UPSERT para evitar duplicados
    const response = await fetch(`${config.url}/rest/v1/sorteos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Prefer': 'return=minimal,resolution=merge-duplicates'
      },
      body: JSON.stringify(sorteosParaInsertar)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${errorText}`);
    }

    console.log('✅ Resultados guardados en Supabase exitosamente (batch)');
    return true;

  } catch (error) {
    console.error('❌ Error al guardar en Supabase:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    return false;
  }
}

