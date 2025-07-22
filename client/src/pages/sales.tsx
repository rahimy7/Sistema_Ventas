import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SaleForm from "@/components/forms/sale-form";
import { 
  ShoppingCart, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  User,
  CreditCard,
  Eye,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Sale } from "@shared/schema";

export default function SalesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Cargar ventas
  const { data: sales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
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
    averageTicket: sales.length > 0 ? sales.reduce((sum, sale) => sum + Number(sale.total), 0) / sales.length : 0,
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
    <div className="space-y-8 p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            Ventas
          </h1>
          <p className="text-gray-600 mt-2">Gestiona todas las ventas de tu negocio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Venta</DialogTitle>
            </DialogHeader>
            <SaleForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
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
                <p className="text-blue-700 font-medium">Ventas Hoy</p>
                <p className="text-3xl font-bold text-blue-900">{salesStats.todaysSales}</p>
                <p className="text-sm text-blue-600">Ventas del día</p>
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
                <p className="text-3xl font-bold text-purple-900">${salesStats.totalRevenue.toFixed(2)}</p>
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
                <p className="text-3xl font-bold text-orange-900">${salesStats.averageTicket.toFixed(2)}</p>
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
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Historial de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay ventas registradas</p>
              <p className="text-gray-500">¡Registra tu primera venta para empezar!</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2 p-4">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{sale.saleNumber}</span>
                          <Badge className={`text-xs ${getStatusColor(sale.status)}`}>
                            {getStatusText(sale.status)}
                          </Badge>
                        </div>
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
                        <p className="text-xs text-gray-600">Método de pago</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-lg font-bold text-green-600">
                          ${Number(sale.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
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
  );
}