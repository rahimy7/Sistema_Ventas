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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión completa de productos y stock</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            </DialogHeader>
            <InventoryForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Agotados</p>
                <p className="text-2xl font-bold">{outOfStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal con pestañas */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInventory ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">P. Compra</TableHead>
                        <TableHead className="text-right">P. Venta</TableHead>
                        <TableHead className="text-center">Stock Actual</TableHead>
                        <TableHead className="text-center">Punto Reposición</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item: InventoryItem) => {
                        const status = getStockStatus(item.currentStock, item.reorderPoint);
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">${Number(item.purchasePrice).toLocaleString()}</TableCell>
                            <TableCell className="text-right">${Number(item.salePrice).toLocaleString()}</TableCell>
                            <TableCell className="text-center font-semibold">
                              <span className={status.color}>{Number(item.currentStock)}</span>
                            </TableCell>
                            <TableCell className="text-center">{Number(item.reorderPoint)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={status.variant} className="inline-flex items-center">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[300px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-center">Stock Anterior</TableHead>
                        <TableHead className="text-center">Stock Nuevo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Referencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMovements.map((movement: StockMovement) => {
                        const inventoryItem = inventory.find((item: InventoryItem) => item.id === movement.inventoryId);
                        return (
                          <TableRow key={movement.id}>
                            <TableCell>
                              {movement.createdAt && format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {inventoryItem?.productName || "Producto eliminado"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="outline"
                                className={getMovementTypeColor(movement.movementType)}
                              >
                                {getMovementTypeLabel(movement.movementType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              <span className={getMovementTypeColor(movement.movementType)}>
                                {movement.movementType === "out" ? "-" : "+"}{Number(movement.quantity)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{Number(movement.previousStock)}</TableCell>
                            <TableCell className="text-center font-semibold">{Number(movement.newStock)}</TableCell>
                            <TableCell>{movement.reason}</TableCell>
                            <TableCell>{movement.reference || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para ajuste de stock */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
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
  );
}