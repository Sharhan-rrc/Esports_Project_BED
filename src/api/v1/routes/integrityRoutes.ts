/**
 * Integrity routes - AI detection endpoints (admin only)
 * Path: src/api/v1/routes/integrityRoutes.ts
 */

import express, { Router } from "express";
import * as integrityController from "../controllers/integrityController";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import Joi from "joi";

const router: Router = express.Router();

// Validation schemas
const integritySchemas = {
  scanPlayer: {
    params: Joi.object({
      playerId: Joi.string().required().messages({
        "any.required": "Player ID is required",
      }),
    }),
  },
  updateCase: {
    params: Joi.object({
      caseId: Joi.string().required().messages({
        "any.required": "Case ID is required",
      }),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid("open", "investigating", "resolved", "false_positive")
        .required()
        .messages({
          "any.required": "Status is required",
          "any.only": "Status must be: open, investigating, resolved, or false_positive",
        }),
      adminNotes: Joi.string().optional().messages({
        "string.base": "Admin notes must be a string",
      }),
    }),
  },
  caseId: {
    params: Joi.object({
      caseId: Joi.string().required().messages({
        "any.required": "Case ID is required",
      }),
    }),
  },
};

/**
 * @openapi
 * /integrity/scan/{playerId}:
 *   post:
 *     summary: Scan player for integrity violations using AI (admin only)
 *     tags: [Integrity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Player scanned, integrity case created with AI analysis
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Player not found
 */
router.post(
  "/scan/:playerId",
  authenticate,
  isAuthorized({ hasRole: ["admin", "enforcer"] }),
  validateRequest(integritySchemas.scanPlayer),
  integrityController.scanPlayer
);

/**
 * @openapi
 * /integrity/cases:
 *   get:
 *     summary: Get all integrity investigation cases (admin only)
 *     tags: [Integrity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [open, investigating, resolved, false_positive]
 *     responses:
 *       200:
 *         description: List of integrity cases
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
router.get(
  "/cases",
  authenticate,
  isAuthorized({ hasRole: ["admin", "enforcer"] }),
  integrityController.getCases
);

/**
 * @openapi
 * /integrity/cases/{caseId}:
 *   get:
 *     summary: Get detailed integrity case information with AI analysis (admin only)
 *     tags: [Integrity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: caseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed case information with flags and AI analysis
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Case not found
 */
router.get(
  "/cases/:caseId",
  authenticate,
  isAuthorized({ hasRole: ["admin", "enforcer"] }),
  validateRequest(integritySchemas.caseId),
  integrityController.getCaseDetails
);

/**
 * @openapi
 * /integrity/cases/{caseId}:
 *   patch:
 *     summary: Update integrity case status and notes (admin only)
 *     tags: [Integrity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: caseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, investigating, resolved, false_positive]
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Case updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Case not found
 */
router.patch(
  "/cases/:caseId",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(integritySchemas.updateCase),
  integrityController.updateCase
);

export default router;
