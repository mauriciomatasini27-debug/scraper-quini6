# ✅ Verificación Post-Script SQL en Supabase

## 📋 Pasos de Verificación

### 1. Verificar que las Tablas se Crearon

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar tablas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('resultados_quini', 'ai_predictions')
ORDER BY table_name;
```

**Resultado esperado:**
- Deberías ver 2 filas: `resultados_quini` y `ai_predictions`
- Cada una debe tener el número correcto de columnas

---

### 2. Verificar que las Funciones se Crearon

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar funciones
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_updated_at_column', 'calcular_aciertos', 'update_aciertos_on_resultado_real')
ORDER BY routine_name;
```

**Resultado esperado:**
- Deberías ver 3 funciones:
  - `update_updated_at_column`
  - `calcular_aciertos`
  - `update_aciertos_on_resultado_real`

---

### 3. Verificar que los Triggers se Crearon

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('resultados_quini', 'ai_predictions')
ORDER BY event_object_table, trigger_name;
```

**Resultado esperado:**
- Deberías ver al menos 3 triggers:
  - `update_resultados_quini_updated_at` en `resultados_quini`
  - `update_ai_predictions_aciertos` en `ai_predictions`
  - `update_ai_predictions_updated_at` en `ai_predictions`

---

### 4. Verificar RLS (Row Level Security)

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar estado de RLS
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('resultados_quini', 'ai_predictions');
```

**Resultado esperado:**
- `rls_habilitado` debe ser `false` para ambas tablas
- Si es `true`, ejecuta:

```sql
ALTER TABLE resultados_quini DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions DISABLE ROW LEVEL SECURITY;
```

---

### 5. Verificar desde Table Editor (Opcional)

1. Ve a **Table Editor** en Supabase Dashboard
2. Deberías ver las tablas:
   - ✅ `resultados_quini`
   - ✅ `ai_predictions`
3. Puedes hacer clic en cada una para ver su estructura

---

## 🎯 ¿Qué Más Necesitas Hacer?

### Si las verificaciones pasan: ✅ **NADA MÁS**

El script SQL ya configuró todo lo necesario:
- ✅ Tablas creadas
- ✅ Funciones creadas con seguridad
- ✅ Triggers creados
- ✅ RLS deshabilitado

### Pasos Opcionales (Solo si los necesitas):

#### A. Importar Datos Históricos (Opcional)

Si tienes datos históricos en archivos JSON y quieres importarlos:

```bash
# Desde la terminal del proyecto
npm run import:history:pg:dev
```

**Requisitos:**
- Archivos JSON en la carpeta `data/`
- Variables de entorno configuradas en `.env`:
  - `DATABASE_URL` o componentes individuales (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.)

#### B. Configurar Políticas RLS (Solo para Producción)

Si planeas usar RLS en producción, crea políticas:

```sql
-- Permitir lectura pública (solo lectura)
CREATE POLICY "Permitir lectura pública de resultados"
ON resultados_quini
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir lectura pública de predicciones"
ON ai_predictions
FOR SELECT
TO anon, authenticated
USING (true);
```

**Nota:** Para desarrollo, RLS deshabilitado es suficiente.

#### C. Verificar Permisos de la Clave Publishable

La clave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` debe tener permisos para:
- ✅ Leer datos (SELECT)
- ❌ NO necesita escribir (INSERT/UPDATE) para el frontend

Si el frontend solo lee datos, no necesitas permisos adicionales.

---

## 🧪 Probar la Conexión

### Desde el Frontend:

1. **Asegúrate de que el servidor esté corriendo:**
   ```bash
   npm run dev:frontend
   ```

2. **Visita la página de diagnóstico:**
   ```
   http://localhost:3001/diagnostico
   ```

3. **Verifica que todas las pruebas pasen:**
   - ✅ Configuración
   - ✅ Conexión ai_predictions
   - ✅ Conexión resultados_quini
   - ✅ Lectura de datos

### Si hay errores:

- **Tabla no existe:** Ejecuta el script SQL nuevamente
- **Error de permisos (RLS):** Deshabilita RLS (ver paso 4)
- **Error de conexión:** Verifica las variables de entorno en `.env.local`

---

## ✅ Checklist Final

- [x] Script SQL ejecutado en Supabase
- [ ] Tablas verificadas (ejecuta SQL del paso 1)
- [ ] Funciones verificadas (ejecuta SQL del paso 2)
- [ ] Triggers verificados (ejecuta SQL del paso 3)
- [ ] RLS verificado (ejecuta SQL del paso 4)
- [ ] Frontend probado (visita `/diagnostico`)

---

## 🎉 Conclusión

**Si ejecutaste el script SQL y las verificaciones pasan, NO necesitas hacer nada más en Supabase.**

El frontend debería funcionar correctamente. Solo asegúrate de:
1. ✅ Variables de entorno configuradas en `.env.local`
2. ✅ Servidor de Next.js reiniciado
3. ✅ Probar la conexión en `/diagnostico`

