import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Package,
  ShoppingCart,
  ShoppingBag,
  Settings
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
            <p className="text-slate-600 mt-1">Resumen ejecutivo de tu negocio automotriz</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-700 font-medium">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-emerald-900">${(25000).toLocaleString()}</p>
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
                <p className="text-3xl font-bold text-red-900">${(15000).toLocaleString()}</p>
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

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-700 font-medium">Productos en Stock</p>
                <p className="text-3xl font-bold text-blue-900">{(156).toLocaleString()}</p>
                <p className="text-sm text-blue-600">Inventario saludable</p>
              </div>
              <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/inventario">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg h-16">
              <div className="flex flex-col items-center space-y-1">
                <Package className="h-5 w-5" />
                <span className="text-sm">Inventario</span>
              </div>
            </Button>
          </Link>
          
          <Link href="/ventas">
            <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg h-16">
              <div className="flex flex-col items-center space-y-1">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Ventas</span>
              </div>
            </Button>
          </Link>
          
          <Link href="/compras">
            <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg h-16">
              <div className="flex flex-col items-center space-y-1">
                <ShoppingBag className="h-5 w-5" />
                <span className="text-sm">Compras</span>
              </div>
            </Button>
          </Link>
          
          <Link href="/configuracion">
            <Button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg h-16">
              <div className="flex flex-col items-center space-y-1">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Configuración</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Actividad Reciente</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Nueva venta registrada</p>
              <p className="text-sm text-slate-600">Filtro de aceite - $45.00</p>
            </div>
            <span className="text-sm text-slate-500">Hace 2 horas</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Compra a proveedor</p>
              <p className="text-sm text-slate-600">Pastillas de freno x20 - $300.00</p>
            </div>
            <span className="text-sm text-slate-500">Hace 5 horas</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Stock actualizado</p>
              <p className="text-sm text-slate-600">Bujías NGK - Stock bajo (5 unidades)</p>
            </div>
            <span className="text-sm text-slate-500">Hace 1 día</span>
          </div>
        </div>
      </div>
    </div>
  );
}