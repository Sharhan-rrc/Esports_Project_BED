/**
 * Audit logging middleware - Logs all state-changing operations
 * Path: src/api/v1/middleware/auditLogger.ts
 */

import { db } from "../../../config/firebaseConfig";
import { Request, Response, NextFunction } from "express";

export interface AuditLogEntry {
  action: string;
  userId: string;
  targetId: string;
  targetType: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Logs an audit entry to Firestore
 * Should be called from service methods when state changes occur
 * 
 * @param entry - Audit log entry to record
 */
export const logAuditEntry = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await db.collection("audit_logs").add({
      ...entry,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't throw - audit log failure shouldn't break the operation
  }
};

/**
 * Middleware to capture client IP for audit logs
 * Stores IP in res.locals for downstream middleware
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const captureClientIP = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  res.locals.clientIP = ip;
  next();
};

/**
 * Helper to construct audit log for player operations
 */
export const createPlayerAuditLog = (
  action: string,
  playerId: string,
  userId: string,
  changes?: Record<string, any>,
  ipAddress?: string
): AuditLogEntry => ({
  action,
  userId,
  targetId: playerId,
  targetType: "player",
  changes,
  timestamp: new Date(),
  ipAddress,
});