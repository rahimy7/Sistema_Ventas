import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SalesChart() {
  const data = {
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
  };

  const options = {
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
          label: function(context: any) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <div className="relative h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
}
