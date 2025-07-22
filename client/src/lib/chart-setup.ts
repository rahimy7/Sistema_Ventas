// Global Chart.js setup to ensure all components are registered properly
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  registerables,
} from 'chart.js';

// Register ALL Chart.js components globally to prevent "not registered controller" errors
ChartJS.register(...registerables);

export { ChartJS };