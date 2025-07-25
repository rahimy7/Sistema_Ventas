import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type UserRole } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Lock } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <Alert className="m-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Acceso Restringido</AlertTitle>
        <AlertDescription>
          Debes iniciar sesión para acceder a esta página.
        </AlertDescription>
      </Alert>
    );
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <Alert className="m-4" variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos suficientes para acceder a esta página.
          {user && (
            <div className="mt-2 text-sm">
              Tu rol actual: <strong>{getRoleDisplayName(user.role as UserRole)}</strong>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    admin: "Administrador",
    sales: "Ventas", 
    viewer: "Visor"
  };
  return roleNames[role] || role;
}