import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SaleFormEnhanced from "@/components/forms/sale-form-enhanced";
import SaleInvoiceDialog from "@/components/invoice/sale-invoice-dialog";
import HomeButton from "@/components/ui/home-button";
import {
  ShoppingCart,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  CreditCard,
  Eye,
  FileText,
  Printer,
  Package,
  Trash2,
  History
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Sale, type SaleItem } from "@shared/schema";
import { AlertTriangle } from "lucide-react";

// Crear tipo extendido para ventas con items
type SaleWithItems = Sale & {
  items?: SaleItem[];
};

export default function SalesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [saleForInvoice, setSaleForInvoice] = useState<SaleWithItems | null>(null);
    const [showCreditOptions, setShowCreditOptions] = useState(false);
  const [customerCreditInfo, setCustomerCreditInfo] = useState(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para eliminar venta
  const deleteSale = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Venta eliminada",
        description: "La venta ha sido eliminada exitosamente y el inventario ha sido restaurado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar la venta.",
        variant: "destructive",
      });
    },
  });

  // Cargar ventas (solo las últimas 10)
  const { data: sales = [], isLoading: salesLoading } = useQuery<SaleWithItems[]>({
    queryKey: ["/api/sales"],
  });
   const { data: creditTerms } = useQuery({
    queryKey: ["/api/customer-credit-terms"],
    enabled: showCreditOptions
  });

  // Estadísticas de ventas
  const salesStats = {
    totalSales: sales.length,
    todaysSales: sales.filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.saleDate);
      return saleDate.toDateString() === today.toDateString();
    }).length,
    totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.total), 0),
    averageTicket: sales.length > 0 ?
      sales.reduce((sum, sale) => sum + Number(sale.total), 0) / sales.length : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completada";
      case "pending": return "Pendiente";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "credit": return "Crédito";
      default: return method;
    }
  };

  const handleViewInvoice = async (sale: SaleWithItems) => {
    try {
      console.log("Loading items for sale:", sale.id);

      // Cargar items desde la API
      const res = await apiRequest("GET", `/api/sales/${sale.id}/items`);
      const items: SaleItem[] = await res.json();
      console.log("Loaded items from API:", items);

      // Crear objeto de venta con items
      const saleWithItems: SaleWithItems = {
        ...sale,
        items,
      };

      setSaleForInvoice(saleWithItems);
      setInvoiceDialogOpen(true);
    } catch (error) {
      console.error("Error loading sale items:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la venta.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit": return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "cash": return <DollarSign className="h-4 w-4 text-green-500" />;
      default: return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

   // 4. Función para verificar crédito del cliente
  const checkCustomerCredit = async (customerId: string) => {
    try {
      const response = await apiRequest("GET", `/api/customers/${customerId}/credit-terms`);
      const creditInfo = await response.json();
      setCustomerCreditInfo(creditInfo);
      return creditInfo;
    } catch (error) {
      console.error("Error checking customer credit:", error);
      return null;
    }
  };

  // 5. Función para crear venta a crédito
const createCreditSale = async (saleData: any) => {
  try {
    // Primero crear la venta regular
    const saleResponse = await apiRequest("POST", "/api/sales", {
      ...saleData,
      paymentMethod: "credit"
    });
    
    const sale = await saleResponse.json();
    
    // Luego crear la factura a crédito
    const invoiceData = {
      saleId: sale.id,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      total: saleData.total,
      items: saleData.items,
      creditTerms: saleData.creditTerms,
      invoiceNumber: `INV-${Date.now()}`,
      dueDate: new Date(Date.now() + (saleData.creditTerms.daysToPayment * 24 * 60 * 60 * 1000))
    };
    
    const invoiceResponse = await apiRequest("POST", "/api/sales/credit", invoiceData);
    const invoice = await invoiceResponse.json();
    
    toast({
      title: "Venta a crédito creada",
      description: `Factura ${invoice.invoiceNumber} generada exitosamente`,
    });
    
    // Invalidar ambas queries
    queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
    
    return { sale, invoice };
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "No se pudo crear la venta a crédito",
      variant: "destructive",
    });
    throw error;
  }
};

  const handleDelete = (id: number) => {
    deleteSale.mutate(id);
  };

return (
  <div className="min-h-screen bg-gray-50">
    <div className="space-y-6 p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            Ventas
          </h1>
          <p className="text-gray-600 mt-2">Gestiona todas las ventas de tu negocio</p>
        </div>
        <div className="flex items-center space-x-3">
          <HomeButton />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Venta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-screen w-[95vw] h-[95vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-xl">Registrar Nueva Venta</DialogTitle>
                <DialogDescription>
                  Complete los datos para agregar una nueva venta (contado o crédito)
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                <SaleFormEnhanced 
                  onSuccess={() => setDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas - Cambiar grid a 5 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-700 font-medium">Total Ventas</p>
                <p className="text-3xl font-bold text-green-900">{salesStats.totalSales}</p>
                <p className="text-sm text-green-600">Ventas realizadas</p>
              </div>
              <div className="h-14 w-14 bg-green-500 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-700 font-medium">Ventas Hoy</p>
                <p className="text-3xl font-bold text-blue-900">{salesStats.todaysSales}</p>
                <p className="text-sm text-blue-600">Del día actual</p>
              </div>
              <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-purple-700 font-medium">Ingresos Totales</p>
                <p className="text-3xl font-bold text-purple-900">${salesStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-purple-600">Suma de ventas</p>
              </div>
              <div className="h-14 w-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-orange-700 font-medium">Ticket Promedio</p>
                <p className="text-3xl font-bold text-orange-900">${salesStats.averageTicket.toLocaleString()}</p>
                <p className="text-sm text-orange-600">Por venta</p>
              </div>
              <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nueva tarjeta de ventas a crédito */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-indigo-700 font-medium">Ventas a Crédito</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {sales.filter(s => s.paymentMethod === 'credit').length}
                </p>
                <p className="text-sm text-indigo-600">Por cobrar</p>
              </div>
              <div className="h-14 w-14 bg-indigo-500 rounded-2xl flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ventas */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Ventas Recientes (Últimas 10)
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => window.open('/ventas/historial', '_blank')}
            >
              <History className="h-4 w-4 mr-2" />
              Ver Historial Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay ventas registradas</p>
              <p className="text-sm">Comienza registrando tu primera venta</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Fecha</TableHead>
                    <TableHead className="font-semibold text-gray-900">Cliente</TableHead>
                    <TableHead className="font-semibold text-gray-900">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-900">Método de Pago</TableHead>
                    <TableHead className="font-semibold text-gray-900">Total</TableHead>
                    <TableHead className="font-semibold text-gray-900">Estado de Pago</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{sale.customerName || 'Cliente sin nombre'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusColor(sale.status)}`}>
                          {getStatusText(sale.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${sale.paymentMethod === 'credit' ? 'border-blue-300 text-blue-700' : ''}`}
                          >
                            {getPaymentMethodText(sale.paymentMethod)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700">
                            ${Number(sale.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.paymentMethod === 'credit' ? (
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              sale.paymentStatus === 'paid' ? 'border-green-300 text-green-700' :
                              sale.paymentStatus === 'overdue' ? 'border-red-300 text-red-700' :
                              'border-yellow-300 text-yellow-700'
                            }`}
                          >
                            {sale.paymentStatus === 'paid' ? 'Pagado' :
                             sale.paymentStatus === 'overdue' ? 'Vencido' : 'Pendiente'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleViewInvoice(sale)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            onClick={() => handleViewInvoice(sale)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Imprimir
                          </Button>
                          
                          {/* Botón especial para gestionar cobro si es venta a crédito */}
                          {sale.paymentMethod === 'credit' && sale.paymentStatus !== 'paid' && (
                            <Button
                              onClick={() => window.open(`/cuentas-por-cobrar?invoice=${sale.id}`, '_blank')}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Cobrar
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La venta del cliente "{sale.customerName || 'Sin nombre'}" 
                                  por ${Number(sale.total).toLocaleString('en-US', { minimumFractionDigits: 2 })} será eliminada permanentemente.
                                  <br /><br />
                                  <strong>Nota:</strong> Los productos vendidos serán devueltos automáticamente al inventario.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(sale.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar Venta
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Diálogo de factura de venta */}
    {saleForInvoice && (
      <SaleInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        sale={saleForInvoice}
        saleItems={saleForInvoice.items || []}
        onDelete={handleDelete}
      />
    )}
  </div>
);
}