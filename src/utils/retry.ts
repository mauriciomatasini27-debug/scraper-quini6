/**
 * Utilidad para retry con backoff exponencial
 * 
 * Implementa un sistema robusto de reintentos para operaciones que pueden fallar
 * por problemas de red, timeout, o errores temporales.
 */

export interface RetryOptions {
  maxRetries?: number; // Número máximo de reintentos (default: 3)
  initialDelay?: number; // Delay inicial en ms (default: 1000)
  maxDelay?: number; // Delay máximo en ms (default: 30000)
  factor?: number; // Factor de multiplicación para backoff exponencial (default: 2)
  retryableErrors?: Array<number | string>; // Códigos de error o mensajes que justifican retry
  onRetry?: (attempt: number, error: Error) => void; // Callback opcional para logging
}

/**
 * Ejecuta una función con retry y backoff exponencial
 * 
 * @param fn Función async a ejecutar
 * @param options Opciones de retry
 * @returns Resultado de la función
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    retryableErrors = [],
    onRetry
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Verificar si el error es retryable
      const shouldRetry = shouldRetryError(lastError, retryableErrors);
      if (!shouldRetry) {
        throw lastError;
      }

      // Callback de retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Esperar antes del siguiente intento (backoff exponencial)
      await sleep(delay);
      
      // Calcular el siguiente delay con backoff exponencial
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  // Esto no debería ejecutarse, pero por seguridad
  throw lastError || new Error('Error desconocido en retry');
}

/**
 * Verifica si un error es retryable basado en los códigos/mensajes especificados
 */
function shouldRetryError(error: Error, retryableErrors: Array<number | string>): boolean {
  if (retryableErrors.length === 0) {
    // Si no se especifican errores retryable, retry por defecto
    return true;
  }

  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  // Verificar códigos de estado HTTP comunes
  const httpStatusMatch = errorMessage.match(/(\d{3})/);
  if (httpStatusMatch) {
    const statusCode = parseInt(httpStatusMatch[1], 10);
    if (retryableErrors.some(e => typeof e === 'number' && e === statusCode)) {
      return true;
    }
    
    // Retry automático para errores 5xx y 429 (rate limit)
    if (statusCode >= 500 || statusCode === 429 || statusCode === 408) {
      return true;
    }
  }

  // Verificar mensajes de error
  for (const retryable of retryableErrors) {
    if (typeof retryable === 'string') {
      if (errorMessage.includes(retryable.toLowerCase()) || 
          errorStack.includes(retryable.toLowerCase())) {
        return true;
      }
    }
  }

  // Retry automático para errores de red comunes
  const networkErrors = [
    'network',
    'timeout',
    'econnreset',
    'enotfound',
    'econnrefused',
    'etimedout',
    'eai_again'
  ];
  
  for (const networkError of networkErrors) {
    if (errorMessage.includes(networkError) || errorStack.includes(networkError)) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Configuración predefinida para retry de APIs
 */
export const RetryConfig = {
  groq: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    retryableErrors: [429, 500, 502, 503, 504, 'timeout', 'network']
  },
  supabase: {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    factor: 2,
    retryableErrors: [500, 502, 503, 504, 'network', 'timeout']
  }
};

