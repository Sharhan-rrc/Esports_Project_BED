/**
 * Player service - Business logic for player operations
 * Path: src/api/v1/services/playerService.ts
 */

import * as firestoreRepository from "../repositories/firestoreRepository";
import { ServiceError } from "../errors/errors";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  UpdatePlayerStatsRequest,
  PlayerRating,
} from "../models/playerModel";
import {
  calculatePlayerRating,
} from "../utils/ratingCalculator";
import {
  logAuditEntry,
  createPlayerAuditLog,
} from "../middleware/auditLogger";

const PLAYERS_COLLECTION = "players";

/**
 * Create new player
 * BRANCH: feature/players-crud
 * Create branch before implementing
 */
export const createPlayer = async (
  data: CreatePlayerRequest,
  userId: string,
  ipAddress?: string
): Promise<Player> => {
  try {
    // Check if player with email already exists
    const existingPlayers = await firestoreRepository.queryDocuments(
      PLAYERS_COLLECTION,
      "email",
      "==",
      data.email
    );

    if (!existingPlayers.empty) {
      throw new ServiceError(
        "Player with this email already exists",
        "PLAYER_EXISTS",
        HTTP_STATUS.CONFLICT
      );
    }

    const now = new Date();
    
    // Extract stats from request (if provided)
    const wins = data.wins || 0;
    const losses = data.losses || 0;
    const totalKills = data.totalKills || 0;
    const totalDeaths = data.totalDeaths || 0;
    const matchesLast30Days = data.matchesLast30Days || 0;
    const totalMatches = wins + losses;
    
    // Calculate rating if any stats provided
    const ratingComponents = calculatePlayerRating(
      totalMatches,
      wins,
      totalKills,
      totalDeaths,
      matchesLast30Days
    );
    
    const playerData = {
      username: data.username,
      email: data.email,
      organization: data.organization,
      rating: {
        playerId: "", // Will be set after creation
        totalMatches,
        wins,
        losses,
        totalKills,
        totalDeaths,
        winRate: ratingComponents.winRate,
        kdRatio: ratingComponents.kdRatio,
        consistency: ratingComponents.consistency,
        overallRating: ratingComponents.overallRating,
        matchesLast30Days: 0,
        lastUpdated: now,
      },
      blacklisted: false,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    const playerId = await firestoreRepository.createDocument(
      PLAYERS_COLLECTION,
      playerData
    );

    // Update rating with correct playerId
    await firestoreRepository.updateDocument(PLAYERS_COLLECTION, playerId, {
      "rating.playerId": playerId,
    });

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_created",
        playerId,
        userId,
        { action: "created player" },
        ipAddress
      )
    );

    return {
      id: playerId,
      ...playerData,
    } as Player;
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to create player";
    throw new ServiceError(message, "CREATE_PLAYER_ERROR");
  }
};

/**
 * Get all players (excluding deleted unless specified)
 * BRANCH: feature/players-crud
 */
export const getAllPlayers = async (
  includeDeleted: boolean = false,
  page: number = 1,
  limit: number = 10
): Promise<{ players: Player[]; total: number }> => {
  try {
    const snapshot = await firestoreRepository.getDocuments(PLAYERS_COLLECTION);
    let players: Player[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!includeDeleted && data.isDeleted) return;
      players.push({
        id: doc.id,
        ...data,
      } as Player);
    });

    // Simple pagination
    const start = (page - 1) * limit;
    const paginatedPlayers = players.slice(start, start + limit);

    return {
      players: paginatedPlayers,
      total: players.length,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch players";
    throw new ServiceError(message, "GET_PLAYERS_ERROR");
  }
};

/**
 * Get player by ID
 * BRANCH: feature/players-crud
 */
export const getPlayerById = async (playerId: string): Promise<Player> => {
  try {
    const doc = await firestoreRepository.getDocumentById(
      PLAYERS_COLLECTION,
      playerId
    );

    if (!doc || doc.data()?.isDeleted) {
      throw new ServiceError(
        "Player not found",
        "PLAYER_NOT_FOUND",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Player;
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to fetch player";
    throw new ServiceError(message, "GET_PLAYER_ERROR");
  }
};

/**
 * Update player information
 * BRANCH: feature/players-crud
 */
export const updatePlayer = async (
  playerId: string,
  data: UpdatePlayerRequest,
  userId: string,
  ipAddress?: string
): Promise<Player> => {
  try {
    const existingPlayer = await getPlayerById(playerId);

    // Check if new email already exists (if email is being updated)
    if (data.email && data.email !== existingPlayer.email) {
      const emailPlayers = await firestoreRepository.queryDocuments(
        PLAYERS_COLLECTION,
        "email",
        "==",
        data.email
      );
      if (!emailPlayers.empty) {
        throw new ServiceError(
          "Email already in use",
          "EMAIL_IN_USE",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await firestoreRepository.updateDocument(
      PLAYERS_COLLECTION,
      playerId,
      updateData
    );

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_updated",
        playerId,
        userId,
        { changed_fields: Object.keys(data) },
        ipAddress
      )
    );

    return getPlayerById(playerId);
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to update player";
    throw new ServiceError(message, "UPDATE_PLAYER_ERROR");
  }
};

/**
 * Soft delete player (set isDeleted = true)
 * BRANCH: feature/players-crud
 */
export const softDeletePlayer = async (
  playerId: string,
  userId: string,
  ipAddress?: string
): Promise<void> => {
  try {
    await getPlayerById(playerId); // Verify player exists

    await firestoreRepository.updateDocument(PLAYERS_COLLECTION, playerId, {
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_deleted",
        playerId,
        userId,
        { action: "soft deleted player" },
        ipAddress
      )
    );
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to delete player";
    throw new ServiceError(message, "DELETE_PLAYER_ERROR");
  }
};

/**
 * Blacklist player
 * BRANCH: feature/blacklist-audit
 */
export const blacklistPlayer = async (
  playerId: string,
  reason: string,
  userId: string,
  ipAddress?: string
): Promise<Player> => {
  try {
    const player = await getPlayerById(playerId);

    if (player.blacklisted) {
      throw new ServiceError(
        "Player is already blacklisted",
        "PLAYER_ALREADY_BLACKLISTED",
        HTTP_STATUS.CONFLICT
      );
    }

    const blacklistData = {
      blacklisted: true,
      blacklistReason: reason,
      blacklistBy: userId,
      blacklistAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreRepository.updateDocument(
      PLAYERS_COLLECTION,
      playerId,
      blacklistData
    );

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_blacklisted",
        playerId,
        userId,
        { reason, action: "blacklisted" },
        ipAddress
      )
    );

    return getPlayerById(playerId);
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to blacklist player";
    throw new ServiceError(message, "BLACKLIST_PLAYER_ERROR");
  }
};

/**
 * Unblacklist player
 * BRANCH: feature/blacklist-audit
 */
export const unblacklistPlayer = async (
  playerId: string,
  userId: string,
  ipAddress?: string
): Promise<Player> => {
  try {
    const player = await getPlayerById(playerId);

    if (!player.blacklisted) {
      throw new ServiceError(
        "Player is not blacklisted",
        "PLAYER_NOT_BLACKLISTED",
        HTTP_STATUS.CONFLICT
      );
    }

    const unblacklistData = {
      blacklisted: false,
      blacklistReason: undefined,
      blacklistBy: undefined,
      blacklistAt: undefined,
      updatedAt: new Date(),
    };

    await firestoreRepository.updateDocument(
      PLAYERS_COLLECTION,
      playerId,
      unblacklistData
    );

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_unblacklisted",
        playerId,
        userId,
        { action: "unblacklisted" },
        ipAddress
      )
    );

    return getPlayerById(playerId);
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to unblacklist player";
    throw new ServiceError(message, "UNBLACKLIST_PLAYER_ERROR");
  }
};

/**
 * Update player stats and recalculate rating
 * BRANCH: feature/ranking-system
 */
export const updatePlayerStats = async (
  playerId: string,
  stats: UpdatePlayerStatsRequest,
  userId: string,
  ipAddress?: string
): Promise<PlayerRating> => {
  try {
    const player = await getPlayerById(playerId);
    const rating = player.rating;

    // Update stats
    const updatedRating = {
      ...rating,
      wins: stats.wins ?? rating.wins,
      losses: stats.losses ?? rating.losses,
      totalKills: stats.totalKills ?? rating.totalKills,
      totalDeaths: stats.totalDeaths ?? rating.totalDeaths,
      totalMatches:
        (stats.wins ?? rating.wins) + (stats.losses ?? rating.losses),
    };

    // Recalculate rating
    const ratingComponents = calculatePlayerRating(
      updatedRating.totalMatches,
      updatedRating.wins,
      updatedRating.totalKills,
      updatedRating.totalDeaths,
      updatedRating.matchesLast30Days
    );

    const newRating = {
      ...updatedRating,
      ...ratingComponents,
      lastUpdated: new Date(),
    };

    // Update player document
    await firestoreRepository.updateDocument(PLAYERS_COLLECTION, playerId, {
      rating: newRating,
      updatedAt: new Date(),
    });

    // Log audit entry
    await logAuditEntry(
      createPlayerAuditLog(
        "player_stats_updated",
        playerId,
        userId,
        { stats, new_rating: newRating.overallRating },
        ipAddress
      )
    );

    return newRating;
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to update player stats";
    throw new ServiceError(message, "UPDATE_STATS_ERROR");
  }
};