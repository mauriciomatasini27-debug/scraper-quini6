# 🗄️ Configuración de Supabase

Guía para configurar Supabase y almacenar los resultados del scraping en una base de datos.

## 📋 Prerequisitos

1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener la URL y la API Key de tu proyecto

## 🏗️ Estructura de la Base de Datos

Crea la siguiente tabla en Supabase SQL Editor:

```sql
-- Tabla principal para almacenar los sorteos
CREATE TABLE IF NOT EXISTS sorteos (
  id BIGSERIAL PRIMARY KEY,
  numero_sorteo INTEGER UNIQUE NOT NULL,
  fecha DATE NOT NULL,
  fecha_texto VARCHAR(20),
  año INTEGER NOT NULL,
  tradicional JSONB NOT NULL,
  segunda JSONB NOT NULL,
  revancha JSONB NOT NULL,
  siempre_sale JSONB NOT NULL,
  pozo_extra JSONB,
  url TEXT,
  extraido_en TIMESTAMPTZ,
  fecha_extraccion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_sorteos_numero_sorteo ON sorteos(numero_sorteo);
CREATE INDEX IF NOT EXISTS idx_sorteos_fecha ON sorteos(fecha);
CREATE INDEX IF NOT EXISTS idx_sorteos_año ON sorteos(año);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sorteos_updated_at BEFORE UPDATE
  ON sorteos FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (opcional, para producción)
ALTER TABLE sorteos ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (ajustar según necesidad)
CREATE POLICY "Allow public read access" ON sorteos
  FOR SELECT USING (true);

-- Política para permitir inserción desde la API (usando service role key)
-- Esta política permite insertar usando la service_role key
CREATE POLICY "Allow service role insert" ON sorteos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update" ON sorteos
  FOR UPDATE USING (true);
```

## 🔐 Configurar Secretos de GitHub

1. Ve a tu repositorio en GitHub
2. Navega a **Settings → Secrets and variables → Actions**
3. Haz clic en **New repository secret**
4. Agrega los siguientes secretos:

### SUPABASE_URL
- **Nombre**: `SUPABASE_URL`
- **Valor**: La URL de tu proyecto (ej: `https://xxxxx.supabase.co`)

### SUPABASE_KEY
- **Nombre**: `SUPABASE_KEY`
- **Valor**: La **Service Role Key** (NO la anon key)
  - En Supabase: Settings → API → Service Role Key (secret)

⚠️ **IMPORTANTE**: Usa la Service Role Key, no la anon key, para tener permisos de escritura.

## 🧪 Probar la Conexión

Puedes probar la conexión localmente creando un archivo `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
```

Luego ejecuta:

```bash
npm run scrape
```

Si Supabase está configurado, verás el mensaje: `✅ Resultados también guardados en Supabase`

## 📊 Consultar los Datos

### Desde Supabase Dashboard

1. Ve a tu proyecto en Supabase
2. Navega a **Table Editor**
3. Selecciona la tabla `sorteos`
4. Verás todos los sorteos almacenados

### Usando SQL

```sql
-- Ver todos los sorteos de 2025
SELECT * FROM sorteos WHERE año = 2025 ORDER BY numero_sorteo;

-- Contar sorteos por año
SELECT año, COUNT(*) as total FROM sorteos GROUP BY año ORDER BY año;

-- Ver último sorteo
SELECT * FROM sorteos ORDER BY numero_sorteo DESC LIMIT 1;
```

### Desde tu Aplicación

Si estás usando la biblioteca de Supabase:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Obtener sorteos de 2025
const { data, error } = await supabase
  .from('sorteos')
  .select('*')
  .eq('año', 2025)
  .order('numero_sorteo');
```

## 🔄 Actualización Automática

El scraper usa **UPSERT** (merge-duplicates) para evitar duplicados:

- Si un sorteo ya existe (mismo `numero_sorteo`), se actualiza
- Si no existe, se inserta
- Esto permite re-ejecutar el scraper sin crear duplicados

## ⚠️ Notas Importantes

1. **Service Role Key**: Solo úsala en entornos seguros (servidores, GitHub Actions). Nunca la expongas en el frontend.

2. **Row Level Security**: Si habilitas RLS, asegúrate de configurar las políticas correctamente para permitir las operaciones necesarias.

3. **Límites de Supabase**: 
   - Plan gratuito: 500MB de base de datos
   - Considera la cantidad de datos que almacenarás

4. **Backup**: Aunque Supabase tiene backups automáticos, considera exportar los datos periódicamente.

## 🚀 Próximos Pasos

Una vez configurado, los resultados se guardarán automáticamente:
- ✅ En archivos JSON (en el repositorio)
- ✅ En Supabase (si está configurado)

Esto te permite:
- Tener datos estructurados en una base de datos
- Consultar fácilmente desde aplicaciones
- Hacer análisis y reportes
- Crear APIs para consumir los datos

