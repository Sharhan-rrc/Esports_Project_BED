/**
 * Authentication middleware - Firebase token verification
 * Path: src/api/v1/middleware/authenticate.ts
 * 
 * BRANCH: feature/auth-rbac
 * Create this branch before implementing authentication
 */

import { Request, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { AuthenticationError } from "../errors/errors";
import { getErrorMessage, getErrorCode } from "../utils/errorUtils";
import { auth } from "../../../config/firebaseConfig";

/**
 * Middleware to authenticate user using Firebase ID token
 * Extracts token from Authorization header
 * Verifies token and stores user info in res.locals
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token: string | undefined = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      throw new AuthenticationError(
        "Unauthorized: No token provided",
        "TOKEN_NOT_FOUND"
      );
    }

    const decodedToken: DecodedIdToken = await auth.verifyIdToken(token);

    // Store user info in res.locals for downstream middleware
    res.locals.uid = decodedToken.uid;
    res.locals.email = decodedToken.email;
    res.locals.role = (decodedToken as any).role || "officer";
    res.locals.organization = (decodedToken as any).organization;

    next();
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error instanceof Error) {
      next(
        new AuthenticationError(
          `Unauthorized: ${getErrorMessage(error)}`,
          getErrorCode(error)
        )
      );
    } else {
      next(
        new AuthenticationError(
          "Unauthorized: Invalid token",
          "TOKEN_INVALID"
        )
      );
    }
  }
};

export default authenticate;