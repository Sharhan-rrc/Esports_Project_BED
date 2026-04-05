/**
 * Admin routes - Admin management endpoints
 * Path: src/api/v1/routes/adminRoutes.ts
 * 
 * BRANCH: feature/bootstrap
 * Create this branch before implementing admin routes
 */

import express, { Router } from "express";
import * as adminController from "../controllers/adminController";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import Joi from "joi";

const router: Router = express.Router();

// Validation schemas for admin endpoints
const adminSchemas = {
  bootstrapAdmin: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          "any.required": "Email is required",
          "string.email": "Email must be valid",
        }),
      password: Joi.string()
        .min(8)
        .required()
        .messages({
          "any.required": "Password is required",
          "string.min": "Password must be at least 8 characters",
        }),
    }),
  },
  assignRole: {
    body: Joi.object({
      uid: Joi.string()
        .required()
        .messages({
          "any.required": "User UID is required",
        }),
      role: Joi.string()
        .valid("admin", "enforcer", "organizer", "officer")
        .required()
        .messages({
          "any.required": "Role is required",
          "any.only": "Role must be one of: admin, enforcer, organizer, officer",
        }),
    }),
  },
  userById: {
    params: Joi.object({
      uid: Joi.string()
        .required()
        .messages({
          "any.required": "User UID is required",
        }),
    }),
  },
};

/**
 * @openapi
 * /admin/bootstrap:
 *   post:
 *     summary: Bootstrap first admin user (one-time only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@esports.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePassword123!"
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       409:
 *         description: Admin already exists
 *       422:
 *         description: Validation error
 */
router.post(
  "/bootstrap",
  validateRequest(adminSchemas.bootstrapAdmin),
  adminController.bootstrapAdmin
);

/**
 * @openapi
 * /admin/assign-role:
 *   post:
 *     summary: Assign role to user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - role
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "user_abc123"
 *               role:
 *                 type: string
 *                 enum: [admin, enforcer, organizer, officer]
 *                 example: "enforcer"
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       422:
 *         description: Validation error
 */
router.post(
  "/assign-role",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(adminSchemas.assignRole),
  adminController.assignRole
);

/**
 * @openapi
 * /admin/users/{uid}:
 *   get:
 *     summary: Get user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */
router.get(
  "/users/:uid",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(adminSchemas.userById),
  adminController.getUserDetails
);

/**
 * @openapi
 * /admin/users/{uid}/disable:
 *   post:
 *     summary: Disable user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User disabled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */
router.post(
  "/users/:uid/disable",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(adminSchemas.userById),
  adminController.disableUser
);

/**
 * @openapi
 * /admin/users/{uid}/enable:
 *   post:
 *     summary: Enable user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User enabled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */
router.post(
  "/users/:uid/enable",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(adminSchemas.userById),
  adminController.enableUser
);

export default router;