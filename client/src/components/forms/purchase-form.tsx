import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPurchaseSchema, type InsertPurchase, type Purchase } from "@shared/schema";
import { useState, useEffect } from "react";
import { Calculator, Package, User, CreditCard } from "lucide-react";

interface PurchaseFormProps {
  purchase?: Purchase | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Productos para reventa",
  "Materias primas", 
  "Suministros de oficina",
  "Equipos y herramientas",
  "Servicios",
  "Mantenimiento",
  "Otros"
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
];

const UNITS = [
  "unidades", "piezas", "kilogramos", "gramos", "litros", "metros", "cajas", "packs"
];

export default function PurchaseForm({ purchase, onSuccess, onCancel }: PurchaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const form = useForm<InsertPurchase>({
    resolver: zodResolver(insertPurchaseSchema),
    defaultValues: {
      purchaseDate: purchase?.purchaseDate ? new Date(purchase.purchaseDate) : new Date(),
      supplier: purchase?.supplier || "",
      product: purchase?.product || "",
      unit: purchase?.unit || "",
      quantity: purchase?.quantity || "0",
      unitPrice: purchase?.unitPrice || "0",
      totalAmount: purchase?.totalAmount || "0",
      category: purchase?.category || "",
      paymentMethod: purchase?.paymentMethod || "",
      invoiceNumber: purchase?.invoiceNumber || "",
      notes: purchase?.notes || "",
    },
  });

  // Initialize values for editing
  useEffect(() => {
    if (purchase) {
      const qty = parseFloat(purchase.quantity);
      const price = parseFloat(purchase.unitPrice);
      setQuantity(qty);
      setUnitPrice(price);
      setTotal(parseFloat(purchase.totalAmount));
    }
  }, [purchase]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPurchase) => {
      const url = purchase ? `/api/purchases/${purchase.id}` : "/api/purchases";
      const method = purchase ? "PUT" : "POST";
      return apiRequest(url, method, data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: purchase ? "Compra actualizada correctamente" : "Compra registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (!purchase) form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo procesar la compra",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = (qty: number, price: number) => {
    const newTotal = qty * price;
    setTotal(newTotal);
    form.setValue("totalAmount", newTotal.toFixed(2));
    return newTotal;
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
      purchaseDate: new Date(data.purchaseDate),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Número de factura o recibo" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Product Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles del Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto o Servicio *</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del producto o servicio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleQuantityChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleUnitPriceChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        readOnly
                        className="bg-gray-50 font-medium"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <p><strong>Total a pagar: ${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                <p className="text-xs mt-1">
                  {Number(quantity).toLocaleString()} {form.watch("unit") || "unidades"} × ${Number(unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre la compra..."
                      {...field}
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {createMutation.isPending ? "Guardando..." : purchase ? "Actualizar Compra" : "Registrar Compra"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
