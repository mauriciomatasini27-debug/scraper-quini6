-- ============================================================
-- Script SQL para actualizar funciones existentes con correcciones de seguridad
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Si ya tienes las funciones creadas en Supabase, ejecuta este script
-- 2. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
-- 3. Navega a "SQL Editor" en el menú lateral
-- 4. Crea una nueva query
-- 5. Copia y pega TODO este contenido
-- 6. Haz clic en "Run" o presiona Ctrl+Enter
-- ============================================================
--
-- Este script actualiza las funciones existentes con:
-- - SET search_path explícito para seguridad
-- - Nombres de objetos completamente calificados
-- - Referencias a funciones built-in usando pg_catalog

-- Actualizar función update_updated_at_column
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

-- Actualizar función calcular_aciertos (si existe)
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

-- Actualizar función update_aciertos_on_resultado_real (si existe)
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
-- Verificar que las funciones se actualizaron correctamente
-- ============================================================
SELECT 
  routine_name,
  routine_schema,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name IN ('update_updated_at_column', 'calcular_aciertos', 'update_aciertos_on_resultado_real')
  AND routine_schema = 'public'
ORDER BY routine_name;

