import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuoteForm from "@/components/forms/quote-form";
import QuotePDFDialog from "@/components/quote-pdf-dialog";
import HomeButton from "@/components/ui/home-button";
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  Check, 
  X, 
  ShoppingCart,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Types (estos deberían importarse desde @shared/schema)
type Quote = {
  id: number;
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  quoteDate: Date;
  validUntil: Date;
  subtotal: string;
  taxRate?: string;
  taxAmount?: string;
  discountAmount?: string;
  total: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  notes?: string;
  terms?: string;
  saleId?: number;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteItem = {
  id: number;
  quoteId: number;
  inventoryId: number;
  productName: string;
  description?: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  createdAt: Date;
};

type QuoteWithItems = Quote & {
  items?: QuoteItem[];
};

export default function QuotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithItems | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");

  // Cargar cotizaciones
  const { data: quotes = [], isLoading: quotesLoading } = useQuery<QuoteWithItems[]>({
    queryKey: ["/api/quotes"],
  });

  // Cargar items de la cotización seleccionada
  const { data: selectedQuoteItems = [] } = useQuery<QuoteItem[]>({
    queryKey: ["/api/quotes", selectedQuote?.id, "items"],
    enabled: !!selectedQuote,
  });

  // Estadísticas de cotizaciones
  const { data: quoteStats } = useQuery<{
    totalQuotes: number;
    pendingQuotes: number;
    acceptedQuotes: number;
    convertedQuotes: number;
    totalQuoteValue: string;
  }>({
    queryKey: ["/api/quotes/stats"],
  });

  // Mutación para convertir cotización a venta
  const convertToSaleMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      return await apiRequest("POST", `/api/quotes/${quoteId}/convert-to-sale`);
    },
    onSuccess: () => {
      toast({
        title: "Cotización convertida",
        description: "La cotización se ha convertido exitosamente en una venta.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      setSelectedQuote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al convertir la cotización",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar estado de cotización
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/quotes/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la cotización se ha actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el estado",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar cotización
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Cotización eliminada",
        description: "La cotización se ha eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setSelectedQuote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cotización",
        variant: "destructive",
      });
    },
  });

  // Filtrar cotizaciones por estado
  const filteredQuotes = quotes.filter(quote => {
    if (selectedTab === "all") return true;
    if (selectedTab === "pending") return ["draft", "sent"].includes(quote.status);
    if (selectedTab === "active") return ["accepted"].includes(quote.status);
    if (selectedTab === "completed") return ["converted"].includes(quote.status);
    if (selectedTab === "expired") return ["expired", "rejected"].includes(quote.status);
    return quote.status === selectedTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-orange-100 text-orange-800";
      case "converted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Borrador";
      case "sent": return "Enviada";
      case "accepted": return "Aceptada";
      case "rejected": return "Rechazada";
      case "expired": return "Expirada";
      case "converted": return "Convertida";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Edit className="h-4 w-4" />;
      case "sent": return <Send className="h-4 w-4" />;
      case "accepted": return <Check className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      case "expired": return <Clock className="h-4 w-4" />;
      case "converted": return <ShoppingCart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isExpired = (validUntil: Date) => {
    return new Date() > new Date(validUntil);
  };

  const canConvertToSale = (quote: Quote) => {
    return quote.status === "accepted" && !isExpired(quote.validUntil);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Cotizaciones
            </h1>
            <p className="text-gray-600 mt-2">Gestiona cotizaciones y conviértelas en ventas</p>
          </div>
          <div className="flex items-center space-x-3">
            <HomeButton />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cotización
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Nueva Cotización</DialogTitle>
                  <DialogDescription>
                    Ingrese los detalles para crear una nueva cotización
                  </DialogDescription>
                </DialogHeader>
                <QuoteForm
                  onSuccess={() => setDialogOpen(false)}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cotizaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quoteStats?.totalQuotes || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {quoteStats?.pendingQuotes || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Convertidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {quoteStats?.convertedQuotes || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Number(quoteStats?.totalQuoteValue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de cotizaciones */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Cotizaciones
                </CardTitle>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="active">Activas</TabsTrigger>
                    <TabsTrigger value="completed">Completadas</TabsTrigger>
                    <TabsTrigger value="expired">Expiradas</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {quotesLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-gray-500">Cargando cotizaciones...</div>
                    </div>
                  ) : filteredQuotes.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-gray-500">No hay cotizaciones para mostrar</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedQuote?.id === quote.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                          onClick={() => setSelectedQuote(quote)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(quote.status)}
                              <span className="font-semibold text-gray-900">
                                {quote.quoteNumber}
                              </span>
                              <Badge className={getStatusColor(quote.status)}>
                                {getStatusText(quote.status)}
                              </Badge>
                              {isExpired(quote.validUntil) && quote.status === "sent" && (
                                <Badge variant="destructive">Expirada</Badge>
                              )}
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              ${Number(quote.total).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{quote.customerName}</span>
                            <span>
                              Válida hasta: {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: es })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detalles de cotización seleccionada */}
          <div>
            {selectedQuote ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      {selectedQuote.quoteNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedQuote.status)}>
                        {getStatusText(selectedQuote.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información del cliente */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{selectedQuote.customerName}</p>
                      {selectedQuote.customerEmail && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedQuote.customerEmail}
                        </p>
                      )}
                      {selectedQuote.customerPhone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedQuote.customerPhone}
                        </p>
                      )}
                      {selectedQuote.customerAddress && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedQuote.customerAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fechas
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Fecha: {format(new Date(selectedQuote.quoteDate), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                      <p className={isExpired(selectedQuote.validUntil) ? "text-red-600 font-medium" : ""}>
                        Válida hasta: {format(new Date(selectedQuote.validUntil), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Totales
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${Number(selectedQuote.subtotal).toLocaleString()}</span>
                      </div>
                      {selectedQuote.discountAmount && Number(selectedQuote.discountAmount) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuento:</span>
                          <span>-${Number(selectedQuote.discountAmount).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedQuote.taxAmount && Number(selectedQuote.taxAmount) > 0 && (
                        <div className="flex justify-between">
                          <span>Impuestos ({selectedQuote.taxRate}%):</span>
                          <span>${Number(selectedQuote.taxAmount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span className="text-green-600">${Number(selectedQuote.total).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  {selectedQuoteItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Productos ({selectedQuoteItems.length})
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {selectedQuoteItems.map((item) => (
                            <div key={item.id} className="text-sm border rounded p-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{item.productName}</p>
                                  {item.description && (
                                    <p className="text-gray-600 text-xs">{item.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${Number(item.subtotal).toLocaleString()}</p>
                                  <p className="text-gray-600 text-xs">
                                    {Number(item.quantity)} × ${Number(item.unitPrice).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Notas */}
                  {selectedQuote.notes && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Notas</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {selectedQuote.notes}
                      </p>
                    </div>
                  )}

                  {/* Términos */}
                  {selectedQuote.terms && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Términos y Condiciones</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {selectedQuote.terms}
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex flex-col gap-2">
                      {/* Convertir a venta */}
                      {canConvertToSale(selectedQuote) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Convertir a Venta
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Convertir cotización a venta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción creará una nueva venta basada en esta cotización. 
                                Los productos se descontarán del inventario y la cotización se marcará como convertida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => convertToSaleMutation.mutate(selectedQuote.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Convertir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {/* Acciones de estado */}
                      {selectedQuote.status === "draft" && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => updateStatusMutation.mutate({ id: selectedQuote.id, status: "sent" })}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Marcar como Enviada
                        </Button>
                      )}

                      {selectedQuote.status === "sent" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatusMutation.mutate({ id: selectedQuote.id, status: "accepted" })}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aceptar
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatusMutation.mutate({ id: selectedQuote.id, status: "rejected" })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {/* Imprimir/Exportar */}
                      <QuotePDFDialog quote={selectedQuote}>
                        <Button variant="outline" className="w-full">
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir Cotización
                        </Button>
                      </QuotePDFDialog>

                      {/* Editar (solo si es borrador) */}
                      {selectedQuote.status === "draft" && (
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Cotización
                        </Button>
                      )}

                      {/* Eliminar */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full border-red-200 hover:bg-red-50 text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la cotización 
                              {selectedQuote.quoteNumber} y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteQuoteMutation.mutate(selectedQuote.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Selecciona una cotización</p>
                    <p className="text-sm">
                      Haz clic en una cotización de la lista para ver sus detalles y realizar acciones.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}