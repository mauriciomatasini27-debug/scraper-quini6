'use client';

import { useMemo } from 'react';
import { Cell, ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import type { FrecuenciaNumero } from '../../types';

interface NumberHeatmapProps {
  datos: FrecuenciaNumero[];
  isLoading?: boolean;
}

interface HeatmapData {
  name: string;
  value: number;
  frecuencia: number;
  frecuenciaRelativa: number;
}

// Función para obtener el color basado en la frecuencia relativa
const getColor = (frecuenciaRelativa: number): string => {
  // Normalizar a 0-1
  const normalized = Math.min(frecuenciaRelativa * 100, 1);
  
  // Paleta de colores: de azul oscuro (baja frecuencia) a verde esmeralda (alta frecuencia)
  if (normalized < 0.2) {
    return '#1e3a5f'; // Azul muy oscuro
  } else if (normalized < 0.4) {
    return '#2563eb'; // Azul
  } else if (normalized < 0.6) {
    return '#3b82f6'; // Azul claro
  } else if (normalized < 0.8) {
    return '#10b981'; // Verde
  } else {
    return '#34d399'; // Verde esmeralda brillante
  }
};

const CustomCell = ({ payload, x, y, width, height }: any) => {
  if (!payload) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getColor(payload.frecuenciaRelativa)}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={1}
        rx={4}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        fill="white"
        fontSize={Math.min(width / 3, height / 3, 14)}
        fontWeight="bold"
      >
        {payload.name}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="font-bold">Número {data.name}</p>
      <p className="text-sm text-muted-foreground">
        Frecuencia: {data.frecuencia}
      </p>
      <p className="text-sm text-muted-foreground">
        Probabilidad: {(data.frecuenciaRelativa * 100).toFixed(2)}%
      </p>
    </div>
  );
};

export function NumberHeatmap({ datos, isLoading }: NumberHeatmapProps) {
  const heatmapData: HeatmapData[] = useMemo(() => {
    return datos.map((item) => ({
      name: item.numero.toString().padStart(2, '0'),
      value: item.frecuencia,
      frecuencia: item.frecuencia,
      frecuenciaRelativa: item.frecuenciaRelativa,
    }));
  }, [datos]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor - Frecuencia de Números</CardTitle>
        <CardDescription>
          Visualización de la frecuencia de aparición de cada número (00-45) en
          los sorteos históricos. Los colores más brillantes indican mayor
          frecuencia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={heatmapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomCell />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#1e3a5f]"></div>
            <span>Baja</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#2563eb]"></div>
            <span>Media-Baja</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#3b82f6]"></div>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#10b981]"></div>
            <span>Media-Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#34d399]"></div>
            <span>Alta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

