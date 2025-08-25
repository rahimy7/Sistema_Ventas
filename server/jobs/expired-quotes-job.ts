// server/jobs/expired-quotes-job.ts

import { storage } from '../storage';
import { checkAndUpdateExpiredStatus } from '../../client/src/lib/quote-date-validation';

export class ExpiredQuotesJob {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private intervalMinutes: number = 60) {} // Ejecutar cada hora por defecto

  start() {
    if (this.isRunning) {
      console.log('ExpiredQuotesJob ya está en ejecución');
      return;
    }

    console.log(`Iniciando ExpiredQuotesJob - ejecutará cada ${this.intervalMinutes} minutos`);
    this.isRunning = true;

    // Ejecutar inmediatamente
    this.executeJob();

    // Programar ejecuciones periódicas
    this.interval = setInterval(() => {
      this.executeJob();
    }, this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('ExpiredQuotesJob detenido');
  }

  async executeJob() {
    try {
      console.log('Ejecutando verificación de cotizaciones expiradas...');
      
      // Obtener todas las cotizaciones
      const quotes = await storage.getQuotes();
      
      // Filtrar solo las que pueden expirar (sent, accepted)
      const activeQuotes = quotes.filter(quote => 
        ['sent', 'accepted'].includes(quote.status)
      );

      if (activeQuotes.length === 0) {
        console.log('No hay cotizaciones activas para verificar');
        return;
      }

      // Verificar cuáles han expirado
      const expiredUpdates = checkAndUpdateExpiredStatus(activeQuotes);

      if (expiredUpdates.length === 0) {
        console.log(`Verificadas ${activeQuotes.length} cotizaciones - ninguna expirada`);
        return;
      }

      // Actualizar en lote las cotizaciones expiradas
      const updatePromises = expiredUpdates.map(async (update) => {
        try {
          await storage.updateQuoteStatus(update.id, 'expired');
          console.log(`Cotización ${update.id} marcada como expirada`);
          return { id: update.id, success: true };
        } catch (error) {
          console.error(`Error actualizando cotización ${update.id}:`, error);
          return { id: update.id, success: false, error };
        }
      });

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Procesadas ${expiredUpdates.length} cotizaciones expiradas: ${successful} exitosas, ${failed} fallidas`);

      // Opcional: Enviar notificaciones
      await this.sendExpirationNotifications(expiredUpdates);

    } catch (error) {
      console.error('Error en ExpiredQuotesJob:', error);
    }
  }

  private async sendExpirationNotifications(expiredUpdates: any[]) {
    // Implementar notificaciones por email si es necesario
    // Por ahora solo log
    if (expiredUpdates.length > 0) {
      console.log(`📧 Se deberían enviar ${expiredUpdates.length} notificaciones de expiración`);
    }
  }
}

