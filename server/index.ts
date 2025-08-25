// Load environment variables first - MUST be at the very top
import { config } from "dotenv";
config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import path from "path";
import { ExpiredQuotesJob } from './jobs/expired-quotes-job';

console.log("🔧 Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Trust proxy for Vercel
app.set('trust proxy', 1);

// Inicializar job de cotizaciones expiradas
const expiredQuotesJob = new ExpiredQuotesJob(60); // Cada 60 minutos
expiredQuotesJob.start();

// Add health check endpoint BEFORE other middleware
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  expiredQuotesJob.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  expiredQuotesJob.stop();
  process.exit(0);
});

// Endpoint manual para ejecutar verificación
app.post('/api/admin/check-expired-quotes', async (req, res) => {
  try {
    await expiredQuotesJob.executeJob();
    res.json({ 
      message: 'Verificación de cotizaciones expiradas ejecutada exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ejecutando verificación manual:', error);
    res.status(500).json({ 
      message: 'Error ejecutando verificación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});



(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(distPath));

    // SPA fallback
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  // Modify the server listen logic to work with Railway
  if (!process.env.VERCEL) {
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    server.listen(port, host, () => {
      console.log(`Server running on ${host}:${port}`);
      console.log(`Health check available at http://${host}:${port}/api/health`);
    });

    app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`📋 Job de cotizaciones expiradas iniciado`);
});
  }
})().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Use ESM exports consistently
export default app;