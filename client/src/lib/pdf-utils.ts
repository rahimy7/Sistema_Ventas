import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PDFInvoiceData {
  invoice: InvoiceWithItems;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
}

export interface InvoiceWithItems {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  issueDate: Date;
  dueDate: Date;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: string;
  notes: string | null;
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

function generatePDFContent(doc: jsPDF, data: PDFInvoiceData): void {
  const { invoice, companyInfo } = data;
  
  // Colores del tema
  const primaryColor = [37, 99, 235]; // Azul
  const secondaryColor = [75, 85, 99]; // Gris
  const accentColor = [229, 231, 235]; // Gris claro

  // Configuración de página
  const pageWidth = doc.internal.pageSize.width;
  
  // Header con información de la empresa
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo placeholder y nombre de empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const companyName = companyInfo?.name || 'Mi Empresa';
  doc.text(companyName, 20, 25);
  
  // Información de contacto de la empresa
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (companyInfo) {
    doc.text(companyInfo.address, 20, 32);
    doc.text(`Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`, 20, 36);
  }
  
  // Título FACTURA
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', pageWidth - 20, 25, { align: 'right' });
  
  // Número de factura
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. ${invoice.invoiceNumber}`, pageWidth - 20, 35, { align: 'right' });
  
  // Información del cliente
  const clientStartY = 60;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A:', 20, clientStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.customerName, 20, clientStartY + 8);
  
  if (invoice.customerEmail) {
    doc.text(invoice.customerEmail, 20, clientStartY + 16);
  }
  
  if (invoice.customerPhone) {
    doc.text(invoice.customerPhone, 20, clientStartY + 24);
  }
  
  if (invoice.customerAddress) {
    const addressLines = doc.splitTextToSize(invoice.customerAddress, 80);
    doc.text(addressLines, 20, clientStartY + 32);
  }
  
  // Fechas
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', 130, clientStartY);
  doc.text('VENCIMIENTO:', 130, clientStartY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.issueDate.toLocaleDateString('es-ES'), 170, clientStartY);
  doc.text(invoice.dueDate.toLocaleDateString('es-ES'), 170, clientStartY + 8);
  
  // Tabla de productos
  const tableStartY = clientStartY + 50;
  
  // Encabezados de tabla
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(20, tableStartY, pageWidth - 40, 10, 'F');
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', 25, tableStartY + 7);
  doc.text('Cant.', 120, tableStartY + 7, { align: 'center' });
  doc.text('Precio Unit.', 145, tableStartY + 7, { align: 'center' });
  doc.text('Total', 175, tableStartY + 7, { align: 'right' });
  
  // Filas de productos
  let currentY = tableStartY + 15;
  doc.setFont('helvetica', 'normal');
  
  invoice.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, currentY - 5, pageWidth - 40, 12, 'F');
    }
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(item.description, 25, currentY + 3);
    doc.text(item.quantity.toString(), 120, currentY + 3, { align: 'center' });
    doc.text(`$${item.unitPrice.toLocaleString()}`, 145, currentY + 3, { align: 'center' });
    doc.text(`$${item.total.toLocaleString()}`, 175, currentY + 3, { align: 'right' });
    
    currentY += 12;
  });
  
  // Totales
  const totalsStartY = currentY + 20;
  const totalsX = 120;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Subtotal
  doc.text('Subtotal:', totalsX, totalsStartY);
  doc.text(`$${parseFloat(invoice.subtotal).toLocaleString()}`, 175, totalsStartY, { align: 'right' });
  
  // Impuesto
  if (parseFloat(invoice.tax) > 0) {
    const taxAmount = (parseFloat(invoice.subtotal) * parseFloat(invoice.tax)) / 100;
    doc.text(`Impuesto (${invoice.tax}%):`, totalsX, totalsStartY + 7);
    doc.text(`$${taxAmount.toLocaleString()}`, 175, totalsStartY + 7, { align: 'right' });
  }
  
  // Descuento
  if (parseFloat(invoice.discount) > 0) {
    doc.text('Descuento:', totalsX, totalsStartY + 14);
    doc.text(`-$${parseFloat(invoice.discount).toLocaleString()}`, 175, totalsStartY + 14, { align: 'right' });
  }
  
  // Línea separadora para total
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(totalsX, totalsStartY + 20, 190, totalsStartY + 20);
  
  // Total final
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, totalsStartY + 30);
  doc.text(`$${parseFloat(invoice.total).toLocaleString()}`, 175, totalsStartY + 30, { align: 'right' });
  
  // Notas adicionales
  if (invoice.notes) {
    const notesStartY = totalsStartY + 50;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Notas:', 20, notesStartY);
    
    const maxNotesWidth = 170;
    const notesLines = doc.splitTextToSize(invoice.notes, maxNotesWidth);
    doc.text(notesLines, 20, notesStartY + 7);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Gracias por su confianza', 20, pageHeight - 20);
  doc.text(`Factura generada el ${new Date().toLocaleString('es-ES')}`, 20, pageHeight - 15);
}

export function generateInvoicePDF(data: PDFInvoiceData): void {
  const doc = new jsPDF();
  generatePDFContent(doc, data);
  
  // Descargar PDF
  doc.save(`Factura-${data.invoice.invoiceNumber}.pdf`);
}

export function printInvoice(invoice: InvoiceWithItems, companyInfo?: PDFInvoiceData['companyInfo']): void {
  try {
    const pdf = new jsPDF();
    const invoiceData: PDFInvoiceData = { invoice, companyInfo };
    
    generatePDFContent(pdf, invoiceData);
    
    // Open in new tab for printing
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (error) {
    console.error("Error generating PDF for printing:", error);
  }
}