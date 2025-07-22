import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySettingsSchema, type CompanySettings, type InsertCompanySettings } from "@shared/schema";
import HomeButton from "@/components/ui/home-button";
import { Settings, Building, Mail, Phone, Globe, FileText, Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Obtener configuración actual de la empresa
  const { data: companySettings, isLoading: settingsLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const form = useForm<InsertCompanySettings>({
    resolver: zodResolver(insertCompanySettingsSchema),
    defaultValues: {
      name: companySettings?.name || "",
      address: companySettings?.address || "",
      phone: companySettings?.phone || "",
      email: companySettings?.email || "",
      website: companySettings?.website || "",
      taxId: companySettings?.taxId || "",
      logo: companySettings?.logo || "",
    },
  });

  // Actualizar valores del formulario cuando se cargan los datos
  React.useEffect(() => {
    if (companySettings) {
      form.reset({
        name: companySettings.name,
        address: companySettings.address,
        phone: companySettings.phone,
        email: companySettings.email,
        website: companySettings.website || "",
        taxId: companySettings.taxId || "",
        logo: companySettings.logo || "",
      });
    }
  }, [companySettings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: InsertCompanySettings) => {
      if (companySettings?.id) {
        return await apiRequest("PUT", `/api/company-settings/${companySettings.id}`, data);
      } else {
        return await apiRequest("POST", "/api/company-settings", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Los datos de la empresa se han actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompanySettings) => {
    saveSettingsMutation.mutate(data);
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="space-y-6 p-4">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Configuración
            </h1>
            <p className="text-gray-600 mt-2">Ajustes generales de la empresa</p>
          </div>
          <HomeButton />
        </div>

        {/* Formulario de configuración */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Información de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Nombre de la Empresa *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Mi Empresa S.A." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          RFC / ID Fiscal
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="ABC123456789" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+52 123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email *
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contacto@miempresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Sitio Web
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.miempresa.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección Completa *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Calle, número, colonia, ciudad, estado, código postal"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botón de guardar */}
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={saveSettingsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="shadow-lg border-0 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings className="h-3 w-3 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Información importante</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Esta información se utilizará automáticamente en todas las facturas y documentos comerciales que genere el sistema.
                  Los campos marcados con * son obligatorios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}