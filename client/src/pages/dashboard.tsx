import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import RevenueChart from "@/components/charts/revenue-chart";
import SalesChart from "@/components/charts/sales-chart";
import IncomeForm from "@/components/forms/income-form";
import ExpenseForm from "@/components/forms/expense-form";
import PurchaseForm from "@/components/forms/enhanced-purchase-form";
import InventoryForm from "@/components/forms/inventory-form";
import EmployeeForm from "@/components/forms/employee-form";
import InvoiceForm from "@/components/forms/invoice-form";
import { useBusinessData } from "@/hooks/use-business-data";
import { format } from "date-fns";
type Section = "dashboard" | "income" | "expenses" | "purchases" | "inventory" | "payroll" | "invoices" | "reports";
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    dashboardStats,
    incomes,
    expenses,
    purchases,
    inventory,
    employees,
    invoices,
    expenseCategories,
    isLoading
  } = useBusinessData();
  const renderKPICards = () => {
    if (isLoading || !dashboardStats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <ArrowUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardStats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <ArrowDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Gastos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardStats.monthlyExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Ganancia Neta</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardStats.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Items en Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.stockItems}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  const renderDashboard = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Control</h2>
        <p className="text-gray-600">Resumen general de tu negocio</p>
      </div>
      {renderKPICards()}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Gastos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes?.slice(0, 5).map((income) => (
                  <TableRow key={`income-${income.id}`}>
                    <TableCell>{format(new Date(income.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Ingreso
                      </Badge>
                    </TableCell>
                    <TableCell>{income.productService}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +${Number(income.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {expenses?.slice(0, 3).map((expense) => (
                  <TableRow key={`expense-${expense.id}`}>
                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        Gasto
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -${Number(expense.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderIncomeSection = () => (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Ingresos</h2>
          <p className="text-gray-600">Registra y gestiona todas las ventas y entradas de dinero</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
            </DialogHeader>
            <IncomeForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registro de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto/Servicio</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">P. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes?.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{format(new Date(income.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{income.client || "N/A"}</TableCell>
                    <TableCell>{income.productService}</TableCell>
                    <TableCell className="text-center">{Number(income.quantity)}</TableCell>
                    <TableCell className="text-right">${Number(income.unitPrice).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${Number(income.total).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{income.paymentMethod}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderExpensesSection = () => (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Egresos</h2>
          <p className="text-gray-600">Control de todos los gastos y pagos realizados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
            </DialogHeader>
            <ExpenseForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {expenseCategories && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {expenseCategories.map((category) => (
            <Card key={category.category}>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600">{category.category}</p>
                <p className="text-lg font-bold text-gray-900">${category.total.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Forma de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      ${Number(expense.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderInventorySection = () => {
    const getStockStatus = (currentStock: string, reorderPoint: string) => {
      const current = Number(currentStock);
      const reorder = Number(reorderPoint);
      
      if (current === 0) return { label: "Agotado", variant: "destructive", icon: XCircle };
      if (current <= reorder) return { label: "Stock Bajo", variant: "secondary", icon: AlertTriangle };
      return { label: "En Stock", variant: "default", icon: CheckCircle };
    };
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Control de Inventario</h2>
            <p className="text-gray-600">Gestión de stock y productos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="mt-4 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Producto al Inventario</DialogTitle>
              </DialogHeader>
              <InventoryForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Productos en Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead className="text-right">P. Compra</TableHead>
                    <TableHead className="text-right">P. Venta</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Punto Reposición</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.map((item) => {
                    const status = getStockStatus(item.currentStock, item.reorderPoint);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">${Number(item.purchasePrice).toLocaleString()}</TableCell>
                        <TableCell className="text-right">${Number(item.salePrice).toLocaleString()}</TableCell>
                        <TableCell className="text-center font-semibold">{Number(item.currentStock)}</TableCell>
                        <TableCell className="text-center">{Number(item.reorderPoint)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
  const renderPayrollSection = () => (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Nómina</h2>
          <p className="text-gray-600">Control de pagos a empleados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
            </DialogHeader>
            <EmployeeForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Sueldo Mensual</TableHead>
                  <TableHead className="text-right">Avances</TableHead>
                  <TableHead className="text-right">Bonos</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-gray-500 text-xs">ID: {employee.id.toString().padStart(3, '0')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-right">${Number(employee.monthlySalary).toLocaleString()}</TableCell>
                    <TableCell className="text-right">${Number(employee.advances || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">${Number(employee.bonuses || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">${Number(employee.totalPaid || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderPurchasesSection = () => (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Compras</h2>
          <p className="text-gray-600">Registro de compras de mercancía e insumos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Compra</DialogTitle>
            </DialogHeader>
            <PurchaseForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registro de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Producto/Insumo</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">P. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Categoría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.product}</TableCell>
                    <TableCell className="text-center">{Number(purchase.quantity)}</TableCell>
                    <TableCell className="text-right">${Number(purchase.unitPrice).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(purchase.total).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{purchase.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderInvoicesSection = () => (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Facturas</h2>
          <p className="text-gray-600">Crear y administrar facturas de venta</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Factura</DialogTitle>
            </DialogHeader>
            <InvoiceForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">Facturas emitidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dashboardStats?.pendingInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(dashboardStats?.totalInvoices || 0) - (dashboardStats?.pendingInvoices || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cobradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${dashboardStats?.monthlyRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos por facturas</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Facturas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!invoices || invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay facturas registradas. Crea tu primera factura haciendo clic en "Nueva Factura".
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={
                            invoice.status === "paid" ? "default" : 
                            invoice.status === "pending" ? "secondary" : 
                            invoice.status === "overdue" ? "destructive" : 
                            "outline"
                          }
                        >
                          {invoice.status === "pending" ? "Pendiente" :
                           invoice.status === "paid" ? "Pagada" :
                           invoice.status === "overdue" ? "Vencida" :
                           invoice.status === "cancelled" ? "Cancelada" : 
                           invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                          <Button variant="outline" size="sm">
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderReportsSection = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportes y Análisis</h2>
        <p className="text-gray-600">Informes detallados para toma de decisiones</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Reporte Financiero</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Análisis completo de ingresos, gastos y rentabilidad</p>
            <Button variant="link" className="p-0 text-blue-600">
              Generar Reporte →
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Reporte de Inventario</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Estado actual del stock y productos más vendidos</p>
            <Button variant="link" className="p-0 text-orange-600">
              Generar Reporte →
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Reporte de Ventas</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Análisis de ventas por período y producto</p>
            <Button variant="link" className="p-0 text-green-600">
              Generar Reporte →
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resumen Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-gray-500">Los reportes detallados se generarán basados en los datos almacenados.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">Exportar PDF</Button>
              <Button variant="outline">Exportar Excel</Button>
              <Button variant="outline">Imprimir</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "income":
        return renderIncomeSection();
      case "expenses":
        return renderExpensesSection();
      case "purchases":
        return renderPurchasesSection();
      case "inventory":
        return renderInventorySection();
      case "payroll":
        return renderPayrollSection();
      case "invoices":
        return renderInvoicesSection();
      case "reports":
        return renderReportsSection();
      default:
        return renderDashboard();
    }
  };
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        {renderActiveSection()}
      </main>
    </div>
  );
}
}