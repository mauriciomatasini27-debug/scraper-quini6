import { Quini6Scraper } from './scraper';
import { ValidadorSorteos } from './validator';
import { ResultadoScraping, SorteoQuini6 } from './types';
import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script automatizado que ejecuta el scraper los miércoles y domingos
 * después de los sorteos del Quini 6
 * 
 * Horarios típicos de sorteos:
 * - Domingo: ~19:30
 * - Miércoles: ~19:30
 * 
 * Este script ejecutará el scraping a las 20:00 (8 PM) los días miércoles y domingo
 */
class SchedulerQuini6 {
  private taskMiércoles: cron.ScheduledTask | null = null;
  private taskDomingo: cron.ScheduledTask | null = null;

  /**
   * Ejecuta el scraping del año actual y actualiza el archivo existente
   */
  private async ejecutarScraping(): Promise<void> {
    const añoActual = new Date().getFullYear();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Ejecución automática iniciada - ${new Date().toLocaleString('es-AR')}`);
    console.log(`📅 Año objetivo: ${añoActual}`);
    console.log('='.repeat(60));

    const scraper = new Quini6Scraper(añoActual);
    const validador = new ValidadorSorteos();

    try {
      await scraper.inicializar();

      // Obtener solo los sorteos nuevos comparando con el archivo existente
      const resultado = await this.obtenerSorteosNuevos(scraper, añoActual);

      if (resultado.sorteos.length > 0) {
        console.log(`\n✅ Se encontraron ${resultado.sorteos.length} sorteo(s) nuevo(s)`);
        
        // Validar resultados
        const validacion = await validador.validarSorteos(resultado);
        
        // Guardar resultados (actualiza el archivo completo)
        await scraper.guardarResultados(resultado);
        
        console.log(`\n✅ Scraping automático completado exitosamente`);
        console.log(`📊 Sorteos nuevos agregados: ${resultado.sorteos.length}`);
      } else {
        console.log(`\n✅ No se encontraron sorteos nuevos (ya están actualizados)`);
      }

    } catch (error) {
      console.error('\n❌ Error en scraping automático:', error);
      if (error instanceof Error) {
        console.error('   Mensaje:', error.message);
      }
    } finally {
      await scraper.cerrar();
    }
  }

  /**
   * Obtiene los sorteos nuevos comparando con el archivo existente
   */
  private async obtenerSorteosNuevos(
    scraper: Quini6Scraper,
    año: number
  ): Promise<ResultadoScraping> {
    const archivoPath = path.join(process.cwd(), 'data', `quini_${año}_completo.json`);
    
    // Leer archivo existente si existe
    let sorteosExistentes: Set<number> = new Set();
    let resultadoExistente: ResultadoScraping | null = null;
    
    if (fs.existsSync(archivoPath)) {
      try {
        const contenido = fs.readFileSync(archivoPath, 'utf-8');
        resultadoExistente = JSON.parse(contenido) as ResultadoScraping;
        sorteosExistentes = new Set(resultadoExistente.sorteos.map(s => s.numeroSorteo));
        console.log(`📄 Archivo existente encontrado con ${resultadoExistente.sorteos.length} sorteos`);
      } catch (error) {
        console.warn('⚠️  Error al leer archivo existente, se procesará todo el año');
      }
    }

    // Obtener todos los sorteos del año
    const resultadoCompleto = await scraper.procesarTodosLosSorteos();

    // Si hay archivo existente, filtrar solo los nuevos
    if (resultadoExistente && sorteosExistentes.size > 0) {
      const sorteosNuevos = resultadoCompleto.sorteos.filter(
        s => !sorteosExistentes.has(s.numeroSorteo)
      );

      if (sorteosNuevos.length > 0) {
        console.log(`🆕 Se encontraron ${sorteosNuevos.length} sorteo(s) nuevo(s)`);
        
        // Combinar sorteos existentes con nuevos y ordenar
        const todosLosSorteos = [...resultadoExistente.sorteos, ...sorteosNuevos];
        todosLosSorteos.sort((a, b) => a.numeroSorteo - b.numeroSorteo);

        return {
          ...resultadoCompleto,
          sorteos: todosLosSorteos,
          totalSorteos: todosLosSorteos.length,
          fechaInicio: todosLosSorteos[0]?.fechaISO || '',
          fechaFin: todosLosSorteos[todosLosSorteos.length - 1]?.fechaISO || ''
        };
      } else {
        // No hay sorteos nuevos, retornar el existente
        return resultadoExistente;
      }
    }

    // No hay archivo existente, retornar todo
    return resultadoCompleto;
  }

  /**
   * Inicia el scheduler
   */
  public iniciar(): void {
    console.log('🚀 Iniciando Scheduler Automático de Quini 6');
    console.log('='.repeat(60));
    console.log('📅 Tareas programadas:');
    console.log('   - Miércoles: 20:00 (8:00 PM)');
    console.log('   - Domingo: 20:00 (8:00 PM)');
    console.log('='.repeat(60));
    console.log('\n⏰ El scheduler está corriendo. Presiona Ctrl+C para detener.\n');

    // Ejecutar los miércoles a las 20:00 (0 = domingo, 3 = miércoles)
    // Formato: minuto hora día-mes día-semana
    this.taskMiércoles = cron.schedule('0 20 * * 3', async () => {
      console.log('\n🔔 Tarea programada activada: Miércoles 20:00');
      await this.ejecutarScraping();
    }, {
      scheduled: true,
      timezone: "America/Argentina/Buenos_Aires"
    });

    // Ejecutar los domingos a las 20:00
    this.taskDomingo = cron.schedule('0 20 * * 0', async () => {
      console.log('\n🔔 Tarea programada activada: Domingo 20:00');
      await this.ejecutarScraping();
    }, {
      scheduled: true,
      timezone: "America/Argentina/Buenos_Aires"
    });

    console.log('✅ Scheduler iniciado correctamente');
    console.log('📌 Próxima ejecución:');
    this.mostrarProximaEjecucion();
  }

  /**
   * Muestra la próxima ejecución programada
   */
  private mostrarProximaEjecucion(): void {
    const ahora = new Date();
    const diaSemana = ahora.getDay(); // 0 = domingo, 3 = miércoles
    const hora = ahora.getHours();
    
    let proximaEjecucion: Date;
    
    if (diaSemana === 3 && hora < 20) {
      // Si es miércoles y aún no son las 20:00, ejecutar hoy
      proximaEjecucion = new Date(ahora);
      proximaEjecucion.setHours(20, 0, 0, 0);
    } else if (diaSemana === 0 && hora < 20) {
      // Si es domingo y aún no son las 20:00, ejecutar hoy
      proximaEjecucion = new Date(ahora);
      proximaEjecucion.setHours(20, 0, 0, 0);
    } else {
      // Calcular el próximo miércoles o domingo
      const diasHastaMiercoles = (3 - diaSemana + 7) % 7 || 7;
      const diasHastaDomingo = (0 - diaSemana + 7) % 7 || 7;
      
      const proximaFecha = new Date(ahora);
      if (diasHastaMiercoles < diasHastaDomingo) {
        proximaFecha.setDate(ahora.getDate() + diasHastaMiercoles);
      } else {
        proximaFecha.setDate(ahora.getDate() + diasHastaDomingo);
      }
      proximaFecha.setHours(20, 0, 0, 0);
      proximaEjecucion = proximaFecha;
    }
    
    console.log(`   ${proximaEjecucion.toLocaleString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    })}`);
  }

  /**
   * Detiene el scheduler
   */
  public detener(): void {
    if (this.taskMiércoles) {
      this.taskMiércoles.stop();
    }
    if (this.taskDomingo) {
      this.taskDomingo.stop();
    }
    console.log('\n🛑 Scheduler detenido');
  }
}

// Ejecutar el scheduler
if (require.main === module) {
  const scheduler = new SchedulerQuini6();
  
  // Manejar cierre limpio
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Recibida señal de interrupción...');
    scheduler.detener();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⏹️  Recibida señal de terminación...');
    scheduler.detener();
    process.exit(0);
  });

  scheduler.iniciar();
  
  // Mantener el proceso corriendo
  process.stdin.resume();
}

export { SchedulerQuini6 };

