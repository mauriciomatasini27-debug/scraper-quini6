-- ============================================================
-- Script SQL para crear la tabla ai_predictions en Supabase
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
-- 2. Navega a "SQL Editor" en el menú lateral
-- 3. Crea una nueva query
-- 4. Copia y pega TODO este contenido
-- 5. Haz clic en "Run" o presiona Ctrl+Enter
-- ============================================================

-- Crear la tabla para almacenar predicciones de IA
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

-- Crear función para calcular aciertos automáticamente
-- Con search_path explícito para seguridad
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

-- Crear función para actualizar aciertos cuando se agrega resultado_real
-- Con search_path explícito para seguridad
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

-- Crear trigger para actualizar aciertos automáticamente
CREATE TRIGGER update_ai_predictions_aciertos
  BEFORE UPDATE ON public.ai_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aciertos_on_resultado_real();

-- Crear trigger para actualizar updated_at en cada UPDATE
-- Nota: Esta función debe existir (se crea en create_table_resultados_quini.sql)
CREATE TRIGGER update_ai_predictions_updated_at
  BEFORE UPDATE ON public.ai_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Verificar que la tabla se creó correctamente
-- ============================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_predictions'
ORDER BY ordinal_position;

-- ============================================================
-- Consultas útiles para auditar la precisión
-- ============================================================

-- Ver todas las predicciones con resultados conocidos
-- SELECT 
--   fecha_sorteo,
--   numero_sorteo,
--   combinacion_1,
--   combinacion_2,
--   combinacion_3,
--   resultado_real,
--   aciertos_combinacion_1,
--   aciertos_combinacion_2,
--   aciertos_combinacion_3,
--   created_at
-- FROM ai_predictions
-- WHERE resultado_real IS NOT NULL
-- ORDER BY fecha_sorteo DESC;

-- Calcular estadísticas de precisión
-- SELECT 
--   COUNT(*) as total_predicciones,
--   AVG(aciertos_combinacion_1) as promedio_aciertos_comb1,
--   AVG(aciertos_combinacion_2) as promedio_aciertos_comb2,
--   AVG(aciertos_combinacion_3) as promedio_aciertos_comb3,
--   COUNT(*) FILTER (WHERE aciertos_combinacion_1 >= 3) as comb1_con_3_o_mas,
--   COUNT(*) FILTER (WHERE aciertos_combinacion_2 >= 3) as comb2_con_3_o_mas,
--   COUNT(*) FILTER (WHERE aciertos_combinacion_3 >= 3) as comb3_con_3_o_mas
-- FROM ai_predictions
-- WHERE resultado_real IS NOT NULL;

