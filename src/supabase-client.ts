/**
 * Cliente para guardar datos en Supabase
 * Requiere SUPABASE_URL y SUPABASE_KEY en variables de entorno
 */

import { ResultadoScraping, SorteoQuini6 } from './types';
import { VeredictoJuezFinal } from './engine/types';

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

/**
 * Interfaz para los datos de una predicción de IA
 */
export interface AIPredictionData {
  fechaSorteo: Date | string;
  numeroSorteo?: number;
  combinacion1: number[];
  combinacion2: number[];
  combinacion3: number[];
  analisisTecnico?: string;
  razones?: string[];
  metadata?: Record<string, any>;
}

/**
 * Guarda el veredicto del Juez Final (AI Predictor) en Supabase
 * Esto permite auditar la precisión del motor en el futuro
 * 
 * @param veredicto Veredicto del Juez Final con las 3 combinaciones seleccionadas
 * @param fechaSorteo Fecha del sorteo para el cual se hizo la predicción
 * @param numeroSorteo Número del sorteo (opcional, puede ser null si es una predicción futura)
 * @param metadata Información adicional opcional (scores, estadísticas, etc.)
 * @returns true si se guardó exitosamente, false en caso contrario
 */
export async function logAIVeredicto(
  veredicto: VeredictoJuezFinal,
  fechaSorteo: Date | string,
  numeroSorteo?: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  const config = getSupabaseConfig();

  if (!config) {
    console.warn('⚠️  Supabase no configurado. Saltando guardado de veredicto de IA.');
    return false;
  }

  // Validar que hay al menos 3 combinaciones
  if (!veredicto.top3 || veredicto.top3.length < 3) {
    console.warn('⚠️  El veredicto no contiene 3 combinaciones. Saltando guardado.');
    return false;
  }

  try {
    console.log('💾 Guardando veredicto de IA en Supabase...');

    // Formatear fecha
    const fechaFormateada = fechaSorteo instanceof Date 
      ? fechaSorteo.toISOString().split('T')[0] 
      : fechaSorteo;

    // Preparar datos para inserción
    const datosPrediccion = {
      fecha_sorteo: fechaFormateada,
      numero_sorteo: numeroSorteo || null,
      combinacion_1: veredicto.top3[0],
      combinacion_2: veredicto.top3[1],
      combinacion_3: veredicto.top3[2],
      analisis_tecnico: veredicto.analisisTecnico || null,
      razones: veredicto.razones || [],
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString()
    };

    // Insertar en Supabase
    const response = await fetch(`${config.url}/rest/v1/ai_predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(datosPrediccion)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error al guardar veredicto de IA: ${response.status} - ${errorText}`);
      return false;
    }

    const resultado = await response.json();
    console.log(`✅ Veredicto de IA guardado exitosamente (ID: ${resultado[0]?.id || 'N/A'})`);
    return true;

  } catch (error) {
    console.error('❌ Error al guardar veredicto de IA en Supabase:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    return false;
  }
}

/**
 * Actualiza el resultado real de una predicción de IA
 * Esto permite calcular los aciertos automáticamente
 * 
 * @param fechaSorteo Fecha del sorteo
 * @param resultadoReal Resultado real del sorteo (combinación ganadora)
 * @returns true si se actualizó exitosamente, false en caso contrario
 */
export async function actualizarResultadoReal(
  fechaSorteo: Date | string,
  resultadoReal: number[]
): Promise<boolean> {
  const config = getSupabaseConfig();

  if (!config) {
    console.warn('⚠️  Supabase no configurado. Saltando actualización de resultado real.');
    return false;
  }

  try {
    // Formatear fecha
    const fechaFormateada = fechaSorteo instanceof Date 
      ? fechaSorteo.toISOString().split('T')[0] 
      : fechaSorteo;

    // Actualizar el registro
    const response = await fetch(
      `${config.url}/rest/v1/ai_predictions?fecha_sorteo=eq.${fechaFormateada}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          resultado_real: resultadoReal
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error al actualizar resultado real: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`✅ Resultado real actualizado para fecha ${fechaFormateada}`);
    return true;

  } catch (error) {
    console.error('❌ Error al actualizar resultado real:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
    }
    return false;
  }
}

