import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import type { QuoteWithStringValues, QuoteItemWithStringValues, InsertQuote, InsertQuoteItem } from "@shared/schema";

const router = Router();

// Schema corregido - mantener números para validación pero convertir para DB
const createQuoteSchema = z.object({
  quote: z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    customerAddress: z.string().optional().nullable(),
    quoteDate: z.coerce.date(),
    validUntil: z.coerce.date(),
    subtotal: z.number().min(0),
    taxRate: z.number().min(0).max(100).default(0),
    taxAmount: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    total: z.number().min(0),
    notes: z.string().optional().nullable(),
    terms: z.string().optional().nullable(),
  }),
  items: z.array(z.object({
    inventoryId: z.number().int().positive(),
    productName: z.string().min(1),
    description: z.string().optional().nullable(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    subtotal: z.number().min(0),
  })).min(1),
});

// GET /api/quotes - Convertir strings a números para frontend
router.get("/", async (req, res) => {
  try {
    const quotes = await storage.getQuotes();
    
    // Convertir para frontend
    const quotesForFrontend = quotes.map(quote => ({
      ...quote,
      subtotal: parseFloat(quote.subtotal || '0'),
      taxRate: parseFloat(quote.taxRate || '0'),
      taxAmount: parseFloat(quote.taxAmount || '0'),
      discountAmount: parseFloat(quote.discountAmount || '0'),
      total: parseFloat(quote.total || '0')
    }));
    
    res.json(quotesForFrontend);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ 
      message: "Error al obtener las cotizaciones",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// GET /api/quotes/:id - Convertir tipos
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    const quote = await storage.getQuoteById(id);
    if (!quote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // Convertir para frontend
    const quoteForFrontend = {
      ...quote,
      subtotal: parseFloat(quote.subtotal || '0'),
      taxRate: parseFloat(quote.taxRate || '0'),
      taxAmount: parseFloat(quote.taxAmount || '0'),
      discountAmount: parseFloat(quote.discountAmount || '0'),
      total: parseFloat(quote.total || '0')
    };

    res.json(quoteForFrontend);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ 
      message: "Error al obtener la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// GET /api/quotes/:id/items - Convertir items
router.get("/:id/items", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    const items = await storage.getQuoteItems(id);
    
    // Convertir para frontend
    const itemsForFrontend = items.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity || '0'),
      unitPrice: parseFloat(item.unitPrice || '0'),
      subtotal: parseFloat(item.subtotal || '0')
    }));
    
    res.json(itemsForFrontend);
  } catch (error) {
    console.error("Error fetching quote items:", error);
    res.status(500).json({ 
      message: "Error al obtener los items de la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// POST /api/quotes - Convertir números a strings para DB
router.post("/", async (req, res) => {
  try {
    const validatedData = createQuoteSchema.parse(req.body);
    
    // Convertir números a strings para la base de datos
    const quoteForDB: InsertQuote = {
      ...validatedData.quote,
      subtotal: validatedData.quote.subtotal.toString(),
      taxRate: validatedData.quote.taxRate.toString(),
      taxAmount: validatedData.quote.taxAmount.toString(),
      discountAmount: validatedData.quote.discountAmount.toString(),
      total: validatedData.quote.total.toString(),
    };

    const itemsForDB: InsertQuoteItem[] = validatedData.items.map(item => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      subtotal: item.subtotal.toString(),
    }));

    // Verificar productos en inventario
    for (const item of validatedData.items) {
      const inventoryItem = await storage.getInventoryItemById(item.inventoryId);
      if (!inventoryItem) {
        return res.status(400).json({ 
          message: `Producto con ID ${item.inventoryId} no encontrado en inventario`
        });
      }
      
      const currentStock = parseFloat(inventoryItem.quantity || '0');
      if (currentStock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${item.productName}. Disponible: ${currentStock}, Solicitado: ${item.quantity}`
        });
      }
    }

    const quote = await storage.createQuote(quoteForDB, itemsForDB);
    
    // Convertir respuesta para frontend
    const quoteForFrontend = {
      ...quote,
      subtotal: parseFloat(quote.subtotal || '0'),
      taxRate: parseFloat(quote.taxRate || '0'),
      taxAmount: parseFloat(quote.taxAmount || '0'),
      discountAmount: parseFloat(quote.discountAmount || '0'),
      total: parseFloat(quote.total || '0')
    };

    res.status(201).json(quoteForFrontend);
  } catch (error) {
    console.error("Error creating quote:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Datos de cotización inválidos",
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      message: "Error al crear la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// PUT /api/quotes/:id - Similar conversión
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    const existingQuote = await storage.getQuoteById(id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    if (!["draft", "sent"].includes(existingQuote.status)) {
      return res.status(400).json({ 
        message: "No se puede editar una cotización que ha sido aceptada, rechazada o convertida"
      });
    }

    const validatedData = createQuoteSchema.parse(req.body);
    
    // Convertir para DB
    const quoteForDB = {
      ...validatedData.quote,
      subtotal: validatedData.quote.subtotal.toString(),
      taxRate: validatedData.quote.taxRate.toString(),
      taxAmount: validatedData.quote.taxAmount.toString(),
      discountAmount: validatedData.quote.discountAmount.toString(),
      total: validatedData.quote.total.toString(),
    };

    const itemsForDB = validatedData.items.map(item => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      subtotal: item.subtotal.toString(),
    }));

    const updatedQuote = await storage.updateQuote(id, quoteForDB, itemsForDB);

    // Convertir para frontend
    const quoteForFrontend = {
      ...updatedQuote,
      subtotal: parseFloat(updatedQuote.subtotal || '0'),
      taxRate: parseFloat(updatedQuote.taxRate || '0'),
      taxAmount: parseFloat(updatedQuote.taxAmount || '0'),
      discountAmount: parseFloat(updatedQuote.discountAmount || '0'),
      total: parseFloat(updatedQuote.total || '0')
    };

    res.json(quoteForFrontend);
  } catch (error) {
    console.error("Error updating quote:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Datos de cotización inválidos",
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      message: "Error al actualizar la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

export default router;