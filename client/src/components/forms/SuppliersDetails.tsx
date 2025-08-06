import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type Supplier } from "@shared/schema";

interface SupplierDetailsDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (supplier: Supplier) => void;
}

export default function SupplierDetailsDialog({ 
  supplier, 
  open, 
  onOpenChange, 
  onEdit 
}: SupplierDetailsDialogProps) {
  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-orange-600" />
            Detalles del Proveedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
              {supplier.contactPerson && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <User className="h-4 w-4" />
                  {supplier.contactPerson}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={supplier.isActive ? "default" : "secondary"}
                className={`${
                  supplier.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}
              >
                {supplier.isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactivo
                  </>
                )}
              </Badge>
              <Button onClick={() => onEdit(supplier)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
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
                    <p className="text-gray-400">No especificado</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  {supplier.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <a 
                        href={`tel:${supplier.phone}`}
                        className="text-gray-900 hover:text-gray-700"
                      >
                        {supplier.phone}
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-400">No especificado</p>
                  )}
                </div>
              </div>

              {supplier.website && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Sitio Web</label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <a 
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      {supplier.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Dirección</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                    <p className="text-gray-900">{supplier.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Información Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">RFC / ID Fiscal</label>
                {supplier.taxId ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <p className="text-gray-900 font-mono">{supplier.taxId}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">No especificado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Información del Registro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-600">Fecha de Registro</label>
                  <p className="text-gray-900">
                    {supplier.createdAt 
                      ? format(new Date(supplier.createdAt), "PPP", { locale: es })
                      : "No disponible"
                    }
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Última Modificación</label>
                  <p className="text-gray-900">
                    {supplier.updatedAt 
                      ? format(new Date(supplier.updatedAt), "PPP", { locale: es })
                      : "No disponible"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}