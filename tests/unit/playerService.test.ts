/**
 * Player service unit tests
 * Path: tests/unit/playerService.test.ts
 * 
 * BRANCH: test/players
 * Create this branch before implementing tests
 */

import * as playerService from "../../src/api/v1/services/playerService";
import * as firestoreRepository from "../../src/api/v1/repositories/firestoreRepository";
import { ServiceError } from "../../src/api/v1/errors/errors";
import { CreatePlayerRequest } from "../../src/api/v1/models/playerModel";

// Mock the repository
jest.mock("../../src/api/v1/repositories/firestoreRepository");
jest.mock("../../src/api/v1/middleware/auditLogger");

describe("Player Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPlayer", () => {
    it("should create a new player successfully", async () => {
      // Arrange
      const createData: CreatePlayerRequest = {
        username: "ProGamer92",
        email: "player@esports.com",
        organization: "team_456def",
      };
      const userId = "admin_uid_123";
      const mockPlayerId = "player_abc123";

      (firestoreRepository.queryDocuments as jest.Mock).mockResolvedValueOnce({
        empty: true,
      });

      (firestoreRepository.createDocument as jest.Mock).mockResolvedValueOnce(
        mockPlayerId
      );

      // Act
      const result = await playerService.createPlayer(createData, userId);

      // Assert
      expect(result.id).toBe(mockPlayerId);
      expect(result.username).toBe(createData.username);
      expect(result.email).toBe(createData.email);
      expect(result.blacklisted).toBe(false);
      expect(result.rating.overallRating).toBe(0);
    });

    it("should throw error if player email already exists", async () => {
      // Arrange
      const createData: CreatePlayerRequest = {
        username: "ProGamer92",
        email: "existing@esports.com",
        organization: "team_456def",
      };

      (firestoreRepository.queryDocuments as jest.Mock).mockResolvedValueOnce({
        empty: false,
      });

      // Act & Assert
      await expect(
        playerService.createPlayer(createData, "admin_uid")
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("getPlayerById", () => {
    it("should retrieve player by ID", async () => {
      // Arrange
      const playerId = "player_abc123";
      const mockPlayer = {
        exists: true,
        id: playerId,
        data: () => ({
          username: "ProGamer92",
          email: "player@esports.com",
          organization: "team_456def",
          blacklisted: false,
          rating: { overallRating: 3.5 },
          isDeleted: false,
        }),
      };

      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValueOnce(
        mockPlayer
      );

      // Act
      const result = await playerService.getPlayerById(playerId);

      // Assert
      expect(result.id).toBe(playerId);
      expect(result.username).toBe("ProGamer92");
    });

    it("should throw error if player not found", async () => {
      // Arrange
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValueOnce(
        null
      );

      // Act & Assert
      await expect(playerService.getPlayerById("nonexistent")).rejects.toThrow(
        ServiceError
      );
    });
  });

  describe("blacklistPlayer", () => {
    it("should blacklist a player successfully", async () => {
      // Arrange
      const playerId = "player_abc123";
      const mockPlayer = {
        exists: true,
        id: playerId,
        data: () => ({
          username: "ProGamer92",
          blacklisted: false,
          isDeleted: false,
        }),
      };

      (firestoreRepository.getDocumentById as jest.Mock)
        .mockResolvedValueOnce(mockPlayer) // First call in blacklistPlayer
        .mockResolvedValueOnce(mockPlayer); // Second call in getPlayerById

      (firestoreRepository.updateDocument as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      // Act
      const result = await playerService.blacklistPlayer(
        playerId,
        "Rule violation detected",
        "enforcer_uid_123"
      );

      // Assert
      expect(firestoreRepository.updateDocument).toHaveBeenCalledWith(
        "players",
        playerId,
        expect.objectContaining({
          blacklisted: true,
          blacklistReason: "Rule violation detected",
        })
      );
    });

    it("should not blacklist already blacklisted player", async () => {
      // Arrange
      const playerId = "player_abc123";
      const mockPlayer = {
        exists: true,
        id: playerId,
        data: () => ({
          username: "ProGamer92",
          blacklisted: true, // Already blacklisted
          isDeleted: false,
        }),
      };

      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValueOnce(
        mockPlayer
      );

      // Act & Assert
      await expect(
        playerService.blacklistPlayer(
          playerId,
          "Another reason",
          "enforcer_uid"
        )
      ).rejects.toThrow(ServiceError);
    });
  });

  describe("updatePlayerStats", () => {
    it("should update player stats and recalculate rating", async () => {
      // Arrange
      const playerId = "player_abc123";
      const mockPlayer = {
        exists: true,
        id: playerId,
        data: () => ({
          username: "ProGamer92",
          rating: {
            totalMatches: 100,
            wins: 60,
            losses: 40,
            totalKills: 2000,
            totalDeaths: 1000,
            matchesLast30Days: 10,
          },
          isDeleted: false,
        }),
      };

      (firestoreRepository.getDocumentById as jest.Mock)
        .mockResolvedValueOnce(mockPlayer) // First call
        .mockResolvedValueOnce(mockPlayer); // Second call after update

      (firestoreRepository.updateDocument as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      // Act
      const result = await playerService.updatePlayerStats(
        playerId,
        { wins: 65, totalKills: 2100 },
        "enforcer_uid"
      );

      // Assert
      expect(result.overallRating).toBeGreaterThan(0);
      expect(result.overallRating).toBeLessThanOrEqual(5);
    });
  });
});