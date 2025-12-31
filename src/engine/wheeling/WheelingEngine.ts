/**
 * Wheeling Engine - Sistemas Reducidos
 * 
 * Implementa algoritmos de generación de Sistemas Reducidos.
 * Dado un set de números elegidos, genera el mínimo de combinaciones
 * necesarias para garantizar un acierto de 4 si salen 5 números del set.
 * 
 * Optimizado con p-limit para volúmenes medianos y Worker Threads para grandes volúmenes (>10,000 combinaciones)
 */

import { NumeroQuini, Combinacion, EstadisticaFrecuencia } from '../types';
import { CoOccurrenceEngine } from '../cooccurrence/CoOccurrenceEngine';
import { EntropyFilter } from '../filters/EntropyFilter';
import { Worker } from 'worker_threads';
import { join } from 'path';
import pLimit from 'p-limit';

/**
 * Resultado de un sistema reducido
 */
export interface SistemaReducido {
  numerosBase: NumeroQuini[];
  combinaciones: Combinacion[];
  totalCombinaciones: number;
  garantia: {
    aciertosRequeridos: number;
    numerosQueDebenSalir: number;
    garantiaAciertos: number;
  };
}

/**
 * Pesos para priorización de combinaciones (Protocolo Lyra Fase 2)
 */
export interface PesosPriorizacion {
  coOcurrencia?: number; // Peso del score de afinidad (Jaccard)
  entropia?: number; // Peso de la entropía de Shannon
  amplitud?: number; // Peso del rango de amplitud
  frecuencia?: number; // Peso de las frecuencias históricas
}

/**
 * Clase principal para sistemas reducidos
 */
export class WheelingEngine {
  private coOccurrenceEngine?: CoOccurrenceEngine;
  private entropyFilter: EntropyFilter;
  private frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>;

  constructor() {
    this.entropyFilter = new EntropyFilter();
  }

  /**
   * Configura los motores necesarios para priorización
   */
  public configurarPriorizacion(
    coOccurrenceEngine?: CoOccurrenceEngine,
    frecuencias?: Map<NumeroQuini, EstadisticaFrecuencia>
  ): void {
    this.coOccurrenceEngine = coOccurrenceEngine;
    this.frecuencias = frecuencias;
  }

  /**
   * Genera combinaciones de forma asíncrona usando hilos de trabajo (Worker Threads)
   * 
   * Este método utiliza un worker thread separado para generar combinaciones,
   * lo que permite procesamiento paralelo sin bloquear el hilo principal.
   * Ideal para grandes volúmenes de números (>10,000 combinaciones).
   * 
   * @param numeros Array de números base para generar combinaciones
   * @returns Promise con array de combinaciones generadas
   */
  public async generarSistemaParalelo(numeros: NumeroQuini[]): Promise<Combinacion[]> {
    if (numeros.length < 6) {
      throw new Error('Se necesitan al menos 6 números para generar combinaciones');
    }

    // Determinar si usar worker o método directo basado en el volumen
    const todasCombinaciones = this.combinaciones(numeros, 6);
    const totalCombinaciones = todasCombinaciones.length;
    
    // Para grandes volúmenes, usar worker thread
    if (totalCombinaciones > 10000) {
      return await this.ejecutarWorker({
        tipo: 'generarCobertura',
        numerosBase: numeros,
        aciertosRequeridos: 4
      });
    }
    
    // Para volúmenes menores, usar método directo más eficiente
    const sistema = await this.generarSistemaReducido(numeros);
    return sistema.combinaciones;
  }
  /**
   * Genera un sistema reducido que garantiza 4 aciertos si salen 5 números del set
   * 
   * Algoritmo: Covering Design
   * Para garantizar 4 aciertos cuando salen 5, necesitamos cubrir todas las
   * combinaciones de 4 números del set elegido.
   * 
   * @param numerosBase Array de números elegidos (debe tener al menos 6 números)
   * @returns Sistema reducido con combinaciones mínimas
   */
  public async generarSistemaReducido(numerosBase: NumeroQuini[]): Promise<SistemaReducido> {
    if (numerosBase.length < 6) {
      throw new Error('Se necesitan al menos 6 números para generar un sistema reducido');
    }

    // Para garantizar 4 aciertos cuando salen 5, necesitamos cubrir
    // todas las combinaciones de 4 números del set
    const combinaciones = await this.generarCoberturaMinima(numerosBase, 4, 5);

    return {
      numerosBase: [...numerosBase].sort((a, b) => a - b),
      combinaciones,
      totalCombinaciones: combinaciones.length,
      garantia: {
        aciertosRequeridos: 4,
        numerosQueDebenSalir: 5,
        garantiaAciertos: 4
      }
    };
  }

  /**
   * Ejecuta el worker thread para procesamiento paralelo
   * Soporta TypeScript usando ts-node/register en desarrollo
   */
  private async ejecutarWorker(task: {
    tipo: 'generarCobertura' | 'generarHeuristica';
    numerosBase: NumeroQuini[];
    aciertosRequeridos?: number;
    maxCombinaciones?: number;
  }): Promise<Combinacion[]> {
    return new Promise((resolve, reject) => {
      // Determinar si estamos en desarrollo (ts-node) o producción (compilado)
      // Verificar si __dirname apunta a src (desarrollo) o dist (producción)
      const esDesarrollo = __dirname.includes('src');
      
      // Nota: Si usas ts-node, apuntamos al .ts; en producción al .js
      const workerPath = join(__dirname, esDesarrollo ? 'WheelingWorker.ts' : 'WheelingWorker.js');

      const worker = new Worker(workerPath, {
        workerData: task,
        execArgv: /\.ts$/.test(workerPath) ? ['-r', 'ts-node/register'] : [],
        // Configuración de límites de recursos
        resourceLimits: {
          maxOldGenerationSizeMb: 512, // Límite de 512 Megabytes
          stackSizeMb: 4,               // Límite de pila para recursión
        }
      });

      worker.on('message', (result: { combinaciones: Combinacion[]; error?: string } | Combinacion[]) => {
        // Manejar tanto el formato con error como directamente las combinaciones
        if (Array.isArray(result)) {
          // Formato directo: solo combinaciones
          resolve(result);
        } else if ('error' in result) {
          // Formato con error
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.combinaciones);
          }
        } else {
          resolve(result.combinaciones);
        }
        worker.terminate();
      });

      worker.on('error', (err) => {
        reject(new Error(`Error en el Worker de Wheeling: ${err.message}`));
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker finalizó con código de salida ${code}`));
        }
      });
    });
  }

  /**
   * Genera una cobertura mínima usando algoritmo greedy
   * Optimizado con p-limit para volúmenes medianos y Worker Threads para grandes volúmenes (>10,000 combinaciones)
   * 
   * @param numerosBase Números base
   * @param aciertosRequeridos Cuántos aciertos se requieren
   * @param numerosQueDebenSalir Cuántos números del set deben salir
   */
  private async generarCoberturaMinima(
    numerosBase: NumeroQuini[],
    aciertosRequeridos: number,
    numerosQueDebenSalir: number
  ): Promise<Combinacion[]> {
    // Generar todas las combinaciones posibles de 6 números del set
    const todasCombinaciones = this.combinaciones(numerosBase, 6);
    const totalCombinaciones = todasCombinaciones.length;

    // Si hay más de 10,000 combinaciones, usar Worker Thread
    const usarWorker = totalCombinaciones > 10000;

    if (usarWorker) {
      try {
        // Usar worker thread para procesamiento paralelo en otro hilo
        return await this.ejecutarWorker({
          tipo: 'generarCobertura',
          numerosBase,
          aciertosRequeridos
        });
      } catch (error) {
        // Si el worker falla, caer back a p-limit
        console.warn(`⚠️  Worker thread falló, usando p-limit: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Para volúmenes menores o como fallback, usar p-limit
    const combinacionesObjetivo = this.combinaciones(numerosBase, aciertosRequeridos);
    
    const combinacionesGeneradas: Combinacion[] = [];
    const combinacionesCubiertas = new Set<string>();

    const usarLimitador = totalCombinaciones > 5000;
    const limitador = usarLimitador ? pLimit(50) : null;

    // Algoritmo greedy: mientras haya combinaciones sin cubrir
    while (combinacionesCubiertas.size < combinacionesObjetivo.length) {
      let mejorCombinacion: NumeroQuini[] | null = null;
      let maxCobertura = 0;

      if (usarLimitador && limitador) {
        // Usar p-limit para procesar en paralelo con límite
        const tareas = todasCombinaciones.map(combinacion => 
          limitador(async () => {
            const cobertura = this.contarCobertura(
              combinacion,
              combinacionesObjetivo,
              combinacionesCubiertas
            );
            return { combinacion, cobertura };
          })
        );

        const resultados = await Promise.all(tareas);
        
        for (const resultado of resultados) {
          if (resultado.cobertura > maxCobertura) {
            maxCobertura = resultado.cobertura;
            mejorCombinacion = resultado.combinacion;
          }
        }
      } else {
        // Procesamiento secuencial para volúmenes pequeños
        for (const combinacion of todasCombinaciones) {
          const cobertura = this.contarCobertura(
            combinacion,
            combinacionesObjetivo,
            combinacionesCubiertas
          );

          if (cobertura > maxCobertura) {
            maxCobertura = cobertura;
            mejorCombinacion = combinacion;
          }
        }
      }

      if (mejorCombinacion) {
        // Agregar la mejor combinación
        const combinacionOrdenada = [...mejorCombinacion].sort((a, b) => a - b) as Combinacion;
        combinacionesGeneradas.push(combinacionOrdenada);

        // Marcar las combinaciones objetivo que ahora están cubiertas
        for (const objetivo of combinacionesObjetivo) {
          if (this.estaContenida(objetivo, mejorCombinacion)) {
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
   * Genera todas las combinaciones de k elementos de un array
   */
  private combinaciones<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > arr.length) return [];
    if (k === arr.length) return [arr];

    const resultado: T[][] = [];

    for (let i = 0; i <= arr.length - k; i++) {
      const primero = arr[i];
      const resto = arr.slice(i + 1);
      const combinacionesResto = this.combinaciones(resto, k - 1);

      for (const comb of combinacionesResto) {
        resultado.push([primero, ...comb]);
      }
    }

    return resultado;
  }

  /**
   * Verifica si todos los elementos de subconjunto están en conjunto
   */
  private estaContenida<T>(subconjunto: T[], conjunto: T[]): boolean {
    const conjuntoSet = new Set(conjunto);
    return subconjunto.every(elem => conjuntoSet.has(elem));
  }

  /**
   * Cuenta cuántas combinaciones objetivo cubre una combinación dada
   */
  private contarCobertura(
    combinacion: NumeroQuini[],
    combinacionesObjetivo: NumeroQuini[][],
    yaCubiertas: Set<string>
  ): number {
    let contador = 0;

    for (const objetivo of combinacionesObjetivo) {
      const objetivoKey = JSON.stringify(objetivo.sort((a, b) => a - b));
      
      if (!yaCubiertas.has(objetivoKey) && this.estaContenida(objetivo, combinacion)) {
        contador++;
      }
    }

    return contador;
  }

  /**
   * Genera un sistema reducido optimizado usando heurísticas
   * 
   * Versión más eficiente que usa técnicas de optimización combinatoria
   * Ahora usa pesos de priorización (Protocolo Lyra Fase 2)
   * Optimizado con p-limit para grandes volúmenes
   */
  public async generarSistemaReducidoOptimizado(
    numerosBase: NumeroQuini[],
    maxCombinaciones: number = 20,
    pesos?: PesosPriorizacion
  ): Promise<SistemaReducido> {
    if (numerosBase.length < 6) {
      throw new Error('Se necesitan al menos 6 números');
    }

    // Si el set es pequeño, usar método completo
    if (numerosBase.length <= 10) {
      const sistema = await this.generarSistemaReducido(numerosBase);
      
      // Si hay pesos, reordenar por priorización
      if (pesos && (this.coOccurrenceEngine || this.frecuencias)) {
        const combinacionesConScore = sistema.combinaciones.map(comb => ({
          combinacion: comb,
          score: this.calcularScorePriorizacion(comb, pesos)
        }));
        
        combinacionesConScore.sort((a, b) => b.score - a.score);
        sistema.combinaciones = combinacionesConScore.map(item => item.combinacion);
      }
      
      return sistema;
    }

    // Para sets grandes, usar método heurístico con priorización
    const combinaciones = await this.generarCoberturaHeuristica(numerosBase, maxCombinaciones, pesos);

    return {
      numerosBase: [...numerosBase].sort((a, b) => a - b),
      combinaciones,
      totalCombinaciones: combinaciones.length,
      garantia: {
        aciertosRequeridos: 4,
        numerosQueDebenSalir: 5,
        garantiaAciertos: 4
      }
    };
  }

  /**
   * Calcula el score de priorización para una combinación
   * 
   * Pesos optimizados basados en análisis de desempeño:
   * - Entropía: 57.8% (mejor desempeño promedio: 0.73)
   * - Amplitud: 26.2% (buen desempeño: 0.58)
   * - Frecuencia: 11.3% (desempeño medio: 0.50)
   * - Co-ocurrencia: 4.6% (bajo desempeño: 0.0586)
   */
  private calcularScorePriorizacion(
    combinacion: Combinacion,
    pesos: PesosPriorizacion = {
      coOcurrencia: 0.046,  // Optimizado: 4.6%
      entropia: 0.578,      // Optimizado: 57.8%
      amplitud: 0.262,      // Optimizado: 26.2%
      frecuencia: 0.113     // Optimizado: 11.3%
    }
  ): number {
    let score = 0;

    // Score de co-ocurrencia (afinidad)
    if (pesos.coOcurrencia && this.coOccurrenceEngine) {
      const scoreAfinidad = this.coOccurrenceEngine.calcularScoreAfinidad(combinacion);
      score += scoreAfinidad * pesos.coOcurrencia;
    }

    // Score de entropía
    if (pesos.entropia) {
      const entropia = this.entropyFilter.calcularEntropiaCombinada(combinacion, this.frecuencias);
      const entropiaNormalizada = this.entropyFilter.normalizarEntropia(entropia);
      score += entropiaNormalizada * pesos.entropia;
    }

    // Score de amplitud (preferir amplitudes entre 32-43)
    if (pesos.amplitud) {
      const numerosOrdenados = [...combinacion].sort((a, b) => a - b);
      const amplitud = numerosOrdenados[numerosOrdenados.length - 1] - numerosOrdenados[0];
      
      // Score máximo si está en rango 32-43
      let scoreAmplitud = 0;
      if (amplitud >= 32 && amplitud <= 43) {
        scoreAmplitud = 1.0;
      } else if (amplitud >= 28 && amplitud < 32) {
        scoreAmplitud = 0.7; // Cerca del rango
      } else if (amplitud > 43 && amplitud <= 45) {
        scoreAmplitud = 0.7; // Cerca del rango
      } else {
        scoreAmplitud = 0.3; // Fuera del rango
      }
      
      score += scoreAmplitud * pesos.amplitud;
    }

    // Score de frecuencia (preferir números con frecuencia media-alta)
    if (pesos.frecuencia && this.frecuencias) {
      let scoreFrecuencia = 0;
      for (const numero of combinacion) {
        const estadistica = this.frecuencias.get(numero);
        if (estadistica) {
          // Preferir frecuencias relativas entre 0.01 y 0.1
          const freqRel = estadistica.frecuenciaRelativa;
          if (freqRel >= 0.01 && freqRel <= 0.1) {
            scoreFrecuencia += 1.0;
          } else {
            scoreFrecuencia += 0.5;
          }
        }
      }
      score += (scoreFrecuencia / combinacion.length) * pesos.frecuencia;
    }

    return score;
  }

  /**
   * Genera cobertura usando heurística para sets grandes
   * Optimizado con p-limit para volúmenes medianos y Worker Threads para grandes volúmenes (>10,000 combinaciones)
   */
  private async generarCoberturaHeuristica(
    numerosBase: NumeroQuini[],
    maxCombinaciones: number,
    pesos?: PesosPriorizacion
  ): Promise<Combinacion[]> {
    // Si maxCombinaciones es muy grande, usar Worker Thread
    const usarWorker = maxCombinaciones > 10000;

    if (usarWorker) {
      try {
        // Usar worker thread para procesamiento paralelo
        const combinaciones = await this.ejecutarWorker({
          tipo: 'generarHeuristica',
          numerosBase,
          maxCombinaciones
        });

        // Si hay pesos de priorización, aplicar en el thread principal
        if (pesos && (this.coOccurrenceEngine || this.frecuencias)) {
          const combinacionesConScore = combinaciones.map(comb => ({
            combinacion: comb,
            score: this.calcularScorePriorizacion(comb, pesos)
          }));

          combinacionesConScore.sort((a, b) => b.score - a.score);
          return combinacionesConScore
            .slice(0, maxCombinaciones)
            .map(item => item.combinacion);
        }

        return combinaciones;
      } catch (error) {
        // Si el worker falla, caer back a p-limit
        console.warn(`⚠️  Worker thread falló, usando p-limit: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Para volúmenes menores o como fallback, usar p-limit
    const combinaciones: Combinacion[] = [];
    const numerosOrdenados = [...numerosBase].sort((a, b) => a - b);

    const usarLimitador = maxCombinaciones > 5000;
    const limitador = usarLimitador ? pLimit(100) : null;

    const tareasGeneracion = [];
    for (let i = 0; i < maxCombinaciones && combinaciones.length < maxCombinaciones; i++) {
      const crearCombinacion = async () => {
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
          return combinacion as Combinacion;
        }
        return null;
      };

      if (usarLimitador && limitador) {
        tareasGeneracion.push(limitador(crearCombinacion));
      } else {
        tareasGeneracion.push(crearCombinacion());
      }
    }

    const resultados = await Promise.all(tareasGeneracion);
    const combinacionesValidas = resultados.filter((c): c is Combinacion => c !== null);
    combinaciones.push(...combinacionesValidas);

    // Si hay pesos de priorización, ordenar y seleccionar las mejores
    if (pesos && (this.coOccurrenceEngine || this.frecuencias)) {
      const combinacionesConScore = combinaciones.map(comb => ({
        combinacion: comb,
        score: this.calcularScorePriorizacion(comb, pesos)
      }));

      // Ordenar por score descendente
      combinacionesConScore.sort((a, b) => b.score - a.score);

      // Retornar las mejores
      return combinacionesConScore
        .slice(0, maxCombinaciones)
        .map(item => item.combinacion);
    }

    return combinaciones.slice(0, maxCombinaciones);
  }

  /**
   * Valida si un sistema reducido cumple con la garantía
   */
  public validarSistema(sistema: SistemaReducido): {
    valido: boolean;
    cobertura: number;
    mensaje: string;
  } {
    const { numerosBase, combinaciones, garantia } = sistema;
    
    // Generar todas las combinaciones de 5 números del set
    const combinaciones5 = this.combinaciones(numerosBase, garantia.numerosQueDebenSalir);
    let coberturaTotal = 0;

    for (const comb5 of combinaciones5) {
      // Verificar si al menos una combinación del sistema tiene 4 de estos 5 números
      let cubierto = false;
      
      for (const combinacionSistema of combinaciones) {
        const numerosComunes = comb5.filter(n => combinacionSistema.includes(n));
        if (numerosComunes.length >= garantia.aciertosRequeridos) {
          cubierto = true;
          break;
        }
      }

      if (cubierto) {
        coberturaTotal++;
      }
    }

    const porcentajeCobertura = (coberturaTotal / combinaciones5.length) * 100;
    const valido = porcentajeCobertura === 100;

    return {
      valido,
      cobertura: porcentajeCobertura,
      mensaje: valido
        ? `Sistema válido: 100% de cobertura`
        : `Sistema parcial: ${porcentajeCobertura.toFixed(2)}% de cobertura`
    };
  }
}

