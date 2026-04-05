/**
 * Logging middleware setup using Morgan
 * Path: src/api/v1/middleware/logger.ts
 */

import morgan, { StreamOptions } from "morgan";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write stream for access logs (append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);

// Define error log stream (4xx and 5xx only)
const errorLogStream: StreamOptions = {
  write: (message) =>
    fs.appendFileSync(path.join(logsDir, "error.log"), message),
};

// Setup access logger (all requests)
const accessLogger = morgan("combined", { stream: accessLogStream });

// Setup error logger (4xx and 5xx status codes only)
const errorLogger = morgan("combined", {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400,
});

// Console logger for development
const consoleLogger = morgan("dev");

export { accessLogger, errorLogger, consoleLogger };