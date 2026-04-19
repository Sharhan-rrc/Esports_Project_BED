/**
 * AI Service - Integrates with local Ollama (Llama 3.2)
 * Path: src/api/v1/services/aiService.ts
 */

import { ServiceError } from "../errors/errors";
import { HTTP_STATUS } from "../../../constants/httpConstants";

const OLLAMA_API_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL_NAME = "llama3.2";

/**
 * Call local Ollama API to generate AI explanation
 * Uses Llama 3.2 model running on local machine
 * 
 * @param prompt - Text prompt for AI analysis
 * @returns AI-generated explanation
 */
export const generateAIExplanation = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} - Make sure Ollama is running and llama3.2 model is downloaded`
      );
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate AI explanation";
    throw new ServiceError(
      `AI Service unavailable: ${message}. Make sure Ollama is running: ollama serve`,
      "AI_SERVICE_ERROR",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }
};

/**
 * Generate integrity case summary using AI
 * 
 * @param playerData - Player statistics
 * @param flags - Detected integrity issues
 * @returns AI-generated investigation summary
 */
export const generateIntegritySummary = async (
  playerData: {
    username: string;
    winRate: number;
    kdRatio: number;
    blacklistCount: number;
    reportedCount: number;
  },
  flags: string[]
): Promise<string> => {
  const flagsText = flags.join(", ");

  const prompt = `You are a sports integrity analyst. Analyze this player data and provide a brief (2-3 sentences) assessment:

Player: ${playerData.username}
Win Rate: ${playerData.winRate.toFixed(2)} (0-5 scale)
K/D Ratio: ${playerData.kdRatio.toFixed(2)}
Blacklist Incidents: ${playerData.blacklistCount}
Reports/Violations: ${playerData.reportedCount}
Red Flags Detected: ${flagsText}

Provide a concise professional assessment of the integrity concerns.`;

  return await generateAIExplanation(prompt);
};
