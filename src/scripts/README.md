# 📥 Scripts de Importación

Scripts para importar datos históricos a Supabase.

## 🗄️ importHistory.ts

Script para importar todos los datos históricos de Quini 6 (2020-2025) desde archivos JSON a Supabase.

### Requisitos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-service-role-key
   ```
   
   O configura las variables de entorno en tu sistema:
   ```bash
   export SUPABASE_URL=https://tu-proyecto.supabase.co
   export SUPABASE_KEY=tu-service-role-key
   ```

   ⚠️ **IMPORTANTE**: Usa la **Service Role Key**, no la anon key, para tener permisos completos.

3. **Crear la tabla en Supabase:**
   
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

   -- Índices para mejorar el rendimiento
   CREATE INDEX IF NOT EXISTS idx_resultados_quini_sorteo_numero ON resultados_quini(sorteo_numero);
   CREATE INDEX IF NOT EXISTS idx_resultados_quini_fecha ON resultados_quini(fecha);
   CREATE INDEX IF NOT EXISTS idx_resultados_quini_año ON resultados_quini(año);

   -- Trigger para actualizar updated_at automáticamente
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

### Uso

#### Opción 1: Usando API REST de Supabase (recomendado para uso general)

**Modo Producción (compilado):**
```bash
npm run import:history
```

**Modo Desarrollo (con ts-node):**
```bash
npm run import:history:dev
```

**Variables requeridas:**
- `SUPABASE_URL`
- `SUPABASE_KEY` (Service Role Key)

#### Opción 2: Usando PostgreSQL Directo (más rápido para importaciones masivas)

**Modo Producción (compilado):**
```bash
npm run import:history:pg
```

**Modo Desarrollo (con ts-node):**
```bash
npm run import:history:pg:dev
```

**Variables requeridas:**
- `DATABASE_URL` o `POSTGRES_URL` (connection string completo)
- O componentes individuales: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Ejemplo de connection string:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Qué hace el script

1. ✅ Lee todos los archivos JSON de la carpeta `data/`:
   - `quini_2020_completo.json`
   - `quini_2021_completo.json`
   - `quini_2022_completo.json`
   - `quini_2023_completo.json`
   - `quini_2024_completo.json`
   - `quini_2025_completo.json`

2. ✅ Mapea los datos al formato de Supabase:
   - `numeroSorteo` → `sorteo_numero`
   - `fechaISO` → `fecha`
   - Arrays de números para cada modalidad
   - Datos de pozo extra (si existe)

3. ✅ Realiza upsert masivo en lotes de 100:
   - Usa `onConflict: 'sorteo_numero'` para evitar duplicados
   - Procesa en lotes para evitar límites de tamaño
   - Incluye pausas entre lotes para no sobrecargar

4. ✅ Muestra progreso y resumen:
   - Progreso por año
   - Resumen final con totales
   - Manejo de errores por lote

### Estructura de Datos

El script mapea los sorteos así:

```typescript
{
  sorteo_numero: 3333,
  fecha: "2025-12-24",
  fecha_texto: "24/12/2025",
  año: 2025,
  tradicional: [8, 10, 25, 33, 35, 42],
  la_segunda: [12, 15, 28, 30, 40, 45],
  revancha: [5, 18, 22, 29, 36, 41],
  siempre_sale: [3, 11, 20, 27, 34, 44],
  pozo_extra: { ganadores: 194, premio: "670.103,09" },
  url: "https://www.quini-6.com.ar/2025/12/...",
  extraido_en: "2025-12-25T10:30:00.000Z"
}
```

### Notas Importantes

- ⚠️ El script usa **UPSERT**, así que puedes ejecutarlo múltiples veces sin crear duplicados
- ⚠️ Si un sorteo ya existe (mismo `sorteo_numero`), se actualizará
- ⚠️ El script procesa en lotes de 100 sorteos para evitar límites de tamaño
- ⚠️ Hay una pausa de 2 segundos entre años para no sobrecargar el servidor
- ⚠️ Usa Service Role Key para evitar problemas de permisos

### Solución de Problemas

**Error: "Variables de entorno no encontradas"**
- Verifica que `.env` existe y tiene las variables correctas
- O configura las variables de entorno del sistema

**Error: "Tabla no encontrada"**
- Ejecuta el SQL de creación de tabla en Supabase
- Verifica que el nombre de la tabla sea exactamente `resultados_quini`

**Error: "Permission denied"**
- Asegúrate de usar la **Service Role Key**, no la anon key
- Verifica que la key tenga permisos de escritura

**Error: "Timeout" o "Connection refused"**
- Verifica que la URL de Supabase sea correcta
- Revisa tu conexión a internet
- Verifica que Supabase esté disponible

