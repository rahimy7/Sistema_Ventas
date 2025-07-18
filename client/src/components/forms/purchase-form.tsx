import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPurchaseSchema, type InsertPurchase } from "@shared/schema";
import { useState } from "react";

interface PurchaseFormProps {
  onSuccess?: () => void;
}

export default function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  const form = useForm<InsertPurchase>({
    resolver: zodResolver(insertPurchaseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0] as any,
      supplier: "",
      product: "",
      quantity: "0",
      unitPrice: "0",
      total: "0",
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPurchase) => {
      await apiRequest("POST", "/api/purchases", data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Compra registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la compra",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = (qty: number, price: number) => {
    const total = qty * price;
    form.setValue("total", total.toString());
    return total;
  };

  const handleQuantityChange = (value: string) => {
    const qty = parseFloat(value) || 0;
    setQuantity(qty);
    form.setValue("quantity", value);
    calculateTotal(qty, unitPrice);
  };

  const handleUnitPriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    setUnitPrice(price);
    form.setValue("unitPrice", value);
    calculateTotal(quantity, price);
  };

  const onSubmit = (data: InsertPurchase) => {
    createMutation.mutate({
      ...data,
      date: new Date(data.date),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Fecha *</Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            className="mt-1"
          />
          {form.formState.errors.date && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="supplier">Proveedor *</Label>
          <Input
            id="supplier"
            {...form.register("supplier")}
            placeholder="Nombre del proveedor"
            className="mt-1"
          />
          {form.formState.errors.supplier && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.supplier.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="product">Producto o Insumo *</Label>
        <Input
          id="product"
          {...form.register("product")}
          placeholder="Descripción del producto o insumo"
          className="mt-1"
        />
        {form.formState.errors.product && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.product.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="quantity">Cantidad *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            {...form.register("quantity")}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="mt-1"
          />
          {form.formState.errors.quantity && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.quantity.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="unitPrice">Precio Unitario *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            {...form.register("unitPrice")}
            onChange={(e) => handleUnitPriceChange(e.target.value)}
            className="mt-1"
          />
          {form.formState.errors.unitPrice && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.unitPrice.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="total">Total</Label>
          <Input
            id="total"
            type="number"
            step="0.01"
            {...form.register("total")}
            readOnly
            className="mt-1 bg-gray-50"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Categoría *</Label>
        <Select onValueChange={(value) => form.setValue("category", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aceites">Aceites</SelectItem>
            <SelectItem value="filtros">Filtros</SelectItem>
            <SelectItem value="herramientas">Herramientas</SelectItem>
            <SelectItem value="repuestos">Repuestos</SelectItem>
            <SelectItem value="materiales">Materiales</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Guardar Compra"}
        </Button>
      </div>
    </form>
  );
}
