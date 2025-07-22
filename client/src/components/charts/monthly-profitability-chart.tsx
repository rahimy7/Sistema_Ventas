import { Chart } from 'react-chartjs-2';

interface MonthlyProfitabilityData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

interface MonthlyProfitabilityChartProps {
  data: MonthlyProfitabilityData[];
}

export default function MonthlyProfitabilityChart({ data }: MonthlyProfitabilityChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Ingresos',
        data: data.map(d => d.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'Gastos',
        data: data.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Utilidad Neta',
        data: data.map(d => d.profit),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Margen (%)',
        data: data.map(d => d.profitMargin),
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y1') {
              label += context.parsed.y.toFixed(1) + '%';
            } else {
              label += '$' + context.parsed.y.toLocaleString('es-ES', { minimumFractionDigits: 2 });
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Mes'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Monto ($)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString('es-ES');
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Margen (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
    },
  };

  return (
    <div className="h-96">
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}