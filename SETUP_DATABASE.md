# 🗄️ Configurar Base de Datos Supabase

Guía para configurar las tablas, funciones y triggers en Supabase de forma automática o manual.

## 🚀 Opción 1: Ejecución Automática (Recomendado)

### Requisitos Previos

1. **Configurar variables de entorno** en tu archivo `.env`:

```env
# Opción A: Connection string completo
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.xxxxx.supabase.co:5432/postgres

# Opción B: Componentes individuales
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
```

**¿Dónde obtener la contraseña?**
- Ve a Supabase Dashboard → Settings → Database
- Busca "Connection string" o "Database password"
- Si no la recuerdas, puedes resetearla desde ahí

### Ejecutar el Script

```bash
# Modo desarrollo (sin compilar)
npm run setup:database:dev

# Modo producción (compila primero)
npm run setup:database
```

El script:
1. ✅ Se conecta a tu base de datos Supabase
2. ✅ Crea las tablas `resultados_quini` y `ai_predictions`
3. ✅ Crea todas las funciones con correcciones de seguridad
4. ✅ Crea los triggers necesarios
5. ✅ Verifica que todo se creó correctamente

## 📝 Opción 2: Ejecución Manual (SQL Editor)

Si prefieres ejecutar el SQL manualmente:

### Pasos

1. **Ve a tu proyecto en Supabase**: https://supabase.com/dashboard
2. **Navega a "SQL Editor"** en el menú lateral
3. **Crea una nueva query**
4. **Abre el archivo** `setup_database_complete.sql` en la raíz del proyecto
5. **Copia y pega TODO el contenido** en el editor SQL
6. **Haz clic en "Run"** o presiona `Ctrl+Enter`

### Archivos SQL Disponibles

- **`setup_database_complete.sql`** - Script completo (recomendado)
  - Crea todo en un solo paso
  - Incluye verificaciones finales
  - Es idempotente (puede ejecutarse múltiples veces)

- **`create_table_resultados_quini.sql`** - Solo tabla de resultados
- **`create_table_ai_predictions.sql`** - Solo tabla de predicciones
- **`update_functions_security.sql`** - Solo actualizar funciones existentes

## ✅ Verificación

Después de ejecutar el script, verifica que todo esté correcto:

### Desde SQL Editor

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('resultados_quini', 'ai_predictions');

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('update_updated_at_column', 'calcular_aciertos', 'update_aciertos_on_resultado_real');

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('resultados_quini', 'ai_predictions');
```

### Desde Table Editor

1. Ve a **Table Editor** en Supabase Dashboard
2. Deberías ver las tablas:
   - ✅ `resultados_quini`
   - ✅ `ai_predictions`

## 🔒 Correcciones de Seguridad Aplicadas

Las funciones incluyen las siguientes correcciones de seguridad:

- ✅ **`SET search_path = public, pg_catalog`** - Previene inyección de search_path
- ✅ **Nombres completamente calificados** - `public.function_name()` en lugar de `function_name()`
- ✅ **Funciones built-in protegidas** - `pg_catalog.now()` en lugar de `NOW()`

Estas correcciones protegen contra vulnerabilidades de seguridad comunes en PostgreSQL.

## ❓ Solución de Problemas

### Error: "Configuración de PostgreSQL no encontrada"

**Solución**: Asegúrate de tener una de estas opciones en tu `.env`:
- `DATABASE_URL` o `POSTGRES_URL` (connection string completo)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` (componentes individuales)

### Error: "Connection refused" o "Timeout"

**Solución**: 
- Verifica que la connection string sea correcta
- Asegúrate de que tu IP esté permitida en Supabase (Settings → Database → Connection pooling)

### Error: "relation already exists"

**Solución**: Este error es normal si las tablas ya existen. El script es idempotente y puede ejecutarse múltiples veces.

### Error: "permission denied"

**Solución**: 
- Asegúrate de usar la contraseña del usuario `postgres` (no la Service Role Key)
- Verifica que tengas permisos de administrador en el proyecto

## 📚 Próximos Pasos

Después de configurar la base de datos:

1. **Configurar RLS (Row Level Security)** si es necesario
2. **Importar datos históricos** usando `npm run import:history:pg:dev`
3. **Configurar el frontend** con las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

