import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { InvoiceWithItems } from '@shared/schema';

// Extender jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

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

export function generateInvoicePDF({ invoice, companyInfo }: PDFInvoiceData): void {
  const doc = new jsPDF();
  
  // Configuración de fuente y colores
  const primaryColor = [66, 139, 202]; // Azul
  const secondaryColor = [108, 117, 125]; // Gris
  const textColor = [33, 37, 41]; // Negro
  
  // Información de la empresa (header)
  if (companyInfo) {
    doc.setFontSize(20);
    doc.setTextColor(...textColor);
    doc.text(companyInfo.name, 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(companyInfo.address, 20, 35);
    doc.text(`Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`, 20, 42);
    if (companyInfo.website) {
      doc.text(`Web: ${companyInfo.website}`, 20, 49);
    }
  }
  
  // Título FACTURA
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('FACTURA', 150, 25);
  
  // Número de factura y fechas
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text(`Factura #: ${invoice.invoiceNumber}`, 150, 35);
  doc.text(`Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}`, 150, 42);
  doc.text(`Vence: ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}`, 150, 49);
  
  // Estado de la factura
  doc.setFontSize(10);
  const statusColor = 
    invoice.status === 'paid' ? [40, 167, 69] : 
    invoice.status === 'pending' ? [255, 193, 7] :
    invoice.status === 'overdue' ? [220, 53, 69] :
    [108, 117, 125];
  
  doc.setTextColor(...statusColor);
  const statusText = 
    invoice.status === 'paid' ? 'PAGADA' :
    invoice.status === 'pending' ? 'PENDIENTE' :
    invoice.status === 'overdue' ? 'VENCIDA' :
    invoice.status === 'cancelled' ? 'CANCELADA' :
    invoice.status.toUpperCase();
  
  doc.text(`Estado: ${statusText}`, 150, 56);
  
  // Línea separadora
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 65, 190, 65);
  
  // Información del cliente
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.text('Facturar a:', 20, 80);
  
  doc.setFontSize(12);
  doc.text(invoice.customerName, 20, 90);
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, 20, 97);
  }
  if (invoice.customerPhone) {
    doc.text(`Tel: ${invoice.customerPhone}`, 20, 104);
  }
  if (invoice.customerAddress) {
    // Dividir dirección en múltiples líneas si es muy larga
    const maxWidth = 100;
    const addressLines = doc.splitTextToSize(invoice.customerAddress, maxWidth);
    doc.text(addressLines, 20, 111);
  }
  
  // Tabla de items
  const tableStartY = 130;
  
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString()}`,
    `$${item.total.toLocaleString()}`
  ]);
  
  doc.autoTable({
    startY: tableStartY,
    head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Descripción
      1: { cellWidth: 25, halign: 'center' }, // Cantidad
      2: { cellWidth: 35, halign: 'right' }, // Precio
      3: { cellWidth: 35, halign: 'right' } // Total
    }
  });
  
  // Calcular posición para los totales
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;
  
  // Totales
  const totalsStartY = finalY + 20;
  const totalsX = 130;
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  // Subtotal
  doc.text('Subtotal:', totalsX, totalsStartY);
  doc.text(`$${parseFloat(invoice.subtotal).toLocaleString()}`, 170, totalsStartY, { align: 'right' });
  
  // Impuesto
  if (parseFloat(invoice.tax) > 0) {
    const taxAmount = (parseFloat(invoice.subtotal) * parseFloat(invoice.tax)) / 100;
    doc.text(`Impuesto (${invoice.tax}%):`, totalsX, totalsStartY + 7);
    doc.text(`$${taxAmount.toLocaleString()}`, 170, totalsStartY + 7, { align: 'right' });
  }
  
  // Descuento
  if (parseFloat(invoice.discount) > 0) {
    doc.text('Descuento:', totalsX, totalsStartY + 14);
    doc.text(`-$${parseFloat(invoice.discount).toLocaleString()}`, 170, totalsStartY + 14, { align: 'right' });
  }
  
  // Línea separadora para total
  doc.setDrawColor(...primaryColor);
  doc.line(totalsX, totalsStartY + 20, 190, totalsStartY + 20);
  
  // Total final
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', totalsX, totalsStartY + 30);
  doc.text(`$${parseFloat(invoice.total).toLocaleString()}`, 170, totalsStartY + 30, { align: 'right' });
  
  // Notas adicionales
  if (invoice.notes) {
    const notesStartY = totalsStartY + 50;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text('Notas:', 20, notesStartY);
    
    const maxNotesWidth = 170;
    const notesLines = doc.splitTextToSize(invoice.notes, maxNotesWidth);
    doc.text(notesLines, 20, notesStartY + 7);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...secondaryColor);
  doc.text('Gracias por su confianza', 20, pageHeight - 20);
  doc.text(`Factura generada el ${new Date().toLocaleString('es-ES')}`, 20, pageHeight - 15);
  
  // Descargar PDF
  doc.save(`Factura-${invoice.invoiceNumber}.pdf`);
}

export function printInvoice(invoice: InvoiceWithItems, companyInfo?: PDFInvoiceData['companyInfo']): void {
  const doc = new jsPDF();
  
  // Generar el PDF pero en lugar de descargarlo, abrirlo en nueva ventana para imprimir
  generateInvoicePDF({ invoice, companyInfo });
  
  // Abrir PDF en nueva ventana
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}