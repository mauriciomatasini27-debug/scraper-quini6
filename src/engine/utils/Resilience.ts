/**
 * Utilidad para reintentos con Backoff Exponencial
 * 
 * Esta función envolverá cualquier llamada asíncrona.
 * Si falla, esperará un tiempo que aumenta exponencialmente antes de reintentar.
 */

/**
 * Ejecuta una función asíncrona con reintentos y backoff exponencial
 * 
 * @param fn Función asíncrona a ejecutar
 * @param maxRetries Número máximo de reintentos (default: 3)
 * @param baseDelay Tiempo base de espera en milisegundos (default: 1000ms = 1 segundo)
 * @returns Promise con el resultado de la función
 * @throws Lanza el último error si todos los intentos fallan
 * 
 * @example
 * ```typescript
 * const resultado = await withRetry(
 *   async () => await algunaOperacion(),
 *   3,  // 3 reintentos
 *   1000 // 1 segundo base
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000 // 1 segundo
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s...
      console.warn(`⚠️  Intento ${attempt + 1} fallido. Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

