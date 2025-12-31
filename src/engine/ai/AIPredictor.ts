/**
 * AI Predictor - Juez Final
 * 
 * Este módulo actúa como el "cerebro" que toma la decisión final
 * sobre las combinaciones candidatas, usando Grok AI (xAI)
 * para evaluar coherencia orgánica y seleccionar las mejores opciones.
 */

import { Combinacion, AnalisisEstadistico, NumeroQuini, EstadisticaFrecuencia } from '../types';

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
  private apiKey: string;
  private apiUrl: string = 'https://api.x.ai/v1/chat/completions';
  private model: string = 'grok-beta';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GROK_API_KEY;
    if (!key) {
      throw new Error('Falta GROK_API_KEY en el .env. Agrega GROK_API_KEY=tu_api_key');
    }

    this.apiKey = key;
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
      // Llamar a Grok API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
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
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Grok API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('No se recibió respuesta de Grok API');
      }

      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de Grok');
      }

      const parsed = JSON.parse(jsonMatch[0]);

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
        console.warn('⚠️  Grok no devolvió 3 combinaciones válidas, usando top 3 candidatas');
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
      console.warn(`⚠️  Error obteniendo veredicto de Grok: ${errorMessage}`);
      console.warn('   Usando top 3 candidatas como fallback');
      
      return {
        top3: candidatas.slice(0, 3),
        analisisTecnico: `Fallback: Error al obtener análisis de Grok (${errorMessage}). Usando top 3 candidatas por score estadístico.`,
        razones: [
          'Seleccionadas por score de priorización',
          'Basadas en análisis estadístico local',
          'Fallback debido a error en API de Grok'
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

