import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import HomeButton from "@/components/ui/home-button";
import AssetForm from "@/components/AssetForm";
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingDown, 
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Wrench,
  XCircle,
  BarChart3,
  Building,
  Eye,
  FileText,
  Archive,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Supplier, type Asset, type AssetStatus } from "@shared/schema";

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assets
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });


  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Activo eliminado",
        description: "El activo ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el activo.",
        variant: "destructive",
      });
    },
  });

  // Update asset status mutation
  const updateAssetStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AssetStatus }) => 
      apiRequest("PUT", `/api/assets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del activo ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    },
  });

  // Get unique categories
  const categories = Array.from(new Set(assets.map(asset => asset.category)));

  // Filter assets
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate statistics
  const assetStats = {
    totalAssets: assets.length,
    totalPurchaseValue: assets.reduce((sum, asset) => sum + Number(asset.purchasePrice), 0),
    totalCurrentValue: assets.reduce((sum, asset) => sum + Number(asset.currentValue), 0),
    totalDepreciation: assets.reduce((sum, asset) => sum + (Number(asset.purchasePrice) - Number(asset.currentValue)), 0),
    activeAssets: assets.filter(a => a.status === 'active').length,
    depreciatedAssets: assets.filter(a => a.status === 'depreciated').length,
    maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
    disposedAssets: assets.filter(a => a.status === 'disposed').length,
    averageAge: assets.length > 0 ? assets.reduce((sum, asset) => {
      const age = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return sum + age;
    }, 0) / assets.length : 0,
  };

  const getStatusLabel = (status: AssetStatus) => {
    switch (status) {
      case "active": return "Activo";
      case "depreciated": return "Depreciado";
      case "disposed": return "Dado de Baja";
      case "maintenance": return "Mantenimiento";
      default: return status;
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case "active": return <CheckCircle className="h-3 w-3" />;
      case "depreciated": return <TrendingDown className="h-3 w-3" />;
      case "disposed": return <XCircle className="h-3 w-3" />;
      case "maintenance": return <Wrench className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusVariant = (status: AssetStatus) => {
    switch (status) {
      case "active": return "default";
      case "depreciated": return "secondary";
      case "disposed": return "destructive";
      case "maintenance": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-50";
      case "depreciated": return "text-yellow-600 bg-yellow-50";
      case "disposed": return "text-red-600 bg-red-50";
      case "maintenance": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const calculateDepreciation = (asset: Asset) => {
    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    const depreciationRate = Number(asset.depreciationRate) || 0;
    const purchasePrice = Number(asset.purchasePrice);
    const currentValue = Number(asset.currentValue);
    
    const calculatedDepreciation = Math.min(purchasePrice * (depreciationRate / 100) * yearsElapsed, purchasePrice);
    const calculatedCurrentValue = Math.max(purchasePrice - calculatedDepreciation, 0);
    
    return {
      yearsElapsed: Math.round(yearsElapsed * 10) / 10,
      totalDepreciation: purchasePrice - currentValue,
      calculatedDepreciation,
      currentValue,
      calculatedCurrentValue,
      depreciationPercent: ((purchasePrice - currentValue) / purchasePrice) * 100,
      annualDepreciation: purchasePrice * (depreciationRate / 100),
    };
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteAsset.mutate(id);
  };

  const handleStatusChange = (id: number, status: AssetStatus) => {
    updateAssetStatus.mutate({ id, status });
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedAsset(null);
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
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Activos</h1>
                <p className="text-slate-600 mt-1">Control completo de activos, equipos y bienes de la empresa</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <HomeButton />
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                    onClick={() => setEditingAsset(null)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Activo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      {editingAsset ? "Editar Activo" : "Registrar Nuevo Activo"}
                    </DialogTitle>
                  </DialogHeader>
                  <AssetForm
                    asset={editingAsset}
                    onSuccess={closeForm}
                    onCancel={closeForm}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">Total Activos</p>
                  <p className="text-3xl font-bold text-blue-900">{assetStats.totalAssets}</p>
                  <p className="text-sm text-blue-600">Registrados</p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Building className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-700 font-medium">Valor Actual</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    ${assetStats.totalCurrentValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-emerald-600">Total patrimonio</p>
                </div>
                <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-amber-700 font-medium">Depreciación Total</p>
                  <p className="text-3xl font-bold text-amber-900">
                    ${assetStats.totalDepreciation.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-amber-600">Pérdida de valor</p>
                </div>
                <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-700 font-medium">Edad Promedio</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {assetStats.averageAge.toFixed(1)} años
                  </p>
                  <p className="text-sm text-purple-600">De antigüedad</p>
                </div>
                <div className="h-14 w-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{assetStats.activeAssets}</p>
              <p className="text-sm text-gray-600">Activos</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Wrench className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{assetStats.maintenanceAssets}</p>
              <p className="text-sm text-gray-600">Mantenimiento</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{assetStats.depreciatedAssets}</p>
              <p className="text-sm text-gray-600">Depreciados</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Archive className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{assetStats.disposedAssets}</p>
              <p className="text-sm text-gray-600">Dados de Baja</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabbed Content */}
        <Tabs defaultValue="list" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-slate-100">
                <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Lista de Activos
                </TabsTrigger>
                <TabsTrigger value="depreciation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análisis Financiero
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Reportes
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="p-0 m-0">
              <div className="p-6 space-y-6">
                {/* Enhanced Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar activos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      
                      <Select value={statusFilter} onValueChange={(value: AssetStatus | "all") => setStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="active">Activos</SelectItem>
                          <SelectItem value="maintenance">En mantenimiento</SelectItem>
                          <SelectItem value="depreciated">Depreciados</SelectItem>
                          <SelectItem value="disposed">Dados de baja</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Assets Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Activos Registrados ({filteredAssets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredAssets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Settings className="h-16 w-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No hay activos registrados</p>
                        <p className="text-sm">
                          {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                            ? "No se encontraron resultados para los filtros aplicados" 
                            : "Comienza registrando tu primer activo"}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-200">
                              <TableHead className="font-semibold text-slate-900">Activo</TableHead>
                              <TableHead className="font-semibold text-slate-900">Categoría</TableHead>
                              <TableHead className="font-semibold text-slate-900">Estado</TableHead>
                              <TableHead className="text-center font-semibold text-slate-900">Antigüedad</TableHead>
                              <TableHead className="text-right font-semibold text-slate-900">Valor Original</TableHead>
                              <TableHead className="text-right font-semibold text-slate-900">Valor Actual</TableHead>
                              <TableHead className="text-center font-semibold text-slate-900">Depreciación</TableHead>
                              <TableHead className="font-semibold text-slate-900">Ubicación</TableHead>
                              <TableHead className="text-center font-semibold text-slate-900">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAssets.map((asset: Asset) => {
                              const depreciation = calculateDepreciation(asset);
                              
                              return (
                                <TableRow key={asset.id} className="border-slate-200 hover:bg-slate-50">
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="font-medium text-slate-900">{asset.assetName}</p>
                                      {asset.serialNumber && (
                                        <p className="text-xs text-slate-500">S/N: {asset.serialNumber}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-medium">
                                      {asset.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={`inline-flex items-center gap-1 font-medium ${getStatusColor(asset.status)}`}
                                    >
                                      {getStatusIcon(asset.status)}
                                      {getStatusLabel(asset.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="space-y-1">
                                      <p className="font-medium">{depreciation.yearsElapsed} años</p>
                                      <p className="text-xs text-slate-500">
                                        {format(new Date(asset.purchaseDate), "MMM yyyy", { locale: es })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${Number(asset.purchasePrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="space-y-1">
                                      <p className="font-medium text-slate-900">
                                        ${depreciation.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="space-y-1">
                                      <p className="font-bold text-red-600">
                                        -{depreciation.depreciationPercent.toFixed(1)}%
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        ${depreciation.totalDepreciation.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                      <MapPin className="h-3 w-3" />
                                      {asset.location || "No especificada"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(asset)}
                                        title="Ver detalles"
                                        className="hover:bg-blue-50"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(asset)}
                                        title="Editar activo"
                                        className="hover:bg-green-50"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="Eliminar activo"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              ¿Eliminar activo?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción no se puede deshacer. El activo "{asset.assetName}" será eliminado permanentemente del sistema.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDelete(asset.id)}
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
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="depreciation" className="p-0 m-0">
              <div className="p-6 space-y-6">
                {/* Financial Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Resumen Financiero
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Valor Original Total</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ${assetStats.totalPurchaseValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Valor Actual Total</p>
                          <p className="text-2xl font-bold text-green-900">
                            ${assetStats.totalCurrentValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Depreciación Total</p>
                          <p className="text-2xl font-bold text-red-900">
                            ${assetStats.totalDepreciation.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">% Depreciación</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {assetStats.totalPurchaseValue > 0 
                              ? ((assetStats.totalDepreciation / assetStats.totalPurchaseValue) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Retención de Valor</span>
                          <span className="font-medium">
                            {assetStats.totalPurchaseValue > 0 
                              ? ((assetStats.totalCurrentValue / assetStats.totalPurchaseValue) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${assetStats.totalPurchaseValue > 0 
                                ? (assetStats.totalCurrentValue / assetStats.totalPurchaseValue) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        Análisis por Categoría
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const categoryStats = categories.map(category => {
                          const categoryAssets = assets.filter(asset => asset.category === category);
                          const totalOriginal = categoryAssets.reduce((sum, asset) => sum + Number(asset.purchasePrice), 0);
                          const totalCurrent = categoryAssets.reduce((sum, asset) => sum + Number(asset.currentValue), 0);
                          const depreciation = totalOriginal - totalCurrent;
                          
                          return {
                            category,
                            count: categoryAssets.length,
                            totalOriginal,
                            totalCurrent,
                            depreciation,
                            depreciationPercent: totalOriginal > 0 ? (depreciation / totalOriginal) * 100 : 0,
                          };
                        });

                        return (
                          <div className="space-y-4">
                            {categoryStats.map(stat => (
                              <div key={stat.category} className="p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="font-medium text-gray-900">{stat.category}</h3>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{stat.count} activos</Badge>
                                    <span className="text-sm font-medium text-red-600">
                                      -{stat.depreciationPercent.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                  <div>
                                    <p className="text-gray-600">Original:</p>
                                    <p className="font-medium">${stat.totalOriginal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Actual:</p>
                                    <p className="font-medium">${stat.totalCurrent.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Pérdida:</p>
                                    <p className="font-medium text-red-600">${stat.depreciation.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(100 - stat.depreciationPercent, 5)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Depreciation Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                      Análisis Detallado de Depreciación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assets.map(asset => {
                        const depreciation = calculateDepreciation(asset);
                        
                        return (
                          <div key={asset.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{asset.assetName}</h3>
                                <p className="text-sm text-gray-600">{asset.category} • {asset.location}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(asset.status)}>
                                  {getStatusLabel(asset.status)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <p className="text-gray-600">Compra:</p>
                                <p className="font-medium">${Number(asset.purchasePrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-500">{format(new Date(asset.purchaseDate), "dd/MM/yyyy")}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Valor Actual:</p>
                                <p className="font-medium">${depreciation.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-500">{depreciation.yearsElapsed} años</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Depreciación:</p>
                                <p className="font-medium text-red-600">-${depreciation.totalDepreciation.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-500">{Number(asset.depreciationRate)}% anual</p>
                              </div>
                              <div>
                                <p className="text-gray-600">% Perdido:</p>
                                <p className="font-medium text-red-600">{depreciation.depreciationPercent.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">del valor original</p>
                              </div>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Valor retenido</span>
                                <span>{(100 - depreciation.depreciationPercent).toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-red-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    depreciation.depreciationPercent < 25 ? 'bg-green-500' :
                                    depreciation.depreciationPercent < 50 ? 'bg-yellow-500' :
                                    depreciation.depreciationPercent < 75 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.max(100 - depreciation.depreciationPercent, 2)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="p-0 m-0">
              <div className="p-6 space-y-6">
                {/* Reports Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-blue-100">
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Inventario de Activos</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Listado completo de todos los activos con sus características y valores</p>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generar Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-purple-100">
                          <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Análisis Financiero</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Reporte detallado de valores, depreciación y análisis por categoría</p>
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generar Análisis
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-orange-100">
                          <Calendar className="h-8 w-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Cronograma de Mantenimiento</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Programación de mantenimientos preventivos y correctivos</p>
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver Cronograma
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-green-100">
                          <Activity className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Movimientos de Activos</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Historial de cambios de ubicación, estado y mantenimientos</p>
                      <Button variant="outline" className="w-full">
                        <Activity className="h-4 w-4 mr-2" />
                        Ver Historial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-red-100">
                          <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Alertas y Notificaciones</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Activos que requieren atención inmediata o próximo mantenimiento</p>
                      <Button variant="outline" className="w-full">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Ver Alertas
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-yellow-100">
                          <Archive className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Reporte de Bajas</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Activos dados de baja, razones y documentación de disposición</p>
                      <Button variant="outline" className="w-full">
                        <Archive className="h-4 w-4 mr-2" />
                        Generar Reporte
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats for Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="p-4 bg-blue-50 rounded-lg mb-2">
                          <p className="text-3xl font-bold text-blue-600">{assets.filter(a => new Date(a.purchaseDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length}</p>
                        </div>
                        <p className="text-sm text-gray-600">Activos adquiridos este año</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="p-4 bg-orange-50 rounded-lg mb-2">
                          <p className="text-3xl font-bold text-orange-600">
                            {assets.filter(a => a.maintenanceSchedule && a.status !== 'disposed').length}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">Con programa de mantenimiento</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="p-4 bg-red-50 rounded-lg mb-2">
                          <p className="text-3xl font-bold text-red-600">
                            {assets.filter(a => {
                              const depreciation = calculateDepreciation(a);
                              return depreciation.depreciationPercent > 75;
                            }).length}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">Altamente depreciados (&gt;75%)</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="p-4 bg-green-50 rounded-lg mb-2">
                          <p className="text-3xl font-bold text-green-600">
                            ${(assetStats.totalCurrentValue / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">Valor total del patrimonio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Asset Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Detalles del Activo
              </DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedAsset.assetName}</span>
                      <Badge className={getStatusColor(selectedAsset.status)}>
                        {getStatusIcon(selectedAsset.status)}
                        {getStatusLabel(selectedAsset.status)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Categoría:</p>
                        <p className="text-gray-900">{selectedAsset.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Proveedor:</p>
                        <p className="text-gray-900">{selectedAsset.supplier || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Número de Serie:</p>
                        <p className="text-gray-900">{selectedAsset.serialNumber || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Ubicación:</p>
                        <p className="text-gray-900">{selectedAsset.location || "No especificada"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Fecha de Compra:</p>
                        <p className="text-gray-900">{format(new Date(selectedAsset.purchaseDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Vida Útil:</p>
                        <p className="text-gray-900">{selectedAsset.usefulLife || "No especificada"} años</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Información Financiera
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const depreciation = calculateDepreciation(selectedAsset);
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Precio Original</p>
                              <p className="text-2xl font-bold text-blue-900">
                                ${Number(selectedAsset.purchasePrice).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Valor Actual</p>
                              <p className="text-2xl font-bold text-green-900">
                                ${depreciation.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Depreciación</p>
                              <p className="text-2xl font-bold text-red-900">
                                ${depreciation.totalDepreciation.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-medium">Tasa de Depreciación Anual:</p>
                              <p className="text-gray-900">{Number(selectedAsset.depreciationRate)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">Años Transcurridos:</p>
                              <p className="text-gray-900">{depreciation.yearsElapsed} años</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">Porcentaje Depreciado:</p>
                              <p className="text-red-600 font-bold">{depreciation.depreciationPercent.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">Depreciación Anual:</p>
                              <p className="text-gray-900">${depreciation.annualDepreciation.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>

                          {/* Depreciation Timeline */}
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">Progreso de Depreciación</p>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${Math.min(depreciation.depreciationPercent, 100)}%` }}
                              >
                                <span className="text-white text-xs font-medium">
                                  {depreciation.depreciationPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Maintenance and Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      Mantenimiento y Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Programa de Mantenimiento:</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {selectedAsset.maintenanceSchedule || "No se ha definido un programa de mantenimiento"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Notas y Observaciones:</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                        {selectedAsset.notes || "No hay observaciones adicionales registradas"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={closeDetail}>
                    Cerrar
                  </Button>
                  <Button onClick={() => {
                    closeDetail();
                    handleEdit(selectedAsset);
                  }} className="bg-purple-600 hover:bg-purple-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Activo
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}