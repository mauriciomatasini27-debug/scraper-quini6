# 📤 Configuración de Git y GitHub

Guía para subir el proyecto a GitHub y configurar la automatización.

## 🚀 Pasos para Subir a GitHub

### 1. Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (arriba a la derecha) → **"New repository"**
3. Configura el repositorio:
   - **Name**: `scraper-quini6` (o el nombre que prefieras)
   - **Description**: "Scraper automatizado para extraer resultados del Quini 6"
   - **Visibility**: Público o Privado (público = GitHub Actions gratis)
   - **NO marques** "Initialize with README" (ya tenemos archivos)
4. Haz clic en **"Create repository"**

### 2. Conectar el Repositorio Local con GitHub

Después de crear el repositorio, GitHub te mostrará comandos. Ejecuta estos en tu terminal:

```bash
# Agregar el remoto (reemplaza USERNAME con tu usuario de GitHub)
git remote add origin https://github.com/USERNAME/scraper-quini6.git

# O si prefieres SSH:
git remote add origin git@github.com:USERNAME/scraper-quini6.git

# Cambiar a la rama main (si es necesario)
git branch -M main

# Subir el código
git push -u origin main
```

### 3. Configurar Secretos en GitHub

Una vez que el código esté en GitHub:

1. Ve a tu repositorio en GitHub
2. Navega a **Settings → Secrets and variables → Actions**
3. Haz clic en **"New repository secret"**
4. Agrega los siguientes secretos:

#### CRAWLBASE_JS_TOKEN (Opcional)
- **Name**: `CRAWLBASE_JS_TOKEN`
- **Value**: Tu token de Crawlbase

#### SUPABASE_URL (Opcional)
- **Name**: `SUPABASE_URL`
- **Value**: `https://tu-proyecto.supabase.co`

#### SUPABASE_KEY (Opcional)
- **Name**: `SUPABASE_KEY`
- **Value**: Tu Service Role Key de Supabase

### 4. Verificar el Workflow

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver el workflow **"Quini 6 Scraper Automático"**
3. Puedes ejecutarlo manualmente haciendo clic en **"Run workflow"**

## 🔐 Autenticación con GitHub

Si tienes problemas de autenticación:

### Opción 1: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos: `repo`, `workflow`
3. Usa el token como contraseña cuando Git te lo pida

### Opción 2: GitHub CLI

```bash
# Instalar GitHub CLI
# Windows: winget install GitHub.cli

# Autenticarse
gh auth login

# Luego puedes hacer push normalmente
git push
```

### Opción 3: SSH Keys

```bash
# Generar SSH key (si no tienes una)
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Agregar la clave pública a GitHub
# Settings → SSH and GPG keys → New SSH key
# Copia el contenido de ~/.ssh/id_ed25519.pub

# Luego usa la URL SSH para el remoto
git remote set-url origin git@github.com:USERNAME/scraper-quini6.git
```

## ✅ Verificar que Todo Funciona

1. **Workflow visible**: Ve a Actions y verifica que el workflow aparece
2. **Ejecución manual**: Ejecuta el workflow manualmente para probar
3. **Secretos configurados**: Verifica que los secretos están en Settings → Secrets

## 📝 Comandos Útiles

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir cambios
git push

# Ver remotos configurados
git remote -v

# Cambiar URL del remoto
git remote set-url origin https://github.com/USERNAME/scraper-quini6.git
```

## 🎯 Próximos Pasos

Una vez que el código esté en GitHub:

1. ✅ El workflow se ejecutará automáticamente según el cron
2. ✅ Puedes ver todas las ejecuciones en la pestaña Actions
3. ✅ Los resultados se guardarán como artifacts
4. ✅ Si configuraste Supabase, los datos se guardarán automáticamente

¡Listo para producción! 🚀

