/**
 * Main Express application setup
 * Path: src/app.ts
 * 
 * BRANCH: feature/bootstrap
 * Create this branch before implementing app setup
 * 
 * CRITICAL: Load environment variables BEFORE any internal imports
 */

import dotenv from "dotenv";
// Load environment variables FIRST
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

// Internal imports
import { getHelmetConfig } from "./config/helmetConfig";
import { getCorsOptions } from "./config/corsConfig";
import { generateSwaggerSpec } from "./config/swaggerOptions";
import {
  accessLogger,
  errorLogger,
  consoleLogger,
} from "./api/v1/middleware/logger";
import { captureClientIP } from "./api/v1/middleware/auditLogger";
import errorHandler from "./api/v1/middleware/errorHandler";

// Routes
import playerRoutes from "./api/v1/routes/playerRoutes";
import adminRoutes from "./api/v1/routes/adminRoutes";

const app: Express = express();

// ============ MIDDLEWARE SETUP ============

// 1. Logging middleware (first in stack)
if (process.env.NODE_ENV === "production") {
  app.use(accessLogger);
  app.use(errorLogger);
} else {
  app.use(consoleLogger);
}

// 2. Security middleware
app.use(getHelmetConfig());
app.use(cors(getCorsOptions()));

// 3. Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// 4. Capture client IP for audit logs
app.use(captureClientIP);

// ============ API DOCUMENTATION ============

const swaggerSpec = generateSwaggerSpec();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============ API ROUTES ============

// Admin routes (includes bootstrap - unauthenticated)
app.use("/api/v1/admin", adminRoutes);

// Player routes (all authenticated)
app.use("/api/v1/players", playerRoutes);

// ============ 404 HANDLER ============

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    error: {
      message: "Endpoint not found",
      code: "NOT_FOUND",
    },
    timestamp: new Date().toISOString(),
  });
});

// ============ ERROR HANDLER (MUST BE LAST) ============

app.use(errorHandler);

export default app;