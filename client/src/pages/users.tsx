import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import UserForm from "@/components/forms/user-form";
import HomeButton from "@/components/ui/home-button";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX,
  Shield,
  Eye,
  ShoppingCart,
  Settings as SettingsIcon
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type User, type UserRole } from "@shared/schema";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatus = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/users/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el estado del usuario.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePassword = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => 
      apiRequest("PUT", `/api/users/${id}/password`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña del usuario ha sido actualizada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar la contraseña.",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user: User) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin": return "Administrador";
      case "sales": return "Ventas";
      case "viewer": return "Visor";
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin": return <SettingsIcon className="h-3 w-3" />;
      case "sales": return <ShoppingCart className="h-3 w-3" />;
      case "viewer": return <Eye className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin": return "default";
      case "sales": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteUser.mutate(id);
  };

  const handleToggleStatus = (id: number) => {
    toggleUserStatus.mutate(id);
  };

  const handlePasswordChange = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const submitPasswordChange = () => {
    if (selectedUser && newPassword.length >= 6) {
      updatePassword.mutate({ id: selectedUser.id, password: newPassword });
    }
  };

  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    salesUsers: users.filter(u => u.role === 'sales').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Gestión de Usuarios
            </h1>
            <p className="mt-2 text-gray-600">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <HomeButton />
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setEditingUser(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                  </DialogTitle>
                </DialogHeader>
                <UserForm
                  user={editingUser}
                  onSuccess={closeForm}
                  onCancel={closeForm}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {userStats.totalUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuarios Activos
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userStats.activeUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Con acceso al sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Administradores
              </CardTitle>
              <SettingsIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {userStats.adminUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Acceso completo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuarios de Ventas
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {userStats.salesUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gestión de ventas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buscar Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, usuario o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de Usuarios ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando usuarios...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Users className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay usuarios registrados</p>
                <p className="text-sm">
                  {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza creando tu primer usuario"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.username}</p>
                              {user.id === currentUser?.id && (
                                <p className="text-xs text-blue-600">(Tú)</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getRoleBadgeVariant(user.role as UserRole)}
                            className="inline-flex items-center gap-1"
                          >
                            {getRoleIcon(user.role as UserRole)}
                            {getRoleLabel(user.role as UserRole)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.isActive ? "default" : "secondary"}
                            className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {user.isActive ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? (
                            <div className="text-sm">
                              <p>{format(new Date(user.lastLogin), "dd/MM/yyyy", { locale: es })}</p>
                              <p className="text-gray-500">{format(new Date(user.lastLogin), "HH:mm")}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>
                              {user.createdAt
                                ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: es })
                                : <span className="text-gray-400">Desconocido</span>
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePasswordChange(user)}
                              title="Cambiar contraseña"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Key className="h-4 w-4" />
                            </Button>

                            {user.id !== currentUser?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(user.id)}
                                  title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
                                  className={user.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                                >
                                  {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700"
                                      title="Eliminar usuario"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        ¿Eliminar usuario?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. El usuario "{user.fullName}" será eliminado permanentemente del sistema.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(user.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
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

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Cambiar Contraseña
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedUser && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Usuario:</p>
                  <p className="font-medium">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nueva Contraseña *
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-sm text-red-600">
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    setNewPassword("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitPasswordChange}
                  disabled={newPassword.length < 6 || updatePassword.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updatePassword.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    "Cambiar Contraseña"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}