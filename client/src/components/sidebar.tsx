import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const sections = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "income", label: "Ingresos", icon: "💰" },
    { id: "expenses", label: "Gastos", icon: "💸" },
    { id: "purchases", label: "Compras", icon: "🛒" },
    { id: "inventory", label: "Inventario", icon: "📦" },
    { id: "payroll", label: "Nómina", icon: "👥" },
    { id: "invoices", label: "Facturas", icon: "📄" },
    { id: "reports", label: "Reportes", icon: "📈" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Sistema de Gestión</h2>
      </div>
      <nav className="mt-6">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start p-4 h-auto text-left",
              activeSection === section.id && "bg-blue-50 text-blue-700"
            )}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="mr-3">{section.icon}</span>
            {section.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}