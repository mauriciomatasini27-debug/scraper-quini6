/**
 * Funciones de consulta para Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { AIPrediction, ResultadoQuini, FrecuenciaNumero } from '../types';

/**
 * Obtiene la última predicción de IA (la más reciente)
 */
export async function obtenerUltimaPrediccion(): Promise<AIPrediction | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase no está configurado. No se pueden obtener predicciones.');
    console.warn('Verifica que las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) estén configuradas en .env.local');
    return null;
  }

  try {
    // Validación adicional: isSupabaseConfigured ya verifica la configuración
    // Esta validación adicional es redundante pero útil para debugging

    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no hay datos

    if (error) {
      // Intentar extraer información del error de manera segura
      const errorInfo: any = {
        hasError: true,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name || 'Unknown',
      };

      // Intentar acceder a propiedades comunes del error de Supabase
      if (error && typeof error === 'object') {
        errorInfo.message = (error as any)?.message || 'No message';
        errorInfo.details = (error as any)?.details || 'No details';
        errorInfo.hint = (error as any)?.hint || 'No hint';
        errorInfo.code = (error as any)?.code || 'No code';
        
        // Intentar serializar el error completo
        try {
          errorInfo.fullError = JSON.stringify(error, null, 2);
        } catch (e) {
          errorInfo.fullError = String(error);
        }
        
        // Verificar si el error tiene propiedades
        const errorKeys = Object.keys(error);
        errorInfo.keys = errorKeys.length > 0 ? errorKeys : 'No keys found';
      } else {
        errorInfo.rawError = String(error);
      }

      console.error('Error al obtener última predicción:', errorInfo);
      
      // Log adicional para debugging
      if (!errorInfo.message || errorInfo.message === 'No message') {
        console.error('⚠️ El error no contiene información detallada. Posibles causas:');
        console.error('- La tabla "ai_predictions" no existe en Supabase');
        console.error('- No hay permisos para leer la tabla (RLS habilitado sin políticas)');
        console.error('- Variables de entorno de Supabase incorrectas o no configuradas');
        console.error('- Problema de conexión con Supabase');
      }
      
      return null;
    }

    // Si no hay datos, retornar null sin error
    if (!data) {
      console.info('No hay predicciones disponibles en la base de datos.');
      return null;
    }

    return data as AIPrediction;
  } catch (error) {
    console.error('Error inesperado al obtener predicción:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return null;
  }
}

/**
 * Obtiene todas las predicciones de IA (últimas N)
 */
export async function obtenerPredicciones(limit: number = 10): Promise<AIPrediction[]> {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener predicciones:', error);
      return [];
    }

    return (data || []) as AIPrediction[];
  } catch (error) {
    console.error('Error inesperado al obtener predicciones:', error);
    return [];
  }
}

/**
 * Obtiene los resultados históricos de Quini 6
 */
export async function obtenerResultadosHistoricos(
  limit: number = 100
): Promise<ResultadoQuini[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase no está configurado. No se pueden obtener resultados históricos.');
    console.warn('Verifica que las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) estén configuradas en .env.local');
    return [];
  }

  try {
    // Validación adicional: isSupabaseConfigured ya verifica la configuración

    const { data, error } = await supabase
      .from('resultados_quini')
      .select('*')
      .order('sorteo_numero', { ascending: false })
      .limit(limit);

    if (error) {
      // Intentar extraer información del error de manera segura
      const errorInfo: any = {
        hasError: true,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name || 'Unknown',
      };

      // Intentar acceder a propiedades comunes del error de Supabase
      if (error && typeof error === 'object') {
        errorInfo.message = (error as any)?.message || 'No message';
        errorInfo.details = (error as any)?.details || 'No details';
        errorInfo.hint = (error as any)?.hint || 'No hint';
        errorInfo.code = (error as any)?.code || 'No code';
        
        // Intentar serializar el error completo
        try {
          errorInfo.fullError = JSON.stringify(error, null, 2);
        } catch (e) {
          errorInfo.fullError = String(error);
        }
        
        // Verificar si el error tiene propiedades
        const errorKeys = Object.keys(error);
        errorInfo.keys = errorKeys.length > 0 ? errorKeys : 'No keys found';
      } else {
        errorInfo.rawError = String(error);
      }

      console.error('Error al obtener resultados históricos:', errorInfo);
      
      // Log adicional para debugging
      if (!errorInfo.message || errorInfo.message === 'No message') {
        console.error('⚠️ El error no contiene información detallada. Posibles causas:');
        console.error('- La tabla "resultados_quini" no existe en Supabase');
        console.error('- No hay permisos para leer la tabla (RLS habilitado sin políticas)');
        console.error('- Variables de entorno de Supabase incorrectas o no configuradas');
        console.error('- Problema de conexión con Supabase');
      }
      
      return [];
    }

    return (data || []) as ResultadoQuini[];
  } catch (error) {
    console.error('Error inesperado al obtener resultados:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return [];
  }
}

/**
 * Calcula la frecuencia de aparición de cada número (00-45)
 * basándose en los resultados históricos
 */
export async function calcularFrecuenciasNumeros(): Promise<FrecuenciaNumero[]> {
  try {
    // Obtener todos los resultados históricos
    const resultados = await obtenerResultadosHistoricos(10000);

    // Validar que hay resultados
    if (!resultados || resultados.length === 0) {
      console.warn('No se encontraron resultados históricos para calcular frecuencias.');
      // Retornar frecuencias en cero para todos los números
      const frecuencias: FrecuenciaNumero[] = [];
      for (let i = 0; i <= 45; i++) {
        frecuencias.push({
          numero: i,
          frecuencia: 0,
          frecuenciaRelativa: 0,
        });
      }
      return frecuencias;
    }

    // Inicializar contadores para números 0-45
    const contadores: Map<number, number> = new Map();
    for (let i = 0; i <= 45; i++) {
      contadores.set(i, 0);
    }

    // Contar apariciones de cada número en la modalidad tradicional
    resultados.forEach((resultado) => {
      // Validar que el resultado tenga la estructura esperada
      if (resultado && resultado.tradicional && Array.isArray(resultado.tradicional)) {
        resultado.tradicional.forEach((numero) => {
          if (typeof numero === 'number' && numero >= 0 && numero <= 45) {
            const count = contadores.get(numero) || 0;
            contadores.set(numero, count + 1);
          }
        });
      } else {
        console.warn('Resultado con estructura inválida:', resultado);
      }
    });

    // Calcular frecuencia relativa (probabilidad empírica)
    const totalApariciones = resultados.length * 6; // 6 números por sorteo
    const frecuencias: FrecuenciaNumero[] = [];

    contadores.forEach((frecuencia, numero) => {
      frecuencias.push({
        numero,
        frecuencia,
        frecuenciaRelativa: totalApariciones > 0 ? frecuencia / totalApariciones : 0,
      });
    });

    // Ordenar por número
    return frecuencias.sort((a, b) => a.numero - b.numero);
  } catch (error) {
    console.error('Error al calcular frecuencias:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return [];
  }
}

