import React from "react";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Package,
  ShoppingCart,
  ShoppingBag,
  FileText,
  Settings,
  Users,
  LogOut,
  Home,
  TrendingUp,
  Building
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiresRole?: string[];
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Panel principal del sistema"
  },
  {
    title: "Inventario",
    href: "/inventario",
    icon: Package,
    description: "Gestión de productos y stock"
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
    requiresRole: ["admin", "sales"],
    description: "Registro y seguimiento de ventas"
  },
  {
    title: "Compras",
    href: "/compras",
    icon: ShoppingBag,
    requiresRole: ["admin"],
    description: "Gestión de compras a proveedores"
  },
  {
    title: "Activos Fijos",
    href: "/activos",
    icon: Building,
    requiresRole: ["admin"],
    description: "Gestión de activos fijos y equipos"
  },
  {
  title: "Proveedores",
  href: "/proveedores", 
  icon: Building,
  requiresRole: ["admin"],
  description: "Gestión de proveedores y contactos"
},
  {
    title: "Reportes",
    href: "/reportes",
    icon: TrendingUp,
    requiresRole: ["admin"],
    description: "Análisis y reportes del negocio"
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: Users,
    requiresRole: ["admin"],
    description: "Gestión de usuarios del sistema"
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
    requiresRole: ["admin"],
    description: "Configuración del sistema"
  }
];

interface SidebarNavigationProps {
  className?: string;
}

export default function SidebarNavigation({ className }: SidebarNavigationProps) {
  const { user, logout, hasRole } = useAuth();
  const [match] = useRoute("/:path*");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const filteredItems = navigationItems.filter((item) => {
    if (!item.requiresRole) return true;
    return hasRole(item.requiresRole as any);
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "sales": return "Ventas";
      case "viewer": return "Visor";
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "sales": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r border-gray-200", className)}>
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">RVR_VENTAS</h1>
            <p className="text-xs text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">@{user.username}</p>
                <Badge 
                  variant={getRoleBadgeVariant(user.role) as any}
                  className="text-xs"
                >
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
            Navegación Principal
          </div>
          
          {filteredItems.map((item) => {
            const isActive = item.href === "/" 
              ? window.location.pathname === "/" 
              : window.location.pathname.startsWith(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            © 2025 AutoParts System
          </p>
          <p className="text-xs text-gray-400 text-center">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}