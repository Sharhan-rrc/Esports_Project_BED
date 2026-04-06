/**
 * Authentication routes - Auth endpoints
 * Path: src/api/v1/routes/authRoutes.ts
 */

import express, { Router } from "express";
import * as authController from "../controllers/authController";
import authenticate from "../middleware/authenticate";


const router: Router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user with Firebase token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "firebase-id-token-here"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid token
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
