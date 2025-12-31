# Motor de Probabilidades para Análisis de Lotería (Quiniela)

## Descripción

Motor robusto en TypeScript diseñado para procesar resultados históricos de la quiniela (años 2020-2025). El objetivo **no es la predicción azarosa**, sino la **reducción del espacio de búsqueda** mediante:

- Identificación de anomalías estadísticas
- Cálculo de probabilidades de transición (Markov)
- Aplicación de filtros heurísticos

## Arquitectura

El motor está estructurado en módulos independientes y modulares:

```
src/engine/
├── types/              # Interfaces y tipos TypeScript
├── ingestion/          # Data Ingestion - Carga y normalización de datos
├── statistical/        # Statistical Core - Cálculos estadísticos
├── markov/             # Markov Chain Engine - Matriz de transición
├── filters/            # Heuristic Filters - Filtros de reducción
├── index.ts            # Punto de entrada principal
└── ejemplo-uso.ts      # Ejemplos de uso
```

## Módulos

### 1. Data Ingestion (`ingestion/DataIngestion.ts`)

Responsable de:
- Cargar datos históricos desde archivos JSON (2020-2025)
- Normalizar datos del formato de scraping al formato de análisis
- Filtrar por modalidad (tradicional, segunda, revancha, siempreSale)
- Calcular métricas básicas (suma, paridad, espaciado)

### 2. Statistical Core (`statistical/StatisticalCore.ts`)

Calcula estadísticas fundamentales:
- **Frecuencias**: Frecuencia absoluta y relativa de cada número
- **Desviación Estándar (σ)**: Medida de dispersión
- **Atrasos (Delays)**: Sorteos desde última aparición, promedio y desviación
- **Medias Móviles**: Para ventanas configurables (5, 10, 20 sorteos)

### 3. Markov Chain Engine (`markov/MarkovChainEngine.ts`)

Implementa cadenas de Markov:
- **Matriz de Transición**: `M[i][j]` = probabilidad de que aparezca `j` dado que apareció `i`
- **Transiciones**: Dentro del mismo sorteo y entre sorteos consecutivos
- **Probabilidades**: Cálculo de probabilidad de combinaciones completas

### 4. Heuristic Filters (`filters/HeuristicFilters.ts`)

Filtros para reducir el espacio de búsqueda:

- **Paridad**: Filtro por cantidad de pares/impares
- **Sumas**: Filtro basado en distribución normal (Campana de Gauss)
- **Espaciado**: Filtro por distancia mínima/máxima entre números
- **Atrasos**: Priorización de números con atraso alto

## Uso Básico

```typescript
import { MotorProbabilidades, ConfiguracionMotor, FiltrosHeuristicos } from './engine';

// 1. Configurar el motor
const configuracion: ConfiguracionMotor = {
  modalidad: 'tradicional',
  rangoNumeros: { min: 1, max: 46 },
  ventanasMediaMovil: [5, 10, 20],
  umbralDesviacion: 1.5,
  habilitarFiltros: {
    paridad: true,
    suma: true,
    espaciado: true,
    atraso: true
  }
};

// 2. Crear instancia
const motor = new MotorProbabilidades(configuracion);

// 3. Definir filtros
const filtros: FiltrosHeuristicos = {
  paridad: {
    minPares: 2,
    maxPares: 4
  },
  suma: {
    desviacionesEstandar: 2
  },
  espaciado: {
    minDistancia: 1,
    maxDistancia: 15
  }
};

// 4. Ejecutar análisis
const resultado = await motor.ejecutarAnalisis(
  [2020, 2021, 2022, 2023, 2024, 2025],
  filtros
);

// 5. Acceder a resultados
console.log(`Números con atraso alto: ${resultado.anomalias.numerosConAtrasoAlto}`);
console.log(`Reducción del espacio: ${resultado.resultadoFiltrado.porcentajeReduccion}%`);
```

## Estructura de Datos

### SorteoNormalizado

Representa un sorteo normalizado para análisis:

```typescript
interface SorteoNormalizado {
  numeroSorteo: number;
  fecha: Date;
  fechaISO: string;
  modalidad: ModalidadSorteo;
  numeros: Combinacion; // [1-46, 1-46, ...]
  suma: number;
  paridad: { pares: number; impares: number };
  espaciado: number[];
}
```

### AnalisisEstadistico

Contiene el análisis estadístico completo:

```typescript
interface AnalisisEstadistico {
  periodo: { fechaInicio, fechaFin, totalSorteos };
  frecuencias: Map<NumeroQuini, EstadisticaFrecuencia>;
  desviacionEstandar: number;
  media: number;
  mediasMoviles: { ventana5, ventana10, ventana20 };
  matrizTransicion: MatrizTransicion;
}
```

## Enfoque Matemático

### Reducción del Espacio de Búsqueda

El motor **no predice números**, sino que:

1. **Identifica anomalías**: Números con atraso alto (> σ del promedio)
2. **Calcula probabilidades**: Usando cadenas de Markov para transiciones
3. **Aplica filtros**: Reduce combinaciones inválidas según heurísticas
4. **Reporta desviaciones**: Identifica números con frecuencia atípica

### Filtros Heurísticos

- **Paridad**: Históricamente, las combinaciones ganadoras suelen tener 2-4 pares
- **Sumas**: Distribución normal con media ~141 y σ ~20
- **Espaciado**: Evita números muy juntos o muy separados
- **Atrasos**: Prioriza números que "deben" aparecer según estadística

## Rendimiento

- Optimizado para procesar miles de registros
- Uso eficiente de memoria con Map/Set
- Cálculos estadísticos en O(n) donde sea posible
- Generación de combinaciones bajo demanda

## Próximos Pasos

- [ ] Integración con base de datos (Supabase)
- [ ] API REST para consultas
- [ ] Visualización de resultados
- [ ] Exportación de reportes
- [ ] Optimización de algoritmos de filtrado

## Notas Importantes

⚠️ **Este motor NO garantiza predicciones**. Su propósito es:
- Análisis estadístico de datos históricos
- Reducción del espacio de búsqueda mediante filtros
- Identificación de patrones y anomalías

El azar sigue siendo el factor determinante en los sorteos de lotería.

