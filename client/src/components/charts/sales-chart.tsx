import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function SalesChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Aceites', 'Filtros', 'Servicios', 'Accesorios', 'Otros'],
            datasets: [
              {
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                  '#1976D2',
                  '#4CAF50',
                  '#FF9800',
                  '#F44336',
                  '#9E9E9E'
                ],
                borderWidth: 2,
                borderColor: '#fff',
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom' as const,
                labels: {
                  padding: 20,
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + '%';
                  }
                }
              }
            },
            cutout: '60%',
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
