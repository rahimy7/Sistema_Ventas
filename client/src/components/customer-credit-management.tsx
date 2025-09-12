// customer-credit-management.tsx - Componente para gestionar términos de crédito

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface CustomerCreditTerms {
  id: number;
  customerId: string;
  customerName: string;
  creditLimit: number;
  paymentTermsDays: number;
  interestRate: number;
  isActive: boolean;
  currentBalance?: number;
  notes?: string;
  createdAt: string;
}

function CustomerCreditManagement() {
  const [creditTerms, setCreditTerms] = useState<CustomerCreditTerms[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTerm, setEditingTerm] = useState<CustomerCreditTerms | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCreditTerms();
  }, []);

  const fetchCreditTerms = async () => {
    try {
      const response = await fetch('/api/customer-credit-terms');
      if (response.ok) {
        const data = await response.json();
        setCreditTerms(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los términos de crédito",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCreditTerms = async (data: Partial<CustomerCreditTerms>) => {
    try {
      const url = editingTerm 
        ? `/api/customer-credit-terms/${editingTerm.id}`
        : '/api/customer-credit-terms';
      
      const method = editingTerm ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingTerm 
            ? "Términos de crédito actualizados"
            : "Términos de crédito creados"
        });
        fetchCreditTerms();
        setIsDialogOpen(false);
        setEditingTerm(null);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los términos de crédito",
        variant: "destructive"
      });
    }
  };

  const deleteCreditTerms = async (id: number) => {
    try {
      const response = await fetch(`/api/customer-credit-terms/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Términos de crédito eliminados"
        });
        fetchCreditTerms();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los términos de crédito",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getAvailableCredit = (term: CustomerCreditTerms) => {
    return term.creditLimit - (term.currentBalance || 0);
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Términos de Crédito
          </h1>
          <p className="text-gray-600 mt-2">Gestión de límites y condiciones de crédito por cliente</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTerm(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Término
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTerm ? 'Editar Términos de Crédito' : 'Nuevos Términos de Crédito'}
              </DialogTitle>
            </DialogHeader>
            <CreditTermsForm 
              initialData={editingTerm}
              onSave={saveCreditTerms}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes con Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {creditTerms.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(creditTerms.reduce((sum, t) => sum + (t.isActive ? t.creditLimit : 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Autorizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Utilizado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(creditTerms.reduce((sum, t) => sum + (t.currentBalance || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">En uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(creditTerms.reduce((sum, t) => sum + getAvailableCredit(t), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Para usar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Términos de Crédito */}
      <Card>
        <CardHeader>
          <CardTitle>Términos de Crédito por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Límite de Crédito</TableHead>
                <TableHead>Saldo Actual</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead>Términos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditTerms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{term.customerName}</div>
                      <div className="text-sm text-gray-500">{term.customerId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(term.creditLimit)}
                  </TableCell>
                  <TableCell>
                    <span className={term.currentBalance && term.currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {formatCurrency(term.currentBalance || 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(getAvailableCredit(term))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{term.paymentTermsDays} días</span>
                      {term.interestRate > 0 && (
                        <Badge variant="outline">{term.interestRate}%</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={term.isActive ? 'default' : 'secondary'}>
                      {term.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTerm(term);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCreditTerms(term.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Formulario para crear/editar términos de crédito
function CreditTermsForm({ 
  initialData, 
  onSave, 
  onCancel 
}: {
  initialData?: CustomerCreditTerms | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    customerId: initialData?.customerId || '',
    customerName: initialData?.customerName || '',
    creditLimit: initialData?.creditLimit || 0,
    paymentTermsDays: initialData?.paymentTermsDays || 30,
    interestRate: initialData?.interestRate || 0,
    isActive: initialData?.isActive ?? true,
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerId">ID del Cliente</Label>
          <Input
            id="customerId"
            value={formData.customerId}
            onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerName">Nombre del Cliente</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="creditLimit">Límite de Crédito</Label>
          <Input
            id="creditLimit"
            type="number"
            step="0.01"
            value={formData.creditLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentTermsDays">Días de Pago</Label>
          <Input
            id="paymentTermsDays"
            type="number"
            value={formData.paymentTermsDays}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsDays: parseInt(e.target.value) || 30 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="interestRate">Tasa de Interés (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.1"
            value={formData.interestRate}
            onChange={(e) => setFormData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Términos activos</Label>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notas adicionales sobre los términos de crédito..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Actualizar' : 'Crear'} Términos
        </Button>
      </div>
    </form>
  );
}

export default CustomerCreditManagement;