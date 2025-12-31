'use client';

import { useQuery } from '@tanstack/react-query';
import { JuezFinalSection } from './components/juez-final/juez-final-section';
import { NumberHeatmap } from './components/heatmap/number-heatmap';
import { calcularFrecuenciasNumeros } from './lib/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Skeleton } from './components/ui/skeleton';

export default function Home() {
  const {
    data: frecuencias,
    isLoading: isLoadingFrecuencias,
  } = useQuery({
    queryKey: ['frecuencias-numeros'],
    queryFn: calcularFrecuenciasNumeros,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Dashboard Predictivo
          </h1>
          <p className="text-muted-foreground mt-2">
            Análisis estadístico avanzado y predicciones basadas en el Protocolo Lyra
          </p>
        </div>
      </section>

      {/* Juez Final Section */}
      <JuezFinalSection />

      {/* Heatmap Section */}
      <section className="space-y-6">
        {isLoadingFrecuencias ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        ) : frecuencias ? (
          <NumberHeatmap datos={frecuencias} />
        ) : (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">
                Error al cargar frecuencias
              </CardTitle>
              <CardDescription>
                No se pudieron obtener los datos de frecuencia de números.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      {/* Stats Summary */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Números</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">46</div>
            <p className="text-sm text-muted-foreground mt-1">
              Rango 00-45
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Estadístico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Activo</div>
            <p className="text-sm text-muted-foreground mt-1">
              Protocolo Lyra en tiempo real
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precisión IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">—</div>
            <p className="text-sm text-muted-foreground mt-1">
              Calculando históricamente
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

