// notification-system.tsx - Sistema de notificaciones para cuentas por cobrar

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  X,
  Eye,
  Settings
} from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface Alert {
  id: number;
  invoiceId: number;
  alertType: 'due_soon' | 'overdue' | 'payment_received' | 'credit_limit_exceeded';
  message: string;
  isRead: boolean;
  createdAt: string;
  invoice?: {
    invoiceNumber: string;
    customerName: string;
    total: number;
    dueDate: string;
  };
}

function NotificationCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/accounts-receivable/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        setUnreadCount(data.filter((alert: Alert) => !alert.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      const response = await fetch(`/api/accounts-receivable/alerts/${alertId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la alerta como leída",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const unreadAlerts = alerts.filter(alert => !alert.isRead);
      await Promise.all(
        unreadAlerts.map(alert => markAsRead(alert.id))
      );
      setUnreadCount(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las alertas como leídas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'due_soon':
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'payment_received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'credit_limit_exceeded':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'due_soon':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'payment_received':
        return 'bg-green-50 border-green-200';
      case 'credit_limit_exceeded':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Botón de notificaciones */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Panel de notificaciones */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones de Cuentas por Cobrar
            </DialogTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar todo como leído
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay notificaciones pendientes</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`${getAlertColor(alert.alertType)} ${
                    !alert.isRead ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.alertType)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {alert.message}
                            </p>
                            {!alert.isRead && (
                              <Badge variant="secondary" className="text-xs">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          
                          {alert.invoice && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>Factura: {alert.invoice.invoiceNumber}</p>
                              <p>Cliente: {alert.invoice.customerName}</p>
                              <p>Monto: ${alert.invoice.total.toLocaleString()}</p>
                              <p>Vence: {formatDate(alert.invoice.dueDate)}</p>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook para crear alertas automáticamente
function useAccountsReceivableAlerts() {
  const createAlert = async (alertData: {
    invoiceId: number;
    alertType: string;
    message: string;
  }) => {
    try {
      const response = await fetch('/api/accounts-receivable/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const createDueSoonAlert = (invoice: any) => {
    return createAlert({
      invoiceId: invoice.id,
      alertType: 'due_soon',
      message: `La factura ${invoice.invoiceNumber} vence en 3 días`
    });
  };

  const createOverdueAlert = (invoice: any) => {
    return createAlert({
      invoiceId: invoice.id,
      alertType: 'overdue',
      message: `La factura ${invoice.invoiceNumber} está vencida`
    });
  };

  const createPaymentReceivedAlert = (invoice: any, payment: any) => {
    return createAlert({
      invoiceId: invoice.id,
      alertType: 'payment_received',
      message: `Se recibió un pago de $${payment.amount} para la factura ${invoice.invoiceNumber}`
    });
  };

  const createCreditLimitAlert = (customer: any) => {
    return createAlert({
      invoiceId: 0, // No es específico de una factura
      alertType: 'credit_limit_exceeded',
      message: `El cliente ${customer.name} ha excedido su límite de crédito`
    });
  };

  return {
    createAlert,
    createDueSoonAlert,
    createOverdueAlert,
    createPaymentReceivedAlert,
    createCreditLimitAlert
  };
}

// Configuración de notificaciones
function NotificationSettings() {
  const [settings, setSettings] = useState({
    enableDueSoonAlerts: true,
    dueSoonDays: 3,
    enableOverdueAlerts: true,
    enablePaymentAlerts: true,
    enableCreditLimitAlerts: true,
    emailNotifications: false,
    notificationEmail: ''
  });

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "Las preferencias de notificación se han actualizado"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuraciones de notificación */}
        <div className="grid grid-cols-2 gap-4">
          {/* Implementar controles de configuración */}
        </div>
        <Button onClick={saveSettings}>
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
}

export { NotificationCenter, useAccountsReceivableAlerts, NotificationSettings };