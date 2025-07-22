import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type Sale, type CompanySettings, type SaleItem } from '@shared/schema';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface InvoicePDFProps {
  sale: Sale;
  saleItems: SaleItem[];
  companyInfo?: CompanySettings;
}

export const generateInvoicePDF = ({ sale, saleItems, companyInfo }: InvoicePDFProps) => {
  const doc = new jsPDF();
  
  // Colors and styling
  const primaryColor = [59, 130, 246]; // Blue
  const secondaryColor = [75, 85, 99]; // Gray
  const accentColor = [16, 185, 129]; // Green
  
  // Page margins
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Helper function to add line
  const addLine = (y: number, color = [200, 200, 200]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };
  
  // Header section
  let yPosition = margin;
  
  // Company logo area (placeholder)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPosition, 40, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGO', margin + 20, yPosition + 20, { align: 'center' });
  
  // Company information
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const companyName = companyInfo?.name || 'Su Empresa';
  doc.text(companyName, margin + 50, yPosition + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const companyDetails = [
    companyInfo?.address || 'Dirección de la empresa',
    companyInfo?.phone || 'Teléfono: +00 000 000 0000',
    companyInfo?.email || 'email@empresa.com',
    companyInfo?.website || 'www.empresa.com'
  ];
  
  companyDetails.forEach((detail, index) => {
    doc.text(detail, margin + 50, yPosition + 20 + (index * 4));
  });
  
  yPosition += 50;
  
  // Invoice title and details
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FACTURA', pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 15;
  
  // Invoice details box
  const invoiceBoxX = pageWidth - 80;
  doc.setFillColor(248, 250, 252);
  doc.rect(invoiceBoxX, yPosition, 60, 40, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(invoiceBoxX, yPosition, 60, 40);
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('No. Factura:', invoiceBoxX + 2, yPosition + 8);
  doc.text('Fecha:', invoiceBoxX + 2, yPosition + 18);
  doc.text('Vencimiento:', invoiceBoxX + 2, yPosition + 28);
  doc.text('Estado:', invoiceBoxX + 2, yPosition + 38);
  
  doc.setFont('helvetica', 'normal');
  doc.text(sale.saleNumber, invoiceBoxX + 25, yPosition + 8);
  doc.text(new Date(sale.saleDate).toLocaleDateString('es-ES'), invoiceBoxX + 25, yPosition + 18);
  doc.text(new Date(sale.saleDate).toLocaleDateString('es-ES'), invoiceBoxX + 25, yPosition + 28);
  
  // Status with color
  const statusColor = sale.status === 'completed' ? accentColor : 
                     sale.status === 'pending' ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  const statusText = sale.status === 'completed' ? 'PAGADA' : 
                    sale.status === 'pending' ? 'PENDIENTE' : 'CANCELADA';
  doc.text(statusText, invoiceBoxX + 25, yPosition + 38);
  
  yPosition += 50;
  
  // Customer information
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURAR A:', margin, yPosition);
  
  yPosition += 10;
  addLine(yPosition - 2, primaryColor);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.customerName, margin, yPosition);
  
  if (sale.customerEmail || sale.customerPhone || sale.customerAddress) {
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (sale.customerEmail) {
      doc.text(`Email: ${sale.customerEmail}`, margin, yPosition);
      yPosition += 6;
    }
    if (sale.customerPhone) {
      doc.text(`Teléfono: ${sale.customerPhone}`, margin, yPosition);
      yPosition += 6;
    }
    if (sale.customerAddress) {
      doc.text(`Dirección: ${sale.customerAddress}`, margin, yPosition);
      yPosition += 6;
    }
  }
  
  yPosition += 15;
  
  // Items table
  const tableStartY = yPosition;
  
  // Table headers
  const headers = [['Producto/Servicio', 'Cantidad', 'Precio Unit.', 'Subtotal']];
  
  // Table data
  const tableData = saleItems.map(item => [
    item.productName,
    Number(item.quantity).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
    `$${Number(item.unitPrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
    `$${Number(item.subtotal).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
  ]);
  
  doc.autoTable({
    startY: tableStartY,
    head: headers,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: secondaryColor
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    tableWidth: 'auto'
  });
  
  // Get Y position after table
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Totals section
  const totalsX = pageWidth - 80;
  const totalsWidth = 60;
  
  // Totals background
  doc.setFillColor(248, 250, 252);
  doc.rect(totalsX, yPosition - 5, totalsWidth, 45, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(totalsX, yPosition - 5, totalsWidth, 45);
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', totalsX + 2, yPosition + 5);
  doc.text(`$${Number(sale.subtotal).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
           totalsX + totalsWidth - 2, yPosition + 5, { align: 'right' });
  
  // Tax
  if (Number(sale.taxAmount) > 0) {
    yPosition += 8;
    doc.text(`IVA (${Number(sale.taxRate)}%):`, totalsX + 2, yPosition + 5);
    doc.text(`$${Number(sale.taxAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
             totalsX + totalsWidth - 2, yPosition + 5, { align: 'right' });
  }
  
  // Discount
  if (Number(sale.discountAmount) > 0) {
    yPosition += 8;
    doc.text('Descuento:', totalsX + 2, yPosition + 5);
    doc.text(`-$${Number(sale.discountAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
             totalsX + totalsWidth - 2, yPosition + 5, { align: 'right' });
  }
  
  // Total line
  yPosition += 8;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(totalsX + 2, yPosition + 2, totalsX + totalsWidth - 2, yPosition + 2);
  
  // Total amount
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('TOTAL:', totalsX + 2, yPosition + 5);
  doc.text(`$${Number(sale.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
           totalsX + totalsWidth - 2, yPosition + 5, { align: 'right' });
  
  yPosition += 20;
  
  // Payment method
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const paymentMethodText = sale.paymentMethod === 'cash' ? 'Efectivo' :
                           sale.paymentMethod === 'card' ? 'Tarjeta' :
                           sale.paymentMethod === 'transfer' ? 'Transferencia' :
                           sale.paymentMethod === 'credit' ? 'Crédito' : sale.paymentMethod;
  doc.text(`Método de pago: ${paymentMethodText}`, margin, yPosition);
  
  // Notes
  if (sale.notes) {
    yPosition += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margin, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(sale.notes, pageWidth - (margin * 2));
    doc.text(splitNotes, margin, yPosition);
  }
  
  // Footer
  const footerY = pageHeight - 30;
  addLine(footerY - 5);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Gracias por su preferencia', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Factura generada el ${new Date().toLocaleDateString('es-ES')}`, 
           pageWidth / 2, footerY + 8, { align: 'center' });
  
  return doc;
};

export const downloadInvoicePDF = (props: InvoicePDFProps) => {
  const doc = generateInvoicePDF(props);
  doc.save(`Factura-${props.sale.saleNumber}.pdf`);
};

export const printInvoicePDF = (props: InvoicePDFProps) => {
  const doc = generateInvoicePDF(props);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};