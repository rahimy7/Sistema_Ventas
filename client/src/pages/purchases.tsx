import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import EnhancedPurchaseForm from "@/components/forms/enhanced-purchase-form";
import HomeButton from "@/components/ui/home-button";
import { 
  ShoppingBag, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Building,
  CreditCard,
  FileText,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Purchase } from "@shared/schema";

export default function PurchasesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Cargar compras
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  // Estadísticas de compras
  const purchaseStats = {
    totalPurchases: purchases.length,
    todaysPurchases: purchases.filter(purchase => {
      const today = new Date();
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate.toDateString() === today.toDateString();
    }).length,
    totalAmount: purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0),
    averagePurchase: purchases.length > 0 ? purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0) / purchases.length : 0,
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "check": return "Cheque";
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
              <ShoppingBag className="h-8 w-8 text-orange-600" />
              Compras
            </h1>
            <p className="text-gray-600 mt-2">Gestiona todas las compras e inventario de tu negocio</p>
          </div>
          <div className="flex items-center space-x-3">
            <HomeButton />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Compra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-screen w-[95vw] h-[95vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-xl">Registrar Nueva Compra</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <EnhancedPurchaseForm 
                    onSuccess={() => setDialogOpen(false)} 
                    onCancel={() => setDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-orange-700 font-medium">Compras Totales</p>
                  <p className="text-3xl font-bold text-orange-900">{purchaseStats.totalPurchases}</p>
                  <p className="text-sm text-orange-600">Todas las compras</p>
                </div>
                <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">Compras Hoy</p>
                  <p className="text-3xl font-bold text-blue-900">{purchaseStats.todaysPurchases}</p>
                  <p className="text-sm text-blue-600">Compras del día</p>
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
                  <p className="text-purple-700 font-medium">Monto Total</p>
                  <p className="text-3xl font-bold text-purple-900">${purchaseStats.totalAmount.toFixed(2)}</p>
                  <p className="text-sm text-purple-600">Suma de compras</p>
                </div>
                <div className="h-14 w-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-green-700 font-medium">Compra Promedio</p>
                  <p className="text-3xl font-bold text-green-900">${purchaseStats.averagePurchase.toFixed(2)}</p>
                  <p className="text-sm text-green-600">Por compra</p>
                </div>
                <div className="h-14 w-14 bg-green-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Compras */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Historial de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {purchasesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay compras registradas</p>
                <p className="text-gray-500">¡Registra tu primera compra para empezar!</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2 p-4">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Compra #{purchase.id}</span>
                            {purchase.invoiceNumber && (
                              <Badge variant="outline" className="text-xs">
                                {purchase.invoiceNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {purchase.supplier}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(purchase.purchaseDate), "PPP", { locale: es })}
                          </p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(purchase.purchaseDate), "HH:mm")}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {getPaymentMethodText(purchase.paymentMethod)}
                          </p>
                          <p className="text-xs text-gray-600">Método de pago</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-lg font-bold text-orange-600">
                            ${Number(purchase.totalAmount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}