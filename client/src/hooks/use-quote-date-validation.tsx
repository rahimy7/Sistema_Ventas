// client/src/hooks/use-quote-date-validation.ts

import { useState, useEffect, useMemo } from 'react';

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExpiryStatus {
  status: 'expired' | 'expiring_soon' | 'expiring_warning' | 'valid';
  message: string;
  daysLeft: number;
  color: 'destructive' | 'warning' | 'default';
}

export function useQuoteDateValidation() {
  const validateDates = (quoteDate: string, validUntil: string): DateValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!quoteDate || !validUntil) {
      return { isValid: false, errors: ['Fechas requeridas'], warnings };
    }

    const qDate = new Date(quoteDate);
    const vDate = new Date(validUntil);
    const now = new Date();

    // Validar fechas válidas
    if (isNaN(qDate.getTime())) errors.push('Fecha de cotización inválida');
    if (isNaN(vDate.getTime())) errors.push('Fecha de vencimiento inválida');

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Validar que validUntil sea posterior a quoteDate
    if (vDate <= qDate) {
      errors.push('La fecha de vencimiento debe ser posterior a la fecha de cotización');
    }

    // Calcular días de vigencia
    const validityDays = Math.ceil((vDate.getTime() - qDate.getTime()) / (1000 * 60 * 60 * 24));

    // Validaciones de rango
    if (validityDays < 1) {
      errors.push('La cotización debe ser válida por al menos 1 día');
    } else if (validityDays > 365) {
      warnings.push('La cotización será válida por más de un año');
    }

    // Advertencias por fechas próximas
    const daysUntilExpiry = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      errors.push('La cotización ya ha expirado');
    } else if (daysUntilExpiry <= 3) {
      warnings.push(`La cotización expirará en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const getExpiryStatus = (validUntil: string | Date): ExpiryStatus => {
    const vDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
    const daysLeft = Math.ceil((vDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return {
        status: 'expired',
        message: 'Expirada',
        daysLeft,
        color: 'destructive'
      };
    } else if (daysLeft <= 3) {
      return {
        status: 'expiring_soon',
        message: `Expira en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
        daysLeft,
        color: 'destructive'
      };
    } else if (daysLeft <= 7) {
      return {
        status: 'expiring_warning',
        message: `Expira en ${daysLeft} días`,
        daysLeft,
        color: 'warning'
      };
    } else {
      return {
        status: 'valid',
        message: `Válida por ${daysLeft} días`,
        daysLeft,
        color: 'default'
      };
    }
  };

  const suggestValidUntilDate = (quoteDate: string, defaultDays: number = 30): string => {
    if (!quoteDate) return '';
    
    const qDate = new Date(quoteDate);
    if (isNaN(qDate.getTime())) return '';
    
    const validUntil = new Date(qDate);
    validUntil.setDate(validUntil.getDate() + defaultDays);
    return validUntil.toISOString().split('T')[0];
  };

  return {
    validateDates,
    getExpiryStatus,
    suggestValidUntilDate
  };
}

// Componente de estado de expiración
export function ExpiryBadge({ validUntil }: { validUntil: string | Date }) {
  const { getExpiryStatus } = useQuoteDateValidation();
  const status = getExpiryStatus(validUntil);

  const getColorClasses = (color: ExpiryStatus['color']) => {
    switch (color) {
      case 'destructive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getColorClasses(status.color)}`}>
      {status.message}
    </span>
  );
}

// Hook para formulario con validación automática
export function useQuoteDateForm() {
  const { validateDates, suggestValidUntilDate } = useQuoteDateValidation();
  const [quoteDate, setQuoteDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [validation, setValidation] = useState<DateValidationResult>({ 
    isValid: true, 
    errors: [], 
    warnings: [] 
  });

  // Validar automáticamente cuando cambien las fechas
  useEffect(() => {
    if (quoteDate || validUntil) {
      const result = validateDates(quoteDate, validUntil);
      setValidation(result);
    }
  }, [quoteDate, validUntil, validateDates]);

  // Auto-completar validUntil cuando cambie quoteDate
  const handleQuoteDateChange = (date: string) => {
    setQuoteDate(date);
    
    // Solo auto-completar si validUntil está vacío
    if (!validUntil && date) {
      const suggested = suggestValidUntilDate(date);
      setValidUntil(suggested);
    }
  };

  return {
    quoteDate,
    validUntil,
    validation,
    setQuoteDate: handleQuoteDateChange,
    setValidUntil,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings
  };
}

// Utilidades auxiliares
export function isQuoteExpired(validUntil: string | Date): boolean {
  const vDate = typeof validUntil === 'string' ? new Date(validUntil) : validUntil;
  return new Date() > vDate;
}

export function canQuoteBeAccepted(status: string, validUntil: string | Date): boolean {
  return status === 'sent' && !isQuoteExpired(validUntil);
}

export function canQuoteBeConverted(status: string, validUntil: string | Date): boolean {
  return status === 'accepted' && !isQuoteExpired(validUntil);
}