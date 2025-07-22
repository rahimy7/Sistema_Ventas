import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Package
} from "lucide-react";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
            <p className="text-slate-600 mt-1">Resumen ejecutivo de tu negocio</p>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-700 font-medium">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-emerald-900">$25,000</p>
                <p className="text-sm text-emerald-600">↗️ +12% vs mes anterior</p>
              </div>
              <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-red-700 font-medium">Gastos del Mes</p>
                <p className="text-3xl font-bold text-red-900">$15,000</p>
                <p className="text-sm text-red-600">↘️ -5% vs mes anterior</p>
              </div>
              <div className="h-14 w-14 bg-red-500 rounded-2xl flex items-center justify-center">
                <TrendingDown className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-amber-700 font-medium">Facturas Pendientes</p>
                <p className="text-3xl font-bold text-amber-900">8</p>
                <p className="text-sm text-amber-600">Requieren seguimiento</p>
              </div>
              <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center">
                <Receipt className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-700 font-medium">Productos en Stock</p>
                <p className="text-3xl font-bold text-blue-900">156</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-blue-600">Inventario saludable</p>
                  <Button 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-6"
                    onClick={() => window.location.href = '/inventario'}
                  >
                    Ver más
                  </Button>
                </div>
              </div>
              <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "income":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Gestión de Ingresos</h1>
                  <p className="text-slate-600 mt-1">Control y registro de todas tus fuentes de ingreso</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Módulo de ingresos en desarrollo...</p>
            </div>
          </div>
        );
      case "expenses":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Gestión de Gastos</h1>
                  <p className="text-slate-600 mt-1">Control y categorización de todos tus gastos</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Módulo de gastos en desarrollo...</p>
            </div>
          </div>
        );
      case "invoices":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Gestión de Facturas</h1>
                  <p className="text-slate-600 mt-1">Sistema completo de facturación y pagos</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600 mb-4">Módulo de facturación implementado y funcionando.</p>
              <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg">
                Crear Nueva Factura
              </Button>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}