// lib/quote-date-validation.ts

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QuoteDateValidationOptions {
  allowPastQuoteDates?: boolean;
  minValidityDays?: number;
  maxValidityDays?: number;
  businessDaysOnly?: boolean;
}

const DEFAULT_OPTIONS: QuoteDateValidationOptions = {
  allowPastQuoteDates: false,
  minValidityDays: 7,
  maxValidityDays: 90,
  businessDaysOnly: false,
};

/**
 * Valida fechas de cotización
 */
export function validateQuoteDates(
  quoteDate: Date | string,
  validUntil: Date | string,
  options: QuoteDateValidationOptions = {}
): DateValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Convertir strings a Date
  const qDate = typeof quoteDate === 'string' ? new Date(quoteDate) : quoteDate;
  const vDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  const now = new Date();

  // Validar fechas válidas
  if (isNaN(qDate.getTime())) {
    errors.push('Fecha de cotización inválida');
  }
  if (isNaN(vDate.getTime())) {
    errors.push('Fecha de vencimiento inválida');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validar fecha de cotización
  if (!opts.allowPastQuoteDates && qDate < startOfDay(now)) {
    errors.push('La fecha de cotización no puede ser anterior a hoy');
  }

  // Validar que validUntil sea posterior a quoteDate
  if (vDate <= qDate) {
    errors.push('La fecha de vencimiento debe ser posterior a la fecha de cotización');
  }

  // Calcular días de vigencia
  const validityDays = Math.ceil((vDate.getTime() - qDate.getTime()) / (1000 * 60 * 60 * 24));

  // Validar rango de vigencia
  if (opts.minValidityDays && validityDays < opts.minValidityDays) {
    errors.push(`La cotización debe ser válida por al menos ${opts.minValidityDays} días`);
  }

  if (opts.maxValidityDays && validityDays > opts.maxValidityDays) {
    warnings.push(`La cotización será válida por ${validityDays} días (máximo recomendado: ${opts.maxValidityDays})`);
  }

  // Validar días laborables si está habilitado
  if (opts.businessDaysOnly) {
    if (isWeekend(qDate)) {
      warnings.push('La fecha de cotización es fin de semana');
    }
    if (isWeekend(vDate)) {
      warnings.push('La fecha de vencimiento es fin de semana');
    }
  }

  // Advertencias por fechas próximas al vencimiento
  const daysUntilExpiry = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    errors.push('La cotización ya ha expirado');
  } else if (daysUntilExpiry <= 3) {
    warnings.push(`La cotización expira en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}`);
  } else if (daysUntilExpiry <= 7) {
    warnings.push(`La cotización expira pronto (${daysUntilExpiry} días)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Verifica si una cotización está expirada
 */
export function isQuoteExpired(validUntil: Date | string): boolean {
  const vDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  return new Date() > vDate;
}

/**
 * Calcula días hasta la expiración
 */
export function getDaysUntilExpiry(validUntil: Date | string): number {
  const vDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  const now = new Date();
  return Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene el estado de expiración con mensaje
 */
export function getExpiryStatus(validUntil: Date | string): {
  status: 'expired' | 'expiring_soon' | 'expiring_warning' | 'valid';
  message: string;
  daysLeft: number;
} {
  const daysLeft = getDaysUntilExpiry(validUntil);
  
  if (daysLeft <= 0) {
    return {
      status: 'expired',
      message: 'Cotización expirada',
      daysLeft
    };
  } else if (daysLeft <= 3) {
    return {
      status: 'expiring_soon',
      message: `Expira en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
      daysLeft
    };
  } else if (daysLeft <= 7) {
    return {
      status: 'expiring_warning',
      message: `Expira en ${daysLeft} días`,
      daysLeft
    };
  } else {
    return {
      status: 'valid',
      message: `Válida por ${daysLeft} días`,
      daysLeft
    };
  }
}

/**
 * Genera fecha de vencimiento sugerida
 */
export function suggestValidUntilDate(
  quoteDate: Date | string,
  defaultValidityDays: number = 30
): Date {
  const qDate = typeof quoteDate === 'string' ? new Date(quoteDate) : quoteDate;
  const validUntil = new Date(qDate);
  validUntil.setDate(validUntil.getDate() + defaultValidityDays);
  return validUntil;
}

/**
 * Middleware de validación automática de estado expirado
 */
export function checkAndUpdateExpiredStatus(
  quotes: Array<{ id: number; status: string; validUntil: Date | string }>
): Array<{ id: number; shouldUpdateStatus: boolean; newStatus: string }> {
  const now = new Date();
  
  return quotes
    .filter(quote => quote.status === 'sent' || quote.status === 'accepted')
    .map(quote => {
      const vDate = typeof quote.validUntil === 'string' ? new Date(quote.validUntil) : quote.validUntil;
      const shouldExpire = now > vDate && quote.status !== 'expired';
      
      return {
        id: quote.id,
        shouldUpdateStatus: shouldExpire,
        newStatus: 'expired'
      };
    })
    .filter(item => item.shouldUpdateStatus);
}

// Utilidades auxiliares
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Domingo o Sábado
}

// Hook personalizado para validación en tiempo real
export function useQuoteDateValidation(options?: QuoteDateValidationOptions) {
  return {
    validateDates: (quoteDate: Date | string, validUntil: Date | string) => 
      validateQuoteDates(quoteDate, validUntil, options),
    isExpired: isQuoteExpired,
    getDaysUntilExpiry,
    getExpiryStatus,
    suggestValidUntil: suggestValidUntilDate
  };
}