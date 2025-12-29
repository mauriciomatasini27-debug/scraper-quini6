# 🚀 Configuración de GitHub Actions

Guía completa para configurar y usar GitHub Actions para automatizar el scraping del Quini 6.

## ✅ Checklist de Configuración

### 1. Secretos de GitHub (Obligatorio)

Ve a tu repositorio en GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

#### Secretos Requeridos:

| Secreto | Descripción | Dónde obtenerlo |
|---------|-------------|-----------------|
| `CRAWLBASE_JS_TOKEN` | Token de Crawlbase (opcional) | [Crawlbase Dashboard](https://crawlbase.com) |
| `SUPABASE_URL` | URL de tu proyecto Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Service Role Key de Supabase | Supabase Dashboard → Settings → API → Service Role Key |

⚠️ **IMPORTANTE**: Para Supabase, usa la **Service Role Key** (no la anon key) para tener permisos completos.

### 2. Verificar el Workflow

El archivo `.github/workflows/scraper_cron.yml` ya está configurado para:

- ✅ Ejecutarse automáticamente los **miércoles y domingos a las 21:30 ARG** (00:30 UTC del día siguiente)
- ✅ Usar los secretos configurados automáticamente
- ✅ Guardar resultados como artifacts
- ✅ Ejecución manual disponible

### 3. Primer Ejecución

#### Opción A: Esperar la ejecución automática
El workflow se ejecutará automáticamente según el cron configurado.

#### Opción B: Ejecución manual (recomendado para probar)

1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **Quini 6 Scraper Automático**
3. Haz clic en **Run workflow**
4. (Opcional) Especifica un año si quieres procesar uno específico
5. Haz clic en **Run workflow**

## 📅 Horarios de Ejecución

El workflow está configurado para ejecutarse:

- **Miércoles**: 00:30 UTC (Jueves) = **21:30 ARG** (Miércoles)
- **Domingo**: 00:30 UTC (Lunes) = **21:30 ARG** (Domingo)

Esto da un margen de **2 horas** después del sorteo típico (19:30 ARG).

### Ajustar el Horario

Si necesitas cambiar el horario, edita `.github/workflows/scraper_cron.yml`:

```yaml
schedule:
  # Formato: 'minuto hora día-mes día-semana'
  # Para ejecutar a las 21:00 ARG (00:00 UTC del día siguiente):
  - cron: '0 0 * * 4'  # Jueves 00:00 UTC = Miércoles 21:00 ARG
  - cron: '0 0 * * 1'  # Lunes 00:00 UTC = Domingo 21:00 ARG
```

## 🔍 Ver Resultados

### En GitHub Actions

1. Ve a **Actions** → **Quini 6 Scraper Automático**
2. Selecciona la ejecución que quieres ver
3. Revisa los logs de cada step
4. Descarga los artifacts desde la sección **Artifacts**

### En Supabase (si está configurado)

1. Ve a tu proyecto en Supabase
2. Navega a **Table Editor**
3. Selecciona la tabla `sorteos`
4. Verás todos los sorteos almacenados

## 📊 Artifacts

Los resultados se guardan automáticamente como artifacts:

- **Nombre**: `resultados-quini6-{run_number}`
- **Retención**: 90 días
- **Contenido**: Todos los archivos JSON generados en `data/`

Para descargar:

1. Ve a la ejecución del workflow
2. Scroll hasta la sección **Artifacts**
3. Haz clic en el artifact para descargarlo

## 🔔 Notificaciones

Puedes configurar notificaciones de GitHub para:

- ✅ Éxito del workflow
- ❌ Fallos del workflow
- ⚠️ Cancelaciones

Ve a: **Settings → Notifications → Actions**

## 🛠️ Solución de Problemas

### El workflow no se ejecuta automáticamente

- Verifica que el archivo `.github/workflows/scraper_cron.yml` esté en la rama principal
- Los workflows programados solo se activan en la rama por defecto
- GitHub puede tener un delay de hasta 15 minutos para workflows programados

### Error: "Playwright browsers not found"

El workflow incluye el step para instalar Playwright. Si falla:

```yaml
- name: 🎭 Instalar Playwright
  run: npx playwright install --with-deps chromium
```

### Error: "Supabase connection failed"

- Verifica que `SUPABASE_URL` y `SUPABASE_KEY` estén configurados correctamente
- Usa la Service Role Key, no la anon key
- Verifica que la tabla `sorteos` exista en Supabase

### El workflow tarda mucho

- Los workflows de GitHub tienen un límite de 6 horas
- Si procesas muchos años, considera dividir en múltiples workflows
- O usa `workflow_dispatch` con parámetros para procesar un año a la vez

## 💰 Costos

GitHub Actions es **gratuito** para:

- ✅ Repositorios públicos: Ilimitado
- ✅ Repositorios privados: 2,000 minutos/mes gratis

Cada ejecución típicamente toma 5-15 minutos, así que puedes ejecutar cientos de veces por mes sin costo adicional.

## 🔐 Seguridad

- ✅ Los secretos nunca se muestran en los logs
- ✅ Solo los colaboradores del repositorio pueden ver los secretos
- ✅ Los artifacts son privados (solo accesibles para colaboradores)

## 📝 Próximos Pasos

Una vez configurado:

1. ✅ El workflow se ejecutará automáticamente según el cron
2. ✅ Los resultados se guardarán en artifacts
3. ✅ Los datos se almacenarán en Supabase (si está configurado)
4. ✅ Podrás ejecutar manualmente cuando lo necesites

¡Disfruta de tu scraper completamente automatizado! 🎉

