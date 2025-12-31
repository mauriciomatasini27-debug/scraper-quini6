# 🗄️ Crear la Tabla en Supabase - Guía Paso a Paso

## ✅ No necesitas importar un CSV

La tabla se crea ejecutando un script SQL directamente en Supabase. Es muy simple.

## 📋 Pasos para Crear la Tabla

### 1. Abrir el SQL Editor en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral izquierdo, haz clic en **"SQL Editor"** (ícono de terminal/código)

### 2. Crear una Nueva Query

1. Haz clic en el botón **"New query"** o **"+"** en la parte superior
2. Se abrirá un editor de SQL en blanco

### 3. Copiar y Pegar el SQL

1. Abre el archivo `create_table_resultados_quini.sql` que está en la raíz del proyecto
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor SQL de Supabase

### 4. Ejecutar el Script

1. Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
2. Deberías ver un mensaje de éxito: `Success. No rows returned`

### 5. Verificar que la Tabla se Creó

1. En el menú lateral, ve a **"Table Editor"**
2. Deberías ver la tabla **`resultados_quini`** en la lista
3. Haz clic en ella para ver su estructura

## ✅ Verificación Rápida

Puedes ejecutar esta query en el SQL Editor para verificar:

```sql
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_name = 'resultados_quini';
```

Si devuelve `1`, la tabla existe correctamente.

## 🔍 Estructura de la Tabla

La tabla `resultados_quini` tiene las siguientes columnas:

- `id` - ID único (auto-incremental)
- `sorteo_numero` - Número del sorteo (único, no se puede repetir)
- `fecha` - Fecha del sorteo
- `fecha_texto` - Fecha en formato texto
- `año` - Año del sorteo
- `tradicional` - Array de 6 números (Tradicional)
- `la_segunda` - Array de 6 números (La Segunda)
- `revancha` - Array de 6 números (Revancha)
- `siempre_sale` - Array de 6 números (Siempre Sale)
- `pozo_extra` - Datos del pozo extra (JSON)
- `url` - URL del sorteo en el sitio web
- `extraido_en` - Fecha/hora de extracción
- `created_at` - Fecha de creación del registro
- `updated_at` - Fecha de última actualización

## 🚨 Si Ya Importaste Datos

Si ya ejecutaste el script de importación y funcionó, **la tabla ya existe**. 

Puedes verificar si hay datos:

```sql
SELECT COUNT(*) as total_sorteos FROM resultados_quini;
```

Si devuelve un número mayor a 0, la tabla existe y tiene datos.

## ❓ Problemas Comunes

### Error: "relation already exists"
- **Solución**: La tabla ya existe. No necesitas crearla de nuevo.

### Error: "permission denied"
- **Solución**: Asegúrate de estar usando la Service Role Key, no la anon key.

### No veo la tabla en Table Editor
- **Solución**: Refresca la página o verifica que ejecutaste el SQL correctamente.

## 📞 Siguiente Paso

Una vez que la tabla esté creada, puedes ejecutar el script de importación:

```bash
npm run import:history:dev
```

O si ya lo ejecutaste y funcionó, ¡ya está todo listo! 🎉


