/**
 * Player rating calculation utility
 * Path: src/api/v1/utils/ratingCalculator.ts
 */



interface RatingComponents {
  winRate: number;
  kdRatio: number;
  consistency: number;
  overallRating: number;
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
    // If no deaths, ratio is infinite; cap at 5
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
  // Maximum 30 matches per month for perfect consistency
  const consistency = (matchesLast30Days / 30) * 5;
  return Math.min(consistency, 5);
};

/**
 * Calculate overall rating
 * Formula: (0.40 × WIN_RATE) + (0.35 × K/D_RATIO) + (0.25 × CONSISTENCY)
 * 
 * @param components - Rating components
 * @returns Overall rating 0-5
 */
export const calculateOverallRating = (
  components: RatingComponents
): number => {
  const overall =
    0.4 * components.winRate +
    0.35 * components.kdRatio +
    0.25 * components.consistency;

  return Math.min(Math.round(overall * 100) / 100, 5);
};

/**
 * Calculate complete player rating
 * 
 * @param totalMatches - Total matches
 * @param wins - Total wins
 * @param totalKills - Total kills
 * @param totalDeaths - Total deaths
 * @param matchesLast30Days - Matches in last 30 days
 * @returns Complete rating components and overall score
 */
export const calculatePlayerRating = (
  totalMatches: number,
  wins: number,
  totalKills: number,
  totalDeaths: number,
  matchesLast30Days: number
): RatingComponents => {
  const winRate = calculateWinRate(wins, totalMatches);
  const kdRatio = calculateKDRatio(totalKills, totalDeaths);
  const consistency = calculateConsistency(matchesLast30Days);
  const overallRating = calculateOverallRating({
    winRate,
    kdRatio,
    consistency,
    overallRating: 0, // Will be calculated
  });

  return {
    winRate,
    kdRatio,
    consistency,
    overallRating,
  };
};

/**
 * Example calculation
 * 
 * Player Stats:
 * - Total Matches: 150
 * - Wins: 105
 * - Total Kills: 3250
 * - Total Deaths: 1500
 * - Matches Last 30 Days: 18
 * 
 * Calculations:
 * WIN_RATE = (105/150) × 5 = 3.5
 * K/D_RATIO = (3250/1500) × 2.5 = 5.42 → 5.0 (capped)
 * CONSISTENCY = (18/30) × 5 = 3.0
 * 
 * OVERALL_RATING = (0.40 × 3.5) + (0.35 × 5.0) + (0.25 × 3.0)
 *                = 1.4 + 1.75 + 0.75
 *                = 3.9 out of 5
 */