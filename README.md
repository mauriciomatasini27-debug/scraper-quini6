# 🎰 Scraper Automatizado Quini 6

Sistema completo de web scraping automatizado para extraer, validar y almacenar resultados históricos del Quini 6 desde 2020 hasta la fecha actual. Incluye automatización mediante GitHub Actions, integración con Supabase, y scraping incremental para actualizaciones eficientes.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40-green)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Configuración](#-configuración)
- [Automatización](#-automatización)
- [Base de Datos](#-base-de-datos)
- [Estructura de Datos](#-estructura-de-datos)
- [Validación](#-validación)
- [Documentación Adicional](#-documentación-adicional)
- [Solución de Problemas](#-solución-de-problemas)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🚀 Características Principales

### ✨ Funcionalidades Core

- ✅ **Extracción Completa**: Scraping de todos los sorteos históricos (2020-2025)
- ✅ **Tipado Estricto**: TypeScript con interfaces y tipos definidos
- ✅ **Validación Automática**: Sistema exhaustivo de validación de integridad de datos
- ✅ **Manejo Robusto de Errores**: Sistema de reintentos (hasta 3 intentos por sorteo)
- ✅ **Scraping Incremental**: Solo extrae sorteos nuevos, optimizando tiempo y recursos
- ✅ **Múltiples Modalidades**: Extrae datos de 5 modalidades por sorteo:
  - Tradicional Primer Sorteo
  - Tradicional la Segunda
  - Revancha
  - El Quini que Siempre Sale
  - Pozo Extra (cuando aplica)

### 🤖 Automatización

- ✅ **GitHub Actions**: Workflow automatizado que se ejecuta miércoles y domingos
- ✅ **Cron Jobs Locales**: Scheduler con node-cron para ejecución local
- ✅ **Scraping Incremental**: Compara con datos existentes y solo extrae lo nuevo
- ✅ **Persistencia de Artifacts**: Descarga automática de datos previos en GitHub Actions

### 💾 Integración con Base de Datos

- ✅ **Supabase Integration**: Guardado automático en Supabase (PostgreSQL)
- ✅ **Importación Masiva**: Scripts para importar datos históricos (2020-2025)
- ✅ **Operaciones Batch**: Upsert masivo optimizado para miles de registros
- ✅ **Doble Método**: Soporte para REST API y conexión directa PostgreSQL

### 🔍 Validación y Calidad

- ✅ **Verificación de Integridad**: Detecta sorteos faltantes en rangos
- ✅ **Validación de Formato**: Verifica que los números estén en rango válido (00-45)
- ✅ **Orden Cronológico**: Valida que las fechas estén en orden correcto
- ✅ **Datos Completos**: Verifica que cada sorteo tenga todos los campos requeridos

---

## 🛠️ Tecnologías Utilizadas

### Lenguajes y Runtime
- **TypeScript 5.3**: Lenguaje principal con tipado estático estricto
- **Node.js 20+**: Runtime de ejecución
- **CommonJS**: Sistema de módulos

### Librerías Principales
- **Playwright 1.40**: Automatización de navegador headless para web scraping
- **@supabase/supabase-js 2.89**: Cliente oficial de Supabase para integración REST API
- **pg 8.16**: Cliente PostgreSQL nativo para conexión directa
- **node-cron 3.0**: Programación de tareas automatizadas
- **dotenv**: Gestión de variables de entorno

### Herramientas de Desarrollo
- **ts-node**: Ejecución directa de TypeScript sin compilación previa
- **TypeScript Compiler**: Compilación y validación de tipos
- **Git**: Control de versiones
- **npm**: Gestión de dependencias

### Plataformas y Servicios
- **GitHub Actions**: CI/CD y automatización en la nube
- **Supabase**: Base de datos PostgreSQL como servicio
- **PostgreSQL**: Base de datos relacional
- **Crawlbase** (opcional): Servicio anti-CAPTCHA para casos especiales

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- Git (para clonar el repositorio)

### Pasos de Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tu-usuario/scraper-quini6.git
cd scraper-quini6
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Instalar Playwright y navegadores**:
```bash
npx playwright install chromium
```

4. **Configurar variables de entorno** (opcional):
```bash
cp env.example.txt .env
# Editar .env con tus credenciales
```

---

## 🎯 Uso

### Scraping Manual

#### Extraer un año específico:
```bash
# Año 2025 (por defecto)
npm run scrape:2025

# Año 2024
npm run scrape:2024

# Años 2020-2023
npm run scrape:2020-2023
```

#### Modo desarrollo (sin compilar):
```bash
npm run dev
```

#### Compilar y ejecutar:
```bash
npm run build
npm start
```

### Scraping Incremental

Para extraer solo los sorteos nuevos (útil para actualizaciones):

```bash
# Compilar primero
npm run build

# Ejecutar modo incremental
node dist/index-incremental.js [año]
```

### Importar Datos Históricos a Supabase

#### Opción 1: Usando REST API (Recomendado)
```bash
npm run import:history
```

#### Opción 2: Usando conexión directa PostgreSQL
```bash
npm run import:history:pg
```

### Scheduler Local

Para ejecutar el scraper automáticamente los miércoles y domingos:

```bash
npm run scheduler
```

Ver [SCHEDULER.md](./SCHEDULER.md) para más detalles sobre configuración como servicio.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
scraperquini6/
├── .github/
│   └── workflows/
│       └── scraper_cron.yml      # Workflow de GitHub Actions
├── data/                          # Datos extraídos (JSON) - NO se sube a Git
│   ├── quini_2020_completo.json
│   ├── quini_2021_completo.json
│   ├── quini_2022_completo.json
│   ├── quini_2023_completo.json
│   ├── quini_2024_completo.json
│   └── quini_2025_completo.json
├── dist/                          # Código compilado (generado) - NO se sube a Git
├── src/
│   ├── scraper.ts                 # Clase principal de scraping
│   ├── validator.ts               # Validación de datos
│   ├── types.ts                   # Definiciones TypeScript
│   ├── supabase-client.ts         # Cliente Supabase
│   ├── index.ts                   # Entry point principal
│   ├── index-2024.ts              # Script específico para 2024
│   ├── index-incremental.ts       # Scraping incremental
│   ├── index-multi-year.ts        # Scraping múltiples años
│   ├── index-scheduler.ts          # Scheduler local
│   └── scripts/
│       ├── importHistory.ts       # Importación masiva (REST API)
│       ├── importHistoryPg.ts     # Importación masiva (PostgreSQL)
│       └── README.md               # Documentación de scripts
├── .env                            # Variables de entorno (NO se sube a Git)
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md                       # Este archivo
└── [Documentación adicional]      # Varios archivos .md de guías
```

### Componentes Principales

#### 1. `Quini6Scraper` (`src/scraper.ts`)
Clase principal que maneja todo el proceso de scraping:
- Inicialización del navegador Playwright
- Navegación y extracción de enlaces de sorteos
- Extracción de datos de cada sorteo
- Manejo de errores y reintentos
- Guardado de resultados en JSON

#### 2. `ValidadorSorteos` (`src/validator.ts`)
Sistema de validación exhaustiva:
- Verificación de sorteos faltantes
- Validación de formato de números
- Verificación de orden cronológico
- Detección de datos incompletos

#### 3. `supabase-client.ts`
Integración con Supabase:
- Configuración desde variables de entorno
- Mapeo de datos a formato de base de datos
- Operaciones batch (upsert masivo)
- Manejo de errores de conexión

#### 4. Scripts de Importación
- `importHistory.ts`: Usa REST API de Supabase
- `importHistoryPg.ts`: Usa conexión directa PostgreSQL

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Crawlbase (opcional - para casos de CAPTCHA)
CRAWLBASE_JS_TOKEN=tu_token_crawlbase

# Supabase (opcional - para guardar en base de datos)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key

# PostgreSQL Direct (opcional - alternativa a REST API)
DATABASE_URL=postgresql://user:password@host:port/database
```

**Nota**: Usa la **Service Role Key** de Supabase, no la anon key, para tener permisos completos.

Ver [CONFIGURAR_ENV.md](./CONFIGURAR_ENV.md) para más detalles.

### Configuración del Scraper

Puedes modificar estos valores en `src/scraper.ts`:

```typescript
private maxReintentos = 3;              // Reintentos por sorteo fallido
private delayEntreRequests = 2000;      // Delay entre requests (ms)
private navigationTimeout = 60000;      // Timeout de navegación (ms)
```

### Configuración de GitHub Actions

1. Ve a **Settings → Secrets and variables → Actions** en tu repositorio
2. Agrega los siguientes secretos:
   - `CRAWLBASE_JS_TOKEN` (opcional)
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

Ver [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) para instrucciones detalladas.

### Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el SQL en `create_table_resultados_quini.sql` para crear la tabla
3. Obtén tu URL y Service Role Key desde Settings → API

Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) y [CREAR_TABLA_SUPABASE.md](./CREAR_TABLA_SUPABASE.md) para más detalles.

---

## 🤖 Automatización

### GitHub Actions (Recomendado)

El workflow se ejecuta automáticamente:
- **Miércoles a las 21:00 ARG** (después del sorteo de las 19:30)
- **Domingo a las 21:00 ARG** (después del sorteo de las 19:30)

**Características**:
- ✅ Descarga automática de artifacts previos
- ✅ Scraping incremental (solo sorteos nuevos)
- ✅ Guardado en Supabase (si está configurado)
- ✅ Upload de artifacts para próxima ejecución
- ✅ Ejecución manual disponible desde GitHub Actions UI

**Ver ejecuciones**: Ve a la pestaña "Actions" en tu repositorio de GitHub.

Ver [EJECUTAR_WORKFLOW.md](./EJECUTAR_WORKFLOW.md) para ejecutar manualmente.

### Scheduler Local

Para ejecutar localmente con node-cron:

```bash
npm run scheduler
```

El scheduler ejecutará el scraping los miércoles y domingos a las 20:00 (hora local).

**Ver**: [SCHEDULER.md](./SCHEDULER.md) para configuración como servicio de Windows/Linux.

---

## 💾 Base de Datos

### Esquema de Tabla

La tabla `resultados_quini` tiene la siguiente estructura:

```sql
CREATE TABLE resultados_quini (
  id BIGSERIAL PRIMARY KEY,
  sorteo_numero INTEGER UNIQUE NOT NULL,
  fecha DATE NOT NULL,
  fecha_texto VARCHAR(20),
  año INTEGER NOT NULL,
  tradicional INTEGER[] NOT NULL,
  la_segunda INTEGER[] NOT NULL,
  revancha INTEGER[] NOT NULL,
  siempre_sale INTEGER[] NOT NULL,
  pozo_extra JSONB,
  url TEXT,
  extraido_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Ver `create_table_resultados_quini.sql` para el script completo.

### Importación de Datos

#### Importar todos los datos históricos (2020-2025):

```bash
# Opción 1: REST API (más simple)
npm run import:history

# Opción 2: PostgreSQL directo (más rápido para grandes volúmenes)
npm run import:history:pg
```

**Nota**: Los scripts detectan y eliminan duplicados automáticamente antes de insertar.

Ver [src/scripts/README.md](./src/scripts/README.md) para más detalles.

---

## 📊 Estructura de Datos

### Formato JSON de Salida

Los resultados se guardan en `data/quini_[año]_completo.json`:

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
      "segunda": { /* ... */ },
      "revancha": { /* ... */ },
      "siempreSale": { /* ... */ },
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

### Mapeo a Base de Datos

Los números se transforman de objetos a arrays:
- `tradicional.numeros` → `tradicional INTEGER[]`
- `segunda.numeros` → `la_segunda INTEGER[]`
- `revancha.numeros` → `revancha INTEGER[]`
- `siempreSale.numeros` → `siempre_sale INTEGER[]`

---

## 🔍 Validación

El sistema de validación verifica:

1. **Integridad de Rangos**: Detecta sorteos faltantes entre el primero y último sorteo del año
2. **Formato de Números**: Verifica que todos los números estén en rango válido (00-45)
3. **Orden Cronológico**: Valida que las fechas estén en orden ascendente
4. **Datos Completos**: Verifica que cada sorteo tenga todas las modalidades requeridas
5. **Formato de Fechas**: Valida formato ISO y formato legible

**Ejemplo de salida de validación**:
```
🔍 Validando sorteos del #3000 al #3333...
✅ Validación completada:
   - Total sorteos: 165
   - Sorteos faltantes: 0
   - Advertencias: 0
```

---

## 📚 Documentación Adicional

El proyecto incluye documentación detallada en varios archivos:

- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)**: Configuración de GitHub Actions
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**: Configuración de Supabase
- **[CREAR_TABLA_SUPABASE.md](./CREAR_TABLA_SUPABASE.md)**: Guía paso a paso para crear la tabla
- **[SCHEDULER.md](./SCHEDULER.md)**: Configuración del scheduler local
- **[CONFIGURAR_ENV.md](./CONFIGURAR_ENV.md)**: Configuración de variables de entorno
- **[ACTUALIZAR_ENV.md](./ACTUALIZAR_ENV.md)**: Actualizar variables de entorno para PostgreSQL
- **[src/scripts/README.md](./src/scripts/README.md)**: Documentación de scripts de importación
- **[EJECUTAR_WORKFLOW.md](./EJECUTAR_WORKFLOW.md)**: Cómo ejecutar workflows manualmente
- **[GIT_SETUP.md](./GIT_SETUP.md)**: Configuración de Git
- **[CONFIGURAR_GITHUB.md](./CONFIGURAR_GITHUB.md)**: Configurar repositorio remoto
- **[VERIFICAR_REPOSITORIO.md](./VERIFICAR_REPOSITORIO.md)**: Verificar información del repositorio

---

## 🐛 Solución de Problemas

### Error: "Página no inicializada"
**Solución**: Asegúrate de que Playwright esté instalado:
```bash
npx playwright install chromium
```

### Error: "No se encontraron enlaces de sorteos"
**Causas posibles**:
- Problemas de conexión a internet
- El sitio está temporalmente no disponible
- Cambios en la estructura HTML del sitio

**Solución**: Verifica tu conexión y ejecuta nuevamente. Si persiste, revisa los selectores en `scraper.ts`.

### Sorteos Faltantes
**Causa**: Algunos sorteos pueden fallar en la extracción inicial.

**Solución**: 
1. Revisa el array `sorteosPendientes` en el JSON de salida
2. Ejecuta el scraper nuevamente (solo procesará los faltantes si usas modo incremental)

### Error de Supabase: "ON CONFLICT DO UPDATE command cannot affect row a second time"
**Causa**: Duplicados dentro del mismo batch.

**Solución**: Los scripts de importación ya manejan esto automáticamente eliminando duplicados antes de insertar.

### Timeout en GitHub Actions
**Solución**: Aumenta el timeout en el workflow o divide la ejecución en batches más pequeños.

---

## 📈 Mejoras Futuras

- [ ] Soporte para otros juegos de lotería
- [ ] Dashboard web para visualizar datos
- [ ] API REST para consultar datos
- [ ] Análisis estadístico de números
- [ ] Notificaciones cuando hay sorteos nuevos
- [ ] Exportación a otros formatos (CSV, Excel)

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 👤 Autor

Desarrollado con ❤️ para extracción automatizada de datos públicos.

---

## 🙏 Agradecimientos

- [Playwright](https://playwright.dev/) por la excelente herramienta de automatización
- [Supabase](https://supabase.com/) por el servicio de base de datos
- [GitHub Actions](https://github.com/features/actions) por la plataforma de CI/CD

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**
