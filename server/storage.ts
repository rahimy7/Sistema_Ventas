import {
  users,
  incomes,
  expenses,
  purchases,
  purchaseItems,
  inventory,
  employees,
  payrollRecords,
  invoices,
  invoiceItems,
  stockMovements,
  sales,
  saleItems,
  companySettings,
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
  type StockMovement,
  type InsertStockMovement,
  type InventoryItemWithMovements,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type CompanySettings,
  type InsertCompanySettings,
  type User,
  type InsertUser,
  type LoginCredentials,
  type UserRole,
  assets,
  Asset,
  InsertAsset,
  AssetStatus,
  ProductType
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, sum, count, gte, lte, and, like } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
  adjustStock(id: number, adjustment: number, reason: string, reference?: string): Promise<InventoryItem>;
  
  // Stock movement operations
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByInventory(inventoryId: number): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getInventoryItemWithMovements(id: number): Promise<InventoryItemWithMovements | undefined>;

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

  // Sales operations
  getSales(): Promise<Sale[]>;
  getSaleById(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: number): Promise<void>;
  getSaleItems(saleId: number): Promise<SaleItem[]>;

  // Company settings operations
  getCompanySettings(): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(id: number, settings: Partial<InsertCompanySettings>): Promise<CompanySettings>;
  generateSaleNumber(): Promise<string>;

  getUsers(): Promise<User[]>;
updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
deleteUser(id: number): Promise<void>;
updateUserPassword(id: number, password: string): Promise<void>;
toggleUserStatus(id: number): Promise<User>;

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

  // User authentication
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(credentials: LoginCredentials): Promise<User | null>;
  updateUserLastLogin(id: number): Promise<void>;
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
    return await db.select().from(purchases).orderBy(desc(purchases.purchaseDate));
  }

  async getPurchaseById(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async getAssets(): Promise<Asset[]> {
  return await db.select().from(assets).orderBy(desc(assets.purchaseDate));
}

async getAssetById(id: number): Promise<Asset | undefined> {
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  return asset;
}

async createAsset(asset: InsertAsset): Promise<Asset> {
  const [newAsset] = await db.insert(assets).values(asset).returning();
  return newAsset;
}

async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
  const [updatedAsset] = await db
    .update(assets)
    .set({ ...asset, updatedAt: new Date() })
    .where(eq(assets.id, id))
    .returning();
  return updatedAsset;
}

async deleteAsset(id: number): Promise<void> {
  await db.delete(assets).where(eq(assets.id, id));
}

async updateAssetStatus(id: number, status: AssetStatus): Promise<Asset> {
  const [updatedAsset] = await db
    .update(assets)
    .set({ status, updatedAt: new Date() })
    .where(eq(assets.id, id))
    .returning();
  return updatedAsset;
}

// Enhanced purchase creation with product types - ACTUALIZADO

async createEnhancedPurchase(purchaseData: {
  purchaseDate: Date;
  supplier: string;
  totalAmount: string;
  paymentMethod: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    product: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    totalAmount: string;
    category: string;
    productType: ProductType;
    inventoryId?: number;
    isNewProduct: boolean;
    salePrice?: string;
    reorderPoint?: string;
    // Campos para activos
    usefulLife?: string;
    depreciationRate?: string;
    serialNumber?: string;
    location?: string;
  }>;
}): Promise<Purchase> {
  console.log("Storage: Creating enhanced purchase:", purchaseData);
  
  try {
    return await db.transaction(async (tx) => {
      console.log("Storage: Starting transaction");
      
      // Create the purchase header
      const [purchase] = await tx.insert(purchases).values({
        purchaseDate: purchaseData.purchaseDate,
        supplier: purchaseData.supplier,
        totalAmount: purchaseData.totalAmount,
        paymentMethod: purchaseData.paymentMethod,
        invoiceNumber: purchaseData.invoiceNumber,
        notes: purchaseData.notes,
      }).returning();

      console.log("Storage: Purchase header created:", purchase.id);

      // Process each item based on product type
      for (let index = 0; index < purchaseData.items.length; index++) {
        const item = purchaseData.items[index];
        console.log(`Storage: Processing item ${index + 1}:`, item.product, item.productType);
        
        let inventoryId = item.inventoryId;
        let assetId: number | undefined = undefined;

        try {
          if (item.productType === 'inventory') {
            // Handle inventory products (for sale)
            if (item.isNewProduct) {
              console.log("Storage: Creating new inventory item");
              
              // Create new inventory item
              const [newInventoryItem] = await tx.insert(inventory).values({
                productName: item.product,
                unit: item.unit,
                purchasePrice: item.unitPrice,
                salePrice: item.salePrice || item.unitPrice,
                initialStock: item.quantity,
                currentStock: item.quantity,
                reorderPoint: item.reorderPoint || "0",
              }).returning();
              
              inventoryId = newInventoryItem.id;
              console.log("Storage: New inventory item created:", inventoryId);

              // Log initial stock movement
              await tx.insert(stockMovements).values({
                inventoryId: newInventoryItem.id,
                movementType: "in",
                quantity: item.quantity,
                previousStock: "0",
                newStock: item.quantity,
                reason: "Compra inicial - producto nuevo",
                reference: `Compra #${purchase.id}`,
                createdBy: "system",
              });
              
            } else if (inventoryId) {
              console.log("Storage: Updating existing inventory");
              
              // Update existing inventory stock
              const [currentItem] = await tx.select().from(inventory).where(eq(inventory.id, inventoryId));
              if (currentItem) {
                const previousStock = Number(currentItem.currentStock);
                const addedQuantity = Number(item.quantity);
                const newStock = previousStock + addedQuantity;

                await tx.update(inventory)
                  .set({ 
                    currentStock: newStock.toString(),
                    updatedAt: new Date(),
                  })
                  .where(eq(inventory.id, inventoryId));

                // Log stock movement
                await tx.insert(stockMovements).values({
                  inventoryId,
                  movementType: "in",
                  quantity: item.quantity,
                  previousStock: previousStock.toString(),
                  newStock: newStock.toString(),
                  reason: "Compra de inventario",
                  reference: `Compra #${purchase.id}`,
                  createdBy: "system",
                });
              }
            }
            
          } else if (item.productType === 'asset') {
            console.log("Storage: Creating new asset");
            
            // Handle assets
            const [newAsset] = await tx.insert(assets).values({
              assetName: item.product,
              category: item.category,
              purchaseDate: purchaseData.purchaseDate,
              purchasePrice: item.unitPrice,
              currentValue: item.unitPrice, // Initially same as purchase price
              depreciationRate: item.depreciationRate || "20",
              usefulLife: item.usefulLife ? parseInt(item.usefulLife) : 5,
              supplier: purchaseData.supplier,
              serialNumber: item.serialNumber,
              location: item.location,
              status: 'active',
              notes: `Adquirido mediante compra #${purchase.id}`,
            }).returning();
            
            assetId = newAsset.id;
            console.log("Storage: New asset created:", assetId);
            
          } else if (item.productType === 'supply') {
            console.log("Storage: Creating expense for supply");
            
            // Handle supplies (create expense record)
            await tx.insert(expenses).values({
              date: purchaseData.purchaseDate,
              category: `Insumos - ${item.category}`,
              description: `${item.product} - ${item.quantity} ${item.unit}`,
              amount: item.totalAmount,
              paymentMethod: purchaseData.paymentMethod,
              receipt: `Compra #${purchase.id}`,
            });
          }

          // Create purchase item record
          console.log("Storage: Creating purchase item record");
          await tx.insert(purchaseItems).values({
            purchaseId: purchase.id,
            product: item.product,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            category: item.category,
            productType: item.productType,
            inventoryId,
            assetId,
          });
          
        } catch (itemError) {
          console.error(`Storage: Error processing item ${index + 1}:`, itemError);
          throw new Error(`Error procesando el producto "${item.product}": ${itemError instanceof Error ? itemError.message : 'Error desconocido'}`);
        }
      }

      console.log("Storage: Transaction completed successfully");
      return purchase;
    });
    
  } catch (error) {
    console.error("Storage: Enhanced purchase creation failed:", error);
    
    if (error instanceof Error) {
      throw new Error(`Error en la creación de compra: ${error.message}`);
    } else {
      throw new Error("Error desconocido al crear la compra en la base de datos");
    }
  }
}

  async updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase> {
    const [updatedPurchase] = await db
      .update(purchases)
      .set({ ...purchase, updatedAt: new Date() })
      .where(eq(purchases.id, id))
      .returning();
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
  }

  async getPurchaseStats(): Promise<{
    totalPurchases: number;
    totalAmount: string;
    monthlyPurchases: number;
    monthlyAmount: string;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total purchases
    const [totalResult] = await db
      .select({
        count: count(),
        sum: sum(purchases.totalAmount),
      })
      .from(purchases);

    // Monthly purchases
    const [monthlyResult] = await db
      .select({
        count: count(),
        sum: sum(purchases.totalAmount),
      })
      .from(purchases)
      .where(and(
        gte(purchases.purchaseDate, startOfMonth),
        lte(purchases.purchaseDate, endOfMonth)
      ));

    return {
      totalPurchases: totalResult.count,
      totalAmount: totalResult.sum || "0",
      monthlyPurchases: monthlyResult.count,
      monthlyAmount: monthlyResult.sum || "0",
    };
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

  async adjustStock(id: number, adjustment: number, reason: string, reference?: string): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);
    if (!item) throw new Error("Inventory item not found");

    const previousStock = Number(item.currentStock);
    const newStock = previousStock + adjustment;
    
    // Create stock movement record
    const movementType = adjustment > 0 ? "in" : adjustment < 0 ? "out" : "adjustment";
    await db.insert(stockMovements).values({
      inventoryId: id,
      movementType,
      quantity: Math.abs(adjustment).toString(),
      previousStock: previousStock.toString(),
      newStock: newStock.toString(),
      reason,
      reference,
      createdBy: "system"
    });

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

  // Stock movement operations
  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
  }

  async getStockMovementsByInventory(inventoryId: number): Promise<StockMovement[]> {
    return await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.inventoryId, inventoryId))
      .orderBy(desc(stockMovements.createdAt));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async getInventoryItemWithMovements(id: number): Promise<InventoryItemWithMovements | undefined> {
    const item = await this.getInventoryItemById(id);
    if (!item) return undefined;

    const movements = await this.getStockMovementsByInventory(id);
    return { ...item, stockMovements: movements };
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

  // Sales operations
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.saleDate));
  }

  async getSaleById(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async createSale(saleData: InsertSale, itemsData: InsertSaleItem[]): Promise<Sale> {
    // Generate sale number
    const saleNumber = await this.generateSaleNumber();
    
    const [sale] = await db.insert(sales).values({
      ...saleData,
      saleNumber
    }).returning();
    
    // Create sale items and adjust inventory
    for (const itemData of itemsData) {
      await db.insert(saleItems).values({
        ...itemData,
        saleId: sale.id
      });

      // Adjust inventory stock (decrease)
      const quantityNum = Number(itemData.quantity);
      await this.adjustStock(
        itemData.inventoryId,
        -quantityNum,
        "Venta",
        `Venta #${saleNumber}`
      );
    }

    return sale;
  }

  async updateSale(id: number, saleData: Partial<InsertSale>): Promise<Sale> {
    const [updatedSale] = await db
      .update(sales)
      .set({ ...saleData, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    return updatedSale;
  }

  async deleteSale(id: number): Promise<void> {
    // Get sale items first to restore inventory
    const items = await this.getSaleItems(id);
    const sale = await this.getSaleById(id);
    
    if (sale) {
      // Restore inventory for each item
      for (const item of items) {
        const quantityNum = Number(item.quantity);
        await this.adjustStock(
          item.inventoryId,
          quantityNum,
          "Cancelación de venta",
          `Cancelación venta #${sale.saleNumber}`
        );
      }
    }
    
    // Delete sale items and sale
    await db.delete(saleItems).where(eq(saleItems.saleId, id));
    await db.delete(sales).where(eq(sales.id, id));
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async generateSaleNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const [lastSale] = await db
      .select({ saleNumber: sales.saleNumber })
      .from(sales)
      .where(like(sales.saleNumber, `V${year}${month}%`))
      .orderBy(desc(sales.saleNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `V${year}${month}${String(nextNumber).padStart(4, '0')}`;
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

  // Company settings operations
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const [newSettings] = await db.insert(companySettings).values(settings).returning();
    return newSettings;
  }

  async updateCompanySettings(id: number, settings: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const [updatedSettings] = await db
      .update(companySettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(companySettings.id, id))
      .returning();
    return updatedSettings;
  }

  // User authentication operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return newUser;
  }

  async authenticateUser(credentials: LoginCredentials): Promise<User | null> {
    const user = await this.getUserByUsername(credentials.username);
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await this.updateUserLastLogin(user.id);
    
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(users.fullName);
}

async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
  const updateData: any = { ...userData, updatedAt: new Date() };
  
  // Hash password if provided
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
}

async deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

async updateUserPassword(id: number, password: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(password, 10);
  await db
    .update(users)
    .set({ 
      password: hashedPassword,
      updatedAt: new Date()
    })
    .where(eq(users.id, id));
}

async toggleUserStatus(id: number): Promise<User> {
  const user = await this.getUserById(id);
  if (!user) throw new Error("User not found");
  
  const [updatedUser] = await db
    .update(users)
    .set({ 
      isActive: !user.isActive,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
}
}

export const storage = new DatabaseStorage();
