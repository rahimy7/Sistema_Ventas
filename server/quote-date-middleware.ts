import { Request, Response, NextFunction } from 'express';
import { validateQuoteDates, checkAndUpdateExpiredStatus } from '../client/src/lib/quote-date-validation';
import { storage } from './storage';

/**
 * Middleware para validar fechas en cotizaciones
 */
export function validateQuoteDateMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT') {
    const { quote } = req.body;
    
    if (quote && quote.quoteDate && quote.validUntil) {
      const validation = validateQuoteDates(quote.quoteDate, quote.validUntil, {
        allowPastQuoteDates: req.method === 'PUT', // Permitir fechas pasadas al editar
        minValidityDays: 1,
        maxValidityDays: 365
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Fechas de cotización inválidas',
          errors: validation.errors
        });
      }
      
      // Agregar advertencias a la respuesta si las hay
      if (validation.warnings.length > 0) {
        req.body._warnings = validation.warnings;
      }
    }
  }
  
  next();
}

/**
 * Middleware para actualizar cotizaciones expiradas automáticamente
 */
export async function checkExpiredQuotesMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Solo ejecutar en operaciones GET de listado
    if (req.method === 'GET' && req.path === '/api/quotes') {
      const quotes = await storage.getQuotes();
      const expiredUpdates = checkAndUpdateExpiredStatus(quotes);
      
      // Actualizar cotizaciones expiradas en lote
      if (expiredUpdates.length > 0) {
        await Promise.all(
          expiredUpdates.map(update => 
            storage.updateQuoteStatus(update.id, 'expired')
          )
        );
        
        console.log(`Se actualizaron ${expiredUpdates.length} cotizaciones expiradas`);
      }
    }
  } catch (error) {
    console.error('Error checking expired quotes:', error);
    // No bloquear la petición por este error
  }
  
  next();
}