# 🚀 Guía de Configuración del Frontend

## Paso 1: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias incluyendo:
- Next.js 15
- React 18
- Tailwind CSS
- TanStack Query
- Supabase Client
- Recharts
- Framer Motion
- Y todas las demás dependencias del proyecto

## Paso 2: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_publishable_aqui
```

O alternativamente (si tu proyecto usa la clave anon tradicional):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### ¿Dónde obtener estas credenciales?

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** → **API**
3. Encuentra:
   - **Project URL** → Copia esto en `NEXT_PUBLIC_SUPABASE_URL`
   - **publishable key** o **anon/public key** → Copia esto en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (preferido) o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Importante**: 
- Usa la clave **publishable** o **anon/public**, NO la clave de servicio (service_role)
- El código acepta ambas variables, pero `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` tiene prioridad
- Estas claves son seguras para usar en el cliente

## Paso 3: Verificar Tablas en Supabase

Asegúrate de que las siguientes tablas existan en tu base de datos:

### Tabla: `ai_predictions`
Debe tener las columnas:
- `id` (bigserial, primary key)
- `fecha_sorteo` (date)
- `numero_sorteo` (integer, nullable)
- `combinacion_1` (integer[])
- `combinacion_2` (integer[])
- `combinacion_3` (integer[])
- `analisis_tecnico` (text, nullable)
- `razones` (text[], nullable)
- `resultado_real` (integer[], nullable)
- `aciertos_combinacion_1` (integer, default 0)
- `aciertos_combinacion_2` (integer, default 0)
- `aciertos_combinacion_3` (integer, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Script SQL**: Ver `create_table_ai_predictions.sql` en la raíz del proyecto.

### Tabla: `resultados_quini`
Debe tener las columnas:
- `id` (bigserial, primary key)
- `sorteo_numero` (integer, unique)
- `fecha` (date)
- `fecha_texto` (varchar, nullable)
- `año` (integer)
- `tradicional` (integer[])
- `la_segunda` (integer[])
- `revancha` (integer[])
- `siempre_sale` (integer[])
- `pozo_extra` (jsonb, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Script SQL**: Ver `create_table_resultados_quini.sql` en la raíz del proyecto.

## Paso 4: Configurar Permisos RLS (Row Level Security)

En Supabase, para que el frontend pueda leer las tablas, necesitas configurar políticas RLS:

### Para `ai_predictions`:
```sql
-- Permitir lectura pública de predicciones
CREATE POLICY "Permitir lectura pública de predicciones"
ON ai_predictions
FOR SELECT
TO anon, authenticated
USING (true);
```

### Para `resultados_quini`:
```sql
-- Permitir lectura pública de resultados
CREATE POLICY "Permitir lectura pública de resultados"
ON resultados_quini
FOR SELECT
TO anon, authenticated
USING (true);
```

O simplemente deshabilita RLS si no necesitas seguridad estricta (solo para desarrollo):

```sql
ALTER TABLE ai_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_quini DISABLE ROW LEVEL SECURITY;
```

⚠️ **Nota**: Deshabilitar RLS solo es recomendable para desarrollo. En producción, configura políticas apropiadas.

## Paso 5: Ejecutar el Frontend

### Modo Desarrollo:
```bash
npm run dev:frontend
```

El servidor estará disponible en: `http://localhost:3000`

### Build de Producción:
```bash
npm run build:frontend
npm run start:frontend
```

## Verificación

Una vez que el servidor esté corriendo, deberías ver:

1. ✅ Dashboard con sidebar lateral
2. ✅ Sección "Juez Final" con las Top 3 combinaciones (si hay datos)
3. ✅ Mapa de calor de frecuencia de números (si hay datos históricos)
4. ✅ Estados de carga (skeletons) mientras se cargan los datos

## Troubleshooting

### Error: "Supabase no configurado"
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor después de crear/modificar `.env.local`
- Asegúrate de que las variables empiecen con `NEXT_PUBLIC_`

### Error: "Failed to fetch" o errores de red
- Verifica que las credenciales de Supabase sean correctas
- Verifica que RLS esté configurado correctamente
- Revisa la consola del navegador para más detalles

### No se muestran datos
- Verifica que las tablas existan y tengan datos
- Revisa la consola del navegador para errores
- Verifica que los nombres de las tablas coincidan exactamente: `ai_predictions` y `resultados_quini`

### Problemas con las rutas de importación
- Asegúrate de que `tsconfig-next.json` esté en la raíz del proyecto
- Verifica que el alias `@/*` esté configurado correctamente
- Reinicia el servidor TypeScript en tu IDE

## Estructura del Proyecto

```
├── app/                    # Aplicación Next.js 15 (App Router)
│   ├── components/         # Componentes React
│   ├── lib/               # Utilidades y cliente Supabase
│   ├── types/             # Tipos TypeScript compartidos
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Página principal
├── src/                   # Código del backend (TypeScript)
├── .env.local            # Variables de entorno (crear este archivo)
├── next.config.js        # Configuración de Next.js
├── tailwind.config.ts    # Configuración de Tailwind CSS
└── tsconfig-next.json    # Configuración TypeScript para Next.js
```

## Próximos Pasos

1. ✅ Frontend configurado y funcionando
2. 🔄 Generar predicciones con el backend para ver datos en el dashboard
3. 🔄 Agregar más visualizaciones y estadísticas
4. 🔄 Implementar página de estadísticas detalladas
5. 🔄 Agregar autenticación si es necesario

