import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, FileText, X } from "lucide-react";
import { generateInvoicePDF, printInvoice, type InvoiceWithItems, type PDFInvoiceData } from "@/lib/pdf-utils";

interface PDFOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  saleData: any;
  companyInfo?: PDFInvoiceData['companyInfo'];
}

export default function PDFOptionsDialog({ 
  open, 
  onClose, 
  saleData,
  companyInfo 
}: PDFOptionsDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const invoice: InvoiceWithItems = {
        id: saleData.id,
        invoiceNumber: saleData.saleNumber || `V${Date.now()}`,
        customerName: saleData.customerName,
        customerEmail: saleData.customerEmail || null,
        customerPhone: saleData.customerPhone || null,
        customerAddress: saleData.customerAddress || null,
        issueDate: new Date(saleData.saleDate),
        dueDate: new Date(saleData.saleDate),
        subtotal: saleData.subtotal || "0",
        tax: saleData.taxRate || "0",
        discount: saleData.discountAmount || "0",
        total: saleData.total || "0",
        status: 'paid',
        notes: saleData.notes || null,
        items: saleData.items?.map((item: any) => ({
          id: item.inventoryId,
          description: item.productName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.subtotal)
        })) || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      generateInvoicePDF({ invoice, companyInfo });
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const invoice: InvoiceWithItems = {
        id: saleData.id,
        invoiceNumber: saleData.saleNumber || `V${Date.now()}`,
        customerName: saleData.customerName,
        customerEmail: saleData.customerEmail || null,
        customerPhone: saleData.customerPhone || null,
        customerAddress: saleData.customerAddress || null,
        issueDate: new Date(saleData.saleDate),
        dueDate: new Date(saleData.saleDate),
        subtotal: saleData.subtotal || "0",
        tax: saleData.taxRate || "0",
        discount: saleData.discountAmount || "0",
        total: saleData.total || "0",
        status: 'paid',
        notes: saleData.notes || null,
        items: saleData.items?.map((item: any) => ({
          id: item.inventoryId,
          description: item.productName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.subtotal)
        })) || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      printInvoice(invoice, companyInfo);
      onClose();
    } catch (error) {
      console.error("Error printing PDF:", error);
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
            Opciones de Factura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-6">
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
          {companyInfo && (
            <div className="bg-gray-50 p-3 rounded-lg mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Datos de la empresa:
              </h4>
              <p className="text-xs text-gray-600">{companyInfo.name}</p>
              <p className="text-xs text-gray-600">{companyInfo.email}</p>
              <p className="text-xs text-gray-600">{companyInfo.phone}</p>
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