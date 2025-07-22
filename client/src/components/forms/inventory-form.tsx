import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInventorySchema, type InsertInventoryItem } from "@shared/schema";
import { Package, DollarSign, Hash, AlertTriangle, Plus } from "lucide-react";

interface InventoryFormProps {
  onSuccess?: () => void;
}

export default function InventoryForm({ onSuccess }: InventoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertInventoryItem>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      productName: "",
      unit: "",
      purchasePrice: "",
      salePrice: "",
      initialStock: "",
      reorderPoint: "",
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      await apiRequest("POST", "/api/inventory", data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Producto agregado al inventario correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al inventario",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInventoryItem) => {
    createInventoryMutation.mutate(data);
  };

  const calculateProfitMargin = () => {
    const purchasePrice = Number(form.watch("purchasePrice")) || 0;
    const salePrice = Number(form.watch("salePrice")) || 0;
    if (purchasePrice > 0 && salePrice > 0) {
      const margin = ((salePrice - purchasePrice) / purchasePrice) * 100;
      return margin.toFixed(1);
    }
    return "0.0";
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-slate-200">
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-slate-600">Completa la información del nuevo producto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-600" />
              Información Básica
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Nombre del Producto *</Label>
                <Input
                  id="productName"
                  {...form.register("productName")}
                  placeholder="Ej: Aceite Motor 20W-50"
                  className="mt-1"
                />
                {form.formState.errors.productName && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.productName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Unidad de Medida *</Label>
                <Input
                  id="unit"
                  {...form.register("unit")}
                  placeholder="Ej: litros, unidades, kilos, metros"
                  className="mt-1"
                  list="unit-suggestions"
                />
                <datalist id="unit-suggestions">
                  <option value="litros" />
                  <option value="unidades" />
                  <option value="kilos" />
                  <option value="metros" />
                  <option value="pares" />
                  <option value="juegos" />
                  <option value="cajas" />
                  <option value="galones" />
                </datalist>
                {form.formState.errors.unit && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.unit.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de Precios */}
        <div className="space-y-4">
          <div className="bg-emerald-50 p-4 rounded-xl">
            <h3 className="font-semibold text-emerald-900 mb-4 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
              Información de Precios
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="purchasePrice">Precio de Compra *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("purchasePrice")}
                  placeholder="0.00"
                  className="mt-1"
                />
                {form.formState.errors.purchasePrice && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.purchasePrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="salePrice">Precio de Venta *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("salePrice")}
                  placeholder="0.00"
                  className="mt-1"
                />
                {form.formState.errors.salePrice && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.salePrice.message}</p>
                )}
              </div>

              {/* Margen de Ganancia */}
              {(form.watch("purchasePrice") && form.watch("salePrice")) && (
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">Margen de ganancia:</span>
                    <span className="font-bold text-emerald-800">{calculateProfitMargin()}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información de Stock */}
      <div className="bg-amber-50 p-4 rounded-xl">
        <h3 className="font-semibold text-amber-900 mb-4 flex items-center">
          <Hash className="h-4 w-4 mr-2 text-amber-600" />
          Control de Inventario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="initialStock">Stock Inicial *</Label>
            <Input
              id="initialStock"
              type="number"
              step="0.01"
              min="0"
              {...form.register("initialStock")}
              placeholder="0"
              className="mt-1"
            />
            {form.formState.errors.initialStock && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.initialStock.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reorderPoint">Punto de Reposición *</Label>
            <Input
              id="reorderPoint"
              type="number"
              step="0.01"
              min="0"
              {...form.register("reorderPoint")}
              placeholder="0"
              className="mt-1"
            />
            {form.formState.errors.reorderPoint && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.reorderPoint.message}</p>
            )}
            <p className="text-xs text-amber-600 mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Nivel mínimo antes de solicitar reposición
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => form.reset()}
          className="hover:bg-slate-50 flex items-center justify-center"
        >
          <Package className="h-4 w-4 mr-2" />
          Limpiar Formulario
        </Button>
        <Button
          type="submit"
          disabled={createInventoryMutation.isPending}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg min-w-[160px] flex items-center justify-center"
        >
          {createInventoryMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </>
          )}
        </Button>
      </div>
    </form>
  );
}