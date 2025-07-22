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
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-900">{item.productName}</h3>
        <p className="text-sm text-slate-600">Stock actual: <span className="font-semibold text-blue-600">{currentStock} {item.unit}</span></p>
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Vista Previa del Ajuste
          </h4>
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Stock actual:</span>
              <span className="font-semibold text-slate-900">{currentStock}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Cambio:</span>
              <span className={`font-bold ${adjustmentType === "increase" ? "text-emerald-600" : "text-red-600"}`}>
                {adjustmentType === "increase" ? "+" : "-"}{adjustmentValue}
              </span>
            </div>
            <div className="border-t border-blue-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">Stock nuevo:</span>
                <span className="font-bold text-blue-700 text-lg">{newStock}</span>
              </div>
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
      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          className="hover:bg-slate-50"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={adjustStockMutation.isPending || !quantity}
          className={`shadow-lg transition-all duration-200 ${
            adjustmentType === "decrease" 
              ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" 
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          }`}
        >
          {adjustStockMutation.isPending ? "Ajustando..." : "Confirmar Ajuste"}
        </Button>
      </div>
    </form>
  );
}