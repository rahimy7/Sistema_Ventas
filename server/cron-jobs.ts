// cron-jobs.ts - Sistema de tareas automáticas

import cron from 'node-cron';
import { storage } from './storage';

// Ejecutar todos los días a las 6:00 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Ejecutando actualización diaria de cuentas por cobrar...');
  
  try {
    const result = await storage.runDailyAccountsReceivableUpdate();
    
    console.log(`Actualización completada:
    - ${result.overdueUpdated} facturas marcadas como vencidas
    - ${result.notificationsSent} notificaciones generadas`);
    
    // Log para auditoría
    await logSystemActivity({
      action: 'daily_ar_update',
      details: result,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error en actualización diaria:', error);
    
    // Notificar a administradores del error
    await notifySystemError({
      error: error instanceof Error ? error.message : 'Error desconocido',
      context: 'daily_ar_update'
    });
  }
});

// Función auxiliar para logging
async function logSystemActivity(activity: {
  action: string;
  details: any;
  timestamp: Date;
}) {
  // Implementar logging en base de datos o archivo
  console.log('Sistema:', activity);
}

// Función auxiliar para notificaciones de error
async function notifySystemError(error: {
  error: string;
  context: string;
}) {
  // Implementar notificación a administradores
  console.error('Error del sistema:', error);
}

// Ejecutar manualmente si es necesario
export async function runManualUpdate() {
  return await storage.runDailyAccountsReceivableUpdate();
}

// Inicializar cron jobs
export function initializeCronJobs() {
  console.log('Jobs automáticos inicializados');
}