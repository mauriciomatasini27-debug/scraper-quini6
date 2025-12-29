# 🚀 Cómo Ejecutar el Workflow Manualmente

## Pasos para Ejecutar el Workflow

### 1. Ir a la Pestaña Actions

1. Ve a tu repositorio: https://github.com/mauriciomatasini27-debug/scraper-quini6
2. Haz clic en la pestaña **"Actions"** (arriba del repositorio)

### 2. Seleccionar el Workflow

1. En el menú lateral izquierdo, busca **"Quini 6 Scraper Automático"**
2. Haz clic en él

### 3. Ejecutar Manualmente

1. Verás un botón **"Run workflow"** (arriba a la derecha)
2. Haz clic en **"Run workflow"**
3. Se abrirá un menú desplegable:
   - **Branch**: Selecciona `main` (debería estar seleccionado por defecto)
   - **Año a procesar**: 
     - Déjalo **vacío** para procesar el año actual (2025)
     - O escribe un año específico como `2024`, `2023`, etc.
4. Haz clic en el botón verde **"Run workflow"**

### 4. Ver el Progreso

1. Verás una nueva ejecución aparecer en la lista
2. Haz clic en la ejecución para ver el progreso en tiempo real
3. Verás cada step ejecutándose:
   - ✅ Checkout código
   - ✅ Setup Node.js
   - ✅ Instalar dependencias
   - ✅ Instalar Playwright
   - ✅ Configurar variables de entorno
   - ✅ Compilar TypeScript
   - ✅ Ejecutar Scraper
   - ✅ Subir resultados a artifacts
   - ✅ Resumen de resultados

### 5. Ver los Resultados

Una vez completado:

1. **Artifacts**: Al final de la ejecución, verás una sección "Artifacts"
   - Haz clic para descargar los archivos JSON generados
   
2. **Logs**: Puedes ver los logs completos de cada step haciendo clic en ellos

3. **Resumen**: Al final verás un resumen con los archivos generados

## ⚠️ Notas Importantes

- **Primera ejecución**: Puede tardar más tiempo porque necesita instalar todas las dependencias
- **Tiempo estimado**: 5-15 minutos dependiendo de la cantidad de sorteos
- **Artifacts**: Se mantienen por 90 días automáticamente
- **Supabase**: Si configuraste los secretos, los datos también se guardarán en Supabase

## 🔍 Verificar que Funciona

Si todo está bien, deberías ver:
- ✅ Todos los steps en verde
- ✅ Archivos JSON en los artifacts
- ✅ Mensaje "Workflow completado exitosamente"

## ❌ Si Hay Errores

Si algo falla:
1. Haz clic en el step que falló para ver los logs
2. Los errores más comunes:
   - **Playwright no instalado**: Se instala automáticamente, pero puede tardar
   - **Timeout**: El sitio puede estar lento, el workflow tiene timeouts configurados
   - **Secretos faltantes**: Si usas Supabase, verifica que los secretos estén configurados

## 📊 Ejecución Automática

Recuerda que el workflow también se ejecutará automáticamente:
- **Miércoles**: 00:00 UTC (21:00 ARG del miércoles)
- **Domingo**: 00:00 UTC (21:00 ARG del domingo)

¡Listo para probar! 🎉

