/**
 * Authentication controller - Handle user login and token management
 * Path: src/api/v1/controllers/authController.ts
 */

import { Request, Response, NextFunction } from "express";
import { auth } from "../../../config/firebaseConfig";
import { successResponse } from "../models/responseModel";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import { AuthenticationError } from "../errors/errors";
import { getErrorMessage } from "../utils/errorUtils";

/**
 * POST /api/v1/auth/login - User login with Firebase token
 * Verifies Firebase ID token
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AuthenticationError(
        "Token is required",
        "TOKEN_REQUIRED"
      );
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          uid: decodedToken.uid,
          email: decodedToken.email,
          token: token,
        },
        "Login successful"
      )
    );
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error instanceof Error) {
      next(
        new AuthenticationError(
          `Authentication failed: ${getErrorMessage(error)}`,
          "LOGIN_ERROR"
        )
      );
    } else {
      next(
        new AuthenticationError(
          "Authentication failed",
          "LOGIN_ERROR"
        )
      );
    }
  }
};

/**
 * GET /api/v1/auth/me - Get current authenticated user info
 * Requires authentication token
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const uid = res.locals.uid;
    const email = res.locals.email;
    const role = res.locals.role;

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          uid,
          email,
          role,
        },
        "User information retrieved successfully"
      )
    );
  } catch (error: unknown) {
    next(error);
  }
};
