/**
 * CORS (Cross-Origin Resource Sharing) configuration
 * Path: src/config/corsConfig.ts
 */

import { CorsOptions } from "cors";

/**
 * Get appropriate CORS configuration based on environment
 * @returns CORS configuration object
 */
export const getCorsOptions = (): CorsOptions => {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // Development: Allow all origins for easy testing
    return {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 200,
    };
  }

  // Production: Strict origins from environment variable
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");

  return {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
  };
};