import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem } from "@shared/schema";
import { Plus, Minus } from "lucide-react";

interface SimpleStockAdjustmentProps {
  item: InventoryItem;
  onSuccess?: () => void;
}

export default function SimpleStockAdjustment({ item, onSuccess }: SimpleStockAdjustmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const adjustStockMutation = useMutation({
    mutationFn: async () => {
      const adjustment = adjustmentType === "increase" ? Number(quantity) : -Number(quantity);
      const finalReason = reason || `${adjustmentType === "increase" ? "Aumento" : "Reducción"} manual de stock`;
      
      await apiRequest("PUT", `/api/inventory/${item.id}/adjust-stock`, {
        adjustment,
        reason: finalReason,
        reference: `Ajuste manual - ${new Date().toLocaleDateString()}`,
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
      setQuantity("");
      setReason("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }
    adjustStockMutation.mutate();
  };

  const currentStock = Number(item.currentStock);
  const adjustmentValue = Number(quantity) || 0;
  const newStock = adjustmentType === "increase" 
    ? currentStock + adjustmentValue 
    : Math.max(0, currentStock - adjustmentValue);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Información del producto */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
        <p className="text-sm text-gray-600">Stock actual: <span className="font-semibold">{currentStock} {item.unit}</span></p>
      </div>

      {/* Tipo de ajuste */}
      <div>
        <Label>Tipo de Ajuste</Label>
        <Select value={adjustmentType} onValueChange={(value: "increase" | "decrease") => setAdjustmentType(value)}>
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
                Reducir Stock
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cantidad */}
      <div>
        <Label htmlFor="quantity">Cantidad</Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          min="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          className="mt-1"
        />
      </div>

      {/* Vista previa */}
      {quantity && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Vista Previa</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Stock actual:</span>
              <span className="font-semibold">{currentStock}</span>
            </div>
            <div className="flex justify-between">
              <span>Cambio:</span>
              <span className={`font-semibold ${adjustmentType === "increase" ? "text-green-600" : "text-red-600"}`}>
                {adjustmentType === "increase" ? "+" : "-"}{adjustmentValue}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stock nuevo:</span>
              <span className="font-semibold text-blue-600">{newStock}</span>
            </div>
          </div>
        </div>
      )}

      {/* Motivo opcional */}
      <div>
        <Label htmlFor="reason">Motivo (Opcional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Conteo de inventario, mercancía dañada..."
          className="mt-1"
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={adjustStockMutation.isPending || !quantity}
          className={adjustmentType === "decrease" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {adjustStockMutation.isPending ? "Ajustando..." : "Confirmar Ajuste"}
        </Button>
      </div>
    </form>
  );
}