# 🚀 Importar Datos Históricos Ahora

## ✅ Configuración Completada

Tu archivo `.env` ya está configurado con:
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY (Service Role Key)

## 📋 Próximos Pasos

### 1. Verificar que la tabla existe en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_resultados_quini_sorteo_numero ON resultados_quini(sorteo_numero);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_fecha ON resultados_quini(fecha);
CREATE INDEX IF NOT EXISTS idx_resultados_quini_año ON resultados_quini(año);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resultados_quini_updated_at BEFORE UPDATE
  ON resultados_quini FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Ejecutar la importación

#### Opción A: Usando API REST (más simple)
```bash
npm run import:history
```

#### Opción B: Usando PostgreSQL Directo (más rápido)
```bash
# Primero configura DATABASE_URL en .env con tu contraseña
npm run import:history:pg
```

## ⏱️ Tiempo Estimado

- **API REST**: 10-20 minutos para todos los años
- **PostgreSQL Directo**: 5-10 minutos para todos los años

## 📊 Qué esperar

El script procesará:
- ✅ 2020: ~63 sorteos
- ✅ 2021: ~103 sorteos
- ✅ 2022: ~102 sorteos
- ✅ 2023: ~208 sorteos
- ✅ 2024: ~213 sorteos
- ✅ 2025: ~165 sorteos

**Total**: ~854 sorteos

## 🔍 Verificar Resultados

Después de la importación, puedes verificar en Supabase:

```sql
-- Contar sorteos por año
SELECT año, COUNT(*) as total 
FROM resultados_quini 
GROUP BY año 
ORDER BY año;

-- Ver últimos sorteos
SELECT sorteo_numero, fecha, año 
FROM resultados_quini 
ORDER BY sorteo_numero DESC 
LIMIT 10;
```

¡Listo para importar! 🎉

