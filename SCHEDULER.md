# 🤖 Scheduler Automático de Quini 6

Sistema automatizado para extraer resultados del Quini 6 los días miércoles y domingos después de los sorteos.

## 📅 Horarios de Ejecución

El scheduler está configurado para ejecutarse automáticamente:

- **Miércoles**: 20:00 (8:00 PM) hora Argentina
- **Domingo**: 20:00 (8:00 PM) hora Argentina

Los sorteos del Quini 6 típicamente se realizan alrededor de las 19:30, por lo que el scraper se ejecuta a las 20:00 para asegurar que los resultados estén disponibles.

## 🚀 Iniciar el Scheduler

### Opción 1: Desde la línea de comandos

```bash
npm run scheduler
```

O en modo desarrollo:

```bash
npm run scheduler:dev
```

### Opción 2: Usando el script batch (Windows)

```bash
start-scheduler.bat
```

## 🔧 Configuración como Servicio de Windows

Para que el scheduler se ejecute automáticamente al iniciar Windows:

### Método 1: Task Scheduler de Windows

1. Abre el **Programador de tareas** (Task Scheduler)
2. Crea una **Tarea básica**
3. Configura:
   - **Nombre**: Quini6 Scraper Scheduler
   - **Desencadenador**: Al iniciar sesión
   - **Acción**: Iniciar un programa
   - **Programa/script**: `node`
   - **Argumentos**: `dist/index-scheduler.js`
   - **Iniciar en**: `C:\Users\mauri\OneDrive\Desktop\scraperquini6`

### Método 2: Usando PM2 (Recomendado para producción)

Instalar PM2 globalmente:
```bash
npm install -g pm2
```

Iniciar el scheduler con PM2:
```bash
pm2 start dist/index-scheduler.js --name quini6-scheduler
```

Guardar la configuración para que se inicie automáticamente:
```bash
pm2 save
pm2 startup
```

Comandos útiles de PM2:
```bash
pm2 status              # Ver estado
pm2 logs quini6-scheduler  # Ver logs
pm2 stop quini6-scheduler  # Detener
pm2 restart quini6-scheduler  # Reiniciar
```

## 🔍 Cómo Funciona

1. **Detección de Sorteos Nuevos**: El scheduler compara los sorteos extraídos con el archivo existente para evitar duplicados
2. **Actualización Incremental**: Solo procesa y guarda sorteos nuevos, manteniendo los existentes
3. **Validación Automática**: Valida la integridad de los datos antes de guardar
4. **Manejo de Errores**: Si hay un error, se registra y el scheduler continúa funcionando para la próxima ejecución

## 📊 Logs

Los logs se muestran en la consola en tiempo real. Para producción, se recomienda redirigir la salida a un archivo:

```bash
npm run scheduler >> logs/scheduler.log 2>&1
```

## ⚙️ Configuración Avanzada

### Cambiar la Hora de Ejecución

Edita `src/index-scheduler.ts` y modifica las expresiones cron:

```typescript
// Ejecutar a las 21:00 (9 PM) en lugar de 20:00
this.taskMiércoles = cron.schedule('0 21 * * 3', ...);
this.taskDomingo = cron.schedule('0 21 * * 0', ...);
```

### Cambiar la Zona Horaria

La zona horaria está configurada en `America/Argentina/Buenos_Aires`. Para cambiarla:

```typescript
timezone: "America/Argentina/Buenos_Aires"  // Cambiar aquí
```

## 🔔 Notificaciones (Opcional)

Para agregar notificaciones cuando se complete el scraping, puedes extender el código para enviar emails o mensajes. Un ejemplo básico:

```typescript
// En ejecutarScraping(), después de guardar resultados
if (resultado.sorteos.length > 0) {
  // Enviar notificación (implementar según necesidad)
  console.log('📧 Enviando notificación...');
}
```

## 🛠️ Solución de Problemas

### El scheduler no se ejecuta

1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que las dependencias estén instaladas: `npm install`
3. Compila el proyecto: `npm run build`
4. Verifica los logs para errores

### No se encuentran sorteos nuevos

- Esto es normal si ya se ejecutó el scraper recientemente
- El scheduler solo agrega sorteos que no existen en el archivo

### Error de zona horaria

Si hay problemas con la zona horaria, instala `tzdata`:
```bash
npm install tzdata
```

O usa UTC y ajusta las horas manualmente.

## 📝 Notas Importantes

- El scheduler debe estar ejecutándose continuamente para funcionar
- Si se reinicia la computadora, el scheduler se detendrá a menos que esté configurado como servicio
- Se recomienda usar PM2 o el Task Scheduler de Windows para ejecución automática
- El proceso consume recursos mínimos mientras espera las ejecuciones programadas

