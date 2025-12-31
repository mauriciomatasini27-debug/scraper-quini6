/**
 * Tipos e Interfaces para el Motor de Probabilidades
 * 
 * Este módulo define todas las estructuras de datos necesarias para el análisis
 * estadístico y la reducción del espacio de búsqueda en la Quiniela.
 */

/**
 * Representa un número extraído en un sorteo (1-46 para Quini 6)
 */
export type NumeroQuini = number;

/**
 * Representa una combinación de 6 números ordenados
 */
export type Combinacion = [NumeroQuini, NumeroQuini, NumeroQuini, NumeroQuini, NumeroQuini, NumeroQuini];

/**
 * Modalidades de sorteo disponibles
 */
export type ModalidadSorteo = 'tradicional' | 'segunda' | 'revancha' | 'siempreSale';

/**
 * Resultado normalizado de un sorteo para análisis estadístico
 */
export interface SorteoNormalizado {
  numeroSorteo: number;
  fecha: Date;
  fechaISO: string;
  modalidad: ModalidadSorteo;
  numeros: Combinacion;
  suma: number;
  paridad: {
    pares: number;
    impares: number;
  };
  espaciado: number[];
  amplitud?: number; // Rango de amplitud (diferencia entre máximo y mínimo)
}

/**
 * Estadísticas de frecuencia para un número específico
 */
export interface EstadisticaFrecuencia {
  numero: NumeroQuini;
  frecuencia: number;
  frecuenciaRelativa: number; // Probabilidad empírica
  ultimaAparicion: Date | null;
  atraso: number; // Sorteos desde última aparición
  promedioAtraso: number;
  desviacionAtraso: number; // σ del atraso
  scoreProbabilidad?: number; // Score usando Distribución de Poisson
  lambda?: number; // Parámetro λ de Poisson
}

/**
 * Estadísticas de transición entre números (para Markov)
 */
export interface EstadisticaTransicion {
  desde: NumeroQuini;
  hacia: NumeroQuini;
  frecuencia: number;
  probabilidad: number; // P(hacia | desde)
}

/**
 * Matriz de transición de Markov
 * M[i][j] = probabilidad de que aparezca j dado que apareció i
 */
export type MatrizTransicion = Map<NumeroQuini, Map<NumeroQuini, number>>;

/**
 * Estadísticas de amplitud (rango) - Protocolo Lyra Fase 2
 * Amplitud = diferencia entre el número más alto y el más bajo
 * Históricamente, en dominio 00-45, la amplitud suele estar entre 32 y 43
 */
export interface EstadisticasAmplitud {
  media: number;
  desviacionEstandar: number;
  min: number;
  max: number;
  percentil25: number;
  percentil50: number; // Mediana
  percentil75: number;
}

/**
 * Resultado del análisis estadístico completo
 */
export interface AnalisisEstadistico {
  periodo: {
    fechaInicio: Date;
    fechaFin: Date;
    totalSorteos: number;
  };
  frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>;
  desviacionEstandar: number;
  media: number;
  mediasMoviles: {
    ventana5: number[];
    ventana10: number[];
    ventana20: number[];
  };
  matrizTransicion: MatrizTransicion;
  estadisticasAmplitud?: EstadisticasAmplitud;
}

/**
 * Filtros heurísticos para reducción del espacio de búsqueda
 */
export interface FiltrosHeuristicos {
  paridad?: {
    minPares?: number;
    maxPares?: number;
    minImpares?: number;
    maxImpares?: number;
  };
  suma?: {
    min?: number;
    max?: number;
    desviacionesEstandar?: number; // Filtro por campana de Gauss
  };
  espaciado?: {
    minDistancia?: number;
    maxDistancia?: number;
  };
  atraso?: {
    numerosConAtrasoAlto?: NumeroQuini[]; // Números con atraso > σ
    umbralAtraso?: number;
  };
  entropia?: {
    umbralMinimo?: number; // Entropía mínima normalizada (0-1)
    umbralMaximo?: number; // Entropía máxima normalizada (0-1)
  };
  amplitud?: {
    min?: number; // Amplitud mínima (diferencia max-min)
    max?: number; // Amplitud máxima
  };
}

/**
 * Resultado de la aplicación de filtros
 */
export interface ResultadoFiltrado {
  combinacionesValidas: Combinacion[];
  combinacionesFiltradas: number;
  porcentajeReduccion: number;
  criteriosAplicados: string[];
}

/**
 * Configuración del motor de probabilidades
 */
export interface ConfiguracionMotor {
  modalidad: ModalidadSorteo;
  rangoNumeros: {
    min: NumeroQuini;
    max: NumeroQuini;
  };
  ventanasMediaMovil: number[];
  umbralDesviacion: number; // Para identificar anomalías
  habilitarFiltros: {
    paridad: boolean;
    suma: boolean;
    espaciado: boolean;
    atraso: boolean;
  };
}

/**
 * Resultado completo del análisis del motor
 */
export interface ResultadoAnalisis {
  analisis: AnalisisEstadistico;
  filtros: FiltrosHeuristicos;
  resultadoFiltrado: ResultadoFiltrado;
  anomalias: {
    numerosConAtrasoAlto: NumeroQuini[];
    combinacionesAtipicas: SorteoNormalizado[];
    desviacionesSignificativas: Array<{
      numero: NumeroQuini;
      desviacion: number;
    }>;
  };
  timestamp: Date;
}

