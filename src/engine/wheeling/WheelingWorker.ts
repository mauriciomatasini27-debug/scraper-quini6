/**
 * Wheeling Worker - Worker Thread para generación de combinaciones
 * 
 * Este archivo contiene la lógica de generación de combinaciones que se ejecuta
 * en un worker thread para procesamiento paralelo cuando hay grandes volúmenes.
 * 
 * Para TypeScript: Este archivo se ejecuta con ts-node/register cuando se usa en desarrollo
 */

import { parentPort, workerData } from 'worker_threads';
import { NumeroQuini, Combinacion } from '../types';

/**
 * Mensaje de entrada del worker
 */
interface WorkerTask {
  tipo: 'generarCobertura' | 'generarHeuristica';
  numerosBase: NumeroQuini[];
  aciertosRequeridos?: number;
  maxCombinaciones?: number;
}

/**
 * Mensaje de salida del worker
 */
interface WorkerResult {
  tipo: 'generarCobertura' | 'generarHeuristica';
  combinaciones: Combinacion[];
  error?: string;
}

/**
 * Genera todas las combinaciones de k elementos de un array
 */
function combinaciones<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr];

  const resultado: T[][] = [];

  for (let i = 0; i <= arr.length - k; i++) {
    const primero = arr[i];
    const resto = arr.slice(i + 1);
    const combinacionesResto = combinaciones(resto, k - 1);

    for (const comb of combinacionesResto) {
      resultado.push([primero, ...comb]);
    }
  }

  return resultado;
}

/**
 * Verifica si todos los elementos de subconjunto están en conjunto
 */
function estaContenida<T>(subconjunto: T[], conjunto: T[]): boolean {
  const conjuntoSet = new Set(conjunto);
  return subconjunto.every(elem => conjuntoSet.has(elem));
}

/**
 * Cuenta cuántas combinaciones objetivo cubre una combinación dada
 */
function contarCobertura(
  combinacion: NumeroQuini[],
  combinacionesObjetivo: NumeroQuini[][],
  yaCubiertas: Set<string>
): number {
  let contador = 0;

  for (const objetivo of combinacionesObjetivo) {
    const objetivoKey = JSON.stringify(objetivo.sort((a, b) => a - b));
    
    if (!yaCubiertas.has(objetivoKey) && estaContenida(objetivo, combinacion)) {
      contador++;
    }
  }

  return contador;
}

/**
 * Genera cobertura mínima usando algoritmo greedy
 */
function generarCoberturaMinima(
  numerosBase: NumeroQuini[],
  aciertosRequeridos: number
): Combinacion[] {
  // Generar todas las combinaciones de 'aciertosRequeridos' números del set
  const combinacionesObjetivo = combinaciones(numerosBase, aciertosRequeridos);
  
  const combinacionesGeneradas: Combinacion[] = [];
  const combinacionesCubiertas = new Set<string>();

  // Generar todas las combinaciones posibles de 6 números del set
  const todasCombinaciones = combinaciones(numerosBase, 6);

  // Algoritmo greedy: mientras haya combinaciones sin cubrir
  while (combinacionesCubiertas.size < combinacionesObjetivo.length) {
    let mejorCombinacion: NumeroQuini[] | null = null;
    let maxCobertura = 0;

    // Procesar todas las combinaciones para encontrar la mejor
    for (const combinacion of todasCombinaciones) {
      const cobertura = contarCobertura(
        combinacion,
        combinacionesObjetivo,
        combinacionesCubiertas
      );

      if (cobertura > maxCobertura) {
        maxCobertura = cobertura;
        mejorCombinacion = combinacion;
      }
    }

    if (mejorCombinacion) {
      // Agregar la mejor combinación
      const combinacionOrdenada = [...mejorCombinacion].sort((a, b) => a - b) as Combinacion;
      combinacionesGeneradas.push(combinacionOrdenada);

      // Marcar las combinaciones objetivo que ahora están cubiertas
      for (const objetivo of combinacionesObjetivo) {
        if (estaContenida(objetivo, mejorCombinacion)) {
          combinacionesCubiertas.add(JSON.stringify(objetivo.sort((a, b) => a - b)));
        }
      }
    } else {
      break; // No se puede mejorar más
    }
  }

  return combinacionesGeneradas;
}

/**
 * Genera cobertura usando heurística para sets grandes
 */
function generarCoberturaHeuristica(
  numerosBase: NumeroQuini[],
  maxCombinaciones: number
): Combinacion[] {
  const combinaciones: Combinacion[] = [];
  const numerosOrdenados = [...numerosBase].sort((a, b) => a - b);

  // Estrategia: Distribuir los números de manera balanceada
  for (let i = 0; i < maxCombinaciones && combinaciones.length < maxCombinaciones; i++) {
    const combinacion: NumeroQuini[] = [];
    const numerosUsados = new Set<NumeroQuini>();

    // Seleccionar números de manera distribuida
    const paso = Math.max(1, Math.floor(numerosOrdenados.length / 6));
    
    for (let j = 0; j < 6 && combinacion.length < 6; j++) {
      const indice = (i * paso + j) % numerosOrdenados.length;
      const numero = numerosOrdenados[indice];
      
      if (!numerosUsados.has(numero)) {
        combinacion.push(numero);
        numerosUsados.add(numero);
      }
    }

    // Completar si faltan números
    if (combinacion.length < 6) {
      for (const num of numerosOrdenados) {
        if (!numerosUsados.has(num) && combinacion.length < 6) {
          combinacion.push(num);
          numerosUsados.add(num);
        }
      }
    }

    if (combinacion.length === 6) {
      combinacion.sort((a, b) => a - b);
      combinaciones.push(combinacion as Combinacion);
    }
  }

  return combinaciones.slice(0, maxCombinaciones);
}

/**
 * Procesa la tarea recibida del thread principal
 */
function procesarTarea(task: WorkerTask): WorkerResult {
  try {
    if (task.tipo === 'generarCobertura') {
      if (task.aciertosRequeridos === undefined) {
        throw new Error('aciertosRequeridos es requerido para generarCobertura');
      }
      
      const combinaciones = generarCoberturaMinima(task.numerosBase, task.aciertosRequeridos);
      
      return {
        tipo: 'generarCobertura',
        combinaciones
      };
    } else if (task.tipo === 'generarHeuristica') {
      if (task.maxCombinaciones === undefined) {
        throw new Error('maxCombinaciones es requerido para generarHeuristica');
      }
      
      const combinaciones = generarCoberturaHeuristica(task.numerosBase, task.maxCombinaciones);
      
      return {
        tipo: 'generarHeuristica',
        combinaciones
      };
    } else {
      throw new Error(`Tipo de tarea desconocido: ${(task as any).tipo}`);
    }
  } catch (error) {
    return {
      tipo: task.tipo,
      combinaciones: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Escuchar mensajes del thread principal
if (parentPort) {
  // Si se pasa data al inicializar el worker, procesarla inmediatamente
  if (workerData) {
    const resultado = procesarTarea(workerData as WorkerTask);
    parentPort.postMessage(resultado);
  } else {
    // Escuchar mensajes enviados después de la inicialización
    parentPort.on('message', (task: WorkerTask) => {
      const resultado = procesarTarea(task);
      parentPort?.postMessage(resultado);
    });
  }
} else {
  // Ejecución directa (no en worker) - solo para testing
  console.error('Este archivo debe ejecutarse en un worker thread');
  process.exit(1);
}

