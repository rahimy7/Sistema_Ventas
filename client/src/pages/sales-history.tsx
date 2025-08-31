import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  History, 
  Search, 
  Calendar, 
  User, 
  CreditCard,
  ArrowLeft 
} from "lucide-react";
import HomeButton from "@/components/ui/home-button";
import type { Sale } from "@shared/schema";

interface SalesHistoryResponse {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SalesHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
const { data, isLoading } = useQuery<SalesHistoryResponse>({
  queryKey: ["/api/sales/history", currentPage],
  queryFn: async () => {
    const response = await apiRequest("GET", `/api/sales/history?page=${currentPage}&limit=25`);
    return await response.json();
  },
});

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completada";
      case "pending": return "Pendiente";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      case "credit": return "Crédito";
      default: return method;
    }
  };

  const filteredSales = data?.sales.filter(sale =>
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <History className="h-8 w-8 text-blue-600" />
                Historial de Ventas
              </h1>
              <p className="text-gray-600 mt-1">
                {data?.pagination.total || 0} ventas registradas en total
              </p>
            </div>
          </div>
          <HomeButton />
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por cliente o número de venta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Resultados ({filteredSales.length} de {data?.pagination.total || 0})
              </CardTitle>
              <div className="text-sm text-gray-500">
                Página {data?.pagination.page || 1} de {data?.pagination.totalPages || 1}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.saleNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            {sale.customerName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sale.status)}>
                            {getStatusText(sale.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-500" />
                            {getPaymentMethodText(sale.paymentMethod)}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ${Number(sale.total).toLocaleString('es-ES', { 
                            minimumFractionDigits: 2 
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(currentPage - 1)}
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === data.pagination.totalPages || 
                            Math.abs(page - currentPage) <= 2
                          )
                          .map(page => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={page === currentPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                        {currentPage < data.pagination.totalPages && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(currentPage + 1)}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}