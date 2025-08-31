import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedPurchaseForm from "@/components/forms/enhanced-purchase-form";
import PurchaseInvoiceDialog from "@/components/invoice/purchase-invoice-dialog";
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
  Package,
  Eye,
  Printer,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Purchase } from "@shared/schema";

export default function PurchasesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para eliminar compra
  const deletePurchase = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Compra eliminada",
        description: "La compra ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar la compra.",
        variant: "destructive",
      });
    },
  });


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
    averagePurchase: purchases.length > 0 ? 
      purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0) / purchases.length : 0,
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

  const handleViewInvoice = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setInvoiceDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deletePurchase.mutate(id);
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
                  <DialogDescription>
                    Complete los datos para registrar una nueva compra
                  </DialogDescription>
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
                  <p className="text-orange-700 font-medium">Total Compras</p>
                  <p className="text-3xl font-bold text-orange-900">{purchaseStats.totalPurchases}</p>
                  <p className="text-sm text-orange-600">Registros totales</p>
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
                  <p className="text-blue-700 font-medium">Hoy</p>
                  <p className="text-3xl font-bold text-blue-900">{purchaseStats.todaysPurchases}</p>
                  <p className="text-sm text-blue-600">Compras de hoy</p>
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
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay compras registradas</p>
                <p className="text-sm">Comienza registrando tu primera compra</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Fecha</TableHead>
                      <TableHead className="font-semibold text-gray-900">Proveedor</TableHead>
                      <TableHead className="font-semibold text-gray-900">Método de Pago</TableHead>
                      <TableHead className="font-semibold text-gray-900">Monto Total</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {format(new Date(purchase.purchaseDate), 'dd MMM yyyy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{purchase.supplier}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-500" />
                            <Badge variant="outline" className="text-xs">
                              {getPaymentMethodText(purchase.paymentMethod)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              ${Number(purchase.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewInvoice(purchase)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              onClick={() => handleViewInvoice(purchase)}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Imprimir
                            </Button>
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
                                  <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. La compra del proveedor "{purchase.supplier}" 
                                    por ${Number(purchase.totalAmount).toFixed(2)} será eliminada permanentemente.
                                    <br /><br />
                                    <strong>Nota:</strong> Los productos agregados al inventario y los activos creados 
                                    desde esta compra NO serán eliminados automáticamente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(purchase.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar Compra
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

      {/* Diálogo de factura de compra */}
      {selectedPurchase && (
        <PurchaseInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          purchase={selectedPurchase}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}