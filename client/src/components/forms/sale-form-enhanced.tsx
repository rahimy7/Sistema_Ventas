import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { downloadInvoicePDF } from "@/components/invoice/invoice-pdf";
import { insertSaleSchema, type InsertSale, type InventoryItem, type CompanySettings, type Sale, type SaleItem } from "@shared/schema";
import SaleInvoiceDialog from "@/components/invoice/sale-invoice-dialog";
import { Plus, Trash2, ShoppingCart, User, CreditCard, Package, Calculator, Search, Check, Printer, FileText } from "lucide-react";
import { z } from "zod";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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

export default function SaleFormEnhanced({ onSuccess }: SaleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: null,
      customerPhone: null,
      customerAddress: null,
      saleDate: new Date(),
      subtotal: "0",
      taxRate: "16",
      taxAmount: "0",
      discountAmount: "0",
      total: "0",
      paymentMethod: "",
      status: "completed",
      notes: null,
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

  // Obtener configuración de la empresa
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  // Filtrar productos disponibles (con stock > 0)
  const availableProducts = inventory.filter(item => 
    parseFloat(item.currentStock) > 0 &&
    item.productName.toLowerCase().includes(productSearchValue.toLowerCase())
  );

  // Manejar cierre del diálogo de factura
  useEffect(() => {
    const handleDialogClosed = () => {
      console.log("Invoice dialog closed - resetting form");
      form.reset();
      onSuccess?.();
    };

    window.addEventListener('invoiceDialogClosed', handleDialogClosed);
    return () => window.removeEventListener('invoiceDialogClosed', handleDialogClosed);
  }, [form, onSuccess]);

  const createSaleMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const { items, ...saleData } = data;
      const response = await apiRequest("POST", "/api/sales", { ...saleData, items });
      return response;
    },
    onSuccess: async (sale) => {
      console.log("Sale created:", sale); // Debug log
      toast({
        title: "¡Venta registrada!",
        description: "La venta ha sido procesada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      
      // Abrir diálogo de factura automáticamente
      if (sale && sale.id) {
        console.log("Setting up invoice dialog with sale:", sale);
        const saleData: Sale = {
          id: sale.id,
          saleNumber: sale.saleNumber,
          customerName: sale.customerName,
          customerEmail: sale.customerEmail || null,
          customerPhone: sale.customerPhone || null,
          customerAddress: sale.customerAddress || null,
          saleDate: new Date(sale.saleDate),
          subtotal: sale.subtotal,
          taxRate: sale.taxRate,
          taxAmount: sale.taxAmount,
          discountAmount: sale.discountAmount,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          notes: sale.notes || null,
          createdAt: new Date(sale.createdAt || new Date()),
          updatedAt: new Date(sale.updatedAt || new Date())
        };
        
        setCompletedSale(saleData);
        setInvoiceDialogOpen(true);
        console.log("Invoice dialog should open now");
        
        // Also store form items for backup in case API items fail
        const formData = form.getValues();
        const backupItems = formData.items.map((item, index) => ({
          id: index + 1,
          saleId: sale.id,
          inventoryId: item.inventoryId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          createdAt: new Date()
        }));
        (window as any).backupSaleItems = backupItems;
        
        // Form will be reset when dialog closes via event listener
      } else {
        console.log("Sale data missing or incomplete:", sale);
        // If no sale ID, still try to open dialog with form data
        const formData = form.getValues();
        const fallbackSale: Sale = {
          id: -1, // Use -1 to indicate fallback mode
          saleNumber: `TEMP-${Date.now()}`,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail || null,
          customerPhone: formData.customerPhone || null,
          customerAddress: formData.customerAddress || null,
          saleDate: formData.saleDate || new Date(),
          subtotal: formData.subtotal,
          taxRate: formData.taxRate,
          taxAmount: formData.taxAmount,
          discountAmount: formData.discountAmount,
          total: formData.total,
          paymentMethod: formData.paymentMethod,
          status: "completed",
          notes: formData.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setCompletedSale(fallbackSale);
        setInvoiceDialogOpen(true);
        console.log("Opening dialog with fallback data");
        
        // Store fallback sale items for the dialog
        const fallbackItems = formData.items.map((item, index) => ({
          id: index + 1,
          saleId: -1,
          inventoryId: item.inventoryId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          createdAt: new Date()
        }));
        
        // Store fallback data temporarily for dialog access
        (window as any).fallbackSaleItems = fallbackItems;
        
        // Form will be reset when dialog closes via event listener
      }
      
      // Stop processing indicator
      setIsProcessing(false);
      
      // Form will be reset when dialog closes via event listener
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error?.message || "No se pudo procesar la venta",
        variant: "destructive",
      });
    },
  });



  const addProduct = (product: InventoryItem) => {
    const existingItemIndex = fields.findIndex(item => item.inventoryId === product.id);
    
    if (existingItemIndex >= 0) {
      const currentQuantity = parseFloat(fields[existingItemIndex].quantity);
      const newQuantity = currentQuantity + 1;
      const newSubtotal = newQuantity * parseFloat(product.salePrice);
      
      form.setValue(`items.${existingItemIndex}.quantity`, newQuantity.toString());
      form.setValue(`items.${existingItemIndex}.subtotal`, newSubtotal.toFixed(2));
    } else {
      append({
        inventoryId: product.id,
        productName: product.productName,
        quantity: "1",
        unitPrice: product.salePrice,
        subtotal: product.salePrice,
      });
    }
    
    setProductSearchOpen(false);
    setProductSearchValue("");
    calculateTotals();
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const qty = parseFloat(quantity) || 0;
    const unitPrice = parseFloat(fields[index].unitPrice);
    const subtotal = qty * unitPrice;
    
    form.setValue(`items.${index}.quantity`, quantity);
    form.setValue(`items.${index}.subtotal`, subtotal.toFixed(2));
    calculateTotals();
  };

  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal || "0"), 0);
    const taxRate = parseFloat(form.getValues("taxRate") || "0");
    const discountAmount = parseFloat(form.getValues("discountAmount") || "0");
    
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    form.setValue("subtotal", subtotal.toFixed(2));
    form.setValue("taxAmount", taxAmount.toFixed(2));
    form.setValue("total", total.toFixed(2));
  };

  useEffect(() => {
    calculateTotals();
  }, [fields]);

  const onSubmit = (data: SaleFormData) => {
    setIsProcessing(true);
    createSaleMutation.mutate(data);
  };

  return (
    <div className="h-full overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Venta</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Dirección completa" {...field} value={field.value || ""} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div>
                <Label>Buscar y Agregar Productos</Label>
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-1"
                      role="combobox"
                      aria-expanded={productSearchOpen}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {productSearchValue || "Buscar productos..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar productos..."
                        value={productSearchValue}
                        onValueChange={setProductSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                        <CommandGroup>
                          {availableProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() => addProduct(product)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <p className="font-medium">{product.productName}</p>
                                  <p className="text-sm text-gray-500">
                                    Stock: {product.currentStock} {product.unit}
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  ${parseFloat(product.salePrice).toFixed(2)}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Items List */}
              {fields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Productos Seleccionados:</h4>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{field.productName}</p>
                        <p className="text-sm text-gray-600">${parseFloat(field.unitPrice).toFixed(2)} c/u</p>
                      </div>
                      
                      <div className="w-24">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={field.quantity}
                          onChange={(e) => updateItemQuantity(index, e.target.value)}
                          className="text-center"
                        />
                      </div>
                      
                      <div className="w-24 text-right">
                        <p className="text-xs text-gray-600">Subtotal</p>
                        <p className="font-medium">${parseFloat(field.subtotal).toFixed(2)}</p>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Totales y Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impuesto (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            calculateTotals();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            calculateTotals();
                          }}
                        />
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
                          <SelectItem value="credit">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${form.watch("subtotal") || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impuesto ({form.watch("taxRate") || 0}%):</span>
                    <span>${form.watch("taxAmount") || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Descuento:</span>
                    <span>-${form.watch("discountAmount") || "0.00"}</span>
                  </div>
                  <div className="border-t pt-2 border-blue-300">
                    <div className="flex justify-between text-lg font-bold text-blue-900">
                      <span>TOTAL:</span>
                      <span>${form.watch("total") || "0.00"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observaciones adicionales..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pb-6">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Limpiar Formulario
            </Button>
            <Button
              type="submit"
              disabled={createSaleMutation.isPending || isProcessing || fields.length === 0}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              {createSaleMutation.isPending || isProcessing ? (
                createSaleMutation.isPending ? "Procesando venta..." : "Generando factura..."
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Procesar Venta
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Invoice Dialog */}
      {completedSale && (
        <SaleInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          sale={completedSale}
        />
      )}
    </div>
  );
}