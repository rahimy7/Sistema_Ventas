import { useQuery } from "@tanstack/react-query";
import type { 
  Income, 
  Expense, 
  Purchase, 
  InventoryItem, 
  Employee,
  Invoice 
} from "@shared/schema";

export function useBusinessData() {
  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: incomes, isLoading: isIncomesLoading } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
  });

  const { data: expenses, isLoading: isExpensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: purchases, isLoading: isPurchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: inventory, isLoading: isInventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: employees, isLoading: isEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: invoices, isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: expenseCategories, isLoading: isCategoriesLoading } = useQuery<{ category: string; total: number }[]>({
    queryKey: ["/api/expenses/categories"],
  });

  const isLoading = 
    isStatsLoading || 
    isIncomesLoading || 
    isExpensesLoading || 
    isPurchasesLoading || 
    isInventoryLoading || 
    isEmployeesLoading ||
    isInvoicesLoading ||
    isCategoriesLoading;

  return {
    dashboardStats,
    incomes,
    expenses,
    purchases,
    inventory,
    employees,
    invoices,
    expenseCategories,
    isLoading,
  };
}
