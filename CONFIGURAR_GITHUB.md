# 🔧 Configurar GitHub - Paso a Paso

## Paso 1: Crear el Repositorio en GitHub

1. Ve a https://github.com e **inicia sesión**
2. Haz clic en el botón **"+"** (arriba a la derecha) → **"New repository"**
3. Configura:
   - **Repository name**: `scraper-quini6` (o el nombre que prefieras)
   - **Description**: "Scraper automatizado para extraer resultados del Quini 6"
   - **Visibility**: 
     - ✅ **Public** (recomendado - GitHub Actions es gratis)
     - O Private (si prefieres mantenerlo privado)
   - ⚠️ **NO marques** "Add a README file" (ya tenemos archivos)
   - ⚠️ **NO marques** "Add .gitignore" (ya tenemos uno)
   - ⚠️ **NO marques** "Choose a license" (por ahora)
4. Haz clic en **"Create repository"**

## Paso 2: Obtener la URL de tu Repositorio

Después de crear el repositorio, GitHub te mostrará una página con instrucciones. 

**Copia la URL** que aparece. Será algo como:
- `https://github.com/TU-USUARIO/scraper-quini6.git`
- O `git@github.com:TU-USUARIO/scraper-quini6.git` (SSH)

## Paso 3: Configurar el Remoto

Ejecuta estos comandos en tu terminal (reemplaza `TU-USUARIO` con tu usuario real de GitHub):

```bash
# Agregar el remoto con la URL correcta
git remote add origin https://github.com/TU-USUARIO/scraper-quini6.git

# Verificar que se configuró correctamente
git remote -v

# Cambiar a la rama main (si es necesario)
git branch -M main

# Subir el código
git push -u origin main
```

## Paso 4: Autenticación

Cuando ejecutes `git push`, GitHub te pedirá autenticación:

### Opción A: Personal Access Token (Recomendado)

1. Ve a: https://github.com/settings/tokens
2. Haz clic en **"Generate new token"** → **"Generate new token (classic)"**
3. Configura:
   - **Note**: "Scraper Quini 6"
   - **Expiration**: Elige una fecha (o "No expiration")
   - **Select scopes**: Marca `repo` y `workflow`
4. Haz clic en **"Generate token"**
5. **Copia el token** (solo se muestra una vez)
6. Cuando Git te pida contraseña, **pega el token** (no tu contraseña de GitHub)

### Opción B: GitHub CLI (Más fácil)

```bash
# Instalar GitHub CLI (si no lo tienes)
# Windows: winget install GitHub.cli

# Autenticarse
gh auth login

# Seguir las instrucciones en pantalla
# Luego puedes hacer push normalmente
git push -u origin main
```

## ⚠️ Solución de Problemas

### Error: "remote repository not found"

**Causas posibles:**
1. ❌ El repositorio no existe en GitHub → **Créalo primero** (Paso 1)
2. ❌ El nombre del usuario es incorrecto → Verifica tu usuario en GitHub
3. ❌ El nombre del repositorio es incorrecto → Verifica que coincida exactamente
4. ❌ Problemas de permisos → Verifica que tienes acceso al repositorio

**Solución:**
```bash
# Verificar el remoto actual
git remote -v

# Si está mal, eliminar y volver a agregar
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/NOMBRE-REPO.git

# Verificar de nuevo
git remote -v
```

### Error: "Authentication failed"

**Solución:**
- Usa un Personal Access Token en lugar de tu contraseña
- O configura GitHub CLI con `gh auth login`

### Error: "Permission denied"

**Solución:**
- Verifica que el repositorio existe y tienes permisos
- Verifica que el nombre del usuario y repositorio son correctos
- Si es un repositorio privado, asegúrate de estar autenticado

## ✅ Verificar que Funcionó

Después de hacer push:

1. Ve a tu repositorio en GitHub: `https://github.com/TU-USUARIO/scraper-quini6`
2. Deberías ver todos tus archivos
3. Ve a la pestaña **Actions** - deberías ver el workflow "Quini 6 Scraper Automático"

## 📝 Comandos Rápidos

```bash
# Ver remotos configurados
git remote -v

# Cambiar URL del remoto
git remote set-url origin https://github.com/TU-USUARIO/scraper-quini6.git

# Ver rama actual
git branch

# Cambiar a main
git branch -M main

# Subir código
git push -u origin main
```

