# 🔧 Configurar Credenciales de Supabase para el Frontend

## 📋 Paso a Paso

### Paso 1: Acceder a Supabase Dashboard

1. Ve a **https://supabase.com/dashboard**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (o crea uno nuevo si no tienes)

### Paso 2: Obtener las Credenciales

1. En el menú lateral izquierdo, haz clic en **Settings** (⚙️)
2. Luego haz clic en **API** en el submenú

### Paso 3: Copiar las Credenciales Necesarias

En la página de API verás dos secciones importantes:

#### **Project URL**
- Se encuentra en la sección "Project URL"
- Formato: `https://xxxxxxxxxxxxx.supabase.co`
- **Esta va en:** `NEXT_PUBLIC_SUPABASE_URL`

#### **anon/public key** o **publishable key**
- Se encuentra en la sección "Project API keys"
- Busca la fila que dice **"anon" "public"** o **"publishable"**
- Haz clic en el ícono de **copiar** (📋) al lado de la clave
- **Esta va en:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (preferido) o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE**: 
- NO uses la clave que dice **"service_role"** (es para el backend)
- Solo usa la clave **"anon" "public"** para el frontend

### Paso 4: Crear el Archivo .env.local

En la raíz de tu proyecto, crea un archivo llamado `.env.local` con este contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_publishable_aqui
```

O alternativamente (si tu proyecto usa la clave anon tradicional):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

**Reemplaza:**
- `https://tu-proyecto.supabase.co` → con tu Project URL real
- `tu_clave_anonima_aqui` → con tu anon/public key real

### Paso 5: Ejemplo de Archivo .env.local

Tu archivo `.env.local` debería verse así (con tus valores reales):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ejemplo_de_clave_muy_larga_aqui
```

O con la clave anon tradicional:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.ejemplo_de_clave_muy_larga_aqui
```

### Paso 6: Verificar que el Archivo Esté Correcto

✅ El archivo debe estar en la **raíz del proyecto** (mismo nivel que `package.json`)
✅ Debe llamarse exactamente `.env.local` (con el punto al inicio)
✅ Las variables deben empezar con `NEXT_PUBLIC_`
✅ No debe tener espacios alrededor del signo `=`

### Paso 7: Reiniciar el Servidor

Después de crear/modificar `.env.local`:

1. Si el servidor está corriendo, deténlo (Ctrl+C)
2. Vuelve a ejecutar: `npm run dev:frontend`

## 🔍 Verificación

Una vez configurado, el frontend debería:
- ✅ Conectarse a Supabase sin errores
- ✅ Mostrar datos si existen en las tablas
- ✅ No mostrar advertencias de "Supabase no configurado"

## ❓ ¿Problemas?

### No encuentro la sección API
- Asegúrate de estar en **Settings** → **API**
- No confundas con "Database" o "Auth"

### La clave es muy larga
- Es normal, las claves de Supabase son muy largas
- Asegúrate de copiarla completa

### El archivo .env.local no se guarda
- En Windows, asegúrate de guardarlo como "Todos los archivos" y no como .txt
- O usa el comando: `echo. > .env.local` en PowerShell

### Sigue mostrando "Supabase no configurado"
- Verifica que el archivo se llame exactamente `.env.local` (con punto)
- Verifica que las variables empiecen con `NEXT_PUBLIC_`
- Verifica que uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Reinicia el servidor después de crear el archivo

## 📝 Nota de Seguridad

⚠️ **NUNCA** subas el archivo `.env.local` a Git. Ya está incluido en `.gitignore`.

La clave **anon/public** es segura para usar en el frontend porque:
- Solo permite operaciones que definas en las políticas RLS
- No puede hacer operaciones administrativas
- Está diseñada para ser pública

