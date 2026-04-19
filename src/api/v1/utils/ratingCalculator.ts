/**
 * Player rating calculation utility with integrity scoring
 * Path: src/api/v1/utils/ratingCalculator.ts
 */

interface RatingComponents {
  winRate: number;
  kdRatio: number;
  consistency: number;
  integrityScore: number;
  overallRating: number;
  riskLevel: "low" | "medium" | "high";
}

/**
 * Calculate win rate component (0-5)
 * Formula: (Wins / Total_Matches) × 5
 * 
 * @param wins - Total wins
 * @param totalMatches - Total matches played
 * @returns Win rate score 0-5
 */
export const calculateWinRate = (
  wins: number,
  totalMatches: number
): number => {
  if (totalMatches === 0) return 0;
  const winPercentage = wins / totalMatches;
  return Math.min(winPercentage * 5, 5);
};

/**
 * Calculate K/D ratio component (0-5)
 * Formula: (Total_Kills / Total_Deaths) × 2.5, capped at 5
 * 
 * @param kills - Total kills
 * @param deaths - Total deaths
 * @returns K/D ratio score 0-5
 */
export const calculateKDRatio = (kills: number, deaths: number): number => {
  if (deaths === 0) {
    return kills > 0 ? 5 : 0;
  }
  const kdRatio = kills / deaths;
  const score = kdRatio * 2.5;
  return Math.min(score, 5);
};

/**
 * Calculate consistency component (0-5)
 * Formula: (Matches_Last_30_Days / 30) × 5
 * 
 * @param matchesLast30Days - Matches played in last 30 days
 * @returns Consistency score 0-5
 */
export const calculateConsistency = (
  matchesLast30Days: number
): number => {
  const consistency = (matchesLast30Days / 30) * 5;
  return Math.min(consistency, 5);
};

/**
 * Calculate integrity score based on behavior
 * Penalizes: blacklist incidents, reported violations, suspicious stat spikes
 * 
 * @param blacklistCount - Number of times blacklisted
 * @param reportedCount - Number of reports/violations
 * @param suspiciousFlags - Count of detected red flags
 * @returns Integrity score 0-5 (5 = perfect integrity)
 */
export const calculateIntegrityScore = (
  blacklistCount: number,
  reportedCount: number,
  suspiciousFlags: number
): number => {
  // Start with perfect integrity
  let integrityScore = 5;

  // Deduct for blacklist incidents (-1 per incident)
  integrityScore -= blacklistCount * 1;

  // Deduct for reports/violations (-0.5 per incident)
  integrityScore -= reportedCount * 0.5;

  // Deduct for suspicious flags (-0.3 per flag)
  integrityScore -= suspiciousFlags * 0.3;

  // Floor at 0, cap at 5
  return Math.max(0, Math.min(integrityScore, 5));
};

/**
 * Determine risk level based on integrity score
 * 
 * @param integrityScore - Integrity score 0-5
 * @returns Risk level classification
 */
export const determineRiskLevel = (
  integrityScore: number
): "low" | "medium" | "high" => {
  if (integrityScore >= 4) return "low";
  if (integrityScore >= 2.5) return "medium";
  return "high";
};

/**
 * Calculate overall rating with integrity weighting
 * Formula: (0.35 × WIN_RATE) + (0.30 × K/D_RATIO) + (0.20 × CONSISTENCY) + (0.15 × INTEGRITY)
 * 
 * @param components - Rating components
 * @returns Overall rating 0-5
 */
export const calculateOverallRating = (
  components: RatingComponents
): number => {
  const overall =
    0.35 * components.winRate +
    0.30 * components.kdRatio +
    0.20 * components.consistency +
    0.15 * components.integrityScore;

  return Math.min(Math.round(overall * 100) / 100, 5);
};

/**
 * Calculate complete player rating with integrity
 * 
 * @param totalMatches - Total matches
 * @param wins - Total wins
 * @param totalKills - Total kills
 * @param totalDeaths - Total deaths
 * @param matchesLast30Days - Matches in last 30 days
 * @param blacklistCount - Times blacklisted
 * @param reportedCount - Times reported
 * @param suspiciousFlags - Detected red flags
 * @returns Complete rating components and overall score
 */
export const calculatePlayerRating = (
  totalMatches: number,
  wins: number,
  totalKills: number,
  totalDeaths: number,
  matchesLast30Days: number,
  blacklistCount: number = 0,
  reportedCount: number = 0,
  suspiciousFlags: number = 0
): RatingComponents => {
  const winRate = calculateWinRate(wins, totalMatches);
  const kdRatio = calculateKDRatio(totalKills, totalDeaths);
  const consistency = calculateConsistency(matchesLast30Days);
  const integrityScore = calculateIntegrityScore(
    blacklistCount,
    reportedCount,
    suspiciousFlags
  );
  const riskLevel = determineRiskLevel(integrityScore);

  const overallRating = calculateOverallRating({
    winRate,
    kdRatio,
    consistency,
    integrityScore,
    overallRating: 0,
    riskLevel,
  });

  return {
    winRate,
    kdRatio,
    consistency,
    integrityScore,
    overallRating,
    riskLevel,
  };
};