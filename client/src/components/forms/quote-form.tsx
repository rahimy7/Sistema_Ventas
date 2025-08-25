// client/src/components/forms/quote-form.tsx - ACTUALIZADO

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuoteDateValidation, ExpiryBadge } from "@/hooks/use-quote-date-validation";
import {
  Plus,
  Trash2,
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  AlertCircle,
  Clock,
} from "lucide-react";
import { InventoryItem } from "@shared/schema";

// Schema actualizado con validación de fechas
const quoteFormSchema = z
  .object({
    customerName: z.string().min(1, "El nombre del cliente es requerido"),
    customerEmail: z
      .string()
      .email("Email inválido")
      .optional()
      .or(z.literal("")),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    quoteDate: z.string().min(1, "La fecha es requerida"),
    validUntil: z.string().min(1, "La fecha de vencimiento es requerida"),
    taxRate: z.number().min(0).max(100).default(0),
    discountAmount: z.number().min(0).default(0),
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z
      .array(
        z.object({
          inventoryId: z.number().min(1, "Selecciona un producto"),
          productName: z.string().min(1, "Nombre del producto requerido"),
          description: z.string().optional(),
          quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
          unitPrice: z.number().min(0.01, "El precio debe ser mayor a 0"),
        }),
      )
      .min(1, "Debe agregar al menos un producto"),
  })
  .refine(
    (data) => {
      const qDate = new Date(data.quoteDate);
      const vDate = new Date(data.validUntil);
      return vDate > qDate;
    },
    {
      message: "La fecha de vencimiento debe ser posterior a la fecha de cotización",
      path: ["validUntil"],
    }
  );

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  quoteId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function QuoteForm({ quoteId, onSuccess, onCancel }: QuoteFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { validateDates, getExpiryStatus, suggestValidUntilDate } = useQuoteDateValidation();
  
  // Estados para validación de fechas
  const [dateValidation, setDateValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [showDateWarnings, setShowDateWarnings] = useState(false);

  // Cargar inventario
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Cargar cotización existente si hay ID
  const { data: existingQuote } = useQuery({
    queryKey: ["/api/quotes", quoteId],
    enabled: !!quoteId,
  });

  // Configuración del formulario
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      quoteDate: new Date().toISOString().split("T")[0],
      validUntil: "",
      taxRate: 0,
      discountAmount: 0,
      notes: "",
      terms: "• Esta cotización es válida hasta la fecha indicada.\n• Los precios incluyen impuestos.\n• Los productos están sujetos a disponibilidad.",
      items: [{ inventoryId: 0, productName: "", description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Cargar datos existentes
  useEffect(() => {
    if (existingQuote) {
      const quoteDate = new Date(existingQuote.quoteDate).toISOString().split("T")[0];
      const validUntil = new Date(existingQuote.validUntil).toISOString().split("T")[0];
      
      form.reset({
        customerName: existingQuote.customerName,
        customerEmail: existingQuote.customerEmail || "",
        customerPhone: existingQuote.customerPhone || "",
        customerAddress: existingQuote.customerAddress || "",
        quoteDate,
        validUntil,
        taxRate: Number(existingQuote.taxRate) || 0,
        discountAmount: Number(existingQuote.discountAmount) || 0,
        notes: existingQuote.notes || "",
        terms: existingQuote.terms || "",
        items: existingQuote.items || [{ inventoryId: 0, productName: "", description: "", quantity: 1, unitPrice: 0 }],
      });
    }
  }, [existingQuote, form]);

  // Auto-sugerir fecha de vencimiento
  const handleQuoteDateChange = (date: string) => {
    form.setValue("quoteDate", date);
    
    // Solo auto-completar si validUntil está vacío
    const currentValidUntil = form.getValues("validUntil");
    if (!currentValidUntil && date) {
      const suggested = suggestValidUntilDate(date);
      form.setValue("validUntil", suggested);
    }
  };

  // Validar fechas en tiempo real
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.quoteDate && values.validUntil) {
        const validation = validateDates(values.quoteDate, values.validUntil);
        setDateValidation(validation);
        setShowDateWarnings(validation.warnings.length > 0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, validateDates]);

  // Calcular totales
  const watchedItems = form.watch("items");
  const watchedTaxRate = form.watch("taxRate");
  const watchedDiscountAmount = form.watch("discountAmount");

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
  const total = subtotal + taxAmount - (watchedDiscountAmount || 0);

  // Mutación para guardar
  const saveQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const payload = {
        quote: {
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone || null,
          customerAddress: data.customerAddress || null,
          quoteDate: data.quoteDate,
          validUntil: data.validUntil,
          subtotal,
          taxRate: data.taxRate,
          taxAmount,
          discountAmount: data.discountAmount,
          total,
          notes: data.notes || null,
          terms: data.terms || null,
        },
        items: data.items.map((item) => ({
          ...item,
          subtotal: item.quantity * item.unitPrice,
        })),
      };

      if (quoteId) {
        return await apiRequest("PUT", `/api/quotes/${quoteId}`, payload);
      } else {
        return await apiRequest("POST", "/api/quotes", payload);
      }
    },
    onSuccess: (data) => {
      // Mostrar advertencias si las hay
      if (data._warnings && data._warnings.length > 0) {
        toast({
          title: "Cotización guardada con advertencias",
          description: data._warnings.join(", "),
          variant: "destructive",
        });
      } else {
        toast({
          title: quoteId ? "Cotización actualizada" : "Cotización creada",
          description: `La cotización se ha ${quoteId ? "actualizado" : "creado"} correctamente.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar la cotización",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onSubmit = (data: QuoteFormData) => {
    // Validar fechas antes de enviar
    const validation = validateDates(data.quoteDate, data.validUntil);
    if (!validation.isValid) {
      toast({
        title: "Error de validación",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    saveQuoteMutation.mutate(data);
  };

  const addItem = () => {
    append({ inventoryId: 0, productName: "", description: "", quantity: 1, unitPrice: 0 });
  };

  const selectProduct = (index: number, inventoryId: number) => {
    const product = inventory.find((item) => item.id === inventoryId);
    if (product) {
      form.setValue(`items.${index}.inventoryId`, inventoryId);
      form.setValue(`items.${index}.productName`, product.productName);
      form.setValue(`items.${index}.unitPrice`, Number(product.salePrice));
      form.setValue(`items.${index}.description`, "");
    }
  };

  const validateStock = (inventoryId: number, quantity: number): boolean => {
    const product = inventory.find((item) => item.id === inventoryId);
    return product ? Number(product.currentStock) >= quantity : false;
  };

  const getAvailableStock = (inventoryId: number): number => {
    const product = inventory.find((item) => item.id === inventoryId);
    return product ? Number(product.currentStock) : 0;
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre del Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo del cliente" {...field} />
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
                      <Input type="email" placeholder="cliente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="(000) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Dirección completa del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Fechas y Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas y Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alertas de validación de fechas */}
              {!dateValidation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {dateValidation.errors.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
              
              {showDateWarnings && dateValidation.warnings.length > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {dateValidation.warnings.join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quoteDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Cotización *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => handleQuoteDateChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Válida Hasta *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mostrar estado de expiración */}
                <div className="space-y-2">
                  <FormLabel>Estado de Vigencia</FormLabel>
                  <div className="flex items-center h-10">
                    {form.watch("validUntil") && (
                      <ExpiryBadge validUntil={form.watch("validUntil")} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa de Impuesto (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos y Servicios
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item #{index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.inventoryId`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Producto *</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => selectProduct(index, Number(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inventory.map((item) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.productName} - Stock: {item.currentStock}
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
                            <FormLabel>Cantidad *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                            {/* Validación de stock */}
                            {form.watch(`items.${index}.inventoryId`) && 
                             form.watch(`items.${index}.quantity`) &&
                             !validateStock(form.watch(`items.${index}.inventoryId`), form.watch(`items.${index}.quantity`)) && (
                              <p className="text-red-500 text-sm">
                                Stock insuficiente. Disponible: {getAvailableStock(form.watch(`items.${index}.inventoryId`))}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio Unit. *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descripción adicional del producto o servicio"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Subtotal del item */}
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Subtotal: </span>
                      <span className="font-medium">
                        ${((form.watch(`items.${index}.quantity`) || 0) * 
                           (form.watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumen de Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-right">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
                
                <span className="text-gray-600">Impuestos ({watchedTaxRate}%):</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
                
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium">-${(watchedDiscountAmount || 0).toFixed(2)}</span>
                
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notas y Términos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas y Términos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas para uso interno..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos y Condiciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Términos y condiciones de la cotización..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveQuoteMutation.isPending || !dateValidation.isValid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveQuoteMutation.isPending ? "Guardando..." : quoteId ? "Actualizar" : "Crear"} Cotización
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}