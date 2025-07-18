import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function RevenueChart() {
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
          type: 'line',
          data: {
            labels: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
            datasets: [
              {
                label: 'Ingresos',
                data: [32000, 35000, 38000, 39000, 38920, 45230],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#4CAF50',
                pointRadius: 4,
              },
              {
                label: 'Gastos',
                data: [18000, 19500, 20200, 21000, 21500, 23180],
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#F44336',
                pointBorderColor: '#F44336',
                pointRadius: 4,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + Number(value).toLocaleString();
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                }
              },
              x: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
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
