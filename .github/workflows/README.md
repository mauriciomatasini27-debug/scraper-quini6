# GitHub Actions - Scraper Automático Quini 6

Este workflow automatiza la extracción de resultados del Quini 6 usando GitHub Actions.

## ⚙️ Configuración

### 1. Configurar Secretos de GitHub

Ve a: **Settings → Secrets and variables → Actions → New repository secret**

Agrega los siguientes secretos:

- `CRAWLBASE_JS_TOKEN` (opcional): Token de Crawlbase para usar como fallback
- `SUPABASE_URL` (opcional): URL de tu proyecto Supabase
- `SUPABASE_KEY` (opcional): Clave de API de Supabase

### 2. Horarios de Ejecución

El workflow está configurado para ejecutarse:
- **Miércoles**: 22:00 UTC (19:00 hora Argentina)
- **Domingo**: 22:00 UTC (19:00 hora Argentina)

Esto da un margen de 30 minutos después del sorteo típico (19:30 ARG).

### 3. Ejecución Manual

Puedes ejecutar el workflow manualmente desde:
**Actions → Quini 6 Scraper Automático → Run workflow**

Opcionalmente puedes especificar un año específico.

## 📋 Estructura del Workflow

1. **Checkout**: Obtiene el código del repositorio
2. **Setup Node.js**: Configura Node.js 20 con cache
3. **Instalar dependencias**: `npm ci` para instalación limpia
4. **Instalar Playwright**: Instala Chromium y dependencias
5. **Configurar variables**: Configura secretos como variables de entorno
6. **Compilar**: Compila TypeScript a JavaScript
7. **Ejecutar scraper**: Ejecuta el scraper con las variables configuradas
8. **Subir artifacts**: Guarda los JSON generados como artifacts
9. **Resumen**: Genera un resumen de la ejecución

## 🎯 Ventajas de GitHub Actions

- ✅ **Gratuito** para repositorios públicos
- ✅ **Confiable**: Infraestructura gestionada por GitHub
- ✅ **No requiere servidor propio**: Todo corre en la nube
- ✅ **Historial**: Todas las ejecuciones quedan registradas
- ✅ **Artifacts**: Los resultados se guardan automáticamente
- ✅ **Notificaciones**: Integración con GitHub para alertas

## 🔍 Ver Resultados

1. Ve a la pestaña **Actions** en GitHub
2. Selecciona la ejecución que quieres ver
3. Descarga los artifacts desde la sección "Artifacts"

## ⚠️ Notas Importantes

- Los artifacts se mantienen por 90 días
- El workflow usa Ubuntu latest
- Se ejecuta en UTC, ajusta los horarios según tu zona horaria
- Argentina (UTC-3): 22:00 UTC = 19:00 ARG

