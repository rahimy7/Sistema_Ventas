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
import { z } from "zod";
import type { InventoryItem } from "@shared/schema";
import { Plus, Minus, Settings } from "lucide-react";

const stockAdjustmentSchema = z.object({
  adjustment: z.string().min(1, "El ajuste es requerido"),
  adjustmentType: z.enum(["increase", "decrease", "set"]),
  reason: z.string().min(1, "El motivo es requerido"),
  reference: z.string().optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  item: InventoryItem;
  onSuccess?: () => void;
}

export default function StockAdjustmentForm({ item, onSuccess }: StockAdjustmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustment: "",
      adjustmentType: "increase",
      reason: "",
      reference: "",
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      const currentStock = Number(item.currentStock);
      let finalAdjustment = Number(data.adjustment);
      
      // Calculate the actual adjustment based on type
      if (data.adjustmentType === "decrease") {
        finalAdjustment = -finalAdjustment;
      } else if (data.adjustmentType === "set") {
        finalAdjustment = finalAdjustment - currentStock;
      }

      await apiRequest("PUT", `/api/inventory/${item.id}/adjust-stock`, {
        adjustment: finalAdjustment,
        reason: data.reason,
        reference: data.reference,
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Stock ajustado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo ajustar el stock",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StockAdjustmentData) => {
    adjustStockMutation.mutate(data);
  };

  const getAdjustmentPreview = () => {
    const adjustmentValue = Number(form.watch("adjustment") || 0);
    const adjustmentType = form.watch("adjustmentType");
    const currentStock = Number(item.currentStock);
    
    let newStock: number;
    switch (adjustmentType) {
      case "increase":
        newStock = currentStock + adjustmentValue;
        break;
      case "decrease":
        newStock = currentStock - adjustmentValue;
        break;
      case "set":
        newStock = adjustmentValue;
        break;
      default:
        newStock = currentStock;
    }
    
    return {
      current: currentStock,
      new: Math.max(0, newStock), // No permitir stock negativo
      change: newStock - currentStock
    };
  };

  const preview = getAdjustmentPreview();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Información del producto */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
        <p className="text-sm text-gray-600">Stock actual: <span className="font-semibold">{Number(item.currentStock)} {item.unit}</span></p>
      </div>

      {/* Tipo de ajuste */}
      <div>
        <Label htmlFor="adjustmentType">Tipo de Ajuste</Label>
        <Select 
          value={form.watch("adjustmentType")} 
          onValueChange={(value) => form.setValue("adjustmentType", value as "increase" | "decrease" | "set")}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="increase">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                Aumentar Stock
              </div>
            </SelectItem>
            <SelectItem value="decrease">
              <div className="flex items-center">
                <Minus className="h-4 w-4 mr-2 text-red-600" />
                Disminuir Stock
              </div>
            </SelectItem>
            <SelectItem value="set">
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2 text-blue-600" />
                Establecer Stock
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cantidad */}
      <div>
        <Label htmlFor="adjustment">
          {form.watch("adjustmentType") === "set" ? "Nuevo Stock" : "Cantidad"}
        </Label>
        <Input
          id="adjustment"
          type="number"
          step="0.01"
          min="0"
          {...form.register("adjustment")}
          placeholder="0"
          className="mt-1"
        />
        {form.formState.errors.adjustment && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.adjustment.message}</p>
        )}
      </div>

      {/* Vista previa del cambio */}
      {form.watch("adjustment") && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Vista Previa</h4>
          <div className="flex items-center justify-between text-sm">
            <span>Stock actual:</span>
            <span className="font-semibold">{preview.current}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Stock nuevo:</span>
            <span className="font-semibold text-blue-600">{preview.new}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Cambio:</span>
            <span className={`font-semibold ${preview.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {preview.change >= 0 ? '+' : ''}{preview.change}
            </span>
          </div>
        </div>
      )}

      {/* Motivo */}
      <div>
        <Label htmlFor="reason">Motivo del Ajuste *</Label>
        <Select onValueChange={(value) => form.setValue("reason", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inventory_count">Conteo de inventario</SelectItem>
            <SelectItem value="damaged_goods">Mercancía dañada</SelectItem>
            <SelectItem value="expired_goods">Mercancía vencida</SelectItem>
            <SelectItem value="theft_loss">Pérdida/Robo</SelectItem>
            <SelectItem value="supplier_return">Devolución a proveedor</SelectItem>
            <SelectItem value="customer_return">Devolución de cliente</SelectItem>
            <SelectItem value="correction">Corrección de error</SelectItem>
            <SelectItem value="other">Otro motivo</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.reason && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.reason.message}</p>
        )}
      </div>

      {/* Motivo personalizado si selecciona "Otro" */}
      {form.watch("reason") === "other" && (
        <div>
          <Label htmlFor="customReason">Especificar Motivo</Label>
          <Textarea
            id="customReason"
            {...form.register("reason")}
            placeholder="Describe el motivo del ajuste..."
            className="mt-1"
          />
        </div>
      )}

      {/* Referencia (opcional) */}
      <div>
        <Label htmlFor="reference">Referencia (Opcional)</Label>
        <Input
          id="reference"
          {...form.register("reference")}
          placeholder="Ej: Orden #123, Nota de ajuste #456"
          className="mt-1"
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={adjustStockMutation.isPending}
          className={preview.change < 0 ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {adjustStockMutation.isPending ? "Ajustando..." : "Confirmar Ajuste"}
        </Button>
      </div>
    </form>
  );
}