/**
 * Módulo de Data Ingestion
 * 
 * Responsable de cargar, normalizar y preparar los datos históricos
 * para el análisis estadístico.
 * 
 * Incluye validación estricta con Zod para asegurar que todos los números
 * estén en el rango válido 00-45.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { ResultadoScraping, SorteoQuini6, ModalidadSorteo as ModalidadScraping } from '../../types';
import {
  SorteoNormalizado,
  ModalidadSorteo,
  Combinacion,
  NumeroQuini
} from '../types';

/**
 * Schema de validación Zod para números del Quini 6
 * Rango válido: 0-45 (inclusive)
 */
const NumeroQuiniSchema = z.number().int().min(0).max(45);

/**
 * Schema de validación para una combinación completa (6 números)
 */
const CombinacionSchema = z.array(NumeroQuiniSchema).length(6);

/**
 * Schema de validación para los números de un sorteo
 */
const NumerosSorteoSchema = z.object({
  numero1: z.string(),
  numero2: z.string(),
  numero3: z.string(),
  numero4: z.string(),
  numero5: z.string(),
  numero6: z.string()
});

/**
 * Clase principal para la ingesta de datos
 */
export class DataIngestion {
  private datosCargados: SorteoNormalizado[] = [];

  /**
   * Carga datos históricos desde archivos JSON
   * @param años Array de años a cargar (2020-2025)
   * @param rutaBase Ruta base donde se encuentran los archivos JSON
   */
  public cargarDatosHistoricos(
    años: number[],
    rutaBase: string = join(process.cwd(), 'data')
  ): SorteoNormalizado[] {
    this.datosCargados = [];

    for (const año of años) {
      const rutaArchivo = join(rutaBase, `quini_${año}_completo.json`);
      
      try {
        const contenido = readFileSync(rutaArchivo, 'utf-8');
        const datos: ResultadoScraping = JSON.parse(contenido);
        
        const sorteosNormalizados = this.normalizarSorteos(datos);
        this.datosCargados.push(...sorteosNormalizados);
      } catch (error) {
        throw new Error(
          `Error al cargar datos del año ${año}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    // Ordenar por fecha (más antiguo primero)
    this.datosCargados.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    return this.datosCargados;
  }

  /**
   * Normaliza los sorteos del formato de scraping al formato de análisis
   */
  private normalizarSorteos(datos: ResultadoScraping): SorteoNormalizado[] {
    const sorteosNormalizados: SorteoNormalizado[] = [];

    for (const sorteo of datos.sorteos) {
      // Procesar cada modalidad
      const modalidades: Array<{ key: keyof SorteoQuini6; tipo: ModalidadSorteo }> = [
        { key: 'tradicional', tipo: 'tradicional' },
        { key: 'segunda', tipo: 'segunda' },
        { key: 'revancha', tipo: 'revancha' },
        { key: 'siempreSale', tipo: 'siempreSale' }
      ];

      for (const { key, tipo } of modalidades) {
        let modalidad: ModalidadScraping | undefined;
        
        if (key === 'tradicional') modalidad = sorteo.tradicional;
        else if (key === 'segunda') modalidad = sorteo.segunda;
        else if (key === 'revancha') modalidad = sorteo.revancha;
        else if (key === 'siempreSale') modalidad = sorteo.siempreSale;
        
        if (modalidad && modalidad.numeros) {
          const numeros = this.extraerNumeros(modalidad.numeros);
          
          if (numeros.length === 6) {
            const combinacion = numeros as Combinacion;
            const suma = numeros.reduce((acc, n) => acc + n, 0);
            const paridad = this.calcularParidad(numeros);
            const espaciado = this.calcularEspaciado(numeros);

            // Calcular amplitud (diferencia entre máximo y mínimo)
            const amplitud = numeros[numeros.length - 1] - numeros[0];

            sorteosNormalizados.push({
              numeroSorteo: sorteo.numeroSorteo,
              fecha: new Date(sorteo.fechaISO),
              fechaISO: sorteo.fechaISO,
              modalidad: tipo,
              numeros: combinacion,
              suma,
              paridad,
              espaciado,
              amplitud
            });
          }
        }
      }
    }

    return sorteosNormalizados;
  }

  /**
   * Extrae los números de un objeto NumerosSorteo y los convierte a números
   * Valida estrictamente con Zod que todos los números estén en el rango 00-45
   * 
   * @throws {z.ZodError} Si algún número está fuera del rango válido
   */
  private extraerNumeros(numeros: { numero1: string; numero2: string; numero3: string; numero4: string; numero5: string; numero6: string }): NumeroQuini[] {
    // Validar estructura con Zod
    const numerosValidados = NumerosSorteoSchema.parse(numeros);
    
    const numerosArray: NumeroQuini[] = [];
    
    const valores = [
      numerosValidados.numero1,
      numerosValidados.numero2,
      numerosValidados.numero3,
      numerosValidados.numero4,
      numerosValidados.numero5,
      numerosValidados.numero6
    ];
    
    // Validar y convertir cada número con Zod
    for (let i = 0; i < valores.length; i++) {
      const valor = valores[i];
      if (!valor) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.invalid_type,
            expected: z.ZodParsedType.string,
            received: z.ZodParsedType.undefined,
            path: [`numero${i + 1}`],
            message: `Número ${i + 1} está vacío o es undefined`
          }
        ]);
      }

      const numero = parseInt(valor, 10);
      
      // Validar con Zod que el número esté en el rango válido
      try {
        const numeroValidado = NumeroQuiniSchema.parse(numero);
        numerosArray.push(numeroValidado);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              path: [`numero${i + 1}`],
              message: `Número inválido: ${valor}. Debe estar en el rango 00-45 (inclusive).`
            }
          ]);
        }
        throw error;
      }
    }

    // Validar que tengamos exactamente 6 números y que sea una combinación válida
    try {
      CombinacionSchema.parse(numerosArray);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: [],
            message: `Combinación inválida: debe tener exactamente 6 números en el rango 00-45. Números recibidos: ${numerosArray.join(', ')}`
          }
        ]);
      }
      throw error;
    }

    // Ordenar números de menor a mayor
    return numerosArray.sort((a, b) => a - b) as Combinacion;
  }

  /**
   * Calcula la paridad de una combinación
   */
  private calcularParidad(numeros: NumeroQuini[]): { pares: number; impares: number } {
    let pares = 0;
    let impares = 0;

    for (const numero of numeros) {
      if (numero % 2 === 0) {
        pares++;
      } else {
        impares++;
      }
    }

    return { pares, impares };
  }

  /**
   * Calcula el espaciado entre números consecutivos
   */
  private calcularEspaciado(numeros: NumeroQuini[]): number[] {
    const espaciados: number[] = [];

    for (let i = 1; i < numeros.length; i++) {
      espaciados.push(numeros[i] - numeros[i - 1]);
    }

    return espaciados;
  }

  /**
   * Filtra sorteos por modalidad
   */
  public filtrarPorModalidad(
    modalidad: ModalidadSorteo,
    datos?: SorteoNormalizado[]
  ): SorteoNormalizado[] {
    const datosAFiltrar = datos || this.datosCargados;
    return datosAFiltrar.filter(s => s.modalidad === modalidad);
  }

  /**
   * Obtiene los datos cargados
   */
  public obtenerDatos(): SorteoNormalizado[] {
    return [...this.datosCargados];
  }

  /**
   * Limpia los datos cargados de memoria
   */
  public limpiar(): void {
    this.datosCargados = [];
  }
}

