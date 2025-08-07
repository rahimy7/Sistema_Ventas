import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAssetSchema, type Asset, type AssetStatus, type Supplier } from "@shared/schema";
import { CalendarIcon, Building, DollarSign, TrendingDown, LinkIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";

// Esquema extendido para incluir compra relacionada
const assetFormSchema = insertAssetSchema.extend({
  purchaseDate: z.date(),
  purchaseId: z.number().optional(),
  isFromPurchase: z.boolean().default(false)
});

type AssetFormData = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  asset?: Asset | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  fromPurchase?: {
    purchaseId: number;
    purchaseDate: Date;
    supplier: string;
    supplierId?: number;
    total: number;
  };
}

const ASSET_CATEGORIES = [
  "Equipos de Oficina",
  "Maquinaria",
  "Vehículos",
  "Mobiliario",
  "Equipos de Cómputo",
  "Herramientas",
  "Instalaciones",
  "Otros",
];

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "maintenance", label: "En Mantenimiento" },
  { value: "depreciated", label: "Depreciado" },
  { value: "disposed", label: "Dado de Baja" },
];

export default function AssetForm({ asset, onSuccess, onCancel, fromPurchase }: AssetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetName: "",
      category: "",
      purchaseDate: new Date(),
      purchasePrice: "0",
      currentValue: "0",
      depreciationRate: "20",
      usefulLife: 5,
      supplier: "",
      supplierId: undefined,
      serialNumber: "",
      location: "",
      status: "active",
      maintenanceSchedule: "",
      notes: "",
      isFromPurchase: false,
      purchaseId: undefined
    },
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Set initial values
  useEffect(() => {
    if (asset) {
      form.reset({
        ...asset,
        purchaseDate: new Date(asset.purchaseDate),
        isFromPurchase: false
      });
    } else if (fromPurchase) {
      form.reset({
        assetName: `Activo de Compra #${fromPurchase.purchaseId}`,
        category: "Equipos de Oficina", // Valor por defecto
        purchaseDate: fromPurchase.purchaseDate,
        purchasePrice: fromPurchase.total.toString(),
        currentValue: fromPurchase.total.toString(),
        depreciationRate: "20",
        usefulLife: 5,
        supplier: fromPurchase.supplier,
        supplierId: fromPurchase.supplierId,
        status: "active",
        notes: `Generado desde Compra #${fromPurchase.purchaseId}`,
        isFromPurchase: true,
        purchaseId: fromPurchase.purchaseId
      });
    }
  }, [asset, fromPurchase, form]);

  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const url = asset ? `/api/assets/${asset.id}` : "/api/assets";
      const method = asset ? "PUT" : "POST";
      
      // Si viene de compra, usar endpoint especial
      if (data.isFromPurchase && data.purchaseId) {
        return await apiRequest("POST", `/api/compras/${data.purchaseId}/convertir-a-activo`, {
          nombre: data.assetName,
          categoria: data.category,
          ubicacion: data.location,
          numeroSerie: data.serialNumber
        });
      }
      
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      if (fromPurchase) {
        queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
      }
      toast({
        title: asset ? "Activo actualizado" : "Activo creado",
        description: asset ? "El activo ha sido actualizado correctamente." : 
          fromPurchase ? "El activo ha sido creado desde la compra exitosamente." : 
          "El activo ha sido registrado exitosamente.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || `No se pudo ${asset ? "actualizar" : "crear"} el activo.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssetFormData) => {
    // Si hay proveedor seleccionado, actualizar datos
    const selectedSupplier = suppliers.find(s => s.id === data.supplierId);
    if (selectedSupplier) {
      data.supplier = selectedSupplier.name;
    }

    // Para nuevos activos no vinculados a compra, igualar valor actual
    if (!asset && !fromPurchase) {
      data.currentValue = data.purchasePrice;
    }

    createAssetMutation.mutate(data);
  };

  const activeSuppliers = suppliers.filter(s => s.isActive);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con información de origen */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {asset ? "Editar Activo" : fromPurchase ? "Crear Activo desde Compra" : "Nuevo Activo"}
          </h2>
          {fromPurchase && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <LinkIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Vinculado a Compra #{fromPurchase.purchaseId}
              </span>
            </div>
          )}
        </div>

        {/* Sección de Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Activo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre descriptivo del activo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Serie/Placa</FormLabel>
                  <FormControl>
                    <Input placeholder="Identificador único" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación Física *</FormLabel>
                  <FormControl>
                    <Input placeholder="Edificio, piso, área, etc." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección de Origen/Compra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Información de Origen
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Adquisición *</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select 
  onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
  value={field.value?.toString() || "none"}
  disabled={fromPurchase !== undefined}
>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor específico</SelectItem>
                      {activeSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor de Adquisición *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      disabled={fromPurchase !== undefined}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (!asset && !fromPurchase) {
                          form.setValue("currentValue", e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!fromPurchase && (
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Actual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Sección de Depreciación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Configuración de Depreciación
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <FormField
  control={form.control}
  name="depreciationRate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tasa de Depreciación Anual (%) *</FormLabel>
      <FormControl>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder="20"
          {...field}
          // Convertir posibles valores null/undefined a string vacío
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

            <FormField
  control={form.control}
  name="usefulLife"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Vida Útil (años) *</FormLabel>
      <FormControl>
        <Input
          type="number"
          min="1"
          max="100"
          placeholder="5"
          {...field}
          // Convertir número a string y manejar null/undefined
          value={field.value?.toString() ?? ""}
          onChange={(e) => {
            // Convertir string vacío a undefined y otros valores a número
            const value = e.target.value;
            field.onChange(value === "" ? undefined : parseInt(value));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
          </CardContent>
        </Card>

        {/* Sección de Mantenimiento */}
        <Card>
          <CardHeader>
            <CardTitle>Mantenimiento y Observaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="maintenanceSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa de Mantenimiento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Mantenimiento cada 6 meses, revisión anual..."
                      {...field}
                      value={field.value || ""}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones, condiciones especiales, etc."
                      {...field}
                      value={field.value || ""}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Campos ocultos para compra */}
        {fromPurchase && (
          <>
            <input type="hidden" {...form.register("isFromPurchase")} />
            <input type="hidden" {...form.register("purchaseId")} />
          </>
        )}

        {/* Acciones del Formulario */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createAssetMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createAssetMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createAssetMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {asset ? "Actualizando..." : "Creando..."}
                </>
) : (
<>
{asset ? "Actualizar Activo" : fromPurchase ? "Crear desde Compra" : "Registrar Activo"}
</>
)}
</Button>
</div>
</form>
</Form>
);
}