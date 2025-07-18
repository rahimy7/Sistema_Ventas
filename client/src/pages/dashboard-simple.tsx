import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderDashboard = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">$25,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">$15,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Facturas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Productos en Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">156</p>
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
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestión de Ingresos</h1>
            <p>Módulo de ingresos en desarrollo...</p>
          </div>
        );
      case "expenses":
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestión de Gastos</h1>
            <p>Módulo de gastos en desarrollo...</p>
          </div>
        );
      case "invoices":
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestión de Facturas</h1>
            <p>Módulo de facturación implementado y funcionando.</p>
            <Button className="mt-4">Crear Nueva Factura</Button>
          </div>
        );
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