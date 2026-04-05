/**
 * Player routes - API endpoints
 * Path: src/api/v1/routes/playerRoutes.ts
 */

import express, { Router } from "express";
import * as playerController from "../controllers/playerController";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { playerSchemas } from "../validations/playerSchema";

const router: Router = express.Router();

/**
 * @openapi
 * /players:
 *   post:
 *     summary: Create a new player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - organization
 *             properties:
 *               username:
 *                 type: string
 *                 example: "ProGamer92"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "player@esports.com"
 *               organization:
 *                 type: string
 *                 example: "team_456def"
 *     responses:
 *       201:
 *         description: Player created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.post(
  "/",
  authenticate,
  isAuthorized({ hasRole: ["admin", "organizer"] }),
  validateRequest(playerSchemas.create),
  playerController.createPlayer
);

/**
 * @openapi
 * /players:
 *   get:
 *     summary: Get all players
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *       - name: includeDeleted
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of players
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  authenticate,
  validateRequest(playerSchemas.list),
  playerController.getAllPlayers
);

/**
 * @openapi
 * /players/{playerId}:
 *   get:
 *     summary: Get player by ID
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Player not found
 */
router.get(
  "/:id",
  authenticate,
  validateRequest(playerSchemas.getById),
  playerController.getPlayerById
);

/**
 * @openapi
 * /players/{playerId}:
 *   put:
 *     summary: Update player information
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
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
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               organization:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.put(
  "/:id",
  authenticate,
  isAuthorized({
    hasRole: ["admin", "organizer", "enforcer"],
    allowSameOrganization: true,
  }),
  validateRequest(playerSchemas.update),
  playerController.updatePlayer
);

/**
 * @openapi
 * /players/{playerId}:
 *   delete:
 *     summary: Delete player (soft delete - admin only)
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Player deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Player not found
 */
router.delete(
  "/:id",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(playerSchemas.delete),
  playerController.deletePlayer
);

/**
 * @openapi
 * /players/{playerId}/blacklist:
 *   post:
 *     summary: Blacklist a player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Player blacklisted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.post(
  "/:id/blacklist",
  authenticate,
  isAuthorized({ hasRole: ["admin", "enforcer"] }),
  validateRequest(playerSchemas.blacklist),
  playerController.blacklistPlayer
);

/**
 * @openapi
 * /players/{playerId}/blacklist:
 *   delete:
 *     summary: Unblacklist a player (admin only)
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player unblacklisted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Player not found
 */
router.delete(
  "/:id/blacklist",
  authenticate,
  isAuthorized({ hasRole: ["admin"] }),
  validateRequest(playerSchemas.unblacklist),
  playerController.unblacklistPlayer
);

/**
 * @openapi
 * /players/{playerId}/stats:
 *   put:
 *     summary: Update player statistics and recalculate rating
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
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
 *             properties:
 *               wins:
 *                 type: integer
 *                 minimum: 0
 *               losses:
 *                 type: integer
 *                 minimum: 0
 *               totalKills:
 *                 type: integer
 *                 minimum: 0
 *               totalDeaths:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stats updated and rating recalculated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id/stats",
  authenticate,
  isAuthorized({ hasRole: ["admin", "enforcer"] }),
  validateRequest(playerSchemas.updateStats),
  playerController.updatePlayerStats
);

/**
 * @openapi
 * /players/{playerId}/rating:
 *   get:
 *     summary: Get player rating information
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player rating details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Player not found
 */
router.get(
  "/:id/rating",
  authenticate,
  validateRequest(playerSchemas.getById),
  playerController.getPlayerRating
);

export default router;