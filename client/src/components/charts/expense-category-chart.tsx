import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { type Expense } from '@shared/schema';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseCategoryChartProps {
  expenses: Expense[];
}

export default function ExpenseCategoryChart({ expenses }: ExpenseCategoryChartProps) {
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Sin categoría';
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(expensesByCategory);
  const amounts = Object.values(expensesByCategory);

  // Colors for different categories
  const colors = [
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(245, 158, 11, 0.8)',  // Orange
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(147, 51, 234, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(14, 165, 233, 0.8)',  // Sky
    'rgba(99, 102, 241, 0.8)',  // Indigo
  ];

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: amounts,
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors.slice(0, categories.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = amounts.reduce((sum, amount) => sum + amount, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: $${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">No hay gastos registrados</p>
          <p className="text-sm">Los gastos aparecerán aquí cuando se registren</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}