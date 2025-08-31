import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { downloadInvoicePDF, printInvoicePDF } from "@/components/invoice/invoice-pdf";
import {
  FileText,
  Download,
  Printer,
  X,
  User,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Sale, type SaleItem, type CompanySettings } from "@shared/schema";

interface SaleInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  saleItems: SaleItem[];
  onDelete?: (id: number) => void;
}

export default function SaleInvoiceDialog({
  open,
  onOpenChange,
  sale,
  saleItems,
  onDelete,
}: SaleInvoiceDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Cargar configuración de la empresa
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      console.log("Download - Sale data:", sale);
      console.log("Download - Sale items:", saleItems);
      console.log("Download - Company settings:", companySettings);
      
      if (saleItems.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron productos en esta venta.",
          variant: "destructive",
        });
        return;
      }

      if (!sale || (!sale.id && sale.id !== -1)) {
        toast({
          title: "Error",
          description: "Datos de venta incompletos.",
          variant: "destructive",
        });
        return;
      }

      downloadInvoicePDF({
        sale,
        saleItems,
        companyInfo: companySettings,
      });

      toast({
        title: "Éxito",
        description: "Factura descargada correctamente.",
      });
      
      onOpenChange(false);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('invoiceDialogClosed'));
      }, 100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la factura.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      console.log("Print - Sale data:", sale);
      console.log("Print - Sale items:", saleItems);
      console.log("Print - Company settings:", companySettings);
      
      if (saleItems.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron productos en esta venta.",
          variant: "destructive",
        });
        return;
      }

      if (!sale || (!sale.id && sale.id !== -1)) {
        toast({
          title: "Error",
          description: "Datos de venta incompletos.",
          variant: "destructive",
        });
        return;
      }

      printInvoicePDF({
        sale,
        saleItems,
        companyInfo: companySettings,
      });

      toast({
        title: "Éxito",
        description: "Factura enviada a imprimir.",
      });
      
      onOpenChange(false);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('invoiceDialogClosed'));
      }, 100);
    } catch (error) {
      console.error("Error printing PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo imprimir la factura.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completada";
      case "pending": return "Pendiente";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "credit": return "Crédito";
      default: return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles de Venta - {sale.saleNumber || `#${sale.id}`}
          </DialogTitle>
          <DialogDescription>
            Información detallada de la venta seleccionada
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Información de la venta */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-900 mb-3">
                Información General
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-800">
                  <User className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Cliente</span>
                    <span>{sale.customerName || 'Sin nombre'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Fecha</span>
                    <span>{format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Método de Pago</span>
                    <span>{getPaymentMethodText(sale.paymentMethod)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <DollarSign className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Total</span>
                    <span className="text-lg font-bold">${Number(sale.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="font-medium text-green-900">Estado:</span>
                <span className="ml-2 text-green-800">{getStatusText(sale.status)}</span>
              </div>
              {sale.notes && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <span className="font-medium text-green-900">Notas:</span>
                  <p className="text-green-800 mt-1">{sale.notes}</p>
                </div>
              )}
            </div>

            {/* Detalles de productos */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Vendidos
              </h4>
              
              {saleItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron productos en esta venta</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <span className="font-medium">{item.productName}</span>
                          </TableCell>
                          <TableCell>
                            <span>{Number(item.quantity).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span>${Number(item.unitPrice).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full h-auto p-4 bg-green-600 hover:bg-green-700"
                  >
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Descargar PDF</p>
                        <p className="text-sm opacity-90">
                          Guardar factura de venta en el dispositivo
                        </p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button
                    onClick={handlePrint}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full h-auto p-4 border-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Printer className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Imprimir Factura</p>
                        <p className="text-sm text-gray-600">
                          Enviar directamente a la impresora
                        </p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <Button
                          variant="outline"
                          className="w-full h-auto p-4 border-2 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <div className="flex items-center space-x-3">
                            <Trash2 className="h-5 w-5" />
                            <div className="text-left">
                              <p className="font-medium">Eliminar Venta</p>
                              <p className="text-sm">
                                Eliminar esta venta permanentemente
                              </p>
                            </div>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La venta del cliente "{sale.customerName || 'Sin nombre'}" 
                        por ${Number(sale.total).toFixed(2)} será eliminada permanentemente.
                        <br /><br />
                        <strong>Nota:</strong> Los productos vendidos serán devueltos automáticamente al inventario.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onDelete(sale.id);
                          onOpenChange(false);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar Venta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Información de la empresa */}
            {companySettings && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Datos de la empresa:
                </h4>
                <p className="text-xs text-gray-600">{companySettings.name}</p>
                {companySettings.email && (
                  <p className="text-xs text-gray-600">{companySettings.email}</p>
                )}
                {companySettings.phone && (
                  <p className="text-xs text-gray-600">{companySettings.phone}</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}