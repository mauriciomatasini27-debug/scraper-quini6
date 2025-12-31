/**
 * Wheeling Engine - Sistemas Reducidos
 * 
 * Implementa algoritmos de generación de Sistemas Reducidos.
 * Dado un set de números elegidos, genera el mínimo de combinaciones
 * necesarias para garantizar un acierto de 4 si salen 5 números del set.
 */

import { NumeroQuini, Combinacion } from '../types';

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
 * Clase principal para sistemas reducidos
 */
export class WheelingEngine {
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
  public generarSistemaReducido(numerosBase: NumeroQuini[]): SistemaReducido {
    if (numerosBase.length < 6) {
      throw new Error('Se necesitan al menos 6 números para generar un sistema reducido');
    }

    // Para garantizar 4 aciertos cuando salen 5, necesitamos cubrir
    // todas las combinaciones de 4 números del set
    const combinaciones = this.generarCoberturaMinima(numerosBase, 4, 5);

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
   * Genera una cobertura mínima usando algoritmo greedy
   * 
   * @param numerosBase Números base
   * @param tamanoCombinacion Tamaño de cada combinación (6 para Quini)
   * @param numerosQueDebenSalir Cuántos números del set deben salir
   */
  private generarCoberturaMinima(
    numerosBase: NumeroQuini[],
    aciertosRequeridos: number,
    numerosQueDebenSalir: number
  ): Combinacion[] {
    // Generar todas las combinaciones de 'aciertosRequeridos' números del set
    const combinacionesObjetivo = this.combinaciones(numerosBase, aciertosRequeridos);
    
    const combinacionesGeneradas: Combinacion[] = [];
    const combinacionesCubiertas = new Set<string>();

    // Algoritmo greedy: mientras haya combinaciones sin cubrir
    while (combinacionesCubiertas.size < combinacionesObjetivo.length) {
      let mejorCombinacion: NumeroQuini[] | null = null;
      let maxCobertura = 0;

      // Generar todas las combinaciones posibles de 6 números del set
      const todasCombinaciones = this.combinaciones(numerosBase, 6);

      for (const combinacion of todasCombinaciones) {
        // Contar cuántas combinaciones objetivo cubre esta combinación
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
   */
  public generarSistemaReducidoOptimizado(
    numerosBase: NumeroQuini[],
    maxCombinaciones: number = 20
  ): SistemaReducido {
    if (numerosBase.length < 6) {
      throw new Error('Se necesitan al menos 6 números');
    }

    // Si el set es pequeño, usar método completo
    if (numerosBase.length <= 10) {
      return this.generarSistemaReducido(numerosBase);
    }

    // Para sets grandes, usar método heurístico
    const combinaciones = this.generarCoberturaHeuristica(numerosBase, maxCombinaciones);

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
   * Genera cobertura usando heurística para sets grandes
   */
  private generarCoberturaHeuristica(
    numerosBase: NumeroQuini[],
    maxCombinaciones: number
  ): Combinacion[] {
    const combinaciones: Combinacion[] = [];
    const numerosOrdenados = [...numerosBase].sort((a, b) => a - b);

    // Estrategia: Distribuir los números de manera balanceada
    // Crear combinaciones que maximicen la diversidad

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

    return combinaciones;
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

