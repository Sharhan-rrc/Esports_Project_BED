/**
 * Admin controller - Bootstrap admin and role management
 * Path: src/api/v1/controllers/adminController.ts
 * 
 * BRANCH: feature/bootstrap
 * Create this branch before implementing admin bootstrap
 */

import { Request, Response, NextFunction } from "express";
import { auth } from "../../../config/firebaseConfig";
import { successResponse } from "../models/responseModel";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import {
  ServiceError,
} from "../errors/errors";
import * as firestoreRepository from "../repositories/firestoreRepository";
import * as playerService from "../services/playerService";
import { logAuditEntry } from "../middleware/auditLogger";

/**
 * Bootstrap first admin user
 * One-time endpoint - can only be called if no admins exist
 * 
 * BRANCH: feature/bootstrap
 */
export const bootstrapAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if any admins already exist
    const adminsSnapshot = await firestoreRepository.queryDocuments(
      "users",
      "role",
      "==",
      "admin"
    );

    if (!adminsSnapshot.empty) {
      throw new ServiceError(
        "Admin already exists. Bootstrap not allowed.",
        "ADMIN_EXISTS",
        HTTP_STATUS.CONFLICT
      );
    }

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Set custom claims to admin role
    await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreRepository.createDocument("users", userData, userRecord.uid);

    // Log bootstrap action
    await logAuditEntry({
      action: "admin_bootstrapped",
      userId: userRecord.uid,
      targetId: userRecord.uid,
      targetType: "user",
      changes: { role: "admin" },
      timestamp: new Date(),
    });

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          uid: userRecord.uid,
          email: userRecord.email,
        },
        "Admin user created successfully. User must sign in to get token."
      )
    );
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      next(error);
    } else if (error instanceof Error) {
      // Handle Firebase auth errors
      next(new ServiceError(error.message, "BOOTSTRAP_ERROR"));
    } else {
      next(new ServiceError("Failed to bootstrap admin", "BOOTSTRAP_ERROR"));
    }
  }
};

/**
 * Assign role to user
 * Admin only endpoint
 * 
 * BRANCH: feature/bootstrap
 */
export const assignRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid, role } = req.body;
    const adminUid = res.locals.uid;

    // Validate role
    const validRoles = ["admin", "enforcer", "organizer", "officer"];
    if (!validRoles.includes(role)) {
      throw new ServiceError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        "INVALID_ROLE",
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      );
    }

    // Get user record
    const userRecord = await auth.getUser(uid);

    // Set custom claims
    await auth.setCustomUserClaims(uid, { role });

    // Upsert Firestore document so role assignment works even for users
    // created directly in Firebase Authentication.
    const existingUserDoc = await firestoreRepository.getDocumentById("users", uid);
    const now = new Date();

    if (!existingUserDoc) {
      await firestoreRepository.createDocument(
        "users",
        {
          uid,
          email: userRecord.email,
          role,
          createdAt: now,
          updatedAt: now,
        },
        uid
      );
    } else {
      await firestoreRepository.updateDocument("users", uid, {
        role,
        updatedAt: now,
      });
    }

    // Log role assignment
    await logAuditEntry({
      action: "role_assigned",
      userId: adminUid,
      targetId: uid,
      targetType: "user",
      changes: { role, previous_role: (userRecord.customClaims?.role) || "none" },
      timestamp: new Date(),
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          uid,
          email: userRecord.email,
          role,
        },
        "Role assigned successfully. User must obtain new token for changes to take effect."
      )
    );
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      next(error);
    } else if (error instanceof Error) {
      next(new ServiceError(error.message, "ASSIGN_ROLE_ERROR"));
    } else {
      next(new ServiceError("Failed to assign role", "ASSIGN_ROLE_ERROR"));
    }
  }
};

/**
 * Get user details
 * Admin only
 */
export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid } = req.params;

    const userRecord = await auth.getUser(uid as string);
    const userDoc = await firestoreRepository.getDocumentById("users", uid as string);

    const response = {
      uid: userRecord.uid,
      email: userRecord.email,
      role: userDoc?.data()?.role || "officer",
      organization: userDoc?.data()?.organization,
      createdAt: userDoc?.data()?.createdAt,
      updatedAt: userDoc?.data()?.updatedAt,
      emailVerified: userRecord.emailVerified,
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(response, "User details retrieved successfully")
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("user-not-found")) {
        next(
          new ServiceError(
            "User not found",
            "USER_NOT_FOUND",
            HTTP_STATUS.NOT_FOUND
          )
        );
      } else {
        next(new ServiceError(error.message, "GET_USER_ERROR"));
      }
    } else {
      next(new ServiceError("Failed to get user details", "GET_USER_ERROR"));
    }
  }
};

/**
 * Disable user account
 * Admin only
 */
export const disableUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid } = req.params;
    const adminUid = res.locals.uid;

    // Disable user in Firebase Auth
    await auth.updateUser(uid as string, { disabled: true });

    // Update Firestore
    await firestoreRepository.updateDocument("users", uid as string, {
      disabled: true,
      disabledAt: new Date(),
      updatedAt: new Date(),
    });

    // Log action
    await logAuditEntry({
      action: "user_disabled",
      userId: adminUid,
      targetId: uid as string,
      targetType: "user",
      changes: { disabled: true },
      timestamp: new Date(),
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({}, "User disabled successfully")
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(new ServiceError(error.message, "DISABLE_USER_ERROR"));
    } else {
      next(new ServiceError("Failed to disable user", "DISABLE_USER_ERROR"));
    }
  }
};

/**
 * Enable user account
 * Admin only
 */
export const enableUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid } = req.params;
    const adminUid = res.locals.uid;

    // Enable user in Firebase Auth
    await auth.updateUser(uid as string, { disabled: false });

    // Update Firestore
    await firestoreRepository.updateDocument("users", uid as string, {
      disabled: false,
      updatedAt: new Date(),
    });

    // Log action
    await logAuditEntry({
      action: "user_enabled",
      userId: adminUid,
      targetId: uid as string,
      targetType: "user",
      changes: { disabled: false },
      timestamp: new Date(),
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({}, "User enabled successfully")
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(new ServiceError(error.message, "ENABLE_USER_ERROR"));
    } else {
      next(new ServiceError("Failed to enable user", "ENABLE_USER_ERROR"));
    }
  }
};

/**
 * Get all deleted players
 * Admin only - for identifying which players have been deleted
 */
export const getDeletedPlayers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await playerService.getDeletedPlayers(
      Number(page),
      Number(limit)
    );

    // Format the response to include deletion details
    const formattedResult = {
      deletedPlayers: result.players.map((player) => ({
        id: player.id,
        username: player.username,
        email: player.email,
        organization: player.organization,
        deletedAt: player.deletedAt,
        rating: player.rating,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      })),
      total: result.total,
      page: Number(page),
      limit: Number(limit),
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(formattedResult, "Deleted players retrieved successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};
