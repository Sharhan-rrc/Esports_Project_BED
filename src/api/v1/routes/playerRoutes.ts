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
import { AuthorizationOptions } from "../models/authorizationOptions";

const router: Router = express.Router();
const organizerRoles: AuthorizationOptions["hasRole"] = ["admin", "organizer"];
const enforcerRoles: AuthorizationOptions["hasRole"] = ["admin", "enforcer"];
const officerRoles: AuthorizationOptions["hasRole"] = ["admin", "enforcer", "organizer", "officer"];

/**
 * @openapi
 * /players/{playerId}:
 *   delete:
 *     summary: Soft delete player (admin and enforcer)
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
 *         description: Player deleted successfully (returns deleted id)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.delete(
  "/:id",
  authenticate,
  isAuthorized({ hasRole: enforcerRoles }),
  validateRequest(playerSchemas.delete),
  playerController.deletePlayer
);

/**
 * @openapi
 * /players/{playerId}/restore:
 *   patch:
 *     summary: Restore a soft-deleted player (admin and enforcer)
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
 *         description: Player restored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.patch(
  "/:id/restore",
  authenticate,
  isAuthorized({ hasRole: enforcerRoles }),
  validateRequest(playerSchemas.restore),
  playerController.restorePlayer
);

/**
 * @openapi
 * /players/{playerId}/blacklist:
 *   post:
 *     summary: Blacklist a player (admin and enforcer)
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
  isAuthorized({ hasRole: enforcerRoles }),
  validateRequest(playerSchemas.blacklist),
  playerController.blacklistPlayer
);

/**
 * @openapi
 * /players/{playerId}/blacklist:
 *   delete:
 *     summary: Unblacklist a player (admin and enforcer)
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
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.delete(
  "/:id/blacklist",
  authenticate,
  isAuthorized({ hasRole: enforcerRoles }),
  validateRequest(playerSchemas.unblacklist),
  playerController.unblacklistPlayer
);

/**
 * @openapi
 * /players/{playerId}/stats:
 *   put:
 *     summary: Update player statistics and recalculate rating (admin and enforcer)
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
  isAuthorized({ hasRole: enforcerRoles }),
  validateRequest(playerSchemas.updateStats),
  playerController.updatePlayerStats
);

/**
 * @openapi
 * /players:
 *   post:
 *     summary: Create a new player with optional initial stats (admin, organizer)
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
 *               wins:
 *                 type: integer
 *                 minimum: 0
 *                 example: 45
 *               losses:
 *                 type: integer
 *                 minimum: 0
 *                 example: 15
 *               totalKills:
 *                 type: integer
 *                 minimum: 0
 *                 example: 450
 *               totalDeaths:
 *                 type: integer
 *                 minimum: 0
 *                 example: 150
 *               matchesLast30Days:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 22
 *     responses:
 *       201:
 *         description: Player created successfully with calculated rating
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
  isAuthorized({ hasRole: organizerRoles }),
  validateRequest(playerSchemas.create),
  playerController.createPlayer
);

/**
 * @openapi
 * /players:
 *   put:
 *     summary: Update player information (admin, organizer)
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
  isAuthorized({ hasRole: organizerRoles }),
  validateRequest(playerSchemas.update),
  playerController.updatePlayer
);

/**
 * @openapi
 * /players:
 *   get:
 *     summary: Get all players (admin, organizer, enforcer, officer)
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
 *         description: Include soft-deleted players in list results
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
  isAuthorized({ hasRole: officerRoles }),
  validateRequest(playerSchemas.list),
  playerController.getAllPlayers
);

/**
 * @openapi
 * /players/{playerId}:
 *   get:
 *     summary: Get player by ID (admin, organizer, enforcer, officer)
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
  isAuthorized({ hasRole: officerRoles }),
  validateRequest(playerSchemas.getById),
  playerController.getPlayerById
);

/**
 * @openapi
 * /players/{playerId}/rating:
 *   get:
 *     summary: Get player rating information (admin, organizer, enforcer, officer)
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
  isAuthorized({ hasRole: officerRoles }),
  validateRequest(playerSchemas.getById),
  playerController.getPlayerRating
);

export default router;