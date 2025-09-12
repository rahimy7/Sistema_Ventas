import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";  
import { LoginForm } from "@/components/auth/login-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard-simple";
import InventoryPage from "@/pages/inventory";
import SalesPage from "@/pages/sales";
import PurchasesPage from "@/pages/purchases";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import AssetsPage from "@/pages/AssetsPage"; // Importar la página de activos
import NotFound from "@/pages/not-found";
import SuppliersPage from "@/pages/SuppliersPage";
import SalesHistoryPage from "@/pages/sales-history";
import AccountsReceivablePage from "@/pages/accounts-receivable";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventario">
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        </Route>
        <Route path="/ventas">
          <ProtectedRoute requiredRoles={['admin', 'sales']}>
            <SalesPage />
          </ProtectedRoute>
        </Route>
   <Route path="/ventas/historial">
  <ProtectedRoute requiredRoles={['admin', 'sales']}>
    <SalesHistoryPage />
  </ProtectedRoute>
</Route>
<Route path="/compras">
          <ProtectedRoute requiredRoles={['admin']}>
            <PurchasesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/cuentas-por-cobrar">
          <ProtectedRoute requiredRoles={['admin','sales']}>
            <AccountsReceivablePage />
          </ProtectedRoute>
        </Route>
        <Route path="/activos">
          <ProtectedRoute requiredRoles={['admin']}>
            <AssetsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/proveedores">
  <ProtectedRoute requiredRoles={['admin']}>
    <SuppliersPage />
  </ProtectedRoute>
</Route>
        <Route path="/reportes">
          <ProtectedRoute requiredRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/usuarios">
          <ProtectedRoute requiredRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/configuracion">
          <ProtectedRoute requiredRoles={['admin']}>
            <SettingsPage />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;