import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SupplierForm from "@/components/forms/SuplierForm";
import SupplierDetailsDialog from "@/components/forms/SuppliersDetails";
import HomeButton from "@/components/ui/home-button";
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  TrendingUp,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Supplier } from "@shared/schema";
import { useLocation } from "wouter";





export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const location = useLocation()[0];

useEffect(() => {
  const params = new URLSearchParams(location.split("?")[1]);
  if (params.get("nuevo") === "1") {
    setIsFormOpen(true);
    setEditingSupplier(null);
  }
}, [location]);

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Delete supplier mutation
  const deleteSupplier = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el proveedor.",
        variant: "destructive",
      });
    },
  });

  // Toggle supplier status mutation
  const toggleSupplierStatus = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/suppliers/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del proveedor ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el estado del proveedor.",
        variant: "destructive",
      });
    },
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const supplierStats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.isActive).length,
    inactiveSuppliers: suppliers.filter(s => !s.isActive).length,
    withEmail: suppliers.filter(s => s.email).length,
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSupplier.mutate(id);
  };

  const handleToggleStatus = (id: number) => {
    toggleSupplierStatus.mutate(id);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedSupplier(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Proveedores</h1>
                <p className="text-slate-600 mt-1">Administra tu directorio de proveedores y contactos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <HomeButton />
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg"
                    onClick={() => setEditingSupplier(null)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      {editingSupplier ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
                    </DialogTitle>
                    <DialogDescription>
                      Ingrese la información del proveedor
                    </DialogDescription>
                  </DialogHeader>
                  <SupplierForm
                    supplier={editingSupplier}
                    onSuccess={closeForm}
                    onCancel={closeForm}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-orange-700 font-medium">Total Proveedores</p>
                  <p className="text-3xl font-bold text-orange-900">{supplierStats.totalSuppliers}</p>
                  <p className="text-sm text-orange-600">Registrados</p>
                </div>
                <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <Building className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-green-700 font-medium">Activos</p>
                  <p className="text-3xl font-bold text-green-900">{supplierStats.activeSuppliers}</p>
                  <p className="text-sm text-green-600">Disponibles</p>
                </div>
                <div className="h-14 w-14 bg-green-500 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">Con Email</p>
                  <p className="text-3xl font-bold text-blue-900">{supplierStats.withEmail}</p>
                  <p className="text-sm text-blue-600">Contacto digital</p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Mail className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-red-700 font-medium">Inactivos</p>
                  <p className="text-3xl font-bold text-red-900">{supplierStats.inactiveSuppliers}</p>
                  <p className="text-sm text-red-600">Suspendidos</p>
                </div>
                <div className="h-14 w-14 bg-red-500 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buscar Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de Proveedores ({filteredSuppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Building className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay proveedores registrados</p>
                <p className="text-sm">
                  {searchTerm 
                    ? "No se encontraron resultados para tu búsqueda" 
                    : "Comienza registrando tu primer proveedor"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200">
                      <TableHead className="font-semibold text-slate-900">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-900">Contacto</TableHead>
                      <TableHead className="font-semibold text-slate-900">Email</TableHead>
                      <TableHead className="font-semibold text-slate-900">Teléfono</TableHead>
                      <TableHead className="font-semibold text-slate-900">Ubicación</TableHead>
                      <TableHead className="text-center font-semibold text-slate-900">Estado</TableHead>
                      <TableHead className="text-center font-semibold text-slate-900">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier: Supplier) => (
                      <TableRow key={supplier.id} className="border-slate-200 hover:bg-slate-50">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{supplier.name}</p>
                            {supplier.taxId && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                RFC: {supplier.taxId}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.contactPerson ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-slate-900">{supplier.contactPerson}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No especificado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <a 
                                href={`mailto:${supplier.email}`}
                                className="text-blue-600 hover:text-blue-700 underline"
                              >
                                {supplier.email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400">No especificado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <a 
                                href={`tel:${supplier.phone}`}
                                className="text-slate-900 hover:text-slate-700"
                              >
                                {supplier.phone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400">No especificado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.address ? (
                            <div className="flex items-center gap-2 max-w-48">
                              <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              <span className="text-slate-600 text-sm truncate" title={supplier.address}>
                                {supplier.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No especificada</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={supplier.isActive ? "default" : "secondary"}
                            className={`inline-flex items-center gap-1 font-medium ${
                              supplier.isActive 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {supplier.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(supplier)}
                              title="Ver detalles"
                              className="hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(supplier)}
                              title="Editar proveedor"
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(supplier.id)}
                              title={supplier.isActive ? "Desactivar proveedor" : "Activar proveedor"}
                              className={supplier.isActive ? "hover:bg-orange-50" : "hover:bg-green-50"}
                            >
                              {supplier.isActive ? (
                                <XCircle className="h-4 w-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar proveedor"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar proveedor?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El proveedor "{supplier.name}" será eliminado permanentemente del sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(supplier.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Details Dialog */}
        <SupplierDetailsDialog
          supplier={selectedSupplier}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onEdit={(supplier: { address: string | null; id: number; name: string; contactPerson: string | null; email: string | null; phone: string | null; website: string | null; taxId: string | null; notes: string | null; isActive: boolean | null; createdAt: Date | null; updatedAt: Date | null; }) => {
            closeDetail();
            handleEdit(supplier);
          }}
        />

        {/* Additional Information */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building className="h-3 w-3 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Gestión de Proveedores</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Mantén actualizada la información de tus proveedores para facilitar las compras y mejorar la comunicación. 
                  Los proveedores inactivos no aparecerán en las listas de selección al registrar compras.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function setIsFormOpen(arg0: boolean) {
  throw new Error("Function not implemented.");
}
function setEditingSupplier(arg0: null) {
  throw new Error("Function not implemented.");
}

