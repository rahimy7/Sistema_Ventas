import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadQuotePDF, validateQuoteForPDF, type QuoteForPDF, type CompanyInfo } from "@/lib/quote-pdf-utils";
import { Printer, Download, Eye, Loader2 } from "lucide-react";

interface QuotePDFDialogProps {
  quote: {
    id: number;
    quoteNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    quoteDate: Date;
    validUntil: Date;
    subtotal: string;
    taxRate?: string;
    taxAmount?: string;
    discountAmount?: string;
    total: string;
    notes?: string;
    terms?: string;
  };
  children: React.ReactNode;
}

export default function QuotePDFDialog({ quote, children }: QuotePDFDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Cargar items de la cotización
  const { data: quoteItems = [] } = useQuery<Array<{
    id: number;
    productName: string;
    description?: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
  }>>({
    queryKey: ["/api/quotes", quote.id, "items"],
    enabled: dialogOpen,
  });

  // Cargar información de la empresa
  const { data: companySettings } = useQuery<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  }>({
    queryKey: ["/api/company-settings"],
    enabled: dialogOpen,
  });

  const handleGeneratePDF = async (action: 'download' | 'preview') => {
    setIsGenerating(true);
    
    try {
      // Preparar datos para el PDF
      const quoteForPDF: QuoteForPDF = {
        quoteNumber: quote.quoteNumber,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        quoteDate: new Date(quote.quoteDate),
        validUntil: new Date(quote.validUntil),
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        discountAmount: quote.discountAmount,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        items: quoteItems.map(item => ({
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      };

      const companyInfo: CompanyInfo = {
        name: companySettings?.name || "Mi Empresa",
        address: companySettings?.address || "",
        phone: companySettings?.phone || "",
        email: companySettings?.email || "",
        website: companySettings?.website,
        taxId: companySettings?.taxId,
      };

      // Validar datos
      const validationErrors = validateQuoteForPDF(quoteForPDF);
      if (validationErrors.length > 0) {
        toast({
          title: "Error de validación",
          description: `No se puede generar el PDF: ${validationErrors.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      if (action === 'download') {
        downloadQuotePDF(quoteForPDF, companyInfo);
        toast({
          title: "PDF generado",
          description: `La cotización ${quote.quoteNumber} se ha descargado correctamente.`,
        });
      } else if (action === 'preview') {
        // Para previsualización, abrir en nueva pestaña
        const { generateQuotePDF } = await import("@/lib/quote-pdf-utils");
        const doc = generateQuotePDF(quoteForPDF, companyInfo);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        
        // Limpiar el URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        toast({
          title: "Vista previa abierta",
          description: "La vista previa del PDF se ha abierto en una nueva pestaña.",
        });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Error al generar el PDF. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    // Para imprimir, generar PDF y abrir en nueva ventana con diálogo de impresión
    handleGeneratePDF('preview').then(() => {
      // El navegador mostrará automáticamente las opciones de impresión
      setTimeout(() => {
        if (window.print) {
          window.print();
        }
      }, 1000);
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-600" />
            Generar PDF - {quote.quoteNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información de la cotización */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Información de la Cotización</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Cliente:</span> {quote.customerName}</p>
              <p><span className="font-medium">Fecha:</span> {new Date(quote.quoteDate).toLocaleDateString('es-ES')}</p>
              <p><span className="font-medium">Válida hasta:</span> {new Date(quote.validUntil).toLocaleDateString('es-ES')}</p>
              <p><span className="font-medium">Total:</span> ${Number(quote.total).toLocaleString()}</p>
              <p><span className="font-medium">Productos:</span> {quoteItems.length} item{quoteItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Estado de la cotización */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">¿Qué incluye el PDF?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Información completa de la empresa</li>
              <li>• Datos del cliente y contacto</li>
              <li>• Desglose detallado de productos</li>
              <li>• Totales, impuestos y descuentos</li>
              <li>• Términos y condiciones</li>
              <li>• Fecha de validez prominente</li>
            </ul>
          </div>

          {/* Verificación de datos de la empresa */}
          {!companySettings && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Nota:</span> No se ha configurado la información de la empresa. 
                El PDF se generará con datos básicos.
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={() => handleGeneratePDF('preview')}
              disabled={isGenerating}
              className="w-full"
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Vista Previa
            </Button>

            <Button
              onClick={() => handleGeneratePDF('download')}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>

            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Imprimir
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-gray-500 text-center border-t pt-4">
            <p>El PDF se generará con el formato estándar de cotización.</p>
            <p>Asegúrate de que la información de tu empresa esté configurada en Configuración.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}