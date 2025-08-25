// Archivo: server/routes/quotes.ts

import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import type { Quote, QuoteItem, InsertQuote, InsertQuoteItem } from "@shared/schema";

const router = Router();

// Schema de validación para crear/actualizar cotización
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

const updateQuoteStatusSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]),
});

// GET /api/quotes - Obtener todas las cotizaciones
router.get("/", async (req, res) => {
  try {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ 
      message: "Error al obtener las cotizaciones",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// GET /api/quotes/stats - Obtener estadísticas de cotizaciones
router.get("/stats", async (req, res) => {
  try {
    const stats = await storage.getQuoteStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching quote stats:", error);
    res.status(500).json({ 
      message: "Error al obtener las estadísticas",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// GET /api/quotes/:id - Obtener una cotización específica
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

    res.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ 
      message: "Error al obtener la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// GET /api/quotes/:id/items - Obtener items de una cotización
router.get("/:id/items", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    const items = await storage.getQuoteItems(id);
    res.json(items);
  } catch (error) {
    console.error("Error fetching quote items:", error);
    res.status(500).json({ 
      message: "Error al obtener los items de la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// POST /api/quotes - Crear nueva cotización
router.post("/", async (req, res) => {
  try {
    const validatedData = createQuoteSchema.parse(req.body);
    
    // Verificar que todos los productos existen en inventario
    for (const item of validatedData.items) {
      const inventoryItem = await storage.getInventoryItemById(item.inventoryId);
      if (!inventoryItem) {
        return res.status(400).json({ 
          message: `Producto con ID ${item.inventoryId} no encontrado en inventario`
        });
      }
    }

    const quote = await storage.createQuote(
      validatedData.quote as InsertQuote,
      validatedData.items as InsertQuoteItem[]
    );

    res.status(201).json(quote);
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

// PUT /api/quotes/:id - Actualizar cotización
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    // Verificar que la cotización existe
    const existingQuote = await storage.getQuoteById(id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // Verificar que la cotización se puede editar
    if (!["draft", "sent"].includes(existingQuote.status)) {
      return res.status(400).json({ 
        message: "No se puede editar una cotización que ha sido aceptada, rechazada o convertida"
      });
    }

    const validatedData = createQuoteSchema.parse(req.body);
    
    // Verificar que todos los productos existen en inventario
    for (const item of validatedData.items) {
      const inventoryItem = await storage.getInventoryItemById(item.inventoryId);
      if (!inventoryItem) {
        return res.status(400).json({ 
          message: `Producto con ID ${item.inventoryId} no encontrado en inventario`
        });
      }
    }

    // Eliminar items existentes y crear nuevos
    await storage.deleteQuoteItems(id);
    
    const updatedQuote = await storage.updateQuote(
      id,
      validatedData.quote as Partial<InsertQuote>
    );

    // Crear nuevos items
    for (const itemData of validatedData.items) {
      await storage.createQuoteItem(id, itemData as InsertQuoteItem);
    }

    res.json(updatedQuote);
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

// PATCH /api/quotes/:id/status - Actualizar estado de cotización
router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    const { status } = updateQuoteStatusSchema.parse(req.body);

    // Verificar que la cotización existe
    const existingQuote = await storage.getQuoteById(id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // Validar transiciones de estado
    const validTransitions: Record<string, string[]> = {
      draft: ["sent", "rejected"],
      sent: ["accepted", "rejected", "expired"],
      accepted: ["converted"],
      rejected: [],
      expired: [],
      converted: [],
    };

    if (!validTransitions[existingQuote.status].includes(status)) {
      return res.status(400).json({ 
        message: `No se puede cambiar el estado de ${existingQuote.status} a ${status}`
      });
    }

    const updatedQuote = await storage.updateQuoteStatus(id, status);
    res.json(updatedQuote);
  } catch (error) {
    console.error("Error updating quote status:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Estado inválido",
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      message: "Error al actualizar el estado de la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// POST /api/quotes/:id/convert-to-sale - Convertir cotización a venta
router.post("/:id/convert-to-sale", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    // Verificar que la cotización existe
    const existingQuote = await storage.getQuoteById(id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // Verificar que la cotización se puede convertir
    if (existingQuote.status !== "accepted") {
      return res.status(400).json({ 
        message: "Solo se pueden convertir cotizaciones aceptadas"
      });
    }

    // Verificar que la cotización no ha expirado
    if (new Date() > new Date(existingQuote.validUntil)) {
      return res.status(400).json({ 
        message: "No se puede convertir una cotización expirada"
      });
    }

    // Verificar stock disponible
    const quoteItems = await storage.getQuoteItems(id);
    for (const item of quoteItems) {
      const inventoryItem = await storage.getInventoryItemById(item.inventoryId);
      if (!inventoryItem) {
        return res.status(400).json({ 
          message: `Producto ${item.productName} no encontrado en inventario`
        });
      }
      
      if (Number(inventoryItem.currentStock) < Number(item.quantity)) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${item.productName}. Disponible: ${inventoryItem.currentStock}, Requerido: ${item.quantity}`
        });
      }
    }

    const sale = await storage.convertQuoteToSale(id);
    res.status(201).json(sale);
  } catch (error) {
    console.error("Error converting quote to sale:", error);
    res.status(500).json({ 
      message: "Error al convertir la cotización a venta",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// DELETE /api/quotes/:id - Eliminar cotización
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de cotización inválido" });
    }

    // Verificar que la cotización existe
    const existingQuote = await storage.getQuoteById(id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // Verificar que la cotización se puede eliminar
    if (existingQuote.status === "converted") {
      return res.status(400).json({ 
        message: "No se puede eliminar una cotización que ya fue convertida a venta"
      });
    }

    await storage.deleteQuote(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({ 
      message: "Error al eliminar la cotización",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

// POST /api/quotes/update-expired - Actualizar cotizaciones expiradas (tarea automatizada)
router.post("/update-expired", async (req, res) => {
  try {
    await storage.updateExpiredQuotes();
    res.json({ message: "Cotizaciones expiradas actualizadas correctamente" });
  } catch (error) {
    console.error("Error updating expired quotes:", error);
    res.status(500).json({ 
      message: "Error al actualizar cotizaciones expiradas",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

export default router;