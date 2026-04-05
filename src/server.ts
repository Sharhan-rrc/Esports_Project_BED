/**
 * Express server startup
 * Path: src/server.ts
 */

import app from "./app";

const PORT: string | number = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    ESPORTS HUB API STARTED                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  🚀 Server running on port: ${PORT}
║  📝 Environment: ${NODE_ENV}
║  📚 API Docs: http://localhost:${PORT}/api-docs
║  ❤️  Health Check: http://localhost:${PORT}/health
║                                                                    ║
║  Available Routes:                                                  ║
║  POST   /api/v1/admin/bootstrap - Create first admin              ║
║  POST   /api/v1/admin/assign-role - Assign user roles            ║
║  POST   /api/v1/players - Create player                          ║
║  GET    /api/v1/players - List all players                       ║
║  GET    /api/v1/players/:id - Get player details                 ║
║  PUT    /api/v1/players/:id - Update player info                 ║
║  DELETE /api/v1/players/:id - Delete player (soft)               ║
║  POST   /api/v1/players/:id/blacklist - Blacklist player         ║
║  DELETE /api/v1/players/:id/blacklist - Unblacklist player       ║
║  PUT    /api/v1/players/:id/stats - Update player stats          ║
║  GET    /api/v1/players/:id/rating - Get player rating           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  `);
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