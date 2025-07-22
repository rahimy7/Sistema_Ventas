import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart() {
  const data = {
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
  };

  const options = {
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
          callback: function(value: any) {
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
      mode: 'index' as const,
    },
  };

  return (
    <div className="relative h-64">
      <Line data={data} options={options} />
    </div>
  );
}
