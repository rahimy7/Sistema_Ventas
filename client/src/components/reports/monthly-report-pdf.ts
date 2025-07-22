import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  monthlyData: {
    sales: any[];
    purchases: any[];
    incomes: any[];
    expenses: any[];
  };
}

export function generateMonthlyReportPDF(data: MonthlyReportData, companyName: string = "RVR") {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(`${companyName}`, 20, 20);
  doc.setFontSize(16);
  doc.text('Reporte Mensual de Rentabilidad', 20, 30);
  doc.setFontSize(12);
  doc.text(`Período: ${data.month}`, 20, 40);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 50);

  // Financial Summary
  let yPosition = 70;
  doc.setFontSize(14);
  doc.text('Resumen Financiero', 20, yPosition);
  
  const summaryData = [
    ['Métrica', 'Valor'],
    ['Ingresos Totales', `$${data.stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
    ['Gastos Totales', `$${data.stats.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
    ['Compras Totales', `$${data.stats.totalPurchases.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
    ['Utilidad Neta', `$${data.stats.netProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
    ['Margen de Ganancia', `${data.stats.profitMargin.toFixed(2)}%`],
    ['Número de Ventas', data.stats.salesCount.toString()],
    ['Ticket Promedio', `$${data.stats.averageTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
  ];

  autoTable(doc, {
    startY: yPosition + 10,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Sales Details
  if (data.monthlyData.sales.length > 0) {
    doc.setFontSize(14);
    doc.text('Detalle de Ventas', 20, yPosition);
    
    const salesData = data.monthlyData.sales.map(sale => [
      sale.saleNumber || 'N/A',
      sale.customerName || 'Sin nombre',
      new Date(sale.saleDate).toLocaleDateString('es-ES'),
      `$${Number(sale.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      sale.status || 'completed'
    ]);

    autoTable(doc, {
      startY: yPosition + 10,
      head: [['N° Venta', 'Cliente', 'Fecha', 'Total', 'Estado']],
      body: salesData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Expenses Details
  if (data.monthlyData.expenses.length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Detalle de Gastos', 20, yPosition);
    
    const expensesData = data.monthlyData.expenses.map(expense => [
      new Date(expense.date).toLocaleDateString('es-ES'),
      expense.category || 'Sin categoría',
      expense.description || 'Sin descripción',
      `$${Number(expense.amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      expense.paymentMethod || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition + 10,
      head: [['Fecha', 'Categoría', 'Descripción', 'Monto', 'Método de Pago']],
      body: expensesData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
    doc.text(`Generado por Sistema de Gestión ${companyName}`, 20, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  doc.save(`reporte-mensual-${data.month.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}