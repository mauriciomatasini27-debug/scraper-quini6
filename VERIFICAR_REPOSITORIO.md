# 🔍 Verificar Información del Repositorio

Para configurar correctamente el remoto, necesito la información exacta de tu repositorio.

## 📋 Información Necesaria

### 1. Tu Usuario de GitHub

Para encontrarlo:
1. Ve a https://github.com e inicia sesión
2. Tu usuario aparece en la URL: `https://github.com/TU-USUARIO`
3. O haz clic en tu avatar (arriba a la derecha) → tu usuario aparece ahí

### 2. Nombre Exacto del Repositorio

Verifica que el nombre sea exactamente: `raspador-quini6`

Para verificar:
1. Ve a tu perfil en GitHub
2. Busca el repositorio en la lista
3. Copia el nombre exacto (puede tener mayúsculas/minúsculas diferentes)

## 🔧 Configurar el Remoto

Una vez que tengas la información, ejecuta:

```bash
# Reemplaza TU-USUARIO con tu usuario real
# Reemplaza NOMBRE-REPO con el nombre exacto del repositorio
git remote add origin https://github.com/TU-USUARIO/NOMBRE-REPO.git

# Verificar
git remote -v

# Cambiar a main
git branch -M main

# Subir código
git push -u origin main
```

## ✅ Verificar que el Repositorio Existe

1. Ve a: `https://github.com/TU-USUARIO/raspador-quini6`
2. Si ves el repositorio, copia la URL exacta de la página
3. La URL debería ser algo como: `https://github.com/usuario/raspador-quini6`

## 🆘 Si el Repositorio No Existe

Si aún no has creado el repositorio:

1. Ve a https://github.com/new
2. Repository name: `raspador-quini6`
3. Elige Public o Private
4. **NO marques** "Add a README file"
5. Haz clic en "Create repository"
6. Luego ejecuta los comandos de arriba

