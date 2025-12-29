# Scraper Quini 6 - Año 2025

Script en TypeScript para extraer todos los resultados históricos del Quini 6 correspondientes al año 2025 desde https://www.quini-6.com.ar/.

## 🚀 Características

- ✅ Extracción completa de todos los sorteos del año 2025
- ✅ Tipado estricto en TypeScript
- ✅ Validación automática de integridad de datos
- ✅ Sistema de reintentos para manejo de errores
- ✅ Extracción de todas las modalidades:
  - Tradicional Primer Sorteo
  - Tradicional la Segunda
  - Revancha
  - El Quini que Siempre Sale
  - Pozo Extra
- ✅ Guardado en formato JSON estructurado

## 📋 Requisitos

- Node.js 18 o superior
- npm o yarn

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Instalar los navegadores de Playwright:
```bash
npx playwright install chromium
```

## 🎯 Uso

### Ejecutar el scraper manualmente:

```bash
npm run scrape
```

O en modo desarrollo (con ts-node):

```bash
npm run dev
```

### Scraping por año específico:

```bash
npm run scrape:2024    # Extraer año 2024
npm run scrape:2025    # Extraer año 2025
npm run scrape:2020-2023  # Extraer años 2020-2023
```

### 🤖 Ejecutar el Scheduler Automático:

#### Opción 1: GitHub Actions (Recomendado) ⭐

El workflow de GitHub Actions ejecuta el scraping automáticamente los **miércoles y domingos a las 21:30 ARG**:

1. Configura los secretos en GitHub (ver [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md))
2. El workflow se ejecutará automáticamente según el cron configurado
3. Los resultados se guardan como artifacts y en Supabase (opcional)

**Ventajas**:
- ✅ Gratuito para repositorios públicos
- ✅ No requiere servidor propio
- ✅ Completamente automatizado en la nube
- ✅ Historial completo de ejecuciones

#### Opción 2: Scheduler Local

Ejecuta el scraping localmente los **miércoles y domingos a las 20:00**:

```bash
npm run scheduler
```

Ver [SCHEDULER.md](./SCHEDULER.md) para más información sobre cómo configurar el scheduler como servicio local.

### Compilar TypeScript:

```bash
npm run build
```

### Ejecutar la versión compilada:

```bash
npm start
```

## 📁 Estructura del Proyecto

```
scraperquini6/
├── src/
│   ├── index.ts          # Punto de entrada principal
│   ├── scraper.ts        # Lógica de scraping con Playwright
│   ├── validator.ts      # Validación de datos extraídos
│   └── types.ts          # Definiciones de tipos TypeScript
├── data/                 # Directorio de salida (se crea automáticamente)
│   └── quini_2025_completo.json
├── dist/                 # Código compilado (se crea automáticamente)
├── package.json
├── tsconfig.json
└── README.md
```

## 📊 Formato de Salida

Los resultados se guardan en `data/quini_2025_completo.json` con la siguiente estructura:

```json
{
  "año": 2025,
  "totalSorteos": 165,
  "sorteos": [
    {
      "numeroSorteo": 3333,
      "fecha": "24/12/2025",
      "fechaISO": "2025-12-24",
      "tradicional": {
        "nombre": "Tradicional Primer Sorteo",
        "numeros": {
          "numero1": "08",
          "numero2": "10",
          "numero3": "25",
          "numero4": "33",
          "numero5": "35",
          "numero6": "42"
        }
      },
      "segunda": { ... },
      "revancha": { ... },
      "siempreSale": { ... },
      "pozoExtra": {
        "ganadores": 194,
        "premio": "670.103,09"
      },
      "url": "https://www.quini-6.com.ar/2025/12/resultados-del-24122025_24.html",
      "extraidoEn": "2025-12-25T10:30:00.000Z"
    }
  ],
  "sorteosPendientes": [],
  "errores": [],
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-24",
  "metadata": {
    "version": "1.0.0",
    "fechaExtraccion": "2025-12-25T10:30:00.000Z"
  }
}
```

## ⚙️ Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz del proyecto si deseas usar Crawlbase o Supabase:

```env
CRAWLBASE_JS_TOKEN=tu_token_aqui
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key
```

### Configuración de GitHub Actions

Para automatización completa en la nube, configura GitHub Actions:

1. Ve a **Settings → Secrets and variables → Actions**
2. Agrega los secretos: `CRAWLBASE_JS_TOKEN`, `SUPABASE_URL`, `SUPABASE_KEY`
3. El workflow se ejecutará automáticamente según el cron

Ver [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) para instrucciones detalladas.

### Configuración de Supabase (Opcional)

Si quieres almacenar los datos en Supabase, sigue la guía en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para configurar la base de datos.

### Configuración del Scraper

El scraper incluye las siguientes configuraciones por defecto:

- **Año objetivo**: 2025 (configurable en `scraper.ts`)
- **Máximo de reintentos**: 3
- **Delay entre requests**: 2 segundos
- **Timeout de página**: 30 segundos

Puedes modificar estos valores en `src/scraper.ts`:

```typescript
private año = 2025;
private maxReintentos = 3;
private delayEntreRequests = 2000;
```

## 🔍 Validación

El scraper incluye un sistema de validación que verifica:

- ✅ Que no falten sorteos en el rango
- ✅ Que cada sorteo tenga todos los datos requeridos
- ✅ Que las fechas estén en orden cronológico
- ✅ Que los números estén en el rango válido (00-45)
- ✅ Que el formato de los datos sea correcto

## ⚠️ Manejo de Errores

- Si una página no carga, el scraper intentará hasta 3 veces antes de marcarla como pendiente
- Los sorteos que no se puedan extraer se registrarán en `sorteosPendientes`
- Todos los errores se registrarán en el array `errores` del JSON de salida

## 🛡️ Consideraciones

- El scraper respeta los tiempos de espera entre requests para no sobrecargar el servidor
- Usa un User-Agent estándar para evitar bloqueos
- Si detectas problemas de captcha o bloqueos, puedes usar el token de Crawlbase (ver código)

## 📝 Notas

- El proceso puede tardar varios minutos dependiendo de la cantidad de sorteos
- Se recomienda ejecutar en un entorno estable con buena conexión a internet
- Los datos se guardan automáticamente al finalizar el proceso

## 🐛 Solución de Problemas

### Error: "Página no inicializada"
- Asegúrate de que Playwright esté instalado correctamente
- Ejecuta `npx playwright install chromium`

### Error: "No se encontraron enlaces de sorteos"
- Verifica tu conexión a internet
- El sitio puede estar temporalmente no disponible

### Sorteos faltantes
- Revisa el array `sorteosPendientes` en el JSON de salida
- Puedes ejecutar el scraper nuevamente para intentar obtenerlos

## 📄 Licencia

MIT

