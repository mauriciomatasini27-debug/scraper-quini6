/**
 * Utilidades para Distribución de Poisson
 * 
 * Calcula probabilidades usando la distribución de Poisson para modelar
 * la ocurrencia de eventos (aparición de números) en intervalos de tiempo.
 */

/**
 * Calcula el factorial de un número
 */
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Evitar overflow
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Calcula la probabilidad de Poisson
 * P(X = k) = (λ^k * e^(-λ)) / k!
 * 
 * @param lambda Tasa promedio de ocurrencia (λ)
 * @param k Número de ocurrencias
 */
export function probabilidadPoisson(lambda: number, k: number): number {
  if (lambda < 0 || k < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  
  const exponente = -lambda;
  const potencia = Math.pow(lambda, k);
  const factorialK = factorial(k);
  
  return (potencia * Math.exp(exponente)) / factorialK;
}

/**
 * Calcula la probabilidad acumulada de Poisson
 * P(X <= k) = Σ(i=0 to k) P(X = i)
 * 
 * @param lambda Tasa promedio de ocurrencia
 * @param k Número máximo de ocurrencias
 */
export function probabilidadPoissonAcumulada(lambda: number, k: number): number {
  let probabilidad = 0;
  
  for (let i = 0; i <= k; i++) {
    probabilidad += probabilidadPoisson(lambda, i);
  }
  
  return probabilidad;
}

/**
 * Calcula la probabilidad de que ocurran al menos k eventos
 * P(X >= k) = 1 - P(X < k) = 1 - P(X <= k-1)
 */
export function probabilidadPoissonAlMenos(lambda: number, k: number): number {
  if (k === 0) return 1;
  return 1 - probabilidadPoissonAcumulada(lambda, k - 1);
}

/**
 * Calcula el lambda (tasa promedio) para un número específico
 * basado en su frecuencia histórica y el intervalo actual
 * 
 * @param frecuenciaHistorica Frecuencia total del número
 * @param totalSorteos Total de sorteos históricos
 * @param sorteosEnIntervalo Sorteos en el intervalo actual (últimos N sorteos)
 */
export function calcularLambda(
  frecuenciaHistorica: number,
  totalSorteos: number,
  sorteosEnIntervalo: number
): number {
  if (totalSorteos === 0) return 0;
  
  // Probabilidad histórica del número
  const probabilidadHistorica = frecuenciaHistorica / totalSorteos;
  
  // Lambda para el intervalo actual (esperanza de ocurrencias)
  return probabilidadHistorica * sorteosEnIntervalo;
}

/**
 * Calcula el Score de Probabilidad usando Poisson
 * Score = P(X >= 1) en el intervalo actual
 * 
 * @param frecuenciaHistorica Frecuencia histórica del número
 * @param totalSorteos Total de sorteos históricos
 * @param sorteosEnIntervalo Sorteos en el intervalo actual
 */
export function calcularScoreProbabilidad(
  frecuenciaHistorica: number,
  totalSorteos: number,
  sorteosEnIntervalo: number
): number {
  const lambda = calcularLambda(frecuenciaHistorica, totalSorteos, sorteosEnIntervalo);
  
  // Probabilidad de que aparezca al menos una vez en el intervalo
  return probabilidadPoissonAlMenos(lambda, 1);
}

