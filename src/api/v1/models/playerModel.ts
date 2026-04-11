/**
 * Player model and interfaces
 * Path: src/api/v1/models/playerModel.ts
 */

/**
 * Player rating information
 */
export interface PlayerRating {
  playerId: string;
  totalMatches: number;
  wins: number;
  losses: number;
  totalKills: number;
  totalDeaths: number;
  winRate: number; // 0-5
  kdRatio: number; // 0-5
  consistency: number; // 0-5
  overallRating: number; // 0-5 (Final Rating)
  matchesLast30Days: number;
  lastUpdated: Date;
}

/**
 * Complete player profile
 */
export interface Player {
  id: string;
  username: string;
  email: string;
  organization: string;
  rating: PlayerRating;
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistBy?: string; // uid of admin/enforcer
  blacklistAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Player creation payload
 */
export interface CreatePlayerRequest {
  username: string;
  email: string;
  organization: string;
  wins?: number;
  losses?: number;
  totalKills?: number;
  totalDeaths?: number;
  matchesLast30Days?: number;
}

/**
 * Player update payload
 */
export interface UpdatePlayerRequest {
  username?: string;
  email?: string;
  organization?: string;
}

/**
 * Player stats update (for rating calculation)
 */
export interface UpdatePlayerStatsRequest {
  wins?: number;
  losses?: number;
  totalKills?: number;
  totalDeaths?: number;
}

/**
 * Blacklist action payload
 */
export interface BlacklistPlayerRequest {
  reason: string;
}

/**
 * Player response with rating
 */
export interface PlayerResponse extends Player {
  riskLevel?: "low" | "medium" | "high"; // Based on rating
}