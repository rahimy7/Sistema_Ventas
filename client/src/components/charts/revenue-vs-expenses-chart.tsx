import { Bar } from 'react-chartjs-2';

interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

interface RevenueVsExpensesChartProps {
  data: RevenueExpenseData[];
}

export default function RevenueVsExpensesChart({ data }: RevenueVsExpensesChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: data.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
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
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}