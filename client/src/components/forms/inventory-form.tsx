import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInventorySchema, type InsertInventoryItem } from "@shared/schema";

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
      purchasePrice: "0",
      salePrice: "0",
      initialStock: "0",
      reorderPoint: "0",
    },
  });

  const createMutation = useMutation({
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
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al inventario",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInventoryItem) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productName">Nombre del Producto *</Label>
          <Input
            id="productName"
            {...form.register("productName")}
            placeholder="Ej: Aceite 20W-50"
            className="mt-1"
          />
          {form.formState.errors.productName && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.productName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="unit">Unidad de Medida *</Label>
          <Select onValueChange={(value) => form.setValue("unit", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unidades">Unidades</SelectItem>
              <SelectItem value="litros">Litros</SelectItem>
              <SelectItem value="kilogramos">Kilogramos</SelectItem>
              <SelectItem value="metros">Metros</SelectItem>
              <SelectItem value="cajas">Cajas</SelectItem>
              <SelectItem value="galones">Galones</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.unit && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.unit.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Agregar Producto"}
        </Button>
      </div>
    </form>
  );
}
