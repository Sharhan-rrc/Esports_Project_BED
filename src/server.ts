/**
 * Express server startup
 * Path: src/server.ts
 */

import app from "./app";

const PORT: string | number = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log("\nESPORTS HUB API STARTED");
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Health Check (v1): http://localhost:${PORT}/api/v1/health`);
  console.log("\nAvailable Routes:");
  console.log("POST   /api/v1/admin/bootstrap");
  console.log("POST   /api/v1/admin/assign-role");
  console.log("POST   /api/v1/players");
  console.log("GET    /api/v1/players");
  console.log("GET    /api/v1/players/:id");
  console.log("PUT    /api/v1/players/:id");
  console.log("DELETE /api/v1/players/:id");
  console.log("POST   /api/v1/players/:id/blacklist");
  console.log("DELETE /api/v1/players/:id/blacklist");
  console.log("PUT    /api/v1/players/:id/stats");
  console.log("GET    /api/v1/players/:id/rating\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default server;