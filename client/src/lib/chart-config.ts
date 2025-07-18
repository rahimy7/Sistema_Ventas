export const chartColors = {
  primary: '#1976D2',
  secondary: '#424242',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  purple: '#9C27B0',
  teal: '#009688',
  orange: '#FF5722',
  grey: '#9E9E9E',
};

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString()}`;
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};
