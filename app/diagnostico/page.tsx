'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function DiagnosticoPage() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function diagnosticar() {
      const diagnosticos: any[] = [];
      
      // 1. Verificar configuración
      // Nota: process.env solo está disponible en el servidor, en el cliente usamos isSupabaseConfigured
      diagnosticos.push({
        paso: '1. Configuración',
        estado: isSupabaseConfigured ? '✅ OK' : '❌ ERROR',
        detalles: {
          isConfigured: isSupabaseConfigured,
          nota: isSupabaseConfigured 
            ? 'Variables de entorno configuradas correctamente' 
            : 'Verifica que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
        }
      });

      if (!isSupabaseConfigured) {
        setResultados(diagnosticos);
        setLoading(false);
        return;
      }

      // 2. Probar conexión con ai_predictions
      try {
        const { data, error } = await supabase
          .from('ai_predictions')
          .select('id')
          .limit(0);
        
        diagnosticos.push({
          paso: '2. Conexión ai_predictions',
          estado: error ? '❌ ERROR' : '✅ OK',
          detalles: error ? {
            codigo: error.code,
            mensaje: error.message,
            detalles: error.details,
            hint: error.hint,
            esTablaInexistente: error.code === '42P01',
            esPermisos: error.code === '42501' || error.message.includes('permission'),
          } : 'Conexión exitosa'
        });
      } catch (error: any) {
        diagnosticos.push({
          paso: '2. Conexión ai_predictions',
          estado: '❌ ERROR',
          detalles: { error: error.message }
        });
      }

      // 3. Probar conexión con resultados_quini
      try {
        const { data, error } = await supabase
          .from('resultados_quini')
          .select('id')
          .limit(0);
        
        diagnosticos.push({
          paso: '3. Conexión resultados_quini',
          estado: error ? '❌ ERROR' : '✅ OK',
          detalles: error ? {
            codigo: error.code,
            mensaje: error.message,
            detalles: error.details,
            hint: error.hint,
            esTablaInexistente: error.code === '42P01',
            esPermisos: error.code === '42501' || error.message.includes('permission'),
          } : 'Conexión exitosa'
        });
      } catch (error: any) {
        diagnosticos.push({
          paso: '3. Conexión resultados_quini',
          estado: '❌ ERROR',
          detalles: { error: error.message }
        });
      }

      // 4. Intentar leer datos
      try {
        const { data, error } = await supabase
          .from('resultados_quini')
          .select('sorteo_numero')
          .limit(1);
        
        diagnosticos.push({
          paso: '4. Lectura de datos',
          estado: error ? '❌ ERROR' : '✅ OK',
          detalles: error ? {
            codigo: error.code,
            mensaje: error.message,
            esRLS: error.code === '42501' || error.message.includes('permission denied'),
          } : `Datos encontrados: ${data?.length || 0} registros`
        });
      } catch (error: any) {
        diagnosticos.push({
          paso: '4. Lectura de datos',
          estado: '❌ ERROR',
          detalles: { error: error.message }
        });
      }

      setResultados(diagnosticos);
      setLoading(false);
    }

    diagnosticar();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔍 Diagnóstico de Supabase</h1>
        <p className="text-muted-foreground mt-2">
          Verificación de configuración y conexión
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p>Ejecutando diagnóstico...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {resultados.map((resultado, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{resultado.paso}</span>
                  <span className={resultado.estado.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                    {resultado.estado}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(resultado.detalles, null, 2)}
                </pre>
                
                {resultado.detalles?.esTablaInexistente && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      ⚠️ La tabla no existe
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      Ejecuta el script <code>setup_database_complete.sql</code> en Supabase SQL Editor
                    </p>
                  </div>
                )}

                {resultado.detalles?.esRLS && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      ⚠️ Error de permisos (RLS)
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                      La tabla tiene RLS activado sin políticas. Ejecuta en Supabase SQL Editor:
                    </p>
                    <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs">
{`ALTER TABLE resultados_quini DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions DISABLE ROW LEVEL SECURITY;`}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

