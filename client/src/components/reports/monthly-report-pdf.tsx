import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface MonthlyReportData {
  month: string;
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    totalPurchases: number;
    netProfit: number;
    profitMargin: number;
    salesCount: number;
    averageTicket: number;
    topExpenseCategory: string;
    topRevenueSource: string;
  };
  chartData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
  monthlyData: {
    sales: any[];
    purchases: any[];
    incomes: any[];
    expenses: any[];
  };
}

export const generateMonthlyReportPDF = (data: MonthlyReportData) => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const secondaryColor = [75, 85, 99]; // Gray
  const successColor = [34, 197, 94]; // Green
  const errorColor = [239, 68, 68]; // Red
  
  // Page configuration
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = margin;
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE RENTABILIDAD', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${data.month}`, pageWidth / 2, 30, { align: 'center' });
  
  yPosition = 60;
  
  // Executive Summary
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO', margin, yPosition);
  yPosition += 15;
  
  // Summary boxes
  const boxWidth = (pageWidth - 3 * margin) / 2;
  const boxHeight = 25;
  
  // Revenue box
  doc.setFillColor(34, 197, 94, 0.1 * 255);
  doc.rect(margin, yPosition, boxWidth, boxHeight, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.rect(margin, yPosition, boxWidth, boxHeight);
  
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INGRESOS TOTALES', margin + 5, yPosition + 8);
  doc.setFontSize(16);
  doc.text(`$${data.stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
           margin + 5, yPosition + 18);
  
  // Expenses box
  doc.setFillColor(239, 68, 68, 0.1 * 255);
  doc.rect(margin + boxWidth + 10, yPosition, boxWidth, boxHeight, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(margin + boxWidth + 10, yPosition, boxWidth, boxHeight);
  
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GASTOS TOTALES', margin + boxWidth + 15, yPosition + 8);
  doc.setFontSize(16);
  doc.text(`$${(data.stats.totalExpenses + data.stats.totalPurchases).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 
           margin + boxWidth + 15, yPosition + 18);
  
  yPosition += 35;
  
  // Net profit box (full width)
  const profitColor = data.stats.netProfit >= 0 ? successColor : errorColor;
  doc.setFillColor(profitColor[0], profitColor[1], profitColor[2], 0.1 * 255);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'F');
  doc.setDrawColor(profitColor[0], profitColor[1], profitColor[2]);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight);
  
  doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('UTILIDAD NETA', pageWidth / 2, yPosition + 10, { align: 'center' });
  doc.setFontSize(20);
  doc.text(`$${data.stats.netProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${data.stats.profitMargin.toFixed(1)}%)`, 
           pageWidth / 2, yPosition + 20, { align: 'center' });
  
  yPosition += 40;
  
  // Key Metrics Table
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS CLAVE', margin, yPosition);
  yPosition += 10;
  
  const metricsData = [
    ['Métrica', 'Valor'],
    ['Número de ventas', data.stats.salesCount.toString()],
    ['Ticket promedio', `$${data.stats.averageTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
    ['Margen de utilidad', `${data.stats.profitMargin.toFixed(1)}%`],
    ['Principal categoría de gasto', data.stats.topExpenseCategory],
    ['Eficiencia operativa', `${data.stats.totalRevenue > 0 ? ((data.stats.totalRevenue - data.stats.totalExpenses) / data.stats.totalRevenue * 100).toFixed(1) : '0'}%`],
  ];
  
  doc.autoTable({
    startY: yPosition,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: secondaryColor
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Historical Trend Table
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TENDENCIA HISTÓRICA (ÚLTIMOS 6 MESES)', margin, yPosition);
  yPosition += 10;
  
  const trendHeaders = [['Mes', 'Ingresos', 'Gastos', 'Utilidad', 'Margen (%)']];
  const trendData = data.chartData.map(item => [
    item.month,
    `$${item.revenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
    `$${item.expenses.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
    `$${item.profit.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
    `${item.profitMargin.toFixed(1)}%`
  ]);
  
  doc.autoTable({
    startY: yPosition,
    head: trendHeaders,
    body: trendData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: secondaryColor
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = margin;
  }
  
  // Monthly Activity Summary
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE ACTIVIDAD MENSUAL', margin, yPosition);
  yPosition += 15;
  
  // Activity summary boxes
  const activityData = [
    { label: 'Ventas realizadas', value: data.monthlyData.sales.length, color: successColor },
    { label: 'Compras registradas', value: data.monthlyData.purchases.length, color: primaryColor },
    { label: 'Gastos operacionales', value: data.monthlyData.expenses.length, color: errorColor },
    { label: 'Otros ingresos', value: data.monthlyData.incomes.length, color: [147, 51, 234] }
  ];
  
  activityData.forEach((item, index) => {
    const boxY = yPosition + (index * 15);
    
    doc.setFillColor(item.color[0], item.color[1], item.color[2], 0.1 * 255);
    doc.rect(margin, boxY, pageWidth - 2 * margin, 12, 'F');
    doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(margin, boxY, pageWidth - 2 * margin, 12);
    
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin + 5, boxY + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text(item.value.toString(), pageWidth - margin - 5, boxY + 8, { align: 'right' });
  });
  
  yPosition += 80;
  
  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-ES')}`, 
           margin, footerY);
  doc.text('Sistema de Gestión Automotriz', 
           pageWidth - margin, footerY, { align: 'right' });
  
  // Save the PDF
  doc.save(`Reporte-Rentabilidad-${data.month.replace(' ', '-')}.pdf`);
};