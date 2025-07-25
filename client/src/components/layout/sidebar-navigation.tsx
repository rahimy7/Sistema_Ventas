import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Package,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type CompanySettings } from "@shared/schema";

interface SidebarNavigationProps {
  className?: string;
}

const getAllNavigationItems = () => [
  { href: "/", label: "Inicio", icon: Home, color: "text-blue-600", roles: ['admin', 'sales', 'viewer'] },
  { href: "/inventario", label: "Inventario", icon: Package, color: "text-purple-600", roles: ['admin', 'sales', 'viewer'] },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart, color: "text-green-600", roles: ['admin', 'sales'] },
  { href: "/compras", label: "Compras", icon: ShoppingBag, color: "text-orange-600", roles: ['admin'] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, color: "text-indigo-600", roles: ['admin'] },
  { href: "/configuracion", label: "Configuración", icon: Settings, color: "text-gray-600", roles: ['admin'] },
];

export default function SidebarNavigation({ className }: SidebarNavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Obtener configuración de la empresa
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames = {
      admin: "Administrador",
      sales: "Ventas", 
      viewer: "Visor"
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  // Filter navigation items based on user role
  const getVisibleNavigationItems = () => {
    if (!user) return [];
    return getAllNavigationItems().filter(item => 
      item.roles.includes(user.role as any)
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {companySettings?.name || 'AutoParts'}
                </h1>
                <p className="text-sm text-gray-500">Gestión Empresarial</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {getVisibleNavigationItems().map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-3 transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg" 
                        : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon 
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-white" : item.color
                      )} 
                    />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {user && (
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName(user.role)}
                  </p>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start space-x-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">v1.0.0</p>
              <p className="text-xs text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}