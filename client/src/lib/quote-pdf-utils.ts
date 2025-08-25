// Archivo: lib/quote-pdf-utils.ts

import jsPDF from "jspdf";

export interface QuoteForPDF {
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
  items: Array<{
    productName: string;
    description?: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
  }>;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
}

export function generateQuotePDF(quote: QuoteForPDF, companyInfo: CompanyInfo): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colores
  const primaryColor = [34, 139, 230]; // Azul
  const secondaryColor = [44, 62, 80]; // Gris oscuro
  const accentColor = [236, 240, 241]; // Gris claro
  
  // Encabezado de la empresa
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, 20, 18);
  
  // Información de la empresa
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  
  if (companyInfo.address) {
    doc.text(companyInfo.address, 20, yPos);
    yPos += 4;
  }
  
  const contactInfo = [];
  if (companyInfo.phone) contactInfo.push(`Tel: ${companyInfo.phone}`);
  if (companyInfo.email) contactInfo.push(`Email: ${companyInfo.email}`);
  if (companyInfo.website) contactInfo.push(`Web: ${companyInfo.website}`);
  
  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' | '), 20, yPos);
    yPos += 4;
  }
  
  if (companyInfo.taxId) {
    doc.text(`RNC/Cédula: ${companyInfo.taxId}`, 20, yPos);
    yPos += 8;
  }
  
  // Título del documento
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', pageWidth - 20, 35, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. ${quote.quoteNumber}`, pageWidth - 20, 42, { align: 'right' });
  
  // Información del cliente
  const clientStartY = yPos + 10;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN PARA:', 20, clientStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.customerName, 20, clientStartY + 8);
  
  let clientY = clientStartY + 16;
  if (quote.customerEmail) {
    doc.text(quote.customerEmail, 20, clientY);
    clientY += 8;
  }
  
  if (quote.customerPhone) {
    doc.text(quote.customerPhone, 20, clientY);
    clientY += 8;
  }
  
  if (quote.customerAddress) {
    const addressLines = doc.splitTextToSize(quote.customerAddress, 80);
    doc.text(addressLines, 20, clientY);
    clientY += addressLines.length * 4;
  }
  
  // Fechas y validez
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', 130, clientStartY + 8);
  doc.text('VÁLIDA HASTA:', 130, clientStartY + 16);
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quoteDate.toLocaleDateString('es-ES'), 170, clientStartY + 8);
  doc.text(quote.validUntil.toLocaleDateString('es-ES'), 170, clientStartY + 16);
  
  // Advertencia de expiración si está próxima
  const daysUntilExpiry = Math.ceil((quote.validUntil.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    doc.setTextColor(255, 140, 0); // Naranja
    doc.setFont('helvetica', 'bold');
    doc.text(`¡Expira en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}!`, 130, clientStartY + 24);
  } else if (daysUntilExpiry <= 0) {
    doc.setTextColor(220, 20, 60); // Rojo
    doc.setFont('helvetica', 'bold');
    doc.text('¡COTIZACIÓN EXPIRADA!', 130, clientStartY + 24);
  }
  
  // Tabla de productos
  const tableStartY = Math.max(clientY, clientStartY + 35) + 10;
  
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
  
  quote.items.forEach((item, index) => {
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, currentY - 5, pageWidth - 40, 12, 'F');
    }
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Nombre del producto
    const productText = item.description ? 
      `${item.productName} - ${item.description}` : 
      item.productName;
    const maxWidth = 90;
    const productLines = doc.splitTextToSize(productText, maxWidth);
    doc.text(productLines, 25, currentY + 3);
    
    // Cantidad, precio y total
    doc.text(Number(item.quantity).toLocaleString(), 120, currentY + 3, { align: 'center' });
    doc.text(`${Number(item.unitPrice).toLocaleString()}`, 145, currentY + 3, { align: 'center' });
    doc.text(`${Number(item.subtotal).toLocaleString()}`, 175, currentY + 3, { align: 'right' });
    
    // Ajustar altura si hay múltiples líneas
    const lineHeight = productLines.length > 1 ? productLines.length * 4 : 12;
    currentY += lineHeight;
    
    // Verificar si necesitamos una nueva página
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 30;
    }
  });
  
  // Totales
  const totalsStartY = currentY + 20;
  const totalsX = 120;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, totalsStartY - 5, pageWidth - 20, totalsStartY - 5);
  
  let totalY = totalsStartY;
  
  // Subtotal
  doc.text('Subtotal:', totalsX, totalY);
  doc.text(`${Number(quote.subtotal).toLocaleString()}`, pageWidth - 20, totalY, { align: 'right' });
  totalY += 8;
  
  // Descuento (si aplica)
  if (quote.discountAmount && Number(quote.discountAmount) > 0) {
    doc.setTextColor(220, 20, 60); // Rojo para descuento
    doc.text('Descuento:', totalsX, totalY);
    doc.text(`-${Number(quote.discountAmount).toLocaleString()}`, pageWidth - 20, totalY, { align: 'right' });
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    totalY += 8;
  }
  
  // Impuestos (si aplica)
  if (quote.taxAmount && Number(quote.taxAmount) > 0) {
    const taxText = quote.taxRate ? `Impuestos (${quote.taxRate}%):` : 'Impuestos:';
    doc.text(taxText, totalsX, totalY);
    doc.text(`${Number(quote.taxAmount).toLocaleString()}`, pageWidth - 20, totalY, { align: 'right' });
    totalY += 8;
  }
  
  // Total final
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(totalsX - 5, totalY - 2, pageWidth - totalsX - 15, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', totalsX, totalY + 6);
  doc.text(`${Number(quote.total).toLocaleString()}`, pageWidth - 20, totalY + 6, { align: 'right' });
  
  totalY += 20;
  
  // Notas (si existen)
  if (quote.notes) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NOTAS:', 20, totalY);
    totalY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(quote.notes, pageWidth - 40);
    doc.text(notesLines, 20, totalY);
    totalY += notesLines.length * 4 + 10;
  }
  
  // Términos y condiciones (si existen)
  if (quote.terms) {
    // Verificar si necesitamos una nueva página
    if (totalY > pageHeight - 40) {
      doc.addPage();
      totalY = 30;
    }
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TÉRMINOS Y CONDICIONES:', 20, totalY);
    totalY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const termsLines = doc.splitTextToSize(quote.terms, pageWidth - 40);
    doc.text(termsLines, 20, totalY);
    totalY += termsLines.length * 3 + 10;
  }
  
  // Información adicional en la parte inferior
  const footerY = pageHeight - 30;
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
  
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Instrucciones para el cliente
  const instructions = [
    '• Esta cotización es válida hasta la fecha indicada.',
    '• Los precios pueden estar sujetos a cambios sin previo aviso después del vencimiento.',
    '• Para proceder con la compra, por favor confirme su aceptación antes del vencimiento.',
  ];
  
  let instrY = footerY - 5;
  instructions.forEach(instruction => {
    doc.text(instruction, 20, instrY);
    instrY += 4;
  });
  
  // Información de contacto en el pie
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('¿Preguntas? Contáctanos:', pageWidth - 20, footerY, { align: 'right' });
  
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  if (companyInfo.phone) {
    doc.text(companyInfo.phone, pageWidth - 20, footerY + 4, { align: 'right' });
  }
  if (companyInfo.email) {
    doc.text(companyInfo.email, pageWidth - 20, footerY + 8, { align: 'right' });
  }
  
  return doc;
}

// Función helper para generar y descargar el PDF
export function downloadQuotePDF(quote: QuoteForPDF, companyInfo: CompanyInfo) {
  const doc = generateQuotePDF(quote, companyInfo);
  const filename = `Cotizacion_${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}

// Función helper para obtener el blob del PDF (para previsualización)
export function getQuotePDFBlob(quote: QuoteForPDF, companyInfo: CompanyInfo): Blob {
  const doc = generateQuotePDF(quote, companyInfo);
  return doc.output('blob');
}

// Función para validar que los datos de la cotización son válidos para PDF
export function validateQuoteForPDF(quote: Partial<QuoteForPDF>): string[] {
  const errors: string[] = [];
  
  if (!quote.quoteNumber) errors.push('Número de cotización requerido');
  if (!quote.customerName) errors.push('Nombre del cliente requerido');
  if (!quote.quoteDate) errors.push('Fecha de cotización requerida');
  if (!quote.validUntil) errors.push('Fecha de vencimiento requerida');
  if (!quote.total) errors.push('Total requerido');
  if (!quote.items || quote.items.length === 0) errors.push('Al menos un producto es requerido');
  
  return errors;
}