/**
 * Tipos compartidos para el Frontend
 * Adaptados desde src/engine/types/index.ts para el cliente
 */

export type NumeroQuini = number;

export type Combinacion = [
  NumeroQuini,
  NumeroQuini,
  NumeroQuini,
  NumeroQuini,
  NumeroQuini,
  NumeroQuini
];

/**
 * Veredicto del Juez Final (AI Predictor) para el frontend
 */
export interface VeredictoJuezFinal {
  top3: Combinacion[];
  analisisTecnico: string;
  razones: string[];
  timestamp: string; // ISO string
}

/**
 * Predicción de IA desde Supabase
 */
export interface AIPrediction {
  id: number;
  fecha_sorteo: string;
  numero_sorteo: number | null;
  combinacion_1: number[];
  combinacion_2: number[];
  combinacion_3: number[];
  analisis_tecnico: string | null;
  razones: string[] | null;
  resultado_real: number[] | null;
  aciertos_combinacion_1: number;
  aciertos_combinacion_2: number;
  aciertos_combinacion_3: number;
  created_at: string;
  updated_at: string;
}

/**
 * Resultado histórico de Quini 6 desde Supabase
 */
export interface ResultadoQuini {
  id: number;
  sorteo_numero: number;
  fecha: string;
  fecha_texto: string | null;
  año: number;
  tradicional: number[];
  la_segunda: number[];
  revancha: number[];
  siempre_sale: number[];
  pozo_extra: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Estadísticas de frecuencia de números para el mapa de calor
 */
export interface FrecuenciaNumero {
  numero: NumeroQuini;
  frecuencia: number;
  frecuenciaRelativa: number;
}

