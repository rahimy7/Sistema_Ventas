import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { loginSchema, type User, type LoginCredentials, insertUserSchema, insertAssetSchema } from "../shared/schema.js";
import {
  insertIncomeSchema,
  insertExpenseSchema,
  insertPurchaseSchema,
  insertInventorySchema,
  insertEmployeeSchema,
  insertPayrollRecordSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertStockMovementSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertCompanySettingsSchema,
} from "../shared/schema.js";
import { z } from "zod";

// Extend Express session to include user
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

// Middleware for authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware for role-based access
function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure sessions with memory store for development, PostgreSQL for production
  let sessionStore: session.Store | undefined;

  if (process.env.NODE_ENV === 'production') {
    const PgSession = ConnectPgSimple(session);
    sessionStore = new PgSession({
      pool: pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    });
  }

  const sessionConfig: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production' && !process.env.VERCEL,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  };

  app.use(session(sessionConfig));

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(credentials);

      if (!user) {
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      req.session.user = user;
      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Error en el login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.session.user) {
      res.json({
        id: req.session.user.id,
        username: req.session.user.username,
        fullName: req.session.user.fullName,
        role: req.session.user.role
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Dashboard routes with proper error handling - requires authentication
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      if (error instanceof Error && (error.message.includes('connection') || error.message.includes('timeout'))) {
        res.status(503).json({ message: "Database connection error. Please try again." });
      } else {
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    }
  });

  // Income routes - admin/sales can manage
  app.get("/api/incomes", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const incomes = await storage.getIncomes();
      res.json(incomes);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      res.status(500).json({ message: "Failed to fetch incomes" });
    }
  });

  app.get("/api/incomes/:id", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const income = await storage.getIncomeById(id);
      if (!income) {
        return res.status(404).json({ message: "Income not found" });
      }
      res.json(income);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.post("/api/incomes", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const data = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(data);
      res.status(201).json(income);
    } catch (error) {
      console.error("Error creating income:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create income" });
    }
  });

  app.put("/api/incomes/:id", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertIncomeSchema.partial().parse(req.body);
      const income = await storage.updateIncome(id, data);
      res.json(income);
    } catch (error) {
      console.error("Error updating income:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update income" });
    }
  });

  app.delete("/api/incomes/:id", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIncome(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting income:", error);
      res.status(500).json({ message: "Failed to delete income" });
    }
  });

  // Expense routes - admin only for modification, all can view
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getExpensesByCategory();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  app.post("/api/expenses", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, data);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Purchase routes - admin only
  app.get("/api/purchases", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/purchases/stats", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const stats = await storage.getPurchaseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching purchase stats:", error);
      res.status(500).json({ message: "Failed to fetch purchase statistics" });
    }
  });

  app.post("/api/purchases", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { purchaseDate, ...purchaseData } = req.body;
      
      // Convert purchaseDate string to Date if necessary
      const processedData = {
        ...purchaseData,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      };

      // Validate purchase data
      const validatedPurchase = insertPurchaseSchema.parse(processedData);
      
      const purchase = await storage.createPurchase(validatedPurchase);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.put("/api/purchases/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updatePurchase(id, data);
      res.json(purchase);
    } catch (error) {
      console.error("Error updating purchase:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update purchase" });
    }
  });

  app.delete("/api/purchases/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePurchase(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase:", error);
      res.status(500).json({ message: "Failed to delete purchase" });
    }
  });

  // Enhanced purchase endpoint for multiple items
app.post("/api/purchases/enhanced", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { purchaseDate, ...purchaseData } = req.body;
    
    // Convert purchaseDate string to Date if necessary
    const processedData = {
      ...purchaseData,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    };

    console.log("Processing enhanced purchase:", processedData);

    const purchase = await storage.createEnhancedPurchase(processedData);
    
    // Asegurar que se retorna JSON válido
    res.status(201).json({
      success: true,
      message: "Compra registrada exitosamente",
      purchase: purchase,
      id: purchase.id
    });
    
  } catch (error) {
    console.error("Error creating enhanced purchase:", error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: "Datos inválidos", 
        errors: error.errors 
      });
    }
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        success: false,
        message: error.message || "Error interno del servidor"
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Error desconocido al procesar la compra"
    });
  }
});

  // Inventory routes - all roles can view, admin can modify
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const data = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, data);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.put("/api/inventory/:id/adjust-stock", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adjustment, reason, reference } = req.body;
      const item = await storage.adjustStock(id, Number(adjustment), reason, reference);
      res.json(item);
    } catch (error) {
      console.error("Error adjusting stock:", error);
      res.status(500).json({ message: "Failed to adjust stock" });
    }
  });

  // Stock movements routes
  app.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/inventory/:id/movements", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const movements = await storage.getStockMovementsByInventory(id);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ message: "Failed to fetch inventory movements" });
    }
  });

  app.get("/api/inventory/:id/with-movements", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemWithMovements = await storage.getInventoryItemWithMovements(id);
      if (!itemWithMovements) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(itemWithMovements);
    } catch (error) {
      console.error("Error fetching inventory with movements:", error);
      res.status(500).json({ message: "Failed to fetch inventory with movements" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Employee routes
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(data);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, data);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Payroll routes
  app.get("/api/payroll", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const records = await storage.getPayrollRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching payroll records:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post("/api/payroll", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const data = insertPayrollRecordSchema.parse(req.body);
      const record = await storage.createPayrollRecord(data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating payroll record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/invoices/generate-number", requireAuth, async (req, res) => {
    try {
      const invoiceNumber = await storage.generateInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (error) {
      console.error("Error generating invoice number:", error);
      res.status(500).json({ message: "Failed to generate invoice number" });
    }
  });

  app.post("/api/invoices", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;
      
      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.parse(invoiceData);
      
      // Validate items data
      const validatedItems = items.map((item: any) => 
        insertInvoiceItemSchema.parse(item)
      );

      const invoice = await storage.createInvoice(validatedInvoice, validatedItems);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, data);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.put("/api/invoices/:id/status", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const invoice = await storage.updateInvoiceStatus(id, status);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Sales routes
  app.get("/api/sales", requireAuth, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSaleById(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.get("/api/sales/:id/items", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getSaleItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching sale items:", error);
      res.status(500).json({ message: "Failed to fetch sale items" });
    }
  });

  app.get("/api/sales/generate-number", requireAuth, async (req, res) => {
    try {
      const saleNumber = await storage.generateSaleNumber();
      res.json({ saleNumber });
    } catch (error) {
      console.error("Error generating sale number:", error);
      res.status(500).json({ message: "Failed to generate sale number" });
    }
  });

  app.post("/api/sales", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      
      // Convert saleDate string to Date if necessary
      if (saleData.saleDate && typeof saleData.saleDate === 'string') {
        saleData.saleDate = new Date(saleData.saleDate);
      }
      
      // Validate sale data
      const validatedSale = insertSaleSchema.parse(saleData);
      
      // Validate items data
      const validatedItems = items.map((item: any) => 
        insertSaleItemSchema.parse(item)
      );

      const sale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", requireAuth, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertSaleSchema.partial().parse(req.body);
      const sale = await storage.updateSale(id, data);
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSale(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Company settings routes
  app.get("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post("/api/company-settings", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const data = insertCompanySettingsSchema.parse(req.body);
      const settings = await storage.createCompanySettings(data);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating company settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company settings" });
    }
  });

  app.put("/api/company-settings/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCompanySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCompanySettings(id, data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // User management routes - admin only
app.get("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await storage.getUsers();
    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.post("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body);
    const user = await storage.createUser(data);
    // Remove password from response
    const { password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    if (error instanceof Error && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
      return res.status(409).json({ message: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

app.put("/api/users/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertUserSchema.partial().parse(req.body);
    
    // Don't allow updating own role or status
    if (id === req.session.user?.id) {
      delete data.role;
      delete data.isActive;
    }
    
    const user = await storage.updateUser(id, data);
    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    if (error instanceof Error && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
      return res.status(409).json({ message: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});

app.delete("/api/users/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Don't allow deleting own account
    if (id === req.session.user?.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }
    
    await storage.deleteUser(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

app.put("/api/users/:id/password", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }
    
    await storage.updateUserPassword(id, password);
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// Asset routes - admin only
app.get("/api/assets", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const assets = await storage.getAssets();
    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

app.get("/api/assets/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const asset = await storage.getAssetById(id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.json(asset);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ message: "Failed to fetch asset" });
  }
});

app.post("/api/assets", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const data = insertAssetSchema.parse(req.body);
    const asset = await storage.createAsset(data);
    res.status(201).json(asset);
  } catch (error) {
    console.error("Error creating asset:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create asset" });
  }
});

app.put("/api/assets/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertAssetSchema.partial().parse(req.body);
    const asset = await storage.updateAsset(id, data);
    res.json(asset);
  } catch (error) {
    console.error("Error updating asset:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update asset" });
  }
});

app.put("/api/assets/:id/status", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const asset = await storage.updateAssetStatus(id, status);
    res.json(asset);
  } catch (error) {
    console.error("Error updating asset status:", error);
    res.status(500).json({ message: "Failed to update asset status" });
  }
});

app.delete("/api/assets/:id", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteAsset(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ message: "Failed to delete asset" });
  }
});

// Asset statistics
app.get("/api/assets/stats", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const assets = await storage.getAssets();
    
    const stats = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + Number(asset.currentValue), 0),
      activeAssets: assets.filter(a => a.status === 'active').length,
      depreciatedAssets: assets.filter(a => a.status === 'depreciated').length,
      maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
      disposedAssets: assets.filter(a => a.status === 'disposed').length,
      byCategory: assets.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching asset statistics:", error);
    res.status(500).json({ message: "Failed to fetch asset statistics" });
  }
});

app.put("/api/users/:id/toggle-status", requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Don't allow disabling own account
    if (id === req.session.user?.id) {
      return res.status(400).json({ message: "No puedes desactivar tu propia cuenta" });
    }
    
    const user = await storage.toggleUserStatus(id);
    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to toggle user status" });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}

