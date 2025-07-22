import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, FileText, X } from "lucide-react";
import { downloadInvoicePDF, printInvoicePDF } from "./invoice-pdf";
import { type Sale, type SaleItem, type CompanySettings } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SaleInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale;
}

export default function SaleInvoiceDialog({ 
  open, 
  onClose, 
  sale
}: SaleInvoiceDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Obtener items de la venta
  const { data: saleItems = [] } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales", sale.id, "items"],
    enabled: open && !!sale.id,
  });

  // Obtener configuración de la empresa
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
    enabled: open,
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      if (saleItems.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron productos en esta venta.",
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
      
      onClose();
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
      if (saleItems.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron productos en esta venta.",
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
      
      onClose();
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factura de Venta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la venta */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Detalles de la Venta
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">No. Venta:</span> {sale.saleNumber}</p>
              <p><span className="font-medium">Cliente:</span> {sale.customerName}</p>
              <p><span className="font-medium">Total:</span> ${Number(sale.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              <p><span className="font-medium">Fecha:</span> {new Date(sale.saleDate).toLocaleDateString('es-ES')}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            ¿Qué deseas hacer con la factura de esta venta?
          </p>

          <div className="grid grid-cols-1 gap-4">
            {/* Descargar PDF */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="w-full h-auto p-4 bg-blue-600 hover:bg-blue-700"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Descargar PDF</p>
                      <p className="text-sm opacity-90">
                        Guardar factura en el dispositivo
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Imprimir */}
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
          </div>

          {/* Información de la empresa */}
          {companySettings && (
            <div className="bg-gray-50 p-3 rounded-lg mt-6">
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

          {/* Botón cerrar */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}