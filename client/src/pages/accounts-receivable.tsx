import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  CreditCard,
  Calendar,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: string;
  balanceDue: string;
  paidAmount: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
}

interface Payment {
  id: number;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

interface InvoiceWithPayments extends Invoice {
  payments: Payment[];
}

interface ARStats {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}

export default function AccountsReceivable() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithPayments | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentAmount: "",
    paymentMethod: "cash",
    referenceNumber: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  // Obtener estadísticas
  const { data: stats } = useQuery<ARStats>({
    queryKey: ["/api/accounts-receivable/stats"],
  });

  // Obtener facturas pendientes
  const { data: pendingInvoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/accounts-receivable/pending"],
  });

  // Obtener facturas vencidas
  const { data: overdueInvoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/accounts-receivable/overdue"],
  });

  // Mutation para registrar pago
  const registerPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest("POST", "/api/accounts-receivable/payment", paymentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente.",
      });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo registrar el pago.",
        variant: "destructive",
      });
    },
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentAmount: "",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: ""
    });
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const res = await apiRequest("GET", `/api/accounts-receivable/invoice/${invoice.id}`);
      const invoiceWithPayments: InvoiceWithPayments = await res.json();
      setSelectedInvoice(invoiceWithPayments);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la factura.",
        variant: "destructive",
      });
    }
  };

  const handleRegisterPayment = () => {
    if (!selectedInvoice) return;

    const paymentData = {
      invoiceId: selectedInvoice.id,
      paymentAmount: parseFloat(paymentForm.paymentAmount),
      paymentDate: new Date(),
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber || undefined,
      notes: paymentForm.notes || undefined,
    };

    registerPayment.mutate(paymentData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pendiente" },
      partial: { color: "bg-blue-100 text-blue-800", text: "Parcial" },
      paid: { color: "bg-green-100 text-green-800", text: "Pagado" },
      overdue: { color: "bg-red-100 text-red-800", text: "Vencido" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    return `$${Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return <div className="p-6">Cargando cuentas por cobrar...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              Cuentas por Cobrar
            </h1>
            <p className="text-gray-600 mt-2">Gestión de pagos y seguimiento de facturas pendientes</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.totalPending || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingInvoicesCount || 0} facturas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.totalOverdue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.overdueInvoicesCount || 0} facturas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cobrado Este Mes</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalPaid || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalPending && stats?.totalPaid 
                  ? Math.round((stats.totalPaid / (stats.totalPaid + stats.totalPending)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Efectividad</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Días</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">30</div>
              <p className="text-xs text-muted-foreground">Días promedio pago</p>
            </CardContent>
          </Card>
        </div>

        {/* Facturas Vencidas */}
        {overdueInvoices.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Facturas Vencidas ({overdueInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-center">Días Vencido</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map((invoice) => {
                      const daysOverdue = Math.floor(
                        (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <TableRow key={invoice.id} className="bg-red-50">
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(invoice.balanceDue)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-100 text-red-800">{daysOverdue} días</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Cobrar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facturas Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Facturas Pendientes ({pendingInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(invoice.balanceDue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(invoice.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog para gestionar factura */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Gestionar Factura {selectedInvoice?.invoiceNumber}
              </DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Información de la factura */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-600">Cliente</Label>
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total</Label>
                    <p className="font-medium">{formatCurrency(selectedInvoice.total)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Pagado</Label>
                    <p className="font-medium text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Saldo Pendiente</Label>
                    <p className="font-bold text-red-600">{formatCurrency(selectedInvoice.balanceDue)}</p>
                  </div>
                </div>

                {/* Historial de pagos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Historial de Pagos</h3>
                  {selectedInvoice.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString('es-ES')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {payment.paymentMethod === 'cash' ? 'Efectivo' :
                                 payment.paymentMethod === 'card' ? 'Tarjeta' :
                                 payment.paymentMethod === 'transfer' ? 'Transferencia' : 'Cheque'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.paymentAmount)}
                            </TableCell>
                            <TableCell>{payment.referenceNumber || '-'}</TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
                  )}
                </div>

                {/* Formulario de nuevo pago */}
                {Number(selectedInvoice.balanceDue) > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paymentAmount">Monto del Pago</Label>
                        <Input
                          id="paymentAmount"
                          type="number"
                          step="0.01"
                          max={selectedInvoice.balanceDue}
                          value={paymentForm.paymentAmount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentAmount: e.target.value }))}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Saldo pendiente: {formatCurrency(selectedInvoice.balanceDue)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Método de Pago</Label>
                        <Select 
                          value={paymentForm.paymentMethod} 
                          onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="check">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="referenceNumber">Número de Referencia (Opcional)</Label>
                        <Input
                          id="referenceNumber"
                          value={paymentForm.referenceNumber}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          placeholder="Ej: Transf. 123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Textarea
                          id="notes"
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Observaciones del pago..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedInvoice(null)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleRegisterPayment}
                        disabled={!paymentForm.paymentAmount || registerPayment.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {registerPayment.isPending ? 'Registrando...' : 'Registrar Pago'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}