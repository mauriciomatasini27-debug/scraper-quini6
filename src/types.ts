/**
 * Tipos TypeScript estrictos para los datos del Quini 6
 */

export interface NumerosSorteo {
  numero1: string;
  numero2: string;
  numero3: string;
  numero4: string;
  numero5: string;
  numero6: string;
}

export interface ModalidadSorteo {
  nombre: string;
  numeros: NumerosSorteo;
  ganadores?: {
    aciertos6?: number;
    aciertos5?: number;
    aciertos4?: number;
  };
  premios?: {
    premio6?: string;
    premio5?: string;
    premio4?: string;
  };
}

export interface SorteoQuini6 {
  numeroSorteo: number;
  fecha: string;
  fechaISO: string;
  tradicional: ModalidadSorteo;
  segunda: ModalidadSorteo;
  revancha: ModalidadSorteo;
  siempreSale: ModalidadSorteo;
  pozoExtra?: {
    ganadores?: number;
    premio?: string;
  };
  url: string;
  extraidoEn: string;
}

export interface ResultadoScraping {
  año: number;
  totalSorteos: number;
  sorteos: SorteoQuini6[];
  sorteosPendientes: number[];
  errores: Array<{
    numeroSorteo?: number;
    fecha?: string;
    error: string;
    timestamp: string;
  }>;
  fechaInicio: string;
  fechaFin: string;
  metadata: {
    version: string;
    fechaExtraccion: string;
  }
}

