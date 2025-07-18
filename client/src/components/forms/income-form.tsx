import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertIncomeSchema, type InsertIncome } from "@shared/schema";
import { useState } from "react";

interface IncomeFormProps {
  onSuccess?: () => void;
}

export default function IncomeForm({ onSuccess }: IncomeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  const form = useForm<InsertIncome>({
    resolver: zodResolver(insertIncomeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0] as any,
      client: "",
      productService: "",
      quantity: "0",
      unitPrice: "0",
      total: "0",
      paymentMethod: "",
      observations: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertIncome) => {
      await apiRequest("POST", "/api/incomes", data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Ingreso registrado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el ingreso",
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

  const onSubmit = (data: InsertIncome) => {
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
          <Label htmlFor="client">Cliente</Label>
          <Input
            id="client"
            {...form.register("client")}
            placeholder="Nombre del cliente (opcional)"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="productService">Producto o Servicio *</Label>
        <Input
          id="productService"
          {...form.register("productService")}
          placeholder="Descripción del producto o servicio"
          className="mt-1"
        />
        {form.formState.errors.productService && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.productService.message}</p>
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
        <Label htmlFor="paymentMethod">Forma de Pago *</Label>
        <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar forma de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.paymentMethod.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea
          id="observations"
          {...form.register("observations")}
          placeholder="Observaciones adicionales (opcional)"
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Guardar Ingreso"}
        </Button>
      </div>
    </form>
  );
}
