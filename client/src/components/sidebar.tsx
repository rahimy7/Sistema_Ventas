// client/src/components/layout/sidebar-navigation.tsx

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  FileText, 
  Users, 
  Settings,
  Building,
  Archive
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
    description: "Panel de control principal"
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: Package,
    description: "Gestión de productos y stock"
  },
  {
    name: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
    description: "Registro y seguimiento de ventas",
    requiredRoles: ['admin', 'sales']
  },
  {
    name: "Compras",
    href: "/compras",
    icon: ShoppingBag,
    description: "Gestión de compras y proveedores",
    requiredRoles: ['admin']
  },
  {
    name: "Activos",
    href: "/activos",
    icon: Building,
    description: "Gestión de activos y equipos",
    requiredRoles: ['admin']
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: FileText,
    description: "Análisis y reportes financieros",
    requiredRoles: ['admin']
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: Users,
    description: "Administración de usuarios",
    requiredRoles: ['admin']
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Configuración del sistema",
    requiredRoles: ['admin']
  }
];

interface SidebarNavigationProps {
  userRole?: string;
  onItemClick?: () => void;
}

export default function SidebarNavigation({ userRole = 'viewer', onItemClick }: SidebarNavigationProps) {
  const [location] = useLocation();

  const hasAccess = (item: typeof navigation[0]) => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(userRole);
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="space-y-2 px-3">
      {navigation.map((item) => {
        if (!hasAccess(item)) return null;

        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-12 px-3",
                active && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                !active && "text-gray-700 hover:bg-gray-100"
              )}
              onClick={onItemClick}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5",
                active ? "text-blue-600" : "text-gray-500"
              )} />
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{item.name}</span>
                <span className="text-xs text-gray-500 hidden lg:block">
                  {item.description}
                </span>
              </div>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}