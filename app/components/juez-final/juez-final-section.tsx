'use client';

import { useQuery } from '@tanstack/react-query';
import { obtenerUltimaPrediccion } from '../../lib/queries';
import { JuezFinalCard } from './juez-final-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function JuezFinalSection() {
  const { data: prediccion, isLoading, error } = useQuery({
    queryKey: ['ultima-prediccion'],
    queryFn: obtenerUltimaPrediccion,
  });

  if (isLoading) {
    return (
      <section id="juez-final" className="space-y-6 py-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Skeleton key={j} className="h-14 w-14 rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="juez-final" className="space-y-6 py-8">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al cargar predicciones
            </CardTitle>
            <CardDescription>
              No se pudo obtener la última predicción del Juez Final. 
              Verifica la consola del navegador para más detalles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Posibles causas:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>La tabla <code className="bg-muted px-1 rounded">ai_predictions</code> no existe en Supabase</li>
              <li>No hay permisos RLS configurados correctamente</li>
              <li>La clave de Supabase no tiene los permisos necesarios</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!prediccion) {
    return (
      <section id="juez-final" className="space-y-6 py-8">
        <Card className="border-muted/50 bg-muted/10">
          <CardHeader>
            <CardTitle>No hay predicciones disponibles</CardTitle>
            <CardDescription>
              Aún no se han generado predicciones del Juez Final.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para generar predicciones, ejecuta el backend:
            </p>
            <code className="block bg-muted p-2 rounded mt-2 text-xs">
              npm run analisis:juez:dev
            </code>
          </CardContent>
        </Card>
      </section>
    );
  }

  const combinaciones: [number[], number[], number[]] = [
    prediccion.combinacion_1,
    prediccion.combinacion_2,
    prediccion.combinacion_3,
  ];

  return (
    <section id="juez-final" className="space-y-6 py-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Juez Final - Top 3 Recomendaciones
        </h2>
        <p className="text-muted-foreground">
          Las 3 combinaciones más probables según el análisis del Protocolo Lyra
        </p>
        {prediccion.analisis_tecnico && (
          <Card className="mt-4 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Análisis Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {prediccion.analisis_tecnico}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {combinaciones.map((combinacion, index) => (
          <JuezFinalCard
            key={index}
            combinacion={combinacion as [number, number, number, number, number, number]}
            posicion={(index + 1) as 1 | 2 | 3}
            razon={prediccion.razones?.[index] || undefined}
            delay={index * 0.1}
          />
        ))}
      </div>

      {prediccion.razones && prediccion.razones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Razones de Selección</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prediccion.razones.map((razon, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 text-primary">•</span>
                  <span className="text-muted-foreground">{razon}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

