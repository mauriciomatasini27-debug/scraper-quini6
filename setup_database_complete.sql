-- ============================================================
-- Script SQL Completo para Configurar la Base de Datos
-- Ejecuta todos los pasos en orden de forma segura
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
-- 2. Navega a "SQL Editor" en el menú lateral
-- 3. Crea una nueva query
-- 4. Copia y pega TODO este contenido
-- 5. Haz clic en "Run" o presiona Ctrl+Enter
-- ============================================================

-- ============================================================
-- PASO 1: Crear tabla resultados_quini (si no existe)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resultados_quini (
  id BIGSERIAL PRIMARY KEY,
  sorteo_numero INTEGER UNIQUE NOT NULL,
  fecha DATE NOT NULL,
  fecha_texto VARCHAR(20),
  año INTEGER NOT NULL,
  tradicional INTEGER[] NOT NULL,
  la_segunda INTEGER[] NOT NULL,
  revancha INTEGER[] NOT NULL,
  siempre_sale INTEGER[] NOT NULL,
  pozo_extra JSONB,
  url TEXT,
  extraido_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ DEFAULT pg_catalog.now()
);

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_resultados_quini_sorteo_numero ON public.resultados_quini(sorteo_numero);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_fecha ON public.resultados_quini(fecha);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_año ON public.resultados_quini(año);

-- ============================================================
-- PASO 2: Crear tabla ai_predictions (si no existe)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id BIGSERIAL PRIMARY KEY,
  fecha_sorteo DATE NOT NULL,
  numero_sorteo INTEGER,
  combinacion_1 INTEGER[] NOT NULL,
  combinacion_2 INTEGER[] NOT NULL,
  combinacion_3 INTEGER[] NOT NULL,
  analisis_tecnico TEXT,
  razones TEXT[],
  metadata JSONB,
  resultado_real INTEGER[],
  aciertos_combinacion_1 INTEGER DEFAULT 0,
  aciertos_combinacion_2 INTEGER DEFAULT 0,
  aciertos_combinacion_3 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ DEFAULT pg_catalog.now()
);

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_ai_predictions_fecha_sorteo ON public.ai_predictions(fecha_sorteo);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_numero_sorteo ON public.ai_predictions(numero_sorteo);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON public.ai_predictions(created_at);

-- ============================================================
-- PASO 3: Crear/Actualizar función update_updated_at_column
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PASO 4: Crear/Actualizar función calcular_aciertos
-- ============================================================

CREATE OR REPLACE FUNCTION public.calcular_aciertos(
  combinacion_predicha INTEGER[],
  resultado_real INTEGER[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  aciertos INTEGER := 0;
  num INTEGER;
BEGIN
  IF resultado_real IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH num IN ARRAY combinacion_predicha
  LOOP
    IF num = ANY(resultado_real) THEN
      aciertos := aciertos + 1;
    END IF;
  END LOOP;

  RETURN aciertos;
END;
$$;

-- ============================================================
-- PASO 5: Crear/Actualizar función update_aciertos_on_resultado_real
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_aciertos_on_resultado_real()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.resultado_real IS NOT NULL AND (OLD.resultado_real IS NULL OR OLD.resultado_real <> NEW.resultado_real) THEN
    NEW.aciertos_combinacion_1 := public.calcular_aciertos(NEW.combinacion_1, NEW.resultado_real);
    NEW.aciertos_combinacion_2 := public.calcular_aciertos(NEW.combinacion_2, NEW.resultado_real);
    NEW.aciertos_combinacion_3 := public.calcular_aciertos(NEW.combinacion_3, NEW.resultado_real);
  END IF;
  
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PASO 6: Crear/Reemplazar triggers para resultados_quini
-- ============================================================

-- Eliminar trigger si existe (para recrearlo con la configuración correcta)
DROP TRIGGER IF EXISTS update_resultados_quini_updated_at ON public.resultados_quini;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_resultados_quini_updated_at 
  BEFORE UPDATE ON public.resultados_quini 
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PASO 7: Crear/Reemplazar triggers para ai_predictions
-- ============================================================

-- Eliminar triggers si existen (para recrearlos con la configuración correcta)
DROP TRIGGER IF EXISTS update_ai_predictions_aciertos ON public.ai_predictions;
DROP TRIGGER IF EXISTS update_ai_predictions_updated_at ON public.ai_predictions;

-- Crear trigger para actualizar aciertos automáticamente
CREATE TRIGGER update_ai_predictions_aciertos
  BEFORE UPDATE ON public.ai_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aciertos_on_resultado_real();

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_ai_predictions_updated_at
  BEFORE UPDATE ON public.ai_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PASO 8: Configurar Row Level Security (RLS)
-- ============================================================

-- Deshabilitar RLS para permitir acceso público (recomendado para desarrollo)
-- Si necesitas RLS activo, comenta estas líneas y crea políticas apropiadas
ALTER TABLE IF EXISTS public.resultados_quini DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_predictions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 9: Verificación Final
-- ============================================================

-- Verificar tablas creadas
SELECT 
  'Tablas creadas:' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('resultados_quini', 'ai_predictions')
ORDER BY table_name;

-- Verificar funciones creadas
SELECT 
  'Funciones creadas:' as status,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_updated_at_column', 'calcular_aciertos', 'update_aciertos_on_resultado_real')
ORDER BY routine_name;

-- Verificar triggers creados
SELECT 
  'Triggers creados:' as status,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('resultados_quini', 'ai_predictions')
ORDER BY event_object_table, trigger_name;

-- ============================================================
-- ✅ Configuración completada
-- ============================================================

