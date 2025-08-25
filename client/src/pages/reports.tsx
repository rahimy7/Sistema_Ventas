import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Target,
  Activity
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import HomeButton from "@/components/ui/home-button";
import { type Purchase, type Income, type Expense, type Sale } from "@shared/schema";
import MonthlyProfitabilityChart from "@/components/charts/monthly-profitability-chart";
import ExpenseCategoryChart from "@/components/charts/expense-category-chart";
import RevenueVsExpensesChart from "@/components/charts/revenue-vs-expenses-chart";
import { generateMonthlyReportPDF } from "@/components/reports/monthly-report-pdf";

interface MonthlyStats {
  totalRevenue: number;
  totalExpenses: number;
  totalPurchases: number;
  netProfit: number;
  profitMargin: number;
  salesCount: number;
  averageTicket: number;
  topExpenseCategory: string;
  topRevenueSource: string;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [reportType, setReportType] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Calculate date range for selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch all data
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: incomes = [] } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Filter data for selected month
  const monthlyData = useMemo(() => {
    const monthlySales = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= monthStart && saleDate <= monthEnd;
    });

    const monthlyPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= monthStart && purchaseDate <= monthEnd;
    });

    const monthlyIncomes = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate >= monthStart && incomeDate <= monthEnd;
    });

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    return {
      sales: monthlySales,
      purchases: monthlyPurchases,
      incomes: monthlyIncomes,
      expenses: monthlyExpenses,
    };
  }, [sales, purchases, incomes, expenses, monthStart, monthEnd]);

  // Calculate monthly statistics
  const monthlyStats: MonthlyStats = useMemo(() => {
    const totalRevenue = monthlyData.sales.reduce((sum, sale) => sum + Number(sale.total), 0) +
                        monthlyData.incomes.reduce((sum, income) => sum + Number(income.total), 0);
    
    const totalExpenses = monthlyData.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalPurchases = monthlyData.purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
    
    const totalCosts = totalExpenses + totalPurchases;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Top expense category
    const expensesByCategory = monthlyData.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topExpenseCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

    return {
      totalRevenue,
      totalExpenses,
      totalPurchases,
      netProfit,
      profitMargin,
      salesCount: monthlyData.sales.length,
      averageTicket: monthlyData.sales.length > 0 ? totalRevenue / monthlyData.sales.length : 0,
      topExpenseCategory,
      topRevenueSource: "Ventas", // Since we're mainly tracking sales
    };
  }, [monthlyData]);

  // Generate historical data for charts (last 6 months)
  const historicalData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(selectedMonth, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthlySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= start && saleDate <= end;
      });

      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      const monthlyPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate);
        return purchaseDate >= start && purchaseDate <= end;
      });

      const monthlyIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= start && incomeDate <= end;
      });

      const revenue = monthlySales.reduce((sum, sale) => sum + Number(sale.total), 0) +
                     monthlyIncomes.reduce((sum, income) => sum + Number(income.total), 0);
      const costs = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0) +
                   monthlyPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);

      months.push({
        month: format(monthDate, "MMM yyyy", { locale: es }),
        revenue,
        expenses: costs,
        profit: revenue - costs,
        profitMargin: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0,
      });
    }
    return months;
  }, [sales, expenses, purchases, incomes, selectedMonth]);

  const handleDownloadReport = () => {
    generateMonthlyReportPDF({
      month: format(selectedMonth, "MMMM yyyy", { locale: es }),
      stats: monthlyStats,
      chartData: historicalData,
      monthlyData,
    });
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <HomeButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600">Análisis de rentabilidad y rendimiento del negocio</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              ←
            </Button>
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedMonth, "MMMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedMonth(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={selectedMonth >= new Date()}
            >
              →
            </Button>
          </div>

          <Select value={reportType} onValueChange={(value: typeof reportType) => setReportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownloadReport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Descargar Reporte
        </Button>
      </div>

      <Tabs defaultValue="profitability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${monthlyStats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {monthlyStats.salesCount} ventas
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 text-sm font-medium">Gastos Totales</p>
                    <p className="text-2xl font-bold text-red-900">
                      ${(monthlyStats.totalExpenses + monthlyStats.totalPurchases).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Operacionales + Compras
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-500 rounded-2xl flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${monthlyStats.netProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${monthlyStats.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      Utilidad Neta
                    </p>
                    <p className={`text-2xl font-bold ${monthlyStats.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      ${monthlyStats.netProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs mt-1 ${monthlyStats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {monthlyStats.profitMargin >= 0 ? '+' : ''}{monthlyStats.profitMargin.toFixed(1)}% margen
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${monthlyStats.netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-medium">Ticket omedio</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ${monthlyStats.averageTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Por venta
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profitability Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis de Rentabilidad (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyProfitabilityChart data={historicalData} />
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Principal categoría de gasto:</span>
                  <Badge variant="outline">{monthlyStats.topExpenseCategory}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Principal fuente de ingresos:</span>
                  <Badge variant="outline">{monthlyStats.topRevenueSource}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado de rentabilidad:</span>
                  <Badge className={monthlyStats.profitMargin >= 15 ? 'bg-green-100 text-green-800' : 
                                   monthlyStats.profitMargin >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-red-100 text-red-800'}>
                    {monthlyStats.profitMargin >= 15 ? 'Excelente' : 
                     monthlyStats.profitMargin >= 5 ? 'Bueno' : 
                     monthlyStats.profitMargin >= 0 ? 'Bajo' : 'Pérdidas'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas Clave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margen de utilidad</span>
                    <span className={`font-medium ${monthlyStats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyStats.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${monthlyStats.profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        width: `${Math.min(Math.abs(monthlyStats.profitMargin), 100)}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Eficiencia operativa</span>
                    <span className="font-medium">
                      {monthlyStats.totalRevenue > 0 ? ((monthlyStats.totalRevenue - monthlyStats.totalExpenses) / monthlyStats.totalRevenue * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(monthlyStats.totalRevenue > 0 ? (monthlyStats.totalRevenue - monthlyStats.totalExpenses) / monthlyStats.totalRevenue * 100 : 0, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Ventas</span>
                    <span className="text-lg font-bold text-green-600">
                      ${monthlyData.sales.reduce((sum, sale) => sum + Number(sale.total), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Otros Ingresos</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${monthlyData.incomes.reduce((sum, income) => sum + Number(income.total), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueVsExpensesChart data={historicalData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseCategoryChart expenses={monthlyData.expenses} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Gastos Operacionales</span>
                    <span className="text-lg font-bold text-red-600">
                      ${monthlyStats.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Compras/Inventario</span>
                    <span className="text-lg font-bold text-orange-600">
                      ${monthlyStats.totalPurchases.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <span className="font-bold">Total Costos</span>
                    <span className="text-xl font-bold text-gray-800">
                      ${(monthlyStats.totalExpenses + monthlyStats.totalPurchases).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Análisis de Tendencias (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {historicalData.filter(m => m.profit > 0).length}
                  </p>
                  <p className="text-sm text-green-700">Meses rentables</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {(historicalData.reduce((sum, m) => sum + m.profitMargin, 0) / historicalData.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-700">Margen promedio</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    ${(historicalData.reduce((sum, m) => sum + m.revenue, 0) / historicalData.length).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-purple-700">Ingreso promedio</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {historicalData.map((monthData, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${monthData.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">{monthData.month}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <span className="text-green-600">
                        +${monthData.revenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-red-600">
                        -${monthData.expenses.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </span>
                      <span className={`font-bold ${monthData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthData.profit >= 0 ? '+' : ''}${monthData.profit.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}