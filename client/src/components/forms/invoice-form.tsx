import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertInvoiceSchema, type InsertInvoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Calculator, Printer, Download } from "lucide-react";
import { generateInvoicePDF, printInvoice } from "@/lib/pdf-utils";
import { z } from "zod";

const invoiceFormSchema = insertInvoiceSchema.extend({
  items: z.array(z.object({
    description: z.string().min(1, "La descripción es requerida"),
    quantity: z.string().min(1, "La cantidad es requerida"),
    unitPrice: z.string().min(1, "El precio unitario es requerido"),
    total: z.string().optional(),
  })).min(1, "Debe agregar al menos un item"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSuccess?: () => void;
}

export default function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      customerName: "",
      customerEmail: "",
      customerAddress: "",
      customerPhone: "",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      status: "pending",
      subtotal: "0",
      tax: "0", 
      discount: "0",
      total: "0",
      notes: "",
      items: [{ description: "", quantity: "1", unitPrice: "0", total: "0" }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Generar número de factura al cargar
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        const response = await apiRequest("/api/invoices/generate-number");
        const data = await response.json();
        setInvoiceNumber(data.invoiceNumber);
        form.setValue("invoiceNumber", data.invoiceNumber);
      } catch (error) {
        console.error("Error generating invoice number:", error);
      }
    };
    generateInvoiceNumber();
  }, [form]);

  // Calcular totales cuando cambian los items
  const watchedItems = form.watch("items");
  const watchedTax = form.watch("tax");
  const watchedDiscount = form.watch("discount");

  useEffect(() => {
    let subtotal = 0;
    
    // Actualizar totales de cada item y sumar subtotal
    watchedItems.forEach((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = quantity * unitPrice;
      
      form.setValue(`items.${index}.total`, itemTotal.toString());
      subtotal += itemTotal;
    });

    // Calcular impuestos y descuentos
    const tax = (subtotal * (parseFloat(watchedTax) || 0)) / 100;
    const discount = parseFloat(watchedDiscount) || 0;
    const total = subtotal + tax - discount;

    form.setValue("subtotal", subtotal.toString());
    form.setValue("total", Math.max(0, total).toString());
  }, [watchedItems, watchedTax, watchedDiscount, form]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const { items, ...invoiceData } = data;
      return await apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify({ 
          ...invoiceData,
          items: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.total || "0")
          }))
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Factura creada",
        description: "La factura se ha creado exitosamente.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Error al crear la factura: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const formData = form.getValues();
      const mockInvoice = {
        id: 1,
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerAddress: formData.customerAddress,
        customerPhone: formData.customerPhone,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        total: formData.total,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: formData.items.map((item, index) => ({
          id: index + 1,
          invoiceId: 1,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.total || "0"),
          createdAt: new Date(),
        }))
      };

      const companyInfo = {
        name: "BusinessPro",
        address: "123 Calle Principal, Ciudad, País",
        phone: "+1 234 567 8900",
        email: "contacto@businesspro.com",
        website: "www.businesspro.com"
      };

      generateInvoicePDF({ invoice: mockInvoice, companyInfo });
      
      toast({
        title: "PDF Generado",
        description: "La factura en PDF se ha descargado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintInvoice = async () => {
    try {
      const formData = form.getValues();
      const mockInvoice = {
        id: 1,
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerAddress: formData.customerAddress,
        customerPhone: formData.customerPhone,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        status: formData.status,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        total: formData.total,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: formData.items.map((item, index) => ({
          id: index + 1,
          invoiceId: 1,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.total || "0"),
          createdAt: new Date(),
        }))
      };

      const companyInfo = {
        name: "BusinessPro",
        address: "123 Calle Principal, Ciudad, País",
        phone: "+1 234 567 8900",
        email: "contacto@businesspro.com",
        website: "www.businesspro.com"
      };

      printInvoice(mockInvoice, companyInfo);
      
      toast({
        title: "Impresión Iniciada",
        description: "Se ha abierto la ventana de impresión.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al imprimir",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con información de la factura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Información de Factura</span>
              <Badge variant="outline" className="text-lg font-mono">
                {invoiceNumber || "Generando..."}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Emisión</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagada</SelectItem>
                      <SelectItem value="overdue">Vencida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Información del cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo o empresa" {...field} />
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
                    <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
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
                    <Input placeholder="+1 234 567 8900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items de la factura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Items de la Factura</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: "1", unitPrice: "0", total: "0" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                  <div className="col-span-12 md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción del producto/servicio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Unit.</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.total`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-gray-50" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 flex justify-end">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totales y cálculos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Cálculos y Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impuesto (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${parseFloat(form.watch("subtotal") || "0").toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto:</span>
                  <span>${((parseFloat(form.watch("subtotal") || "0") * parseFloat(form.watch("tax") || "0")) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>-${parseFloat(form.watch("discount") || "0").toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${parseFloat(form.watch("total") || "0").toLocaleString()}</span>
                </div>
              </div>
            </div>
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
                  <FormControl>
                    <Textarea 
                      placeholder="Términos y condiciones, notas de pago, etc..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? "Generando..." : "Descargar PDF"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handlePrintInvoice}
            disabled={isGeneratingPDF}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>

          <Button 
            type="submit" 
            disabled={createInvoiceMutation.isPending}
            className="min-w-[120px]"
          >
            {createInvoiceMutation.isPending ? "Guardando..." : "Crear Factura"}
          </Button>
        </div>
      </form>
    </Form>
  );
}