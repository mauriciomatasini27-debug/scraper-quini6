# Frontend - Protocolo Lyra Dashboard

Dashboard predictivo para Quini 6 basado en Next.js 15, React Server Components, y el Protocolo Lyra.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
- Variables de entorno configuradas (ver `.env.local.example`)

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en modo desarrollo
npm run dev:frontend
```

La aplicación estará disponible en `http://localhost:3000`

### Build de Producción

```bash
# Construir para producción
npm run build:frontend

# Iniciar servidor de producción
npm run start:frontend
```

## 📁 Estructura del Proyecto

```
app/
├── components/
│   ├── ui/              # Componentes base de Shadcn/UI
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   └── skeleton.tsx
│   ├── layout/          # Componentes de layout
│   │   └── sidebar.tsx
│   ├── juez-final/      # Componentes del Juez Final
│   │   ├── juez-final-card.tsx
│   │   └── juez-final-section.tsx
│   └── heatmap/         # Componentes de visualización
│       └── number-heatmap.tsx
├── lib/
│   ├── supabase.ts      # Cliente de Supabase
│   ├── queries.ts       # Funciones de consulta a Supabase
│   └── utils.ts         # Utilidades (cn para clases)
├── types/
│   └── index.ts         # Tipos compartidos para el frontend
├── providers.tsx        # Providers (React Query)
├── layout.tsx           # Layout raíz
├── page.tsx             # Página principal
└── globals.css          # Estilos globales con Tailwind
```

## 🎨 Diseño y Estilo

### Paleta de Colores (Protocolo Lyra)

El diseño sigue una paleta oscura (Dark Mode) con acentos específicos:

- **Background**: Azul muy oscuro (`hsl(222, 47%, 11%)`)
- **Cards**: Azul casi negro (`hsl(224, 71%, 4%)`)
- **Primary**: Azul eléctrico (`hsl(217, 91%, 60%)`)
- **Secondary**: Verde esmeralda (`hsl(158, 64%, 52%)`)
- **Muted**: Gris azulado oscuro (`hsl(217, 33%, 17%)`)

### Componentes Principales

#### JuezFinalSection
Muestra las top 3 combinaciones recomendadas por la IA con:
- Tarjetas animadas con Framer Motion
- Indicadores visuales de posición (🥇🥈🥉)
- Análisis técnico y razones de selección

#### NumberHeatmap
Visualización de la frecuencia de aparición de números (00-45):
- Mapa de calor usando Recharts Treemap
- Colores desde azul oscuro (baja frecuencia) hasta verde esmeralda (alta frecuencia)
- Tooltips informativos

## 🔌 Integración con Supabase

### Variables de Entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

**Importante**: Usa la clave anónima (anon key), no la clave de servicio (service role key).

### Tablas Utilizadas

1. **ai_predictions**: Predicciones del Juez Final
   - `combinacion_1`, `combinacion_2`, `combinacion_3`
   - `analisis_tecnico`, `razones`
   - `fecha_sorteo`, `created_at`

2. **resultados_quini**: Resultados históricos
   - `tradicional` (array de números)
   - `fecha`, `sorteo_numero`

## 📊 Gestión de Estado

Se utiliza **TanStack Query (React Query)** para:
- Caché automático de consultas
- Refetching inteligente
- Estados de carga y error
- Sincronización con Supabase

### Ejemplo de Uso

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['ultima-prediccion'],
  queryFn: obtenerUltimaPrediccion,
});
```

## 🎭 Animaciones

Se utiliza **Framer Motion** para:
- Transiciones suaves en componentes
- Animaciones de entrada
- Efectos hover en tarjetas

## 📱 Responsive Design

El dashboard es totalmente responsive:
- **Desktop**: Sidebar fijo visible
- **Mobile/Tablet**: Sidebar oculto, navegación adaptada
- **Grids**: Adaptativos de 3 columnas a 1 columna

## 🛠️ Tecnologías

- **Next.js 15**: Framework React con App Router
- **React 18**: UI Library
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **Shadcn/UI**: Componentes base
- **TanStack Query**: Gestión de estado y caché
- **Supabase**: Backend y base de datos
- **Recharts**: Visualización de datos
- **Framer Motion**: Animaciones

## 📝 Próximos Pasos

- [ ] Página de estadísticas detalladas
- [ ] Histórico de predicciones
- [ ] Comparación de precisión
- [ ] Filtros avanzados
- [ ] Exportación de datos
- [ ] Modo claro/oscuro toggle

## 🐛 Troubleshooting

### Error: "Supabase no configurado"
- Verifica que `.env.local` exista y tenga las variables correctas
- Reinicia el servidor de desarrollo después de cambiar variables de entorno

### Error: "No se pudo obtener predicciones"
- Verifica que la tabla `ai_predictions` exista en Supabase
- Verifica los permisos RLS (Row Level Security) en Supabase
- Asegúrate de usar la clave anónima correcta

### El sidebar no se muestra
- Es normal en pantallas pequeñas (< 1024px)
- En desktop, verifica que la clase `lg:block` esté aplicada

