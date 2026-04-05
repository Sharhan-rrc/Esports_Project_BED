/**
 * Helmet.js security headers configuration
 * Path: src/config/helmetConfig.ts
 */

import helmet from "helmet";

/**
 * Get appropriate helmet configuration based on environment
 * @returns Helmet configuration object
 */
export const getHelmetConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Base configuration for all environments
  const baseConfig = {
    contentSecurityPolicy: false, // Disabled for JSON APIs
    hidePoweredBy: true, // Always hide server info
    noSniff: true, // Always prevent MIME sniffing
  };

  if (isDevelopment) {
    // Development: Relaxed security
    return helmet({
      ...baseConfig,
      hsts: false, // No HTTPS enforcement in development
    });
  }

  // Production: Full security
  return helmet({
    ...baseConfig,
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "no-referrer" },
  });
};