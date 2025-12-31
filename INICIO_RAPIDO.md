# 🚀 Inicio Rápido del Frontend

## ⚡ Pasos para Ejecutar

### 1. Instalar Dependencias (si no lo has hecho)

```bash
npm install
```

### 2. Configurar Variables de Entorno

**Crea el archivo `.env.local` en la raíz del proyecto:**

```bash
# Windows PowerShell
Copy-Item env.example.txt .env.local

# O crea manualmente el archivo .env.local con este contenido:
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

**⚠️ IMPORTANTE:**
- Reemplaza `https://tu-proyecto.supabase.co` con tu URL real de Supabase
- Reemplaza `tu_clave_anonima_aqui` con tu clave anónima (anon key) de Supabase
- NO uses la service_role key, solo la anon/public key

**¿Dónde obtener estas credenciales?**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
5. Copia **anon/public key** → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Ejecutar el Servidor de Desarrollo

```bash
npm run dev:frontend
```

El servidor debería iniciar en: **http://localhost:3000**

### 4. Verificar que Funcione

Si todo está correcto, deberías ver:
- ✅ Dashboard con sidebar lateral
- ✅ Sección "Juez Final" (puede estar vacía si no hay predicciones)
- ✅ Mapa de calor (puede estar vacío si no hay datos históricos)

## 🔍 Solución de Problemas

### Error: "Supabase no configurado"
- ✅ Verifica que `.env.local` existe y tiene las variables correctas
- ✅ Reinicia el servidor después de crear/modificar `.env.local`
- ✅ Verifica que las variables empiecen con `NEXT_PUBLIC_`

### No se muestran datos
- ✅ Verifica que las tablas `ai_predictions` y `resultados_quini` existan en Supabase
- ✅ Ejecuta el backend para generar predicciones: `npm run analisis:juez:dev`
- ✅ Verifica los permisos RLS (Row Level Security) en Supabase

### Error de compilación TypeScript
- ✅ Verifica que `tsconfig.json` esté en la raíz del proyecto
- ✅ Reinicia el servidor de desarrollo

### El sidebar no se muestra
- ✅ Es normal en pantallas pequeñas (< 1024px)
- ✅ En desktop, debería aparecer automáticamente

## 📋 Checklist Rápido

- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.local` creado con credenciales de Supabase
- [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas
- [ ] Servidor ejecutándose (`npm run dev:frontend`)
- [ ] Navegador abierto en `http://localhost:3000`

## 🎯 Próximos Pasos

Una vez que el frontend esté funcionando:
1. Genera predicciones ejecutando el backend
2. Verifica que los datos se muestren correctamente
3. Explora las visualizaciones y estadísticas

¡Listo! 🎉

