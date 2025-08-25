// client/src/components/quotes-dashboard.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExpiryBadge, useQuoteDateValidation } from '@/hooks/use-quote-date-validation';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface Quote {
  id: number;
  quoteNumber: string;
  customerName: string;
  status: string;
  validUntil: string;
  total: number;
  isExpired?: boolean;
  expiryStatus?: {
    status: string;
    message: string;
    daysLeft: number;
  };
}

interface QuoteStats {
  totalQuotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  convertedQuotes: number;
  expiredQuotes: number;
  totalQuoteValue: string;
}

export default function QuotesDashboard() {
  const { getExpiryStatus } = useQuoteDateValidation();

  // Cargar estadísticas generales
  const { data: stats, isLoading: statsLoading } = useQuery<QuoteStats>({
    queryKey: ['/api/quotes/stats'],
  });

  // Cargar cotizaciones próximas a expirar
  const { data: expiringData, isLoading: expiringLoading, refetch: refetchExpiring } = useQuery<{
    quotes: Quote[];
    count: number;
    daysAhead: number;
  }>({
    queryKey: ['/api/quotes/expiring'],
  });

  // Cargar cotizaciones expiradas
  const { data: expiredData, isLoading: expiredLoading, refetch: refetchExpired } = useQuery<{
    quotes: Quote[];
    count: number;
  }>({
    queryKey: ['/api/quotes/expired'],
  });

  // Ejecutar verificación manual
  const checkExpiredQuotes = async () => {
    try {
      await fetch('/api/admin/check-expired-quotes', { method: 'POST' });
      refetchExpiring();
      refetchExpired();
    } catch (error) {
      console.error('Error ejecutando verificación:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'expired': return 'Expirada';
      case 'converted': return 'Convertida';
      default: return status;
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Cotizaciones</h1>
          <p className="text-gray-600">Monitoreo y gestión de fechas de vencimiento</p>
        </div>
        <Button onClick={checkExpiredQuotes} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Verificar Expiradas
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Valor total: ${stats?.totalQuoteValue || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.pendingQuotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Enviadas y esperando respuesta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas a Expirar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringData?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expiredData?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas importantes */}
      {(expiringData?.count || 0) > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tienes {expiringData?.count} cotización{expiringData?.count !== 1 ? 'es' : ''} próxima{expiringData?.count !== 1 ? 's' : ''} a expirar en los próximos 7 días.
          </AlertDescription>
        </Alert>
      )}

      {(expiredData?.count || 0) > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes {expiredData?.count} cotización{expiredData?.count !== 1 ? 'es' : ''} expirada{expiredData?.count !== 1 ? 's' : ''} que requieren atención.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cotizaciones próximas a expirar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Próximas a Expirar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : expiringData?.quotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No hay cotizaciones próximas a expirar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringData?.quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{quote.quoteNumber}</span>
                        <Badge className={getStatusColor(quote.status)}>
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{quote.customerName}</p>
                      <p className="text-sm font-medium">${quote.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <ExpiryBadge validUntil={quote.validUntil} />
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cotizaciones expiradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiredLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
              </div>
            ) : expiredData?.quotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No hay cotizaciones expiradas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expiredData?.quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{quote.quoteNumber}</span>
                        <Badge className={getStatusColor(quote.status)}>
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{quote.customerName}</p>
                      <p className="text-sm font-medium">${quote.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <ExpiryBadge validUntil={quote.validUntil} />
                      <p className="text-xs text-gray-500 mt-1">
                        Expiró: {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de estados (opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribución por Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { status: 'draft', label: 'Borradores', count: stats?.totalQuotes || 0, color: 'bg-gray-500' },
              { status: 'sent', label: 'Enviadas', count: stats?.pendingQuotes || 0, color: 'bg-blue-500' },
              { status: 'accepted', label: 'Aceptadas', count: stats?.acceptedQuotes || 0, color: 'bg-green-500' },
              { status: 'rejected', label: 'Rechazadas', count: 0, color: 'bg-red-500' },
              { status: 'expired', label: 'Expiradas', count: expiredData?.count || 0, color: 'bg-orange-500' },
              { status: 'converted', label: 'Convertidas', count: stats?.convertedQuotes || 0, color: 'bg-purple-500' },
            ].map(({ status, label, count, color }) => (
              <div key={status} className="text-center">
                <div className={`w-full h-20 ${color} rounded-lg mb-2 flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}