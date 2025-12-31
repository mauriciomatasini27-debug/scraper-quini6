/**
 * Gemini Analyzer - Integración con Google Gemini AI
 * 
 * Utiliza Google Gemini para análisis avanzados de combinaciones
 * y generación de insights basados en datos históricos.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Combinacion, NumeroQuini, AnalisisEstadistico } from '../types';

/**
 * Configuración del analizador Gemini
 */
export interface ConfiguracionGemini {
  apiKey: string;
  model?: string; // Por defecto: 'gemini-2.0-flash'
  temperatura?: number; // 0.0 - 1.0
}

/**
 * Resultado del análisis con Gemini
 */
export interface AnalisisGemini {
  combinacion: Combinacion;
  analisis: string;
  recomendacion: string;
  scoreIA?: number;
  razones: string[];
}

/**
 * Clase principal para análisis con Gemini
 */
export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private configuracion: ConfiguracionGemini;

  constructor(configuracion: ConfiguracionGemini) {
    this.configuracion = {
      model: 'gemini-2.0-flash',
      temperatura: 0.7,
      ...configuracion
    };

    this.genAI = new GoogleGenerativeAI(this.configuracion.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.configuracion.model || 'gemini-2.0-flash',
      generationConfig: {
        temperature: this.configuracion.temperatura || 0.7
      }
    });
  }

  /**
   * Analiza una combinación usando Gemini
   */
  public async analizarCombinacion(
    combinacion: Combinacion,
    contexto?: {
      analisisEstadistico?: AnalisisEstadistico;
      topNumeros?: NumeroQuini[];
      estadisticasRelevantes?: string;
    }
  ): Promise<AnalisisGemini> {
    const numerosStr = combinacion.map(n => n.toString().padStart(2, '0')).join(', ');
    const suma = combinacion.reduce((a, b) => a + b, 0);
    const pares = combinacion.filter(n => n % 2 === 0).length;
    const impares = combinacion.length - pares;
    const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
    const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];

    let prompt = `Analiza esta combinación de números de lotería (Quini 6, dominio 00-45):

Combinación: ${numerosStr}
Suma total: ${suma}
Pares: ${pares} | Impares: ${impares}
Amplitud (rango): ${amplitud}

`;

    if (contexto?.analisisEstadistico) {
      prompt += `Contexto estadístico:
- Total de sorteos analizados: ${contexto.analisisEstadistico.periodo.totalSorteos}
- Media de frecuencias: ${contexto.analisisEstadistico.media.toFixed(2)}
- Desviación estándar: ${contexto.analisisEstadistico.desviacionEstandar.toFixed(2)}
`;
    }

    if (contexto?.topNumeros && contexto.topNumeros.length > 0) {
      prompt += `- Números con mayor presión estadística: ${contexto.topNumeros.map(n => n.toString().padStart(2, '0')).join(', ')}\n`;
    }

    if (contexto?.estadisticasRelevantes) {
      prompt += `\nEstadísticas adicionales:\n${contexto.estadisticasRelevantes}\n`;
    }

    prompt += `\nProporciona un análisis breve (máximo 150 palabras) que incluya:
1. Evaluación de la combinación basada en patrones estadísticos
2. Recomendación (usar o no usar)
3. 3 razones principales para tu recomendación
4. Un score de 0-100 para esta combinación

Formato de respuesta (JSON):
{
  "analisis": "análisis breve",
  "recomendacion": "usar" o "no usar",
  "razones": ["razón 1", "razón 2", "razón 3"],
  "score": 75
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Intentar extraer JSON de la respuesta
      let analisisGemini: Partial<AnalisisGemini> = {
        combinacion,
        analisis: text,
        recomendacion: 'evaluar',
        razones: []
      };

      // Buscar JSON en la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          analisisGemini = {
            combinacion,
            analisis: parsed.analisis || text,
            recomendacion: parsed.recomendacion || 'evaluar',
            razones: parsed.razones || [],
            scoreIA: parsed.score
          };
        } catch (e) {
          // Si falla el parse, usar el texto completo
          analisisGemini.analisis = text;
        }
      }

      return analisisGemini as AnalisisGemini;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Detectar error de cuota
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 60;
        
        throw new Error(
          `Cuota de API excedida. Por favor espera ${Math.ceil(retrySeconds)} segundos antes de reintentar. ` +
          `Verifica tu cuota en: https://ai.dev/usage?tab=rate-limit`
        );
      }
      
      throw new Error(`Error al analizar con Gemini: ${errorMessage}`);
    }
  }

  /**
   * Analiza múltiples combinaciones
   */
  public async analizarCombinaciones(
    combinaciones: Combinacion[],
    contexto?: {
      analisisEstadistico?: AnalisisEstadistico;
      topNumeros?: NumeroQuini[];
      estadisticasRelevantes?: string;
    }
  ): Promise<AnalisisGemini[]> {
    const resultados: AnalisisGemini[] = [];

    for (const combinacion of combinaciones) {
      try {
        const analisis = await this.analizarCombinacion(combinacion, contexto);
        resultados.push(analisis);
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error analizando combinación ${combinacion.join(', ')}:`, error);
      }
    }

    return resultados;
  }

  /**
   * Genera insights generales sobre los datos históricos
   */
  public async generarInsights(
    analisisEstadistico: AnalisisEstadistico,
    topNumeros: NumeroQuini[]
  ): Promise<string> {
    const prompt = `Basándote en estos datos históricos de lotería (Quini 6, dominio 00-45):

- Total de sorteos: ${analisisEstadistico.periodo.totalSorteos}
- Período: ${analisisEstadistico.periodo.fechaInicio.toLocaleDateString()} - ${analisisEstadistico.periodo.fechaFin.toLocaleDateString()}
- Media de frecuencias: ${analisisEstadistico.media.toFixed(2)}
- Desviación estándar: ${analisisEstadistico.desviacionEstandar.toFixed(2)}
- Números con mayor presión: ${topNumeros.map(n => n.toString().padStart(2, '0')).join(', ')}

Genera insights breves (máximo 200 palabras) sobre:
1. Patrones observables
2. Recomendaciones generales
3. Factores a considerar para próximas combinaciones

Sé conciso y basado en datos estadísticos.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Detectar error de cuota
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 60;
        
        throw new Error(
          `Cuota de API excedida. Por favor espera ${Math.ceil(retrySeconds)} segundos antes de reintentar. ` +
          `Verifica tu cuota en: https://ai.dev/usage?tab=rate-limit`
        );
      }
      
      throw new Error(`Error generando insights: ${errorMessage}`);
    }
  }

  /**
   * Compara dos combinaciones y recomienda la mejor
   */
  public async compararCombinaciones(
    combinacion1: Combinacion,
    combinacion2: Combinacion,
    contexto?: {
      analisisEstadistico?: AnalisisEstadistico;
    }
  ): Promise<{
    ganadora: 'combinacion1' | 'combinacion2' | 'empate';
    razon: string;
    diferencia: string;
  }> {
    const prompt = `Compara estas dos combinaciones de lotería:

Combinación 1: ${combinacion1.map(n => n.toString().padStart(2, '0')).join(', ')} (Suma: ${combinacion1.reduce((a, b) => a + b, 0)})
Combinación 2: ${combinacion2.map(n => n.toString().padStart(2, '0')).join(', ')} (Suma: ${combinacion2.reduce((a, b) => a + b, 0)})

${contexto?.analisisEstadistico ? `Contexto: ${contexto.analisisEstadistico.periodo.totalSorteos} sorteos analizados` : ''}

Indica cuál combinación es mejor y por qué (máximo 100 palabras).
Formato JSON:
{
  "ganadora": "combinacion1" o "combinacion2" o "empate",
  "razon": "razón breve",
  "diferencia": "diferencia principal"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          return {
            ganadora: 'empate' as const,
            razon: text,
            diferencia: 'No se pudo determinar'
          };
        }
      }

      return {
        ganadora: 'empate' as const,
        razon: text,
        diferencia: 'Análisis no estructurado'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Detectar error de cuota
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Quota')) {
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 60;
        
        throw new Error(
          `Cuota de API excedida. Por favor espera ${Math.ceil(retrySeconds)} segundos antes de reintentar. ` +
          `Verifica tu cuota en: https://ai.dev/usage?tab=rate-limit`
        );
      }
      
      throw new Error(`Error comparando combinaciones: ${errorMessage}`);
    }
  }
}

