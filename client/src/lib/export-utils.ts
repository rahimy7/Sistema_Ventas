import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPDF = (
  title: string,
  headers: string[],
  data: (string | number)[][],
  filename: string = "report.pdf"
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 20, 20);
  
  // Add current date
  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  doc.save(filename);
};

export const exportToCSV = (
  headers: string[],
  data: (string | number)[][],
  filename: string = "report.csv"
) => {
  const csvContent = [
    headers.join(","),
    ...data.map(row => row.join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const printReport = (
  title: string,
  content: string
) => {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976D2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generado el: ${new Date().toLocaleDateString()}</p>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};
