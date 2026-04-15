/**
 * Integrity service - AI-powered violation detection
 * Path: src/api/v1/services/integrityService.ts
 */

import * as firestoreRepository from "../repositories/firestoreRepository";
import * as aiService from "./aiService";
import { ServiceError } from "../errors/errors";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import { Player, PlayerRating } from "../models/playerModel";
import { IntegrityCase, IntegrityFlag } from "../models/integrityModel";
import { logAuditEntry } from "../middleware/auditLogger";

const CASES_COLLECTION = "integrity_cases";

/**
 * Detect suspicious patterns and red flags
 * 
 * @param player - Player data to analyze
 * @returns Array of detected red flags
 */
const detectRedFlags = (
  player: Player,
  rating: PlayerRating
): IntegrityFlag[] => {
  const flags: IntegrityFlag[] = [];

  // Check for K/D ratio spike (sudden increase of 2+ points)
  if (rating.kdRatio >= 4 && player.rating.totalMatches < 20) {
    flags.push({
      flag: "kdRatioSpike",
      severity: "high",
      reason: `Unusually high K/D ratio (${rating.kdRatio.toFixed(2)}) with few matches (${player.rating.totalMatches})`,
      detectedAt: new Date(),
    });
  }

  // Check for win rate spike (sudden climb to 80%+ with limited matches)
  if (rating.winRate >= 4 && player.rating.totalMatches < 15) {
    flags.push({
      flag: "winRateSpike",
      severity: "high",
      reason: `Suspicious win rate (${(rating.winRate * 20).toFixed(0)}%) with very few matches`,
      detectedAt: new Date(),
    });
  }

  // Check for abnormal consistency (too many matches in short time)
  if (rating.matchesLast30Days > 25) {
    flags.push({
      flag: "suspiciousConsistency",
      severity: "medium",
      reason: `Unusually high activity (${rating.matchesLast30Days} matches in 30 days) - possible farming`,
      detectedAt: new Date(),
    });
  }

  // Check blacklist history
  if (player.blacklisted) {
    flags.push({
      flag: "blacklistHistory",
      severity: "high",
      reason: "Player is currently blacklisted",
      detectedAt: new Date(),
    });
  }

  // Check integrity score (low score = high risk)
  if (rating.integrityScore < 2.5) {
    flags.push({
      flag: "reportedViolations",
      severity: rating.integrityScore < 1 ? "high" : "medium",
      reason: `Low integrity score: ${rating.integrityScore.toFixed(2)}/5 - prior violations detected`,
      detectedAt: new Date(),
    });
  }

  return flags;
};

/**
 * Calculate risk score (0-100) based on flags
 * 
 * @param flags - Detected red flags
 * @param integrityScore - Player integrity score
 * @returns Risk score 0-100
 */
const calculateRiskScore = (flags: IntegrityFlag[], integrityScore: number): number => {
  let riskScore = 0;

  // Base score from integrity (0-40)
  riskScore += (5 - integrityScore) * 8;

  // Add points for each flag
  flags.forEach((flag) => {
    if (flag.severity === "high") riskScore += 15;
    if (flag.severity === "medium") riskScore += 10;
    if (flag.severity === "low") riskScore += 5;
  });

  return Math.min(riskScore, 100);
};

/**
 * Scan player for integrity violations and create investigation case
 * Uses AI to generate detailed analysis
 * 
 * @param playerId - Player ID to scan
 * @param userId - Admin UUID performing scan
 * @returns Created integrity case
 */
export const scanPlayerForViolations = async (
  playerId: string,
  userId: string
): Promise<IntegrityCase> => {
  try {
    // Get player data
    const playerDoc = await firestoreRepository.getDocumentById("players", playerId);
    if (!playerDoc || !playerDoc.exists) {
      throw new ServiceError(
        "Player not found",
        "PLAYER_NOT_FOUND",
        HTTP_STATUS.NOT_FOUND
      );
    }

    const player = { id: playerDoc.id, ...playerDoc.data() } as Player;

    // Detect red flags
    const flags = detectRedFlags(player, player.rating);

    // Calculate risk score
    const riskScore = calculateRiskScore(flags, player.rating.integrityScore);

    // Determine risk level
    const riskLevel: "low" | "medium" | "high" =
      riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

    // Determine recommended action
    const recommendedAction =
      riskLevel === "high"
        ? "blacklist"
        : riskLevel === "medium"
          ? "temporary_ban"
          : "monitor";

    // Generate AI analysis using Ollama
    let aiAnalysis = "";
    try {
      aiAnalysis = await aiService.generateIntegritySummary(
        {
          username: player.username,
          winRate: player.rating.winRate,
          kdRatio: player.rating.kdRatio,
          blacklistCount: player.blacklisted ? 1 : 0,
          reportedCount: Math.round((5 - player.rating.integrityScore) * 2),
        },
        flags.map((f) => f.reason)
      );
    } catch (aiError) {
      // If AI fails, provide fallback analysis
      aiAnalysis = `Risk score: ${riskScore}/100. ${flags.length} red flags detected. Manual review recommended.`;
    }

    // Create case document
    const caseData: IntegrityCase = {
      id: "", // Will be set by Firestore
      playerId,
      playerUsername: player.username,
      playerEmail: player.email,
      riskScore,
      riskLevel,
      flags,
      aiAnalysis,
      status: "open",
      recommendedAction,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    const caseId = await firestoreRepository.createDocument(
      CASES_COLLECTION,
      caseData
    );

    // Log audit entry
    await logAuditEntry({
      action: "integrity_scan",
      userId,
      targetId: playerId,
      targetType: "player",
      changes: {
        riskScore,
        riskLevel,
        flagCount: flags.length,
        caseId,
      },
      timestamp: new Date(),
    });

    return {
      ...caseData,
      id: caseId,
    };
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to scan player";
    throw new ServiceError(message, "SCAN_ERROR");
  }
};

/**
 * Get all open integrity cases
 * 
 * @param status - Filter by case status (optional)
 * @returns List of cases
 */
export const getAllIntegrityCases = async (
  status?: "open" | "investigating" | "resolved" | "false_positive"
): Promise<IntegrityCase[]> => {
  try {
    let query = firestoreRepository.getDocuments(CASES_COLLECTION);

    // If Firestore QuerySnapshot is returned, filter manually for now
    const snapshot = await query;
    const cases: IntegrityCase[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!status || data.status === status) {
        cases.push({
          id: doc.id,
          ...data,
        } as IntegrityCase);
      }
    });

    // Sort by created date (newest first)
    cases.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return cases;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch cases";
    throw new ServiceError(message, "GET_CASES_ERROR");
  }
};

/**
 * Update integrity case status and notes
 * 
 * @param caseId - Case ID to update
 * @param status - New status
 * @param adminNotes - Admin notes
 * @param userId - Admin UUID
 * @returns Updated case
 */
export const updateIntegrityCase = async (
  caseId: string,
  status: "open" | "investigating" | "resolved" | "false_positive",
  adminNotes: string | undefined,
  userId: string
): Promise<IntegrityCase> => {
  try {
    const caseDoc = await firestoreRepository.getDocumentById(
      CASES_COLLECTION,
      caseId
    );

    if (!caseDoc || !caseDoc.exists) {
      throw new ServiceError(
        "Case not found",
        "CASE_NOT_FOUND",
        HTTP_STATUS.NOT_FOUND
      );
    }

    const updateData = {
      status,
      adminNotes: adminNotes || caseDoc.data()?.adminNotes,
      resolvedBy: status === "resolved" ? userId : caseDoc.data()?.resolvedBy,
      resolvedAt: status === "resolved" ? new Date() : caseDoc.data()?.resolvedAt,
      updatedAt: new Date(),
    };

    await firestoreRepository.updateDocument(CASES_COLLECTION, caseId, updateData);

    // Log audit entry
    await logAuditEntry({
      action: "integrity_case_updated",
      userId,
      targetId: caseId,
      targetType: "integrity_case",
      changes: { status, adminNotes },
      timestamp: new Date(),
    });

    const updatedDoc = await firestoreRepository.getDocumentById(CASES_COLLECTION, caseId);
    return {
      id: caseId,
      ...updatedDoc?.data(),
    } as IntegrityCase;
  } catch (error: unknown) {
    if (error instanceof ServiceError) throw error;
    const message =
      error instanceof Error ? error.message : "Failed to update case";
    throw new ServiceError(message, "UPDATE_CASE_ERROR");
  }
};
