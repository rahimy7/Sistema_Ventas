import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, ShoppingCart, Settings, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { type InventoryItem, type ProductType } from "@shared/schema";

// Schema para el formulario
const purchaseItemSchema = z.object({
  product: z.string().min(1, "El producto es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  quantity: z.string().min(1, "La cantidad es requerida"),
  unitPrice: z.string().min(1, "El precio unitario es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  productType: z.enum(['inventory', 'supply', 'asset'] as const),
  salePrice: z.string().optional(),
  reorderPoint: z.string().optional(),
  usefulLife: z.string().optional(),
  depreciationRate: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  isNewProduct: z.boolean().default(true),
  inventoryId: z.number().optional(),
});

const enhancedPurchaseSchema = z.object({
  purchaseDate: z.string().min(1, "La fecha es requerida"),
  supplier: z.string().min(1, "El proveedor es requerido"),
  paymentMethod: z.string().min(1, "El método de pago es requerido"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Debe agregar al menos un producto"),
});

type PurchaseFormData = z.infer<typeof enhancedPurchaseSchema>;

interface EnhancedPurchaseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EnhancedPurchaseForm({ onSuccess, onCancel }: EnhancedPurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar productos de inventario existentes
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(enhancedPurchaseSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: "",
      paymentMethod: "cash",
      invoiceNumber: "",
      notes: "",
      items: [{
        product: "",
        unit: "",
        quantity: "",
        unitPrice: "",
        category: "",
        productType: "inventory",
        isNewProduct: true,
        salePrice: "",
        reorderPoint: "10",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      try {
        // Calcular total
        const totalAmount = data.items.reduce((sum, item) => {
          return sum + (Number(item.quantity) * Number(item.unitPrice));
        }, 0);

        const purchaseData = {
          purchaseDate: new Date(data.purchaseDate),
          supplier: data.supplier,
          totalAmount: totalAmount.toString(),
          paymentMethod: data.paymentMethod,
          invoiceNumber: data.invoiceNumber,
          notes: data.notes,
          items: data.items.map(item => ({
            ...item,
            totalAmount: (Number(item.quantity) * Number(item.unitPrice)).toString(),
          })),
        };

        const response = await fetch("/api/purchases/enhanced", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(purchaseData),
        });

        // Manejo mejorado de errores
        if (!response.ok) {
          let errorMessage = "Error al crear la compra";
          
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } else {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            }
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
          }
          
          throw new Error(errorMessage);
        }

        // Verificar que la respuesta tenga contenido JSON válido
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          // Si no hay JSON, retornar un objeto de éxito simple
          return { success: true, message: "Compra registrada exitosamente" };
        }
        
      } catch (error) {
        console.error("Purchase creation error:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Purchase success:", result);
      setIsSubmitting(false);
      
      // Invalidar queries para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      
      toast({
        title: "Compra registrada",
        description: "La compra se ha registrado exitosamente.",
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Purchase mutation error:", error);
      setIsSubmitting(false);
      
      toast({
        title: "Error",
        description: error?.message || "No se pudo registrar la compra",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseFormData) => {
    console.log("Submitting purchase data:", data);
    setIsSubmitting(true);
    createPurchaseMutation.mutate(data);
  };

  const addItem = () => {
    append({
      product: "",
      unit: "",
      quantity: "",
      unitPrice: "",
      category: "",
      productType: "inventory",
      isNewProduct: true,
      salePrice: "",
      reorderPoint: "10",
    });
  };

  const getProductTypeLabel = (type: ProductType) => {
    switch (type) {
      case "inventory": return "Producto para Venta";
      case "supply": return "Insumo/Consumible";
      case "asset": return "Activo/Equipo";
      default: return type;
    }
  };

  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case "inventory": return <ShoppingCart className="h-4 w-4" />;
      case "supply": return <Package className="h-4 w-4" />;
      case "asset": return <Settings className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const calculateTotal = () => {
    const items = form.watch("items");
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva Compra - Múltiples Productos</h2>
          <p className="text-gray-600">Registra una compra con diferentes tipos de productos</p>
        </div>
        <Badge variant="outline" className="text-lg py-2 px-4">
          Total: ${calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información general de la compra */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información de la Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="credit">Crédito</SelectItem>
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
                    <FormLabel>Número de Factura</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Lista de productos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Productos de la Compra
                </CardTitle>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => {
                const productType = form.watch(`items.${index}.productType`);
                const isNewProduct = form.watch(`items.${index}.isNewProduct`);
                
                return (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getProductTypeIcon(productType)}
                          {getProductTypeLabel(productType)}
                        </Badge>
                        <span className="text-sm text-gray-600">Producto #{index + 1}</span>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Tipo de producto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productType`}
                        render={({ field: productTypeField }) => (
                          <FormItem>
                            <FormLabel>Tipo de Producto *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                productTypeField.onChange(value);
                                // Reset campos específicos cuando cambia el tipo
                                if (value === 'supply') {
                                  form.setValue(`items.${index}.salePrice`, "");
                                  form.setValue(`items.${index}.reorderPoint`, "");
                                  form.setValue(`items.${index}.usefulLife`, "");
                                  form.setValue(`items.${index}.depreciationRate`, "");
                                }
                              }} 
                              defaultValue={productTypeField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="inventory">
                                  <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Producto para Venta
                                  </div>
                                </SelectItem>
                                <SelectItem value="supply">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Insumo/Consumible
                                  </div>
                                </SelectItem>
                                <SelectItem value="asset">
                                  <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Activo/Equipo
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Solo mostrar selector de producto existente para inventario */}
                      {productType === "inventory" && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.isNewProduct`}
                          render={({ field: newProductField }) => (
                            <FormItem>
                              <FormLabel>¿Es un producto nuevo?</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  const isNew = value === "true";
                                  newProductField.onChange(isNew);
                                  if (!isNew) {
                                    // Reset campos cuando es producto existente
                                    form.setValue(`items.${index}.salePrice`, "");
                                    form.setValue(`items.${index}.reorderPoint`, "");
                                  }
                                }} 
                                defaultValue={newProductField.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Producto Nuevo</SelectItem>
                                  <SelectItem value="false">Producto Existente</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Información básica del producto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product`}
                        render={({ field: productField }) => (
                          <FormItem>
                            <FormLabel>Nombre del Producto *</FormLabel>
                            <FormControl>
                              <Input placeholder="Descripción del producto" {...productField} />
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
                            <FormLabel>Unidad *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pza">Pieza</SelectItem>
                                <SelectItem value="kg">Kilogramo</SelectItem>
                                <SelectItem value="lt">Litro</SelectItem>
                                <SelectItem value="mt">Metro</SelectItem>
                                <SelectItem value="caja">Caja</SelectItem>
                                <SelectItem value="paquete">Paquete</SelectItem>
                                <SelectItem value="galon">Galón</SelectItem>
                                <SelectItem value="unidad">Unidad</SelectItem>
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
                            <FormLabel>Cantidad *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
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
                            <FormLabel>Precio Unitario *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Repuestos, Herramientas, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subtotal calculado */}
                      <div className="flex items-end">
                        <div className="w-full">
                          <Label>Subtotal</Label>
                          <div className="h-10 flex items-center px-3 border rounded-md bg-gray-100">
                            <span className="font-medium">
                              ${((Number(form.watch(`items.${index}.quantity`)) || 0) * 
                                 (Number(form.watch(`items.${index}.unitPrice`)) || 0)
                                ).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campos específicos por tipo de producto */}
                    {productType === "inventory" && isNewProduct && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <ShoppingCart className="h-4 w-4" />
                          <span className="font-medium">Configuración para Venta</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.salePrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio de Venta *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    {...field}
                                  />
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
                                <FormLabel>Punto de Reposición</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="10"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {productType === "asset" && (
                      <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 text-purple-800">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">Información del Activo</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.usefulLife`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vida Útil (años)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="5"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.depreciationRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Depreciación Anual (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="20.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.serialNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de Serie</FormLabel>
                                <FormControl>
                                  <Input placeholder="Opcional" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.location`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ubicación</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Oficina, Taller" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {productType === "supply" && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Insumo/Consumible</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                          Este producto se registrará como gasto operacional y no estará disponible para venta.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Notas adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre la compra..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Resumen y botones */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-lg">
                    <span className="font-medium">Total de la Compra:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {fields.length} producto(s) • 
                    {fields.filter(f => form.watch(`items.${fields.indexOf(f)}.productType`) === 'inventory').length} para venta • 
                    {fields.filter(f => form.watch(`items.${fields.indexOf(f)}.productType`) === 'supply').length} insumos • 
                    {fields.filter(f => form.watch(`items.${fields.indexOf(f)}.productType`) === 'asset').length} activos
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || fields.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      "Registrar Compra"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}