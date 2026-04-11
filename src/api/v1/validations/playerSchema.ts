/**
 * Player validation schemas using Joi
 * Path: src/api/v1/validations/playerSchema.ts
 */

import Joi from "joi";

/**
 * @openapi
 * components:
 *   schemas:
 *     Player:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - email
 *         - organization
 *       properties:
 *         id:
 *           type: string
 *           description: Player unique identifier
 *           example: "player_abc123xyz789"
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Player username
 *           example: "ProGamer92"
 *         email:
 *           type: string
 *           format: email
 *           description: Player email address
 *           example: "player@esports.com"
 *         organization:
 *           type: string
 *           description: Organization/team name
 *           example: "team_456def"
 *         blacklisted:
 *           type: boolean
 *           default: false
 *           description: Whether player is blacklisted
 *         blacklistReason:
 *           type: string
 *           description: Reason for blacklist if applicable
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When player was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When player was last updated
 */

export const playerSchemas = {
  // POST /players - Create new player
  create: {
    body: Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(50)
        .required()
        .messages({
          "any.required": "Username is required",
          "string.empty": "Username cannot be empty",
          "string.alphanum": "Username must contain only alphanumeric characters",
          "string.min": "Username must be at least 3 characters",
          "string.max": "Username must be at most 50 characters",
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          "any.required": "Email is required",
          "string.email": "Email must be valid",
        }),
      organization: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          "any.required": "Organization is required",
          "string.min": "Organization must be at least 2 characters",
        }),
      wins: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Wins cannot be negative",
          "number.base": "Wins must be a number",
        }),
      losses: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Losses cannot be negative",
          "number.base": "Losses must be a number",
        }),
      totalKills: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Total kills cannot be negative",
          "number.base": "Total kills must be a number",
        }),
      totalDeaths: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Total deaths cannot be negative",
          "number.base": "Total deaths must be a number",
        }),
      matchesLast30Days: Joi.number()
        .integer()
        .min(0)
        .max(30)
        .optional()
        .messages({
          "number.min": "Matches last 30 days cannot be negative",
          "number.max": "Maximum 30 matches per month for consistency calculation",
          "number.base": "Matches last 30 days must be a number",
        }),
    }),
  },

  // GET /players - List players
  list: {
    query: Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          "number.min": "Page must be at least 1",
        }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
          "number.min": "Limit must be at least 1",
          "number.max": "Limit cannot exceed 100",
        }),
      includeDeleted: Joi.boolean()
        .default(false)
        .messages({
          "boolean.base": "includeDeleted must be true or false",
        }),
      organization: Joi.string()
        .optional()
        .messages({
          "string.base": "Organization must be a string",
        }),
      blacklisted: Joi.boolean()
        .optional()
        .messages({
          "boolean.base": "Blacklisted must be true or false",
        }),
    }),
  },

  // GET /players/:id - Get player by ID
  getById: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
          "string.empty": "Player ID cannot be empty",
        }),
    }),
  },

  // PUT /players/:id - Update player
  update: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
    body: Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(50)
        .optional()
        .messages({
          "string.alphanum": "Username must contain only alphanumeric characters",
          "string.min": "Username must be at least 3 characters",
        }),
      email: Joi.string()
        .email()
        .optional()
        .messages({
          "string.email": "Email must be valid",
        }),
      organization: Joi.string()
        .min(2)
        .max(100)
        .optional(),
    }).min(1),
  },

  // DELETE /players/:id - Delete player
  delete: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
  },

  // PATCH /players/:id/restore - Restore deleted player
  restore: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
  },

  // POST /players/:id/blacklist - Blacklist player
  blacklist: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
    body: Joi.object({
      reason: Joi.string()
        .min(5)
        .max(500)
        .required()
        .messages({
          "any.required": "Blacklist reason is required",
          "string.min": "Reason must be at least 5 characters",
          "string.max": "Reason cannot exceed 500 characters",
        }),
    }),
  },

  // DELETE /players/:id/blacklist - Unblacklist player
  unblacklist: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
  },

  // PUT /players/:id/stats - Update player stats
  updateStats: {
    params: Joi.object({
      id: Joi.string()
        .required()
        .messages({
          "any.required": "Player ID is required",
        }),
    }),
    body: Joi.object({
      wins: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Wins cannot be negative",
        }),
      losses: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Losses cannot be negative",
        }),
      totalKills: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Total kills cannot be negative",
        }),
      totalDeaths: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          "number.min": "Total deaths cannot be negative",
        }),
    }).min(1),
  },
};