import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Package, TrendingUp, DollarSign, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PurchaseForm from "@/components/forms/purchase-form";
import HomeButton from "@/components/ui/home-button";
import { Purchase } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PurchaseStats {
  totalPurchases: number;
  totalAmount: string;
  monthlyPurchases: number;
  monthlyAmount: string;
}

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch purchases data
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });

  // Fetch purchase statistics
  const { data: stats } = useQuery<PurchaseStats>({
    queryKey: ["/api/purchases/stats"],
  });

  // Delete purchase mutation
  const deletePurchase = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/purchases/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/stats"] });
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

  // Filter purchases based on search term
  const filteredPurchases = purchases.filter((purchase: Purchase) =>
    purchase.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deletePurchase.mutate(id);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPurchase(null);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      cash: "default",
      card: "secondary",
      transfer: "outline",
      check: "outline",
    };
    
    const labels: Record<string, string> = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
      check: "Cheque",
    };

    return (
      <Badge variant={variants[method] || "default"}>
        {labels[method] || method}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Gestión de Compras
            </h1>
            <p className="mt-2 text-gray-600">
              Administra las compras a proveedores y controla el inventario
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <HomeButton />
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setEditingPurchase(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPurchase ? "Editar Compra" : "Nueva Compra"}
                </DialogTitle>
                <DialogDescription>
                  {editingPurchase
                    ? "Modifica los datos de la compra."
                    : "Registra una nueva compra de productos o servicios."}
                </DialogDescription>
              </DialogHeader>
              <PurchaseForm
                purchase={editingPurchase}
                onSuccess={closeForm}
                onCancel={closeForm}
              />
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Compras
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {Number(stats.totalPurchases).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Compras registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monto Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${parseFloat(stats.totalAmount).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inversión total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Compras del Mes
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {Number(stats.monthlyPurchases).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monto Mensual
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${parseFloat(stats.monthlyAmount).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mes actual
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="purchases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 lg:w-auto lg:grid-cols-1">
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Lista de Compras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buscar Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por proveedor, producto o número de factura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Purchases Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Compras Registradas ({filteredPurchases.length})
                </CardTitle>
                <CardDescription>
                  Historial completo de compras realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Cargando compras...</div>
                  </div>
                ) : filteredPurchases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay compras registradas</p>
                    <p className="text-sm">
                      {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza registrando tu primera compra"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Factura</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPurchases.map((purchase: Purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              {format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {purchase.supplier}
                            </TableCell>
                            <TableCell>{purchase.product}</TableCell>
                            <TableCell>
                              {Number(purchase.quantity).toLocaleString()} {purchase.unit}
                            </TableCell>
                            <TableCell>
                              ${Number(purchase.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${Number(purchase.totalAmount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {getPaymentMethodBadge(purchase.paymentMethod)}
                            </TableCell>
                            <TableCell>
                              {purchase.invoiceNumber || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(purchase)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        ¿Eliminar compra?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. La compra será eliminada permanentemente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(purchase.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}