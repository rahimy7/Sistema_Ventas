import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Package
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Sale, type SaleItem } from "@shared/schema";

// Crear tipo extendido para ventas con items
type SaleWithItems = Sale & {
  items?: SaleItem[];
};

export default function SalesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [saleForInvoice, setSaleForInvoice] = useState<SaleWithItems | null>(null);

  // Cargar ventas
  const { data: sales = [], isLoading: salesLoading } = useQuery<SaleWithItems[]>({
    queryKey: ["/api/sales"],
  });

  // Cargar items de la venta seleccionada
  const { data: selectedSaleItems = [] } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales", selectedSale?.id, "items"],
    enabled: !!selectedSale,
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
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <SaleFormEnhanced onSuccess={() => setDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-green-700 font-medium">Ventas Totales</p>
                  <p className="text-3xl font-bold text-green-900">{salesStats.totalSales}</p>
                  <p className="text-sm text-green-600">Todas las ventas</p>
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
                  <p className="text-blue-700 font-medium">Ventas de Hoy</p>
                  <p className="text-3xl font-bold text-blue-900">{salesStats.todaysSales}</p>
                  <p className="text-sm text-blue-600">Ventas del día</p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-700 font-medium">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    ${salesStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-emerald-600">Total generado</p>
                </div>
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
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
                  <p className="text-3xl font-bold text-orange-900">
                    ${salesStats.averageTicket.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-orange-600">Por venta</p>
                </div>
                <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Ventas */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Lista de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {salesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando ventas...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            #{sale.saleNumber}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {sale.customerName}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(sale.saleDate), "PPP", { locale: es })}
                          </p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(sale.saleDate), "HH:mm")}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {getPaymentMethodText(sale.paymentMethod)}
                          </p>
                          <Badge className={`text-xs ${getStatusColor(sale.status)}`}>
                            {getStatusText(sale.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-lg font-bold text-green-600">
                            ${Number(sale.total).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSaleForInvoice(sale);
                            setInvoiceDialogOpen(true);
                          }}
                          title="Imprimir factura"
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          <Printer className="h-4 w-4 text-blue-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Detail Dialog */}
      {selectedSale && (
        <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Detalles de la Venta #{selectedSale.saleNumber}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Información del Cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre</p>
                      <p className="text-base font-semibold text-gray-900">{selectedSale.customerName}</p>
                    </div>
                    {selectedSale.customerEmail && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-base text-gray-900">{selectedSale.customerEmail}</p>
                      </div>
                    )}
                    {selectedSale.customerPhone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Teléfono</p>
                        <p className="text-base text-gray-900">{selectedSale.customerPhone}</p>
                      </div>
                    )}
                    {selectedSale.customerAddress && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Dirección</p>
                        <p className="text-base text-gray-900">{selectedSale.customerAddress}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información de la Venta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Información de la Venta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha</p>
                      <p className="text-base font-semibold text-gray-900">
                        {format(new Date(selectedSale.saleDate), "PPP", { locale: es })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedSale.saleDate), "HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                      <Badge variant="outline" className="mt-1">
                        {getPaymentMethodText(selectedSale.paymentMethod)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado</p>
                      <Badge className={`mt-1 ${getStatusColor(selectedSale.status)}`}>
                        {getStatusText(selectedSale.status)}
                      </Badge>
                    </div>
                  </div>
                  {selectedSale.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Notas</p>
                      <p className="text-base text-gray-900 bg-gray-50 p-2 rounded">{selectedSale.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Productos Vendidos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Productos Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSaleItems && selectedSaleItems.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSaleItems.map((item: SaleItem, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} x ${Number(item.unitPrice).toLocaleString('es-ES', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${Number(item.subtotal).toLocaleString('es-ES', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay productos registrados</p>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de Totales */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Resumen de Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        ${Number(selectedSale.subtotal).toLocaleString('es-ES', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                    
                    {Number(selectedSale.taxAmount) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Impuestos ({Number(selectedSale.taxRate)}%):
                        </span>
                        <span className="font-medium">
                          ${Number(selectedSale.taxAmount).toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    )}
                    
                    {Number(selectedSale.discountAmount) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Descuento:</span>
                        <span className="font-medium text-red-600">
                          -${Number(selectedSale.discountAmount).toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${Number(selectedSale.total).toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSale(null)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setSaleForInvoice(selectedSale);
                    setInvoiceDialogOpen(true);
                    setSelectedSale(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Factura
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Dialog */}
      {saleForInvoice && (
        <SaleInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={(open) => {
            setInvoiceDialogOpen(open);
            if (!open) setSaleForInvoice(null);
          }}
          sale={saleForInvoice}
        />
      )}
    </div>
  );
}