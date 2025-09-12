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
  ProductType,
  Supplier,
  InsertSupplier,
  suppliers,
  quotes,
  InsertQuote,
  InsertQuoteItem,
  Quote,
  QuoteItem,
  quoteItems,
  QuoteStatus,
  InsertInvoicePayment,
  InvoicePayment,
  invoicePayments,
  InvoiceWithPayments,
  AccountsReceivableAlert,
  accountsReceivableAlerts,
  CustomerCreditTerms,
  customerCreditTerms,
  InsertAlert,
  InsertCustomerCreditTerms
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, sum, count, gte, lte, and, like, inArray, gt, lt, sql, avg, max, min } from "drizzle-orm";
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
  getPurchaseItems(purchaseId: number): Promise<any[]>;

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

// Supplier operations
getSuppliers(): Promise<Supplier[]>;
getSupplierById(id: number): Promise<Supplier | undefined>;
createSupplier(supplier: InsertSupplier): Promise<Supplier>;
updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
deleteSupplier(id: number): Promise<void>;
toggleSupplierStatus(id: number): Promise<Supplier>;

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
  // If supplier is provided but no supplierId, try to find matching supplier
  if (asset.supplier && !asset.supplierId) {
    const [matchingSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, asset.supplier))
      .limit(1);
    
    if (matchingSupplier) {
      asset.supplierId = matchingSupplier.id;
    }
  }

  const [newAsset] = await db.insert(assets).values(asset).returning();
  return newAsset;
}

async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
  // If supplier is provided but no supplierId, try to find matching supplier
  if (asset.supplier && !asset.supplierId) {
    const [matchingSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, asset.supplier))
      .limit(1);
    
    if (matchingSupplier) {
      asset.supplierId = matchingSupplier.id;
    }
  }

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
  supplierId?: number;
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
    // Asset fields
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
      
      // Find or create supplier if name provided
      let supplierId = purchaseData.supplierId;
      if (purchaseData.supplier && !supplierId) {
        const [existingSupplier] = await tx
          .select()
          .from(suppliers)
          .where(eq(suppliers.name, purchaseData.supplier))
          .limit(1);
        
        if (existingSupplier) {
          supplierId = existingSupplier.id;
        } else {
          // Create new supplier
          const [newSupplier] = await tx.insert(suppliers).values({
            name: purchaseData.supplier,
            isActive: true,
          }).returning();
          supplierId = newSupplier.id;
        }
      }
      
      // Create the purchase header
      const [purchase] = await tx.insert(purchases).values({
        purchaseDate: purchaseData.purchaseDate,
        supplier: purchaseData.supplier,
        supplierId,
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
                preferredSupplierId: supplierId,
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
              
              // Update existing inventory stock and preferred supplier
              const [currentItem] = await tx.select().from(inventory).where(eq(inventory.id, inventoryId));
              if (currentItem) {
                const previousStock = Number(currentItem.currentStock);
                const addedQuantity = Number(item.quantity);
                const newStock = previousStock + addedQuantity;

                await tx.update(inventory)
                  .set({ 
                    currentStock: newStock.toString(),
                    preferredSupplierId: supplierId,
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
              supplierId,
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
              supplierId,
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
  return await db.transaction(async (tx) => {
    console.log(`Storage: Deleting purchase ${id} and its items`);
    
    // First, delete all purchase items associated with this purchase
    await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    console.log(`Storage: Deleted purchase items for purchase ${id}`);
    
    // Then, delete the purchase itself
    await tx.delete(purchases).where(eq(purchases.id, id));
    console.log(`Storage: Deleted purchase ${id}`);
  });
}
async getPurchaseItems(purchaseId: number) {
  return await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId))
    .orderBy(purchaseItems.id);
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
  try {
    console.log("Storage: Creating sale with data:", saleData);
    console.log("Storage: Sale items:", itemsData);
    
    return await db.transaction(async (tx) => {
      // Generate a new sale number
      const saleNumber = await this.generateSaleNumber();
      console.log("Storage: Generated sale number:", saleNumber);

      // Create sale header
      const [sale] = await tx
        .insert(sales)
        .values({
          ...saleData,
          saleNumber,
        })
        .returning();

      console.log("Storage: Sale header created:", sale.id);

      // Create sale items and adjust inventory atomically
      for (let i = 0; i < itemsData.length; i++) {
        const itemData = itemsData[i];
        console.log(`Storage: Processing item ${i + 1}:`, itemData);
        
        try {
          // Insert sale item
          const [saleItem] = await tx.insert(saleItems).values({
            saleId: sale.id,
            inventoryId: itemData.inventoryId,
            productName: itemData.productName,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            subtotal: itemData.subtotal,
          }).returning();
          
          console.log(`Storage: Sale item ${i + 1} created:`, saleItem.id);

          // Fetch current inventory information
          const [invItem] = await tx
            .select()
            .from(inventory)
            .where(eq(inventory.id, itemData.inventoryId));

          if (!invItem) {
            throw new Error(`Producto con ID ${itemData.inventoryId} no encontrado en inventario`);
          }

          const quantityNum = Number(itemData.quantity);
          const previousStock = Number(invItem.currentStock);
          
          if (previousStock < quantityNum) {
            throw new Error(`Stock insuficiente para ${itemData.productName}. Stock disponible: ${previousStock}, solicitado: ${quantityNum}`);
          }
          
          const newStock = previousStock - quantityNum;
          
          console.log(`Storage: Updating inventory ${itemData.inventoryId}: ${previousStock} -> ${newStock}`);

          // Record stock movement
          await tx.insert(stockMovements).values({
            inventoryId: itemData.inventoryId,
            movementType: "out",
            quantity: quantityNum.toString(),
            previousStock: previousStock.toString(),
            newStock: newStock.toString(),
            reason: "Venta",
            reference: `Venta #${saleNumber}`,
            createdBy: "system",
          });

          // Update inventory stock
          await tx
            .update(inventory)
            .set({
              currentStock: newStock.toString(),
              updatedAt: new Date(),
            })
            .where(eq(inventory.id, itemData.inventoryId));
            
          console.log(`Storage: Inventory updated for item ${itemData.inventoryId}`);
            
        } catch (itemError) {
          console.error(`Storage: Error processing item ${i + 1}:`, itemError);
          throw itemError; // Re-throw to fail the entire transaction
        }
      }

      console.log("Storage: Sale creation completed successfully");
      return sale;
    });
    
  } catch (error) {
    console.error("Storage: Sale creation failed:", error);
    if (error instanceof Error) {
      throw error; // Preserve original error message
    } else {
      throw new Error('Error desconocido al crear la venta');
    }
  }
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
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Intentar consulta con timeout más corto
    const [lastSale] = await Promise.race([
      db
        .select({ saleNumber: sales.saleNumber })
        .from(sales)
        .where(like(sales.saleNumber, `V${year}${month}%`))
        .orderBy(desc(sales.saleNumber))
        .limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      )
    ]) as any[];

    let nextNumber = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `V${year}${month}${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('generateSaleNumber error:', error);
    // Fallback: usar timestamp si falla la DB
    const timestamp = Date.now().toString().slice(-6);
    return `V${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${timestamp}`;
  }
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

// Supplier operations
async getSuppliers(): Promise<Supplier[]> {
  return await db.select().from(suppliers).orderBy(suppliers.name);
}

async getSupplierById(id: number): Promise<Supplier | undefined> {
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
  return supplier;
}

async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
  const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
  return newSupplier;
}

async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
  const [updatedSupplier] = await db
    .update(suppliers)
    .set({ ...supplier, updatedAt: new Date() })
    .where(eq(suppliers.id, id))
    .returning();
  return updatedSupplier;
}

async deleteSupplier(id: number): Promise<void> {
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

async toggleSupplierStatus(id: number): Promise<Supplier> {
  const supplier = await this.getSupplierById(id);
  if (!supplier) throw new Error("Supplier not found");
  
  const [updatedSupplier] = await db
    .update(suppliers)
    .set({ 
      isActive: !supplier.isActive,
      updatedAt: new Date()
    })
    .where(eq(suppliers.id, id))
    .returning();
  return updatedSupplier;
}

// Agregar estos métodos a la clase Storage en storage.ts

  // Quote operations
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.quoteDate));
  }

  async getQuoteById(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quoteData: InsertQuote, itemsData: InsertQuoteItem[]): Promise<Quote> {
    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber();
    
    const [quote] = await db.insert(quotes).values({
      ...quoteData,
      quoteNumber
    }).returning();
    
    // Create quote items
    for (const itemData of itemsData) {
      await db.insert(quoteItems).values({
        ...itemData,
        quoteId: quote.id
      });
    }

    return quote;
  }

  async updateQuote(id: number, quoteData: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quoteData, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: number): Promise<void> {
    // Delete quote items and quote
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }

  async generateQuoteNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const [lastQuote] = await db
      .select({ quoteNumber: quotes.quoteNumber })
      .from(quotes)
      .where(like(quotes.quoteNumber, `COT${year}${month}%`))
      .orderBy(desc(quotes.quoteNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastQuote) {
      const lastNumber = parseInt(lastQuote.quoteNumber.slice(-4));
      nextNumber = lastNumber + 1;
    }

    return `COT${year}${month}${String(nextNumber).padStart(4, '0')}`;
  }

  // Convert quote to sale
  async convertQuoteToSale(quoteId: number): Promise<Sale> {
    return await db.transaction(async (tx) => {
      // Get quote data
      const [quote] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
      if (!quote) {
        throw new Error("Cotización no encontrada");
      }

      // Get quote items
      const items = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
      
      // Generate sale number
      const saleNumber = await this.generateSaleNumber();
      
      // Create sale
      const [sale] = await tx.insert(sales).values({
        saleNumber,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        saleDate: new Date(),
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        discountAmount: quote.discountAmount,
        total: quote.total,
        paymentMethod: "pending", // Se debe actualizar después
        status: "pending",
        notes: `Generada desde cotización ${quote.quoteNumber}`,
      }).returning();

      // Create sale items and adjust inventory
      for (const item of items) {
        await tx.insert(saleItems).values({
          saleId: sale.id,
          inventoryId: item.inventoryId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });

        // Adjust inventory stock (decrease)
        const quantityNum = Number(item.quantity);
        await this.adjustStock(
          item.inventoryId,
          -quantityNum,
          "Venta desde cotización",
          `Venta #${saleNumber} (Cotización #${quote.quoteNumber})`
        );
      }

      // Update quote status and link to sale
      await tx
        .update(quotes)
        .set({ 
          status: "converted", 
          saleId: sale.id,
          updatedAt: new Date() 
        })
        .where(eq(quotes.id, quoteId));

      return sale;
    });
  }

  // Update quote status
  async updateQuoteStatus(id: number, status: QuoteStatus): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ status, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  // Get quotes stats
  async getQuoteStats(): Promise<{
    totalQuotes: number;
    pendingQuotes: number;
    acceptedQuotes: number;
    convertedQuotes: number;
    totalQuoteValue: string;
  }> {
    // Total quotes
    const [totalResult] = await db
      .select({
        count: count(),
        sum: sum(quotes.total),
      })
      .from(quotes);

    // Pending quotes (sent but not responded)
    const [pendingResult] = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.status, "sent"));

    // Accepted quotes
    const [acceptedResult] = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.status, "accepted"));

    // Converted quotes
    const [convertedResult] = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.status, "converted"));

    return {
      totalQuotes: totalResult.count,
      pendingQuotes: pendingResult.count,
      acceptedQuotes: acceptedResult.count,
      convertedQuotes: convertedResult.count,
      totalQuoteValue: totalResult.sum || "0",
    };
  }

  // Check and update expired quotes
  async updateExpiredQuotes(): Promise<void> {
    const now = new Date();
    await db
      .update(quotes)
      .set({ status: "expired", updatedAt: now })
      .where(and(
        lte(quotes.validUntil, now),
        inArray(quotes.status, ["draft", "sent"])
      ));
  }


// Obtener facturas pendientes de pago
async getPendingInvoices(): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoices)
    .where(
      and(
        inArray(invoices.paymentStatus, ['pending', 'partial', 'overdue']),
        gt(invoices.balanceDue, "0")
      )
    )
    .orderBy(invoices.dueDate);
}

// Obtener facturas vencidas
async getOverdueInvoices(): Promise<Invoice[]> {
  return await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.paymentStatus, 'overdue'),
        gt(invoices.balanceDue, "0")
      )
    )
    .orderBy(invoices.dueDate);
}

// Obtener una factura con sus pagos
async getInvoiceWithPayments(invoiceId: number): Promise<InvoiceWithPayments | null> {
  const invoice = await this.getInvoiceById(invoiceId);
  if (!invoice) return null;

  const payments = await db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, invoiceId))
    .orderBy(desc(invoicePayments.paymentDate));

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId));

  return { ...invoice, payments, items };
}

// Obtener historial de pagos de una factura
async getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]> {
  return await db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, invoiceId))
    .orderBy(desc(invoicePayments.paymentDate));
}


// Métodos mejorados para storage.ts

// Registrar pago de factura con actualización automática de estado
async createInvoicePayment(paymentData: InsertInvoicePayment): Promise<InvoicePayment> {
  return await db.transaction(async (tx) => {
    // Validar que la factura existe
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, paymentData.invoiceId));

    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // Validar que el monto no exceda el saldo pendiente
    const currentBalance = Number(invoice.balanceDue || 0);
    const paymentAmount = Number(paymentData.paymentAmount);

    if (paymentAmount > currentBalance) {
      throw new Error(`El monto del pago ($${paymentAmount}) no puede ser mayor al saldo pendiente ($${currentBalance})`);
    }

    // Crear el pago
    const [payment] = await tx
      .insert(invoicePayments)
      .values(paymentData)
      .returning();

    // Calcular nuevo balance
    const newBalance = currentBalance - paymentAmount;
    
    // Determinar nuevo estado
    let newStatus: 'pending' | 'partial' | 'paid' | 'overdue';
    if (newBalance === 0) {
      newStatus = 'paid';
    } else if (newBalance < Number(invoice.total)) {
      newStatus = 'partial';
    } else {
      // Mantener estado actual si no es un pago completo
      const today = new Date();
      const dueDate = new Date(invoice.dueDate!);
      newStatus = today > dueDate ? 'overdue' : 'pending';
    }

    // Actualizar factura
    await tx
      .update(invoices)
      .set({
        balanceDue: newBalance.toString(),
        paymentStatus: newStatus,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, paymentData.invoiceId));

    return payment;
  });
}

// Actualizar estados de facturas vencidas
async updateOverdueInvoices(): Promise<number> {
  const today = new Date();
  
  const result = await db
    .update(invoices)
    .set({
      paymentStatus: 'overdue',
      updatedAt: new Date()
    })
    .where(
      and(
        lt(invoices.dueDate, today),
        inArray(invoices.paymentStatus, ['pending', 'partial']),
        gt(invoices.balanceDue, "0")
      )
    )
    .returning({ id: invoices.id });

  return result.length;
}

// Actualizar estado de pago de una factura específica
async updateInvoicePaymentStatus(invoiceId: number): Promise<void> {
  await db.transaction(async (tx) => {
    // Obtener factura actual
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // Calcular total pagado
    const paymentsResult = await tx
      .select({
        totalPaid: sum(invoicePayments.paymentAmount)
      })
      .from(invoicePayments)
      .where(eq(invoicePayments.invoiceId, invoiceId));

    const totalPaid = Number(paymentsResult[0]?.totalPaid || 0);
    const invoiceTotal = Number(invoice.total);
    const newBalance = invoiceTotal - totalPaid;

    // Determinar nuevo estado
    let newStatus: 'pending' | 'partial' | 'paid' | 'overdue';
    if (newBalance <= 0) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    } else {
      const today = new Date();
      const dueDate = new Date(invoice.dueDate!);
      newStatus = today > dueDate ? 'overdue' : 'pending';
    }

    // Actualizar factura
    await tx
      .update(invoices)
      .set({
        balanceDue: Math.max(0, newBalance).toString(),
        paymentStatus: newStatus,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));
  });
}

// Eliminar pago con actualización de estado
async deleteInvoicePayment(paymentId: number): Promise<void> {
  await db.transaction(async (tx) => {
    // Obtener información del pago
    const [payment] = await tx
      .select()
      .from(invoicePayments)
      .where(eq(invoicePayments.id, paymentId));

    if (!payment) {
      throw new Error("Pago no encontrado");
    }

    // Eliminar el pago
    await tx
      .delete(invoicePayments)
      .where(eq(invoicePayments.id, paymentId));

    // Actualizar estado de la factura
    await this.updateInvoicePaymentStatus(payment.invoiceId);
  });
}

// Crear factura a crédito (integración con ventas)
async createCreditInvoice(saleData: any, creditTerms: {
  daysToPayment: number;
  creditLimit?: number;
  interestRate?: number;
}): Promise<Invoice> {
  return await db.transaction(async (tx) => {
    // Validar límite de crédito si aplica
    if (creditTerms.creditLimit) {
      const customerBalance = await this.getCustomerTotalBalance(saleData.customerId);
      if (customerBalance + Number(saleData.total) > creditTerms.creditLimit) {
        throw new Error("Límite de crédito excedido");
      }
    }

    // Calcular fecha de vencimiento
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditTerms.daysToPayment);

    // Crear factura
    const [invoice] = await tx
      .insert(invoices)
      .values({
        ...saleData,
        saleType: 'credit',
        paymentStatus: 'pending',
        dueDate: dueDate,
        balanceDue: saleData.total,
        creditTerms: JSON.stringify(creditTerms),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return invoice;
  });
}

// Obtener balance total de un cliente
async getCustomerTotalBalance(customerId: string): Promise<number> {
  const result = await db
    .select({
      totalBalance: sum(invoices.balanceDue)
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, customerId),
        inArray(invoices.paymentStatus, ['pending', 'partial', 'overdue']),
        gt(invoices.balanceDue, "0")
      )
    );

  return Number(result[0]?.totalBalance || 0);
}

// Obtener facturas próximas a vencer (para notificaciones)
async getUpcomingDueInvoices(daysAhead: number = 7): Promise<Invoice[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return await db
    .select()
    .from(invoices)
    .where(
      and(
        gte(invoices.dueDate, today),
        lte(invoices.dueDate, futureDate),
        inArray(invoices.paymentStatus, ['pending', 'partial']),
        gt(invoices.balanceDue, "0")
      )
    )
    .orderBy(invoices.dueDate);
}

// Obtener todas las cuentas por cobrar con información detallada
async getAccountsReceivable(): Promise<any[]> {
  return await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: invoices.customerName,
      total: invoices.total,
      balanceDue: invoices.balanceDue,
      paymentStatus: invoices.paymentStatus,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      daysOverdue: sql<number>`CASE 
        WHEN ${invoices.dueDate} < CURRENT_DATE 
        THEN EXTRACT(DAY FROM CURRENT_DATE - ${invoices.dueDate})
        ELSE 0 
      END`
    })
    .from(invoices)
    .where(
      and(
        inArray(invoices.paymentStatus, ['pending', 'partial', 'overdue']),
        gt(invoices.balanceDue, "0")
      )
    )
    .orderBy(desc(invoices.dueDate));
}

// Job automático para actualizar estados (llamar desde un cron job)
async runDailyAccountsReceivableUpdate(): Promise<{
  overdueUpdated: number;
  notificationsSent: number;
}> {
  // Actualizar facturas vencidas
  const overdueCount = await this.updateOverdueInvoices();
  
  // Obtener facturas próximas a vencer para notificaciones
  const upcomingDue = await this.getUpcomingDueInvoices(3); // 3 días antes
  
  // Aquí podrías integrar un sistema de notificaciones
  // Por ejemplo, enviar emails o crear alertas en el sistema
  
  return {
    overdueUpdated: overdueCount,
    notificationsSent: upcomingDue.length
  };
}

// Estadísticas de cuentas por cobrar
async getAccountsReceivableStats(): Promise<{
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  averageDaysToPayment: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}> {
  // Total pendiente
  const [pendingResult] = await db
    .select({
      total: sum(invoices.balanceDue),
      count: count()
    })
    .from(invoices)
    .where(
      and(
        inArray(invoices.paymentStatus, ['pending', 'partial']),
        gt(invoices.balanceDue, "0")
      )
    );

  // Total vencido
  const [overdueResult] = await db
    .select({
      total: sum(invoices.balanceDue),
      count: count()
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.paymentStatus, 'overdue'),
        gt(invoices.balanceDue, "0")
      )
    );

  // Total pagado este mes
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [paidResult] = await db
    .select({
      total: sum(invoicePayments.paymentAmount)
    })
    .from(invoicePayments)
    .where(gte(invoicePayments.paymentDate, startOfMonth));

  return {
    totalPending: Number(pendingResult.total || 0),
    totalOverdue: Number(overdueResult.total || 0),
    totalPaid: Number(paidResult.total || 0),
    averageDaysToPayment: 0, // Calcular después
    pendingInvoicesCount: pendingResult.count,
    overdueInvoicesCount: overdueResult.count,
  };
}

// Reporte de antigüedad de saldos
async getAgingReport(): Promise<{
  current: number;        // 0-30 días
  days30to60: number;     // 31-60 días
  days61to90: number;     // 61-90 días
  over90days: number;     // Más de 90 días
}> {
  const today = new Date();
  const days30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days60 = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
  const days90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  const pendingInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        inArray(invoices.paymentStatus, ['pending', 'partial', 'overdue']),
        gt(invoices.balanceDue, "0")
      )
    );

  const aging = {
    current: 0,
    days30to60: 0,
    days61to90: 0,
    over90days: 0
  };

  pendingInvoices.forEach(invoice => {
    const dueDate = new Date(invoice.dueDate!);
    const balance = Number(invoice.balanceDue);

    if (dueDate >= days30) {
      aging.current += balance;
    } else if (dueDate >= days60) {
      aging.days30to60 += balance;
    } else if (dueDate >= days90) {
      aging.days61to90 += balance;
    } else {
      aging.over90days += balance;
    }
  });

  return aging;
}

async getAllCustomerCreditTerms(): Promise<CustomerCreditTerms[]> {
  const terms = await db
    .select()
    .from(customerCreditTerms)
    .orderBy(customerCreditTerms.customerName);

  // Obtener balance actual de cada cliente
  const termsWithBalance = await Promise.all(
    terms.map(async (term) => {
      const balance = await this.getCustomerTotalBalance(term.customerId);
      return { ...term, currentBalance: balance };
    })
  );

  return termsWithBalance;
}

async getCustomerCreditTerms(customerId: string): Promise<CustomerCreditTerms | null> {
  const [terms] = await db
    .select()
    .from(customerCreditTerms)
    .where(eq(customerCreditTerms.customerId, customerId));

  if (!terms) return null;

  const balance = await this.getCustomerTotalBalance(customerId);
  return { ...terms, currentBalance: balance };
}

async createCustomerCreditTerms(data: InsertCustomerCreditTerms): Promise<CustomerCreditTerms> {
  const [terms] = await db
    .insert(customerCreditTerms)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return terms;
}

async updateCustomerCreditTerms(id: number, data: Partial<CustomerCreditTerms>): Promise<CustomerCreditTerms> {
  const [terms] = await db
    .update(customerCreditTerms)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(customerCreditTerms.id, id))
    .returning();

  return terms;
}

async deleteCustomerCreditTerms(id: number): Promise<void> {
  await db
    .delete(customerCreditTerms)
    .where(eq(customerCreditTerms.id, id));
}

async createAlert(data: InsertAlert): Promise<AccountsReceivableAlert> {
  const [alert] = await db
    .insert(accountsReceivableAlerts)
    .values({
      ...data,
      createdAt: new Date()
    })
    .returning();

  return alert;
}

async getAccountsReceivableAlerts(): Promise<AccountsReceivableAlert[]> {
  return await db
    .select()
    .from(accountsReceivableAlerts)
    .where(eq(accountsReceivableAlerts.isRead, false))
    .orderBy(desc(accountsReceivableAlerts.createdAt))
    .limit(50);
}

async markAlertAsRead(alertId: number): Promise<void> {
  await db
    .update(accountsReceivableAlerts)
    .set({
      isRead: true,
      readAt: new Date()
    })
    .where(eq(accountsReceivableAlerts.id, alertId));
}

async getAccountsReceivableSummary(startDate?: Date, endDate?: Date): Promise<any> {
  const dateFilter = startDate && endDate 
    ? and(
        gte(invoices.createdAt, startDate),
        lte(invoices.createdAt, endDate)
      )
    : undefined;

  const summary = await db
    .select({
      totalInvoices: count(),
      totalAmount: sum(invoices.total),
      totalPaid: sum(sql`CASE WHEN ${invoices.paymentStatus} = 'paid' THEN ${invoices.total} ELSE 0 END`),
      totalPending: sum(sql`CASE WHEN ${invoices.paymentStatus} IN ('pending', 'partial', 'overdue') THEN ${invoices.balanceDue} ELSE 0 END`),
      avgDaysToPayment: avg(sql`EXTRACT(DAY FROM ${invoices.updatedAt} - ${invoices.createdAt})`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.saleType, 'credit'),
        dateFilter
      )
    );

  return summary[0];
}

async getAccountsReceivableByCustomer(): Promise<any[]> {
  return await db
    .select({
      customerId: invoices.customerId,
      customerName: invoices.customerName,
      totalInvoices: count(),
      totalAmount: sum(invoices.total),
      totalPending: sum(invoices.balanceDue),
      oldestInvoice: min(invoices.createdAt),
      lastPayment: max(invoicePayments.paymentDate)
    })
    .from(invoices)
    .leftJoin(invoicePayments, eq(invoices.id, invoicePayments.invoiceId))
    .where(
      and(
        eq(invoices.saleType, 'credit'),
        inArray(invoices.paymentStatus, ['pending', 'partial', 'overdue']),
        gt(invoices.balanceDue, "0")
      )
    )
    .groupBy(invoices.customerId, invoices.customerName)
    .orderBy(desc(sql`sum(${invoices.balanceDue})`));
}

// Marcar facturas vencidas (ejecutar diariamente)
async markOverdueInvoices(): Promise<number> {
  const today = new Date();
  
  const result = await db
    .update(invoices)
    .set({ paymentStatus: 'overdue' })
    .where(
      and(
        lt(invoices.dueDate, today),
        inArray(invoices.paymentStatus, ['pending', 'partial']),
        gt(invoices.balanceDue, "0")
      )
    )
    .returning({ id: invoices.id });

  return result.length;
}
}



export const storage = new DatabaseStorage();
