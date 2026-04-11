/**
 * Player controller - Handles HTTP requests for player endpoints
 * Path: src/api/v1/controllers/playerController.ts
 */

import { Request, Response, NextFunction } from "express";
import * as playerService from "../services/playerService";
import { successResponse } from "../models/responseModel";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import { Player } from "../models/playerModel";

interface PlayerStatsResponse {
  totalMatches: number;
  wins: number;
  losses: number;
  totalKills: number;
  totalDeaths: number;
  winRate: number;
  kdRatio: number;
  consistency: number;
  overallRating: number;
  matchesLast30Days: number;
}

interface PlayerDetailsResponse {
  id: string;
  name: string;
  organization: string;
  stats: PlayerStatsResponse;
}

const formatPlayerDetails = (player: Player): PlayerDetailsResponse => ({
  id: player.id,
  name: player.username,
  organization: player.organization,
  stats: {
    totalMatches: player.rating.totalMatches,
    wins: player.rating.wins,
    losses: player.rating.losses,
    totalKills: player.rating.totalKills,
    totalDeaths: player.rating.totalDeaths,
    winRate: player.rating.winRate,
    kdRatio: player.rating.kdRatio,
    consistency: player.rating.consistency,
    overallRating: player.rating.overallRating,
    matchesLast30Days: player.rating.matchesLast30Days,
  },
});

/**
 * POST /api/v1/players - Create new player
 */
export const createPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const player = await playerService.createPlayer(
      req.body,
      userId,
      ipAddress
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(formatPlayerDetails(player), "Player created successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /api/v1/players - Get all players
 */
export const getAllPlayers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, includeDeleted = false } = req.query;

    const result = await playerService.getAllPlayers(
      includeDeleted === "true",
      Number(page),
      Number(limit)
    );

    const formattedResult = {
      players: result.players.map(formatPlayerDetails),
      total: result.total,
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(formattedResult, "Players retrieved successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /api/v1/players/:id - Get player by ID
 */
export const getPlayerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await playerService.getPlayerById(id as string);

    res.status(HTTP_STATUS.OK).json(
      successResponse(formatPlayerDetails(player), "Player retrieved successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * PUT /api/v1/players/:id - Update player
 */
export const updatePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const player = await playerService.updatePlayer(
      id as string,
      req.body,
      userId,
      ipAddress
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(formatPlayerDetails(player), "Player updated successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * DELETE /api/v1/players/:id - Soft delete player
 */
export const deletePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    await playerService.softDeletePlayer(id as string, userId, ipAddress);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        { id, deleted: true },
        "Player deleted successfully"
      )
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * PATCH /api/v1/players/:id/restore - Restore soft-deleted player
 */
export const restorePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const player = await playerService.restorePlayer(id as string, userId, ipAddress);

    res.status(HTTP_STATUS.OK).json(
      successResponse(formatPlayerDetails(player), "Player restored successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * POST /api/v1/players/:id/blacklist - Blacklist player
 * BRANCH: feature/blacklist-audit
 */
export const blacklistPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const player = await playerService.blacklistPlayer(
      id as string,
      reason,
      userId,
      ipAddress
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(formatPlayerDetails(player), "Player blacklisted successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * DELETE /api/v1/players/:id/blacklist - Unblacklist player
 * BRANCH: feature/blacklist-audit
 */
export const unblacklistPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const player = await playerService.unblacklistPlayer(id as string, userId, ipAddress);

    res.status(HTTP_STATUS.OK).json(
      successResponse(formatPlayerDetails(player), "Player unblacklisted successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * PUT /api/v1/players/:id/stats - Update player stats
 * BRANCH: feature/ranking-system
 */
export const updatePlayerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = res.locals.uid;
    const ipAddress = res.locals.clientIP;

    const rating = await playerService.updatePlayerStats(
      id as string,
      req.body,
      userId,
      ipAddress
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(rating, "Player stats updated and rating recalculated")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /api/v1/players/:id/rating - Get player rating
 */
export const getPlayerRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await playerService.getPlayerById(id as string);

    res.status(HTTP_STATUS.OK).json(
      successResponse(player.rating, "Player rating retrieved successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};