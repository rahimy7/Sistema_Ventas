import {
  incomes,
  expenses,
  purchases,
  inventory,
  employees,
  payrollRecords,
  invoices,
  invoiceItems,
  type Income,
  type InsertIncome,
  type Expense,
  type InsertExpense,
  type Purchase,
  type InsertPurchase,
  type InventoryItem,
  type InsertInventoryItem,
  type Employee,
  type InsertEmployee,
  type PayrollRecord,
  type InsertPayrollRecord,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type InvoiceWithItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, count, gte, lte, and, like } from "drizzle-orm";

export interface IStorage {
  // Income operations
  getIncomes(): Promise<Income[]>;
  getIncomeById(id: number): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income>;
  deleteIncome(id: number): Promise<void>;
  getIncomesByDateRange(startDate: Date, endDate: Date): Promise<Income[]>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getExpensesByCategory(): Promise<{ category: string; total: number }[]>;

  // Purchase operations
  getPurchases(): Promise<Purchase[]>;
  getPurchaseById(id: number): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase>;
  deletePurchase(id: number): Promise<void>;

  // Inventory operations
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;
  adjustStock(id: number, adjustment: number): Promise<InventoryItem>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Payroll operations
  getPayrollRecords(): Promise<PayrollRecord[]>;
  getPayrollRecordsByEmployee(employeeId: number): Promise<PayrollRecord[]>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<InvoiceWithItems | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<InvoiceWithItems>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
  generateInvoiceNumber(): Promise<string>;

  // Dashboard analytics
  getDashboardStats(): Promise<{
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    stockItems: number;
    totalEmployees: number;
    totalInvoices: number;
    pendingInvoices: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Income operations
  async getIncomes(): Promise<Income[]> {
    return await db.select().from(incomes).orderBy(desc(incomes.date));
  }

  async getIncomeById(id: number): Promise<Income | undefined> {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, id));
    return income;
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const [newIncome] = await db.insert(incomes).values(income).returning();
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income> {
    const [updatedIncome] = await db
      .update(incomes)
      .set(income)
      .where(eq(incomes.id, id))
      .returning();
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<void> {
    await db.delete(incomes).where(eq(incomes.id, id));
  }

  async getIncomesByDateRange(startDate: Date, endDate: Date): Promise<Income[]> {
    return await db
      .select()
      .from(incomes)
      .where(and(gte(incomes.date, startDate), lte(incomes.date, endDate)))
      .orderBy(desc(incomes.date));
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpensesByCategory(): Promise<{ category: string; total: number }[]> {
    const result = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .groupBy(expenses.category);
    
    return result.map(r => ({ category: r.category, total: Number(r.total) || 0 }));
  }

  // Purchase operations
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.date));
  }

  async getPurchaseById(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase> {
    const [updatedPurchase] = await db
      .update(purchases)
      .set(purchase)
      .where(eq(purchases.id, id))
      .returning();
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
  }

  // Inventory operations
  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventory).orderBy(inventory.productName);
  }

  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventory).values({
      ...item,
      currentStock: item.initialStock,
    }).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventory)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async adjustStock(id: number, adjustment: number): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);
    if (!item) throw new Error("Inventory item not found");

    const newStock = Number(item.currentStock) + adjustment;
    const [updatedItem] = await db
      .update(inventory)
      .set({ 
        currentStock: newStock.toString(),
        updatedAt: new Date()
      })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, true));
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
  }

  // Payroll operations
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    return await db.select().from(payrollRecords).orderBy(desc(payrollRecords.payDate));
  }

  async getPayrollRecordsByEmployee(employeeId: number): Promise<PayrollRecord[]> {
    return await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.employeeId, employeeId))
      .orderBy(desc(payrollRecords.payDate));
  }

  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [newRecord] = await db.insert(payrollRecords).values(record).returning();
    return newRecord;
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.issueDate));
  }

  async getInvoiceById(id: number): Promise<InvoiceWithItems | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    return { ...invoice, items };
  }

  async createInvoice(invoiceData: InsertInvoice, itemsData: InsertInvoiceItem[]): Promise<InvoiceWithItems> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    
    const items = await db.insert(invoiceItems).values(
      itemsData.map(item => ({ ...item, invoiceId: invoice.id }))
    ).returning();

    return { ...invoice, items };
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const [lastInvoice] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(like(invoices.invoiceNumber, `${year}-${month}-%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `${year}-${month}-${String(nextNumber).padStart(3, '0')}`;
  }

  // Dashboard analytics
  async getDashboardStats(): Promise<{
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    stockItems: number;
    totalEmployees: number;
    totalInvoices: number;
    pendingInvoices: number;
  }> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Monthly revenue
    const revenueResult = await db
      .select({ total: sum(incomes.total) })
      .from(incomes)
      .where(and(gte(incomes.date, startOfMonth), lte(incomes.date, endOfMonth)));

    // Monthly expenses
    const expenseResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(gte(expenses.date, startOfMonth), lte(expenses.date, endOfMonth)));

    // Stock items count
    const stockResult = await db
      .select({ count: count() })
      .from(inventory);

    // Active employees count
    const employeeResult = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.isActive, true));

    // Total invoices count
    const invoicesResult = await db
      .select({ count: count() })
      .from(invoices);

    // Pending invoices count  
    const pendingInvoicesResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.status, "pending"));

    const monthlyRevenue = Number(revenueResult[0]?.total) || 0;
    const monthlyExpenses = Number(expenseResult[0]?.total) || 0;

    return {
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      stockItems: stockResult[0]?.count || 0,
      totalEmployees: employeeResult[0]?.count || 0,
      totalInvoices: invoicesResult[0]?.count || 0,
      pendingInvoices: pendingInvoicesResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
