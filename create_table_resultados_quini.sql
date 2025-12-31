-- ============================================================
-- Script SQL para crear la tabla resultados_quini en Supabase
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
-- 2. Navega a "SQL Editor" en el menú lateral
-- 3. Crea una nueva query
-- 4. Copia y pega TODO este contenido
-- 5. Haz clic en "Run" o presiona Ctrl+Enter
-- ============================================================

-- Crear la tabla principal
CREATE TABLE IF NOT EXISTS resultados_quini (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_resultados_quini_sorteo_numero ON resultados_quini(sorteo_numero);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_fecha ON resultados_quini(fecha);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_año ON resultados_quini(año);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER update_resultados_quini_updated_at 
  BEFORE UPDATE ON resultados_quini 
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Verificar que la tabla se creó correctamente
-- ============================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'resultados_quini'
ORDER BY ordinal_position;


