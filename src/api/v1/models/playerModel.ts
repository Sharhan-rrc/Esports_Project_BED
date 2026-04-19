/**
 * Player model and interfaces
 * Path: src/api/v1/models/playerModel.ts
 */

/**
 * Player rating information with integrity scoring
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
  integrityScore: number; // 0-5 (behavior & trustworthiness)
  overallRating: number; // 0-5 (Final Rating with integrity)
  matchesLast30Days: number;
  riskLevel: "low" | "medium" | "high"; // Determined by integrity
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
  integrityFlags: number; // Count of integrity issues
  createdAt: Date;
  updatedAt: Date;
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
 * Player response with integrity rating
 */
export interface PlayerResponse extends Player {
  // Player already includes rating with riskLevel
}