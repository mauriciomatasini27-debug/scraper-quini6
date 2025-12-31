/**
 * AI Predictor - Juez Final
 * 
 * Este módulo actúa como el "cerebro" que toma la decisión final
 * sobre las combinaciones candidatas, usando Groq AI
 * para evaluar coherencia orgánica y seleccionar las mejores opciones.
 * 
 * Incluye sistema de retry con backoff exponencial para mayor resiliencia.
 */

import { Groq } from 'groq-sdk';
import { Combinacion, AnalisisEstadistico, NumeroQuini, EstadisticaFrecuencia } from '../types';
import { withRetry } from '../utils/Resilience';

/**
 * Resultado del veredicto final del AI Predictor
 */
export interface VeredictoFinal {
  top3: Combinacion[];
  analisisTecnico: string;
  razones: string[];
  scores?: Array<{
    combinacion: Combinacion;
    score: number;
    razon: string;
  }>;
}

/**
 * Resumen estadístico para el contexto del predictor
 */
export interface ResumenEstadistico {
  topPresion: Array<{
    numero: NumeroQuini;
    presion: number;
    atraso: number;
    frecuencia: number;
  }>;
  tendenciaSuma: {
    ideal: number;
    rango: { min: number; max: number };
  };
  patronDeltas: {
    masComunes: number[];
    media: number;
  };
  estadisticasAmplitud?: {
    media: number;
    rangoOptimo: { min: number; max: number };
  };
}

/**
 * Clase principal del Juez Final (AI Predictor)
 */
export class AIPredictor {
  private groq: Groq;
  private model: string = 'llama-3.3-70b-versatile'; // Modelo actual de Groq (si no está disponible, intentar: llama-3.1-8b-instant, mixtral-8x7b-32768)

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('Falta GROQ_API_KEY en el .env. Agrega GROQ_API_KEY=tu_api_key');
    }

    this.groq = new Groq({
      apiKey: key
    });
  }

  /**
   * Obtiene el veredicto final sobre las combinaciones candidatas
   * 
   * @param candidatas Combinaciones que ya pasaron filtros de Poisson, Markov y Gauss
   * @param resumenEstadistico Resumen del análisis estadístico
   * @param analisisCompleto Análisis estadístico completo (opcional)
   */
  public async obtenerVeredictoFinal(
    candidatas: Combinacion[],
    resumenEstadistico: ResumenEstadistico,
    analisisCompleto?: AnalisisEstadistico
  ): Promise<VeredictoFinal> {
    if (candidatas.length === 0) {
      throw new Error('No hay combinaciones candidatas para evaluar');
    }

    // Preparar contexto estadístico
    const contextoEstadistico = this.prepararContexto(resumenEstadistico, analisisCompleto);

    // Preparar combinaciones para el prompt
    const combinacionesFormateadas = candidatas.map((comb, idx) => {
      const suma = comb.reduce((a, b) => a + b, 0);
      const pares = comb.filter(n => n % 2 === 0).length;
      const numerosOrdenados = [...comb].sort((a, b) => a - b);
      const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];
      
      return {
        id: idx + 1,
        numeros: comb,
        suma,
        pares,
        impares: 6 - pares,
        amplitud
      };
    });

    const prompt = `
Eres un Analista de Riesgos Estadísticos experto en Juegos de Azar.

CONTEXTO DEL SORTEO (Dominio 00-45):
${contextoEstadistico}

COMBINACIONES FINALISTAS (${candidatas.length} candidatas que ya pasaron filtros de Poisson, Markov, Gauss, Entropía y Co-ocurrencia):
${JSON.stringify(combinacionesFormateadas, null, 2)}

TAREA:
De estas combinaciones, selecciona las 3 que tengan la mejor 'coherencia orgánica'. 
Busca aquellas que:
1. Mezclen números con alto atraso y números en racha
2. Eviten patrones visuales obvios
3. Tengan distribución balanceada de paridad
4. Respeten el rango de amplitud histórico (32-43)
5. Tengan suma dentro del rango ideal (105-165)

FORMATO DE RESPUESTA:
Devuelve un JSON estrictamente con esta estructura:
{
  "top_3": [[n1,n2,n3,n4,n5,n6], [n1,n2,n3,n4,n5,n6], [n1,n2,n3,n4,n5,n6]],
  "analisis_tecnico": "breve explicación de por qué estas 3 (máximo 200 palabras)",
  "razones": ["razón 1", "razón 2", "razón 3"]
}

IMPORTANTE:
- Los números deben estar en el rango 00-45
- Cada combinación debe tener exactamente 6 números
- Selecciona las 3 mejores basándote en coherencia estadística y orgánica
`;

    try {
      // Llamar a Groq API con retry y backoff exponencial
      const text = await withRetry(async () => {
        const chatCompletion = await this.groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Eres un Analista de Riesgos Estadísticos experto en Juegos de Azar. Responde siempre en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.model,
          temperature: 0.6,
          max_tokens: 4096,
          top_p: 0.95,
          stream: false,
          response_format: { type: 'json_object' }
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || '';
        if (!responseContent) {
          throw new Error('Respuesta vacía de Groq');
        }
        
        return responseContent;
      }, 3); // Reintenta hasta 3 veces

      // Extraer JSON de la respuesta
      // Intentar primero extraer de code blocks markdown (```json ... ```)
      let jsonText = '';
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        // Si no hay code block, buscar directamente el JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }

      if (!jsonText) {
        console.warn('⚠️  Respuesta completa de Groq:', text.substring(0, 500));
        throw new Error('No se pudo extraer JSON de la respuesta de Groq');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn('⚠️  Error al parsear JSON. Texto extraído:', jsonText.substring(0, 500));
        throw new Error(`Error al parsear JSON de Groq: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
      }

      // Validar y convertir las combinaciones
      const top3: Combinacion[] = [];
      if (parsed.top_3 && Array.isArray(parsed.top_3)) {
        for (const comb of parsed.top_3) {
          if (Array.isArray(comb) && comb.length === 6) {
            // Validar que todos los números estén en rango 0-45
            const numerosValidos = comb.every((n: number) => 
              typeof n === 'number' && n >= 0 && n <= 45
            );
            
            if (numerosValidos) {
              // Ordenar y convertir a Combinacion
              const combinacionOrdenada = [...comb].sort((a, b) => a - b) as Combinacion;
              top3.push(combinacionOrdenada);
            }
          }
        }
      }

      // Si no se pudieron extraer 3 válidas, usar las primeras candidatas
      if (top3.length < 3 && candidatas.length >= 3) {
        console.warn('⚠️  Groq no devolvió 3 combinaciones válidas, usando top 3 candidatas');
        top3.push(...candidatas.slice(0, 3 - top3.length));
      }

      return {
        top3: top3.slice(0, 3),
        analisisTecnico: parsed.analisis_tecnico || 'Análisis no disponible',
        razones: parsed.razones || []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Detectar error de cuota
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota') || errorMessage.includes('rate limit')) {
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 60;
        
        throw new Error(
          `Cuota de API excedida. Por favor espera ${Math.ceil(retrySeconds)} segundos antes de reintentar. ` +
          `Verifica tu cuota en: https://console.x.ai`
        );
      }

      // Si falla, devolver las top 3 candidatas como fallback
      console.warn(`⚠️  Error obteniendo veredicto de Groq: ${errorMessage}`);
      console.warn('   Usando top 3 candidatas como fallback');
      
      return {
        top3: candidatas.slice(0, 3),
        analisisTecnico: `Fallback: Error al obtener análisis de Groq (${errorMessage}). Usando top 3 candidatas por score estadístico.`,
        razones: [
          'Seleccionadas por score de priorización',
          'Basadas en análisis estadístico local',
          'Fallback debido a error en API de Groq'
        ]
      };
    }
  }

  /**
   * Prepara el contexto estadístico para el prompt
   */
  private prepararContexto(
    resumen: ResumenEstadistico,
    analisisCompleto?: AnalisisEstadistico
  ): string {
    let contexto = '';

    // Top números con presión
    contexto += `- Números con mayor presión (atraso vs frecuencia):\n`;
    for (const item of resumen.topPresion.slice(0, 10)) {
      contexto += `  * Número ${item.numero.toString().padStart(2, '0')}: Presión=${item.presion.toFixed(2)}, Atraso=${item.atraso}, Frecuencia=${item.frecuencia}\n`;
    }

    // Tendencia de suma
    contexto += `\n- Tendencia de suma ideal: ${resumen.tendenciaSuma.ideal} ± 30 (rango: ${resumen.tendenciaSuma.rango.min}-${resumen.tendenciaSuma.rango.max})\n`;

    // Patrón de deltas
    contexto += `\n- Patrón de Deltas detectado:\n`;
    contexto += `  * Deltas más comunes: ${resumen.patronDeltas.masComunes.join(', ')}\n`;
    contexto += `  * Media de deltas: ${resumen.patronDeltas.media.toFixed(2)}\n`;
    contexto += `  * Mayoría de saltos entre 1 y 7\n`;

    // Estadísticas de amplitud
    if (resumen.estadisticasAmplitud) {
      contexto += `\n- Rango de Amplitud histórico:\n`;
      contexto += `  * Media: ${resumen.estadisticasAmplitud.media.toFixed(1)}\n`;
      contexto += `  * Rango óptimo: ${resumen.estadisticasAmplitud.rangoOptimo.min}-${resumen.estadisticasAmplitud.rangoOptimo.max}\n`;
    }

    // Información adicional del análisis completo
    if (analisisCompleto) {
      contexto += `\n- Análisis completo:\n`;
      contexto += `  * Total sorteos analizados: ${analisisCompleto.periodo.totalSorteos}\n`;
      contexto += `  * Período: ${analisisCompleto.periodo.fechaInicio.toLocaleDateString('es-AR')} - ${analisisCompleto.periodo.fechaFin.toLocaleDateString('es-AR')}\n`;
      contexto += `  * Desviación estándar: ${analisisCompleto.desviacionEstandar.toFixed(2)}\n`;
    }

    return contexto;
  }

  /**
   * Genera un resumen estadístico desde el análisis completo
   */
  public static generarResumenEstadistico(
    analisis: AnalisisEstadistico,
    topPresionCount: number = 10
  ): ResumenEstadistico {
    // Calcular presión para cada número
    const topPresion = Array.from(analisis.frecuencias.values())
      .map(estadistica => {
        const presion = estadistica.promedioAtraso > 0
          ? (estadistica.atraso / estadistica.promedioAtraso) * analisis.desviacionEstandar
          : estadistica.atraso * analisis.desviacionEstandar;
        
        return {
          numero: estadistica.numero,
          presion,
          atraso: estadistica.atraso,
          frecuencia: estadistica.frecuencia
        };
      })
      .sort((a, b) => b.presion - a.presion)
      .slice(0, topPresionCount);

    // Calcular deltas más comunes (simplificado - en producción usar PatternAnalyzer)
    const deltasComunes = [1, 2, 3, 4, 5, 6, 7]; // Basado en análisis previo

    return {
      topPresion,
      tendenciaSuma: {
        ideal: 135,
        rango: { min: 105, max: 165 }
      },
      patronDeltas: {
        masComunes: deltasComunes,
        media: 6.77 // Basado en análisis previo
      },
      estadisticasAmplitud: analisis.estadisticasAmplitud ? {
        media: analisis.estadisticasAmplitud.media,
        rangoOptimo: {
          min: 32,
          max: 43
        }
      } : undefined
    };
  }
}

