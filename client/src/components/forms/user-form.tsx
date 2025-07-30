import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, type User, type InsertUser, type UserRole } from "@shared/schema";
import { Eye, EyeOff, User as UserIcon, Mail, Lock, Shield } from "lucide-react";

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      fullName: user?.fullName || "",
      role: user?.role || "viewer",
      isActive: user?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const method = user ? "PUT" : "POST";
      const url = user ? `/api/users/${user.id}` : "/api/users";
      
      // Don't send password if it's empty for updates
      if (user && !data.password) {
        const { password, ...dataWithoutPassword } = data;
        return await apiRequest(method, url, dataWithoutPassword);
      }
      
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: user ? "Usuario actualizado" : "Usuario creado",
        description: user 
          ? "El usuario ha sido actualizado exitosamente." 
          : "El nuevo usuario ha sido creado exitosamente.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || `No se pudo ${user ? "actualizar" : "crear"} el usuario.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    mutation.mutate(data);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin": return "Administrador";
      case "sales": return "Ventas";
      case "viewer": return "Visor";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h2>
          <p className="text-sm text-gray-600">
            {user ? "Modifica los datos del usuario" : "Completa la información del nuevo usuario"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Nombre de Usuario *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="usuario123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Nombre Completo *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Contraseña {user ? "(dejar vacío para mantener actual)" : "*"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={user ? "••••••••" : "Contraseña segura"}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rol *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">{getRoleLabel("admin")}</SelectItem>
                      <SelectItem value="sales">{getRoleLabel("sales")}</SelectItem>
                      <SelectItem value="viewer">{getRoleLabel("viewer")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario Activo</FormLabel>
                    <div className="text-sm text-gray-600">
                      El usuario puede acceder al sistema
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {user ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                user ? "Actualizar Usuario" : "Crear Usuario"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}