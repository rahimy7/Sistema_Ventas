import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema, type InsertSale, type InventoryItem } from "@shared/schema";
import { Plus, Trash2, ShoppingCart, User, CreditCard, Package, Calculator } from "lucide-react";
import { z } from "zod";
import { useState, useEffect } from "react";

interface SaleFormProps {
  onSuccess?: () => void;
}

// Esquema extendido para incluir items
const saleFormSchema = insertSaleSchema.extend({
  items: z.array(z.object({
    inventoryId: z.number(),
    productName: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
    subtotal: z.string(),
  })).min(1, "Debe agregar al menos un producto"),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

export default function SaleForm({ onSuccess }: SaleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      saleDate: new Date(),
      subtotal: "0",
      taxRate: "0",
      taxAmount: "0",
      discountAmount: "0",
      total: "0",
      paymentMethod: "",
      status: "completed",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Obtener inventario disponible
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const { items, ...saleData } = data;
      await apiRequest("POST", "/api/sales", { ...saleData, items });
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "Venta registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive",
      });
    },
  });

  const addProduct = () => {
    if (selectedProduct) {
      const quantity = "1";
      const unitPrice = selectedProduct.salePrice;
      const subtotal = (Number(quantity) * Number(unitPrice)).toString();

      append({
        inventoryId: selectedProduct.id,
        productName: selectedProduct.productName,
        quantity,
        unitPrice,
        subtotal,
      });
      setSelectedProduct(null);
    }
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const item = form.getValues(`items.${index}`);
    const subtotal = (Number(quantity) * Number(item.unitPrice)).toString();
    form.setValue(`items.${index}.quantity`, quantity);
    form.setValue(`items.${index}.subtotal`, subtotal);
    calculateTotals();
  };

  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const taxRate = Number(form.getValues("taxRate"));
    const discountAmount = Number(form.getValues("discountAmount"));
    
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;

    form.setValue("subtotal", subtotal.toString());
    form.setValue("taxAmount", taxAmount.toString());
    form.setValue("total", total.toString());
  };

  useEffect(() => {
    calculateTotals();
  }, [form.watch("items"), form.watch("taxRate"), form.watch("discountAmount")]);

  const onSubmit = (data: SaleFormData) => {
    createSaleMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          Nueva Venta
        </h2>
        <p className="text-gray-600 mt-2">Registra una nueva venta en el sistema</p>
      </div>

      {/* Información del Cliente */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Nombre del Cliente *</Label>
            <Input
              id="customerName"
              {...form.register("customerName")}
              placeholder="Nombre completo del cliente"
              className="mt-1"
            />
            {form.formState.errors.customerName && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.customerName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerPhone">Teléfono</Label>
            <Input
              id="customerPhone"
              {...form.register("customerPhone")}
              placeholder="Número de teléfono"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              {...form.register("customerEmail")}
              placeholder="correo@ejemplo.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="customerAddress">Dirección</Label>
            <Input
              id="customerAddress"
              {...form.register("customerAddress")}
              placeholder="Dirección del cliente"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
        </div>

        {/* Agregar Producto */}
        <div className="flex gap-2 mb-4">
          <Select onValueChange={(value) => {
            const product = inventory.find(p => p.id.toString() === value);
            setSelectedProduct(product || null);
          }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Seleccionar producto..." />
            </SelectTrigger>
            <SelectContent>
              {inventory.filter(item => Number(item.currentStock) > 0).map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.productName} - Stock: {item.currentStock} - ${item.salePrice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={addProduct}
            disabled={!selectedProduct}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de Productos */}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center bg-white p-3 rounded-lg border">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{field.productName}</span>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.watch(`items.${index}.quantity`)}
                  onChange={(e) => updateItemQuantity(index, e.target.value)}
                  className="text-center"
                />
              </div>
              <div className="w-24 text-right">
                <span className="text-gray-600">${field.unitPrice}</span>
              </div>
              <div className="w-24 text-right">
                <span className="font-medium">${field.subtotal}</span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  remove(index);
                  calculateTotals();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {form.formState.errors.items && (
          <p className="text-sm text-red-600 mt-2">{form.formState.errors.items.message}</p>
        )}
      </div>

      {/* Totales y Pago */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Totales y Pago</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              step="0.01"
              {...form.register("taxRate")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="discountAmount">Descuento ($)</Label>
            <Input
              id="discountAmount"
              type="number"
              min="0"
              step="0.01"
              {...form.register("discountAmount")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Método de Pago *</Label>
            <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.paymentMethod.message}</p>
            )}
          </div>
        </div>

        {/* Resumen de Totales */}
        <div className="bg-white p-4 rounded-lg border space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${form.watch("subtotal")}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos:</span>
            <span>${form.watch("taxAmount")}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento:</span>
            <span>-${form.watch("discountAmount")}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${form.watch("total")}</span>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Notas adicionales sobre la venta..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => form.reset()}
          className="hover:bg-gray-50 flex items-center justify-center"
        >
          <Package className="h-4 w-4 mr-2" />
          Limpiar Formulario
        </Button>
        <Button
          type="submit"
          disabled={createSaleMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg min-w-[160px] flex items-center justify-center"
        >
          {createSaleMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Registrar Venta
            </>
          )}
        </Button>
      </div>
    </form>
  );
}