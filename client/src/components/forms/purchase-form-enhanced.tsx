import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InventoryItem } from "@shared/schema";
import { useState, useEffect } from "react";
import { Calculator, Package, User, CreditCard, Plus, Trash2, Search, ShoppingCart } from "lucide-react";
import { z } from "zod";

// Schema para un item de compra
const purchaseItemSchema = z.object({
  product: z.string().min(1, "Producto requerido"),
  unit: z.string().min(1, "Unidad requerida"),
  quantity: z.string().min(1, "Cantidad requerida"),
  unitPrice: z.string().min(1, "Precio unitario requerido"),
  totalAmount: z.string().min(1, "Total requerido"),
  category: z.string().min(1, "Categoría requerida"),
  inventoryId: z.number().optional(),
  isNewProduct: z.boolean().default(true),
  salePrice: z.string().optional(),
  reorderPoint: z.string().optional(),
});

// Schema para la compra completa
const enhancedPurchaseSchema = z.object({
  purchaseDate: z.date(),
  supplier: z.string().min(1, "Proveedor requerido"),
  paymentMethod: z.string().min(1, "Método de pago requerido"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Debe agregar al menos un producto"),
});

type EnhancedPurchaseFormData = z.infer<typeof enhancedPurchaseSchema>;

interface PurchaseFormEnhancedProps {
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

export default function PurchaseFormEnhanced({ onSuccess, onCancel }: PurchaseFormEnhancedProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing inventory items
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const form = useForm<EnhancedPurchaseFormData>({
    resolver: zodResolver(enhancedPurchaseSchema),
    defaultValues: {
      purchaseDate: new Date(),
      supplier: "",
      paymentMethod: "",
      invoiceNumber: "",
      notes: "",
      items: [{
        product: "",
        unit: "",
        quantity: "0",
        unitPrice: "0",
        totalAmount: "0",
        category: "",
        isNewProduct: true,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate total for individual item
  const calculateItemTotal = (index: number) => {
    const quantity = parseFloat(form.watch(`items.${index}.quantity`) || "0");
    const unitPrice = parseFloat(form.watch(`items.${index}.unitPrice`) || "0");
    const total = quantity * unitPrice;
    form.setValue(`items.${index}.totalAmount`, total.toFixed(2));
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const items = form.watch("items");
    return items.reduce((sum, item) => {
      return sum + parseFloat(item.totalAmount || "0");
    }, 0);
  };

  // Handle product selection from inventory
  const handleInventorySelection = (inventoryId: string, index: number) => {
    const item = inventoryItems.find(inv => inv.id === parseInt(inventoryId));
    if (item) {
      form.setValue(`items.${index}.product`, item.productName);
      form.setValue(`items.${index}.unit`, item.unit);
      form.setValue(`items.${index}.unitPrice`, item.purchasePrice);
      form.setValue(`items.${index}.inventoryId`, item.id);
      form.setValue(`items.${index}.isNewProduct`, false);
      calculateItemTotal(index);
    }
  };

  // Toggle between new product and existing product
  const toggleProductType = (index: number, isNew: boolean) => {
    form.setValue(`items.${index}.isNewProduct`, isNew);
    if (isNew) {
      form.setValue(`items.${index}.inventoryId`, undefined);
      form.setValue(`items.${index}.product`, "");
      form.setValue(`items.${index}.unit`, "");
      form.setValue(`items.${index}.unitPrice`, "0");
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: EnhancedPurchaseFormData) => {
      const totalAmount = calculateGrandTotal();
      
      const purchaseData = {
        purchaseDate: data.purchaseDate,
        supplier: data.supplier,
        totalAmount: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        items: data.items.map(item => ({
          product: item.product,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
          category: item.category,
          inventoryId: item.inventoryId,
          isNewProduct: item.isNewProduct,
          salePrice: item.salePrice,
          reorderPoint: item.reorderPoint,
        }))
      };

      return apiRequest("/api/purchases/enhanced", "POST", purchaseData);
    },
    onSuccess: () => {
      toast({
        title: "Compra registrada",
        description: "La compra se ha registrado correctamente con todos sus productos.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la compra. Verifique los datos e intente nuevamente.",
        variant: "destructive",
      });
      console.error("Error creating purchase:", error);
    },
  });

  const onSubmit = (data: EnhancedPurchaseFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Nueva Compra - Múltiples Productos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información de la compra */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
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
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione método de pago" />
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Factura (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: FAC-001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Productos</h3>
                <Button
                  type="button"
                  onClick={() => append({
                    product: "",
                    unit: "",
                    quantity: "0",
                    unitPrice: "0",
                    totalAmount: "0",
                    category: "",
                    isNewProduct: true,
                  })}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Producto {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Toggle: Producto nuevo vs existente */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={form.watch(`items.${index}.isNewProduct`)}
                      onCheckedChange={(checked) => toggleProductType(index, checked)}
                    />
                    <span className="text-sm">
                      {form.watch(`items.${index}.isNewProduct`) ? "Producto nuevo" : "Producto existente"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {!form.watch(`items.${index}.isNewProduct`) && (
                      <FormField
                        control={form.control}
                        name={`items.${index}.inventoryId`}
                        render={({ field }) => (
                          <FormItem className="lg:col-span-2">
                            <FormLabel>Seleccionar del Inventario</FormLabel>
                            <Select onValueChange={(value) => handleInventorySelection(value, index)}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Buscar producto existente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inventoryItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <span>{item.productName}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        Stock: {item.currentStock} {item.unit}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nombre del producto" 
                              {...field}
                              disabled={!form.watch(`items.${index}.isNewProduct`)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unidad" />
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

                    <FormField
                      control={form.control}
                      name={`items.${index}.category`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateItemTotal(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Unitario</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateItemTotal(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.totalAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campos adicionales para productos nuevos */}
                    {form.watch(`items.${index}.isNewProduct`) && (
                      <>
                        <FormField
                          control={form.control}
                          name={`items.${index}.salePrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio de Venta</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.reorderPoint`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Punto de Reorden</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Total General */}
            <div className="flex justify-end">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total General</p>
                  <p className="text-2xl font-bold">
                    ${calculateGrandTotal().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observaciones adicionales sobre la compra" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex gap-2 justify-end">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Registrar Compra"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}