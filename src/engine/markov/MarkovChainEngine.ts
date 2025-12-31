/**
 * Módulo Markov Chain Engine
 * 
 * Implementa cadenas de Markov para calcular probabilidades de transición
 * entre números. La matriz de transición M[i][j] representa la probabilidad
 * de que aparezca el número j dado que apareció el número i.
 */

import {
  SorteoNormalizado,
  MatrizTransicion,
  EstadisticaTransicion,
  NumeroQuini
} from '../types';

/**
 * Clase principal para el motor de cadenas de Markov
 */
export class MarkovChainEngine {
  private matrizTransicion: MatrizTransicion = new Map();
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;

  /**
   * Construye la matriz de transición desde los datos históricos
   */
  public construirMatrizTransicion(sorteos: SorteoNormalizado[]): MatrizTransicion {
    // Inicializar matriz con ceros
    this.inicializarMatriz();

    // Contar transiciones
    const conteoTransiciones = new Map<NumeroQuini, Map<NumeroQuini, number>>();
    const conteoApariciones = new Map<NumeroQuini, number>();

    // Inicializar contadores
    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      conteoTransiciones.set(i, new Map());
      conteoApariciones.set(i, 0);
      
      for (let j = this.RANGO_MIN; j <= this.RANGO_MAX; j++) {
        conteoTransiciones.get(i)!.set(j, 0);
      }
    }

    // Procesar sorteos ordenados por fecha
    const sorteosOrdenados = [...sorteos].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    // Analizar transiciones dentro de cada sorteo y entre sorteos
    for (let idx = 0; idx < sorteosOrdenados.length; idx++) {
      const sorteo = sorteosOrdenados[idx];
      const numeros = sorteo.numeros;

      // Transiciones dentro del mismo sorteo (orden de aparición)
      for (let i = 0; i < numeros.length - 1; i++) {
        const desde = numeros[i];
        const hacia = numeros[i + 1];
        
        const conteo = conteoTransiciones.get(desde)!.get(hacia)!;
        conteoTransiciones.get(desde)!.set(hacia, conteo + 1);
        conteoApariciones.set(desde, (conteoApariciones.get(desde) || 0) + 1);
      }

      // Transiciones entre sorteos consecutivos (último número del sorteo anterior
      // al primer número del sorteo actual)
      if (idx > 0) {
        const sorteoAnterior = sorteosOrdenados[idx - 1];
        const ultimoNumeroAnterior = sorteoAnterior.numeros[sorteoAnterior.numeros.length - 1];
        const primerNumeroActual = numeros[0];
        
        const conteo = conteoTransiciones.get(ultimoNumeroAnterior)!.get(primerNumeroActual)!;
        conteoTransiciones.get(ultimoNumeroAnterior)!.set(primerNumeroActual, conteo + 1);
        conteoApariciones.set(
          ultimoNumeroAnterior,
          (conteoApariciones.get(ultimoNumeroAnterior) || 0) + 1
        );
      }
    }

    // Convertir conteos a probabilidades
    for (let desde = this.RANGO_MIN; desde <= this.RANGO_MAX; desde++) {
      const totalApariciones = conteoApariciones.get(desde) || 0;
      
      if (totalApariciones > 0) {
        for (let hacia = this.RANGO_MIN; hacia <= this.RANGO_MAX; hacia++) {
          const conteo = conteoTransiciones.get(desde)!.get(hacia)!;
          const probabilidad = conteo / totalApariciones;
          this.matrizTransicion.get(desde)!.set(hacia, probabilidad);
        }
      }
    }

    return this.matrizTransicion;
  }

  /**
   * Inicializa la matriz de transición con ceros
   */
  private inicializarMatriz(): void {
    this.matrizTransicion = new Map();

    for (let i = this.RANGO_MIN; i <= this.RANGO_MAX; i++) {
      const fila = new Map<NumeroQuini, number>();
      for (let j = this.RANGO_MIN; j <= this.RANGO_MAX; j++) {
        fila.set(j, 0);
      }
      this.matrizTransicion.set(i, fila);
    }
  }

  /**
   * Obtiene la probabilidad de transición de un número a otro
   */
  public obtenerProbabilidadTransicion(desde: NumeroQuini, hacia: NumeroQuini): number {
    return this.matrizTransicion.get(desde)?.get(hacia) || 0;
  }

  /**
   * Calcula la probabilidad de una combinación completa usando la cadena de Markov
   */
  public calcularProbabilidadCombinacion(combinacion: NumeroQuini[]): number {
    if (combinacion.length < 2) {
      return 0;
    }

    let probabilidad = 1;
    
    // Probabilidad inicial (frecuencia del primer número)
    // Por ahora usamos 1/46 como probabilidad inicial uniforme
    // En una implementación completa, usaríamos la frecuencia empírica
    
    // Multiplicar probabilidades de transición
    for (let i = 0; i < combinacion.length - 1; i++) {
      const desde = combinacion[i];
      const hacia = combinacion[i + 1];
      const probTransicion = this.obtenerProbabilidadTransicion(desde, hacia);
      probabilidad *= probTransicion;
    }

    return probabilidad;
  }

  /**
   * Obtiene los números más probables de aparecer después de un número dado
   */
  public obtenerSiguientesMasProbables(
    desde: NumeroQuini,
    cantidad: number = 10
  ): EstadisticaTransicion[] {
    const fila = this.matrizTransicion.get(desde);
    
    if (!fila) {
      return [];
    }

    const transiciones: EstadisticaTransicion[] = [];

    for (const [hacia, probabilidad] of fila.entries()) {
      // Contar frecuencia (aproximada desde probabilidad)
      // En una implementación completa, guardaríamos la frecuencia real
      transiciones.push({
        desde,
        hacia,
        frecuencia: 0, // Se calcularía desde los datos originales
        probabilidad
      });
    }

    // Ordenar por probabilidad descendente
    transiciones.sort((a, b) => b.probabilidad - a.probabilidad);

    return transiciones.slice(0, cantidad);
  }

  /**
   * Obtiene la matriz de transición completa
   */
  public obtenerMatriz(): MatrizTransicion {
    return this.matrizTransicion;
  }

  /**
   * Exporta estadísticas de transición en formato legible
   */
  public exportarEstadisticasTransicion(): EstadisticaTransicion[] {
    const estadisticas: EstadisticaTransicion[] = [];

    for (const [desde, fila] of this.matrizTransicion.entries()) {
      for (const [hacia, probabilidad] of fila.entries()) {
        if (probabilidad > 0) {
          estadisticas.push({
            desde,
            hacia,
            frecuencia: 0, // Se calcularía desde datos originales
            probabilidad
          });
        }
      }
    }

    return estadisticas;
  }
}

