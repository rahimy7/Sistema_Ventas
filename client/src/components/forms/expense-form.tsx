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
import { insertExpenseSchema, type InsertExpense } from "@shared/schema";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0] as any,
      category: "",
      description: "",
      amount: "0",
      paymentMethod: "",
      receipt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Gasto registrado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
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
          <Label htmlFor="category">Categoría *</Label>
          <Select onValueChange={(value) => form.setValue("category", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="energía">Energía</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="publicidad">Publicidad</SelectItem>
              <SelectItem value="materiales">Materiales</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.category.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Input
          id="description"
          {...form.register("description")}
          placeholder="Descripción detallada del gasto"
          className="mt-1"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Monto *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...form.register("amount")}
            placeholder="0.00"
            className="mt-1"
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.amount.message}</p>
          )}
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
      </div>

      <div>
        <Label htmlFor="receipt">Comprobante/Factura</Label>
        <Input
          id="receipt"
          {...form.register("receipt")}
          placeholder="Número de comprobante o referencia (opcional)"
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Guardar Gasto"}
        </Button>
      </div>
    </form>
  );
}
