/**
 * Test de Chi-Cuadrado
 * 
 * Valida si el dataset tiene sesgos estadísticamente significativos.
 * H0: Los números se distribuyen uniformemente (sin sesgo)
 * H1: Los números NO se distribuyen uniformemente (hay sesgo)
 * 
 * P-Value < 0.05 indica sesgo estadísticamente significativo
 */

import { SorteoNormalizado, NumeroQuini } from '../types';

/**
 * Resultado del test de Chi-Cuadrado
 */
export interface ResultadoChiCuadrado {
  estadisticoChiCuadrado: number;
  gradosLibertad: number;
  pValue: number;
  haySesgo: boolean; // true si pValue < 0.05
  numerosConSesgo: Array<{
    numero: NumeroQuini;
    frecuenciaObservada: number;
    frecuenciaEsperada: number;
    contribucion: number;
  }>;
  interpretacion: string;
}

/**
 * Clase para realizar test de Chi-Cuadrado
 */
export class ChiSquareTest {
  private readonly RANGO_MIN = 0;
  private readonly RANGO_MAX = 45;
  private readonly TOTAL_NUMEROS = 46;

  /**
   * Realiza el test de Chi-Cuadrado sobre los sorteos
   * 
   * @param sorteos Array de sorteos normalizados
   * @param nivelSignificancia Nivel de significancia (default: 0.05)
   */
  public realizarTest(
    sorteos: SorteoNormalizado[],
    nivelSignificancia: number = 0.05
  ): ResultadoChiCuadrado {
    if (sorteos.length === 0) {
      throw new Error('No hay sorteos para analizar');
    }

    // Contar frecuencias observadas
    const frecuenciasObservadas = new Map<NumeroQuini, number>();
    
    // Inicializar contadores
    for (let num = this.RANGO_MIN; num <= this.RANGO_MAX; num++) {
      frecuenciasObservadas.set(num, 0);
    }

    // Contar apariciones
    let totalApariciones = 0;
    for (const sorteo of sorteos) {
      for (const numero of sorteo.numeros) {
        if (numero >= this.RANGO_MIN && numero <= this.RANGO_MAX) {
          frecuenciasObservadas.set(
            numero,
            (frecuenciasObservadas.get(numero) || 0) + 1
          );
          totalApariciones++;
        }
      }
    }

    // Calcular frecuencia esperada (distribución uniforme)
    // Cada número debería aparecer: (totalApariciones / 46)
    const frecuenciaEsperada = totalApariciones / this.TOTAL_NUMEROS;

    // Calcular estadístico Chi-Cuadrado
    // χ² = Σ((O - E)² / E)
    let estadisticoChiCuadrado = 0;
    const numerosConSesgo: ResultadoChiCuadrado['numerosConSesgo'] = [];

    for (let num = this.RANGO_MIN; num <= this.RANGO_MAX; num++) {
      const observada = frecuenciasObservadas.get(num) || 0;
      const esperada = frecuenciaEsperada;
      const diferencia = observada - esperada;
      const contribucion = (diferencia * diferencia) / esperada;
      
      estadisticoChiCuadrado += contribucion;

      // Guardar contribuciones significativas
      if (Math.abs(diferencia) > frecuenciaEsperada * 0.2) {
        numerosConSesgo.push({
          numero: num,
          frecuenciaObservada: observada,
          frecuenciaEsperada: esperada,
          contribucion
        });
      }
    }

    // Grados de libertad = número de categorías - 1 = 46 - 1 = 45
    const gradosLibertad = this.TOTAL_NUMEROS - 1;

    // Calcular P-Value usando aproximación
    const pValue = this.calcularPValue(estadisticoChiCuadrado, gradosLibertad);

    const haySesgo = pValue < nivelSignificancia;

    let interpretacion = '';
    if (haySesgo) {
      interpretacion = `Se detectó sesgo estadísticamente significativo (p = ${pValue.toFixed(4)} < ${nivelSignificancia}). `;
      interpretacion += `Los números NO se distribuyen uniformemente.`;
    } else {
      interpretacion = `No se detectó sesgo estadísticamente significativo (p = ${pValue.toFixed(4)} >= ${nivelSignificancia}). `;
      interpretacion += `Los números se distribuyen de manera uniforme (dentro del margen de error estadístico).`;
    }

    // Ordenar números con sesgo por contribución
    numerosConSesgo.sort((a, b) => b.contribucion - a.contribucion);

    return {
      estadisticoChiCuadrado,
      gradosLibertad,
      pValue,
      haySesgo,
      numerosConSesgo,
      interpretacion
    };
  }

  /**
   * Calcula el P-Value usando aproximación de Chi-Cuadrado
   * 
   * Usa la función gamma incompleta para aproximar el P-Value
   */
  private calcularPValue(chiCuadrado: number, gradosLibertad: number): number {
    // Aproximación usando la función de distribución acumulada
    // Para grados de libertad > 30, usar aproximación normal
    
    if (gradosLibertad > 30) {
      // Aproximación normal: Z = sqrt(2*χ²) - sqrt(2*df - 1)
      const z = Math.sqrt(2 * chiCuadrado) - Math.sqrt(2 * gradosLibertad - 1);
      // P-Value = 1 - CDF normal estándar
      return 1 - this.cdfNormal(z);
    }

    // Para grados de libertad menores, usar aproximación más precisa
    // P-Value = 1 - CDF Chi-Cuadrado
    return 1 - this.cdfChiCuadrado(chiCuadrado, gradosLibertad);
  }

  /**
   * Función de distribución acumulada (CDF) para Chi-Cuadrado
   * Aproximación usando serie de Taylor
   */
  private cdfChiCuadrado(x: number, df: number): number {
    if (x < 0) return 0;
    if (x === 0) return 0;

    // Aproximación usando función gamma incompleta
    // CDF = γ(k/2, x/2) / Γ(k/2)
    const k = df;
    const t = x / 2;
    
    // Aproximación simple para valores comunes
    if (k === 1) {
      return 2 * this.cdfNormal(Math.sqrt(x)) - 1;
    }

    // Para k > 1, usar aproximación más compleja
    // Simplificación: usar aproximación normal si k es grande
    if (k > 10) {
      const z = Math.sqrt(2 * x) - Math.sqrt(2 * k - 1);
      return this.cdfNormal(z);
    }

    // Aproximación básica para casos pequeños
    return this.aproximacionCDFChiCuadrado(x, k);
  }

  /**
   * Aproximación básica de CDF Chi-Cuadrado
   */
  private aproximacionCDFChiCuadrado(x: number, df: number): number {
    // Aproximación muy simplificada
    // En producción, usar librería estadística como jstat o similar
    const z = (x - df) / Math.sqrt(2 * df);
    return this.cdfNormal(z);
  }

  /**
   * Función de distribución acumulada (CDF) para distribución normal estándar
   * Aproximación usando función de error (erf)
   */
  private cdfNormal(z: number): number {
    // Aproximación de Abramowitz y Stegun
    const sign = z >= 0 ? 1 : -1;
    const absZ = Math.abs(z);

    if (absZ > 7) {
      return z > 0 ? 1 : 0;
    }

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1.0 / (1.0 + p * absZ);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Genera un reporte del test
   */
  public generarReporte(resultado: ResultadoChiCuadrado): string {
    let reporte = '📊 TEST DE CHI-CUADRADO\n';
    reporte += '='.repeat(60) + '\n\n';
    reporte += `Estadístico Chi-Cuadrado: ${resultado.estadisticoChiCuadrado.toFixed(4)}\n`;
    reporte += `Grados de libertad: ${resultado.gradosLibertad}\n`;
    reporte += `P-Value: ${resultado.pValue.toFixed(6)}\n\n`;
    reporte += `Resultado: ${resultado.haySesgo ? '⚠️  SESGO DETECTADO' : '✅ SIN SESGO SIGNIFICATIVO'}\n\n`;
    reporte += `Interpretación: ${resultado.interpretacion}\n\n`;

    if (resultado.numerosConSesgo.length > 0) {
      reporte += `Números con mayor desviación (Top 10):\n`;
      reporte += '-'.repeat(60) + '\n';
      reporte += '| Número | Observada | Esperada | Diferencia | Contribución |\n';
      reporte += '-'.repeat(60) + '\n';

      for (const item of resultado.numerosConSesgo.slice(0, 10)) {
        const diferencia = item.frecuenciaObservada - item.frecuenciaEsperada;
        reporte += `|   ${item.numero.toString().padStart(2, '0')}   | `;
        reporte += `${item.frecuenciaObservada.toFixed(1).padStart(8)} | `;
        reporte += `${item.frecuenciaEsperada.toFixed(1).padStart(8)} | `;
        reporte += `${diferencia > 0 ? '+' : ''}${diferencia.toFixed(1).padStart(9)} | `;
        reporte += `${item.contribucion.toFixed(4).padStart(12)} |\n`;
      }
      reporte += '-'.repeat(60) + '\n';
    }

    return reporte;
  }
}

