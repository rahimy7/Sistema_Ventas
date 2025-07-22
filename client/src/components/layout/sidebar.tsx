import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText,
  Receipt,
  Menu,
  X,
  Settings
} from "lucide-react";

type Section = "dashboard" | "income" | "expenses" | "purchases" | "inventory" | "sales" | "payroll" | "invoices" | "reports" | "settings";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navigation = [
  { 
    id: "dashboard" as Section, 
    label: "Dashboard", 
    icon: BarChart3, 
    color: "text-blue-600",
    path: "/"
  },
  { 
    id: "income" as Section, 
    label: "Ingresos", 
    icon: TrendingUp, 
    color: "text-green-600" 
  },
  { 
    id: "expenses" as Section, 
    label: "Egresos", 
    icon: TrendingDown, 
    color: "text-red-600" 
  },
  { 
    id: "purchases" as Section, 
    label: "Compras", 
    icon: ShoppingCart, 
    color: "text-orange-600",
    path: "/compras"
  },
  { 
    id: "inventory" as Section, 
    label: "Inventario", 
    icon: Package, 
    color: "text-gray-600",
    path: "/inventario"
  },
  { 
    id: "sales" as Section, 
    label: "Ventas", 
    icon: Receipt, 
    color: "text-green-600",
    path: "/ventas"
  },
  { 
    id: "payroll" as Section, 
    label: "Nómina", 
    icon: Users, 
    color: "text-blue-600" 
  },
  { 
    id: "invoices" as Section, 
    label: "Facturas", 
    icon: Receipt, 
    color: "text-purple-600" 
  },
  { 
    id: "reports" as Section, 
    label: "Reportes", 
    icon: FileText, 
    color: "text-gray-600" 
  },
  { 
    id: "settings" as Section, 
    label: "Configuración", 
    icon: Settings, 
    color: "text-purple-600",
    path: "/configuracion"
  },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleSectionChange = (section: Section) => {
    onSectionChange(section);
    setIsMobileOpen(false); // Close mobile sidebar when section changes
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={toggleMobileSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">BusinessPro</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white shadow-lg w-64 min-h-screen transition-transform duration-300 ease-in-out z-30",
          "lg:translate-x-0 lg:relative lg:z-auto",
          isMobileOpen ? "translate-x-0 fixed" : "-translate-x-full fixed lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              BusinessPro
            </h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? location === item.path : activeSection === item.id;
              
              return (
                <li key={item.id}>
                  {item.path ? (
                    <Link href={item.path}>
                      <button
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "w-full flex items-center p-3 rounded-lg transition-colors text-left",
                          "hover:bg-gray-100",
                          isActive && "bg-blue-50 text-blue-700"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5 mr-3",
                          isActive ? "text-blue-600" : item.color
                        )} />
                        <span className={cn(
                          isActive ? "font-medium" : "font-normal"
                        )}>
                          {item.label}
                        </span>
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "w-full flex items-center p-3 rounded-lg transition-colors text-left",
                        "hover:bg-gray-100",
                        isActive && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 mr-3",
                        isActive ? "text-blue-600" : item.color
                      )} />
                      <span className={cn(
                        isActive ? "font-medium" : "font-normal"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
