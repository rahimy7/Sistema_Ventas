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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Printer,
  X,
  Building,
  Calendar,
  CreditCard,
  Package,
  ShoppingCart,
  Settings,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Purchase } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CompanySettings {
  name?: string;
  email?: string;
  phone?: string;
}

interface PurchaseItem {
  id: number;
  product: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  category: string;
  productType: 'inventory' | 'supply' | 'asset';
}

interface PurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase;
  onDelete?: (id: number) => void;
}

export default function PurchaseInvoiceDialog({
  open,
  onOpenChange,
  purchase,
  onDelete,
}: PurchaseInvoiceDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Cargar configuración de la empresa
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings"],
  });

  // Cargar items de la compra
  const { data: purchaseItems = [], isLoading: itemsLoading } = useQuery<PurchaseItem[]>({
    queryKey: [`/api/purchases/${purchase.id}/items`],
    enabled: !!purchase.id,
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const purchaseData = {
        id: purchase.id,
        supplier: purchase.supplier,
        purchaseDate: purchase.purchaseDate,
        paymentMethod: purchase.paymentMethod,
        totalAmount: purchase.totalAmount,
        notes: purchase.notes,
        invoiceNumber: `COMP-${String(purchase.id).padStart(6, '0')}`,
        items: purchaseItems,
      };

      console.log("Generating purchase PDF:", purchaseData);
      
      // Simular descarga
      const blob = new Blob(['Purchase PDF content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compra-${purchaseData.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description: "Factura de compra descargada correctamente.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la factura de compra.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const purchaseData = {
        id: purchase.id,
        supplier: purchase.supplier,
        purchaseDate: purchase.purchaseDate,
        paymentMethod: purchase.paymentMethod,
        totalAmount: purchase.totalAmount,
        notes: purchase.notes,
        invoiceNumber: `COMP-${String(purchase.id).padStart(6, '0')}`,
        items: purchaseItems,
      };

      console.log("Printing purchase:", purchaseData);
      window.print();

      toast({
        title: "Éxito",
        description: "Factura de compra enviada a imprimir.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error printing PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo imprimir la factura de compra.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "check": return "Cheque";
      case "credit": return "Crédito";
      default: return method;
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "inventory": return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case "supply": return <Package className="h-4 w-4 text-yellow-600" />;
      case "asset": return <Settings className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "inventory": return "Inventario";
      case "supply": return "Insumo";
      case "asset": return "Activo";
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles de Compra - COMP-{String(purchase.id).padStart(6, '0')}
          </DialogTitle>
          <DialogDescription>
            Información detallada de la compra seleccionada
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Información de la compra */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="text-sm font-medium text-orange-900 mb-3">
                Información General
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-orange-800">
                  <Building className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Proveedor</span>
                    <span>{purchase.supplier}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-orange-800">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Fecha</span>
                    <span>{format(new Date(purchase.purchaseDate), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-orange-800">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Método de Pago</span>
                    <span>{getPaymentMethodText(purchase.paymentMethod)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-orange-800">
                  <Package className="h-4 w-4" />
                  <div>
                    <span className="font-medium block">Total</span>
                    <span className="text-lg font-bold">${Number(purchase.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {purchase.notes && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <span className="font-medium text-orange-900">Notas:</span>
                  <p className="text-orange-800 mt-1">{purchase.notes}</p>
                </div>
              )}
            </div>

            {/* Detalles de productos */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Comprados
              </h4>
              
              {itemsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              ) : purchaseItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron detalles de productos</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product}</p>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getProductTypeIcon(item.productType)}
                              <span className="text-sm">{getProductTypeLabel(item.productType)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span>{Number(item.quantity).toFixed(2)} {item.unit}</span>
                          </TableCell>
                          <TableCell>
                            <span>${Number(item.unitPrice).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${Number(item.totalAmount).toFixed(2)}</span>
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
                    className="w-full h-auto p-4 bg-orange-600 hover:bg-orange-700"
                  >
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Descargar PDF</p>
                        <p className="text-sm opacity-90">
                          Guardar factura de compra en el dispositivo
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
                              <p className="font-medium">Eliminar Compra</p>
                              <p className="text-sm">
                                Eliminar esta compra permanentemente
                              </p>
                            </div>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La compra del proveedor "{purchase.supplier}" 
                        por ${Number(purchase.totalAmount).toFixed(2)} será eliminada permanentemente.
                        <br /><br />
                        <strong>Nota:</strong> Los productos agregados al inventario y los activos creados 
                        desde esta compra NO serán eliminados automáticamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onDelete(purchase.id);
                          onOpenChange(false);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar Compra
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
                <p className="text-xs text-gray-600">{companySettings.name || 'Sin nombre'}</p>
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