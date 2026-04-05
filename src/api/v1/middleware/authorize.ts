/**
 * Authorization middleware - Role-based access control (RBAC)
 * Path: src/api/v1/middleware/authorize.ts
 * 
 * BRANCH: feature/auth-rbac
 * Create this branch before implementing RBAC
 */

import { Request, Response, NextFunction } from "express";
import { AuthorizationOptions } from "../models/authorizationOptions";
import { AuthorizationError } from "../errors/errors";

/**
 * Middleware to check if user is authorized based on role
 * 
 * @param opts - Authorization options with allowed roles
 * @returns Express middleware function
 */
const isAuthorized = (opts: AuthorizationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, uid, organization } = res.locals;
      const { id } = req.params;

      // Allow if same user accessing their own data
      if (opts.allowSameUser && id && uid === id) {
        return next();
      }

      // Allow if same organization
      if (
        opts.allowSameOrganization &&
        organization &&
        req.body?.organization === organization
      ) {
        return next();
      }

      // Check if role exists
      if (!role) {
        throw new AuthorizationError(
          "Forbidden: No role found",
          "ROLE_NOT_FOUND"
        );
      }

      // Check if user has required role
      if (opts.hasRole.includes(role)) {
        return next();
      }

      // Insufficient role
      throw new AuthorizationError(
        "Forbidden: Insufficient role",
        "INSUFFICIENT_ROLE"
      );
    } catch (error) {
      next(error);
    }
  };
};

export default isAuthorized;