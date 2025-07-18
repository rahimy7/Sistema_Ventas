import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

interface EmployeeFormProps {
  onSuccess?: () => void;
}

export default function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      position: "",
      monthlySalary: "0",
      advances: "0",
      bonuses: "0",
      totalPaid: "0",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Empleado registrado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el empleado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Ej: María Pérez"
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="position">Cargo *</Label>
          <Input
            id="position"
            {...form.register("position")}
            placeholder="Ej: Técnico Mecánico"
            className="mt-1"
          />
          {form.formState.errors.position && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.position.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="monthlySalary">Sueldo Mensual *</Label>
        <Input
          id="monthlySalary"
          type="number"
          step="0.01"
          min="0"
          {...form.register("monthlySalary")}
          placeholder="0.00"
          className="mt-1"
        />
        {form.formState.errors.monthlySalary && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.monthlySalary.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="advances">Avances</Label>
          <Input
            id="advances"
            type="number"
            step="0.01"
            min="0"
            {...form.register("advances")}
            placeholder="0.00"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bonuses">Bonos</Label>
          <Input
            id="bonuses"
            type="number"
            step="0.01"
            min="0"
            {...form.register("bonuses")}
            placeholder="0.00"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="totalPaid">Total Pagado</Label>
          <Input
            id="totalPaid"
            type="number"
            step="0.01"
            min="0"
            {...form.register("totalPaid")}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Registrar Empleado"}
        </Button>
      </div>
    </form>
  );
}
