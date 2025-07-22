import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Settings
} from "lucide-react";
import InventoryForm from "@/components/forms/inventory-form";
import SimpleStockAdjustment from "@/components/forms/simple-stock-adjustment";
import HomeButton from "@/components/ui/home-button";
import type { InventoryItem, StockMovement } from "@shared/schema";
import { format } from "date-fns";

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: stockMovements = [], isLoading: isLoadingMovements } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const getStockStatus = (current: string, reorder: string) => {
    const currentStock = Number(current);
    const reorderPoint = Number(reorder);
    
    if (currentStock === 0) return { label: "Agotado", variant: "destructive" as const, icon: XCircle, color: "text-red-600" };
    if (currentStock <= reorderPoint) return { label: "Stock Bajo", variant: "secondary" as const, icon: AlertTriangle, color: "text-yellow-600" };
    return { label: "En Stock", variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "in": return "text-green-600";
      case "out": return "text-red-600";
      case "adjustment": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "in": return "Entrada";
      case "out": return "Salida";  
      case "adjustment": return "Ajuste";
      default: return type;
    }
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustDialogOpen(true);
  };

  const lowStockItems = inventory.filter((item: InventoryItem) => 
    Number(item.currentStock) <= Number(item.reorderPoint)
  );

  const outOfStockItems = inventory.filter((item: InventoryItem) => 
    Number(item.currentStock) === 0
  );

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum: number, item: InventoryItem) => 
    sum + (Number(item.currentStock) * Number(item.purchasePrice)), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
                <p className="text-slate-600 mt-1">Gestión completa de productos y control de stock</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <HomeButton />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Agregar Nuevo Producto</DialogTitle>
                  </DialogHeader>
                  <InventoryForm onSuccess={() => setIsAddDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">Total Productos</p>
                  <p className="text-3xl font-bold text-blue-900">{totalItems}</p>
                  <p className="text-sm text-blue-600">Productos registrados</p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Package className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-700 font-medium">Valor Inventario</p>
                  <p className="text-3xl font-bold text-emerald-900">${totalValue.toLocaleString()}</p>
                  <p className="text-sm text-emerald-600">Valor total en stock</p>
                </div>
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-amber-700 font-medium">Stock Bajo</p>
                  <p className="text-3xl font-bold text-amber-900">{lowStockItems.length}</p>
                  <p className="text-sm text-amber-600">Requieren reposición</p>
                </div>
                <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-red-700 font-medium">Sin Stock</p>
                  <p className="text-3xl font-bold text-red-900">{outOfStockItems.length}</p>
                  <p className="text-sm text-red-600">Productos agotados</p>
                </div>
                <div className="h-14 w-14 bg-red-500 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabbed Content */}
        <Tabs defaultValue="products" className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
                <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Package className="h-4 w-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <History className="h-4 w-4 mr-2" />
                  Movimientos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="products" className="p-0 m-0">
              <div className="p-6">
                {isLoadingInventory ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[60%]" />
                          <Skeleton className="h-4 w-[40%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead className="font-semibold text-slate-900">Producto</TableHead>
                          <TableHead className="font-semibold text-slate-900">Unidad</TableHead>
                          <TableHead className="text-right font-semibold text-slate-900">P. Compra</TableHead>
                          <TableHead className="text-right font-semibold text-slate-900">P. Venta</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Stock Actual</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Punto Reposición</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Estado</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item: InventoryItem) => {
                          const status = getStockStatus(item.currentStock, item.reorderPoint);
                          const StatusIcon = status.icon;
                          
                          return (
                            <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50">
                              <TableCell className="font-medium text-slate-900">{item.productName}</TableCell>
                              <TableCell className="text-slate-600">{item.unit}</TableCell>
                              <TableCell className="text-right font-medium">${Number(item.purchasePrice).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">${Number(item.salePrice).toLocaleString()}</TableCell>
                              <TableCell className="text-center font-bold">
                                <span className={status.color}>{Number(item.currentStock)}</span>
                              </TableCell>
                              <TableCell className="text-center text-slate-600">{Number(item.reorderPoint)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={status.variant} className="inline-flex items-center font-medium">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStockAdjustment(item)}
                                    className="hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="movements" className="p-0 m-0">
              <div className="p-6">
                {isLoadingMovements ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[70%]" />
                          <Skeleton className="h-4 w-[50%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead className="font-semibold text-slate-900">Fecha</TableHead>
                          <TableHead className="font-semibold text-slate-900">Producto</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Tipo</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Cantidad</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Stock Anterior</TableHead>
                          <TableHead className="text-center font-semibold text-slate-900">Stock Nuevo</TableHead>
                          <TableHead className="font-semibold text-slate-900">Motivo</TableHead>
                          <TableHead className="font-semibold text-slate-900">Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockMovements.map((movement: StockMovement) => {
                          const inventoryItem = inventory.find((item: InventoryItem) => item.id === movement.inventoryId);
                          return (
                            <TableRow key={movement.id} className="border-slate-200 hover:bg-slate-50">
                              <TableCell className="text-slate-600">
                                {movement.createdAt && format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                              <TableCell className="font-medium text-slate-900">
                                {inventoryItem?.productName || "Producto eliminado"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant="outline"
                                  className={`${getMovementTypeColor(movement.movementType)} font-medium`}
                                >
                                  {getMovementTypeLabel(movement.movementType)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                <span className={getMovementTypeColor(movement.movementType)}>
                                  {movement.movementType === "out" ? "-" : "+"}{Number(movement.quantity)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-medium text-slate-600">{Number(movement.previousStock)}</TableCell>
                              <TableCell className="text-center font-bold text-slate-900">{Number(movement.newStock)}</TableCell>
                              <TableCell className="text-slate-600">{movement.reason}</TableCell>
                              <TableCell className="text-slate-500">{movement.reference || "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Enhanced Stock Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Ajustar Stock
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <SimpleStockAdjustment
                item={selectedItem}
                onSuccess={() => {
                  setIsAdjustDialogOpen(false);
                  setSelectedItem(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}