# Esports Hub API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Table of Contents
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Authentication Routes](#authentication-routes)
- [Admin Routes](#admin-routes)
- [Player Routes](#player-routes)
- [Integrity Routes](#integrity-routes)
- [Rating System](#rating-system)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

## Authentication

### Authorization Header
Most protected endpoints require a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

### Token Format
- Type: Firebase ID Token (JWT)
- Obtained from Firebase Authentication
- Include in request header for protected routes

## Role-Based Access Control

The API uses role-based authorization with four role types:

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | Full system access | Create/update/delete players, manage users, view all cases |
| `enforcer` | Integrity enforcement | Blacklist players, scan integrity, update cases |
| `organizer` | Event management | Create/update players, view player data |
| `officer` | Read-only access | View players and ratings |

---

## Authentication Routes

### POST /auth/login
Verifies a Firebase ID token and returns user information.

**Security:** No authentication required (public endpoint)

**Request Body:**
```json
{
  "token": "firebase-id-token-here"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "uid": "user_abc123",
    "email": "user@example.com",
    "token": "firebase-id-token-here"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid or expired token

---

### GET /auth/me
Returns the current authenticated user's information.

**Security:** Requires Bearer token

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "uid": "user_abc123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## Admin Routes

### POST /admin/bootstrap
Creates the first admin user. This is a **one-time operation** - subsequent calls will fail if an admin already exists.

**Security:** No authentication required (initialization only)

**Request Body:**
```json
{
  "email": "admin@esports.com",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**
- Email: Valid email format required
- Password: Minimum 8 characters

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "uid": "admin_uid_123",
    "email": "admin@esports.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `409 Conflict` - Admin user already exists
- `422 Unprocessable Entity` - Validation error

---

### POST /admin/assign-role
Assigns a role to a user.

**Security:** Requires Bearer token, Admin role only

**Request Body:**
```json
{
  "uid": "user_abc123",
  "role": "enforcer"
}
```

**Valid Roles:** `admin`, `enforcer`, `organizer`, `officer`

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "uid": "user_abc123",
    "role": "enforcer"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Admin role required
- `422 Unprocessable Entity` - Validation error

---

### GET /admin/users/{uid}
Retrieves user details (admin only).

**Security:** Requires Bearer token, Admin role only

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "uid": "user_abc123",
    "email": "user@example.com",
    "role": "enforcer",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Admin role required
- `404 Not Found` - User not found

---

## Player Routes

### POST /players
Creates a new player with optional initial statistics.

**Security:** Requires Bearer token, `admin` or `organizer` role

**Request Body:**
```json
{
  "username": "ProGamer92",
  "email": "player@esports.com",
  "organization": "team_acme",
  "wins": 45,
  "losses": 15,
  "totalKills": 450,
  "totalDeaths": 150,
  "matchesLast30Days": 22
}
```

**Validation Rules:**
- `username`: Alphanumeric only, 3-50 characters
- `email`: Valid email format, unique in database
- `organization`: 2-100 characters
- `wins`, `losses`, `totalKills`, `totalDeaths`: Non-negative integers (optional)
- `matchesLast30Days`: 0-30 (optional)

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "name": "ProGamer92",
    "organization": "team_acme",
    "stats": {
      "totalMatches": 60,
      "wins": 45,
      "losses": 15,
      "totalKills": 450,
      "totalDeaths": 150,
      "winRate": 3.75,
      "kdRatio": 3.0,
      "consistency": 3.67,
      "overallRating": 3.68,
      "matchesLast30Days": 22
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `409 Conflict` - Player email already exists

---

### GET /players
Retrieves a paginated list of players.

**Security:** Requires Bearer token, `admin`, `organizer`, `enforcer`, or `officer` role

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10, max: 100) - Results per page
- `includeDeleted` (boolean, default: false) - Include soft-deleted players
- `organization` (string, optional) - Filter by organization
- `blacklisted` (boolean, optional) - Filter by blacklist status

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "players": [
      {
        "id": "player_abc123",
        "name": "ProGamer92",
        "organization": "team_acme",
        "stats": {
          "totalMatches": 60,
          "wins": 45,
          "losses": 15,
          "totalKills": 450,
          "totalDeaths": 150,
          "winRate": 3.75,
          "kdRatio": 3.0,
          "consistency": 3.67,
          "overallRating": 3.68,
          "matchesLast30Days": 22
        }
      }
    ],
    "total": 150
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role

---

### GET /players/{playerId}
Retrieves a specific player by ID with full rating details.

**Security:** Requires Bearer token, `admin`, `organizer`, `enforcer`, or `officer` role

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "name": "ProGamer92",
    "organization": "team_acme",
    "stats": {
      "totalMatches": 60,
      "wins": 45,
      "losses": 15,
      "totalKills": 450,
      "totalDeaths": 150,
      "winRate": 3.75,
      "kdRatio": 3.0,
      "consistency": 3.67,
      "overallRating": 3.68,
      "matchesLast30Days": 22
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found

---

### GET /players/{playerId}/rating
Retrieves detailed player rating information including component breakdown.

**Security:** Requires Bearer token, `admin`, `organizer`, `enforcer`, or `officer` role

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "playerId": "player_abc123",
    "totalMatches": 60,
    "wins": 45,
    "losses": 15,
    "totalKills": 450,
    "totalDeaths": 150,
    "winRate": 3.75,
    "kdRatio": 3.0,
    "consistency": 3.67,
    "integrityScore": 5.0,
    "overallRating": 3.68,
    "riskLevel": "low",
    "matchesLast30Days": 22,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found

---

### PUT /players/{playerId}
Updates player profile information (username, email, organization).

**Security:** Requires Bearer token, `admin` or `organizer` role

**Request Body:**
```json
{
  "username": "NewUsername",
  "email": "newemail@esports.com",
  "organization": "team_updated"
}
```

**Validation Rules:**
- All fields optional
- `username`: Alphanumeric, 3-50 characters if provided
- `email`: Valid format, must be unique if provided
- `organization`: 2-100 characters if provided

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "name": "NewUsername",
    "organization": "team_updated",
    "stats": { }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found
- `422 Unprocessable Entity` - Validation error

---

### PUT /players/{playerId}/stats
Updates player game statistics and recalculates rating automatically.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Request Body:**
```json
{
  "wins": 50,
  "losses": 10,
  "totalKills": 1500,
  "totalDeaths": 500
}
```

**Validation Rules:**
- All fields optional (only provided fields are updated)
- All values must be non-negative integers

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "name": "ProGamer92",
    "organization": "team_acme",
    "stats": {
      "totalMatches": 60,
      "wins": 50,
      "losses": 10,
      "totalKills": 1500,
      "totalDeaths": 500,
      "winRate": 4.17,
      "kdRatio": 3.0,
      "consistency": 3.67,
      "overallRating": 3.76,
      "matchesLast30Days": 22
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found
- `422 Unprocessable Entity` - Validation error

---

### POST /players/{playerId}/blacklist
Blacklists a player, preventing participation in events.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Request Body:**
```json
{
  "reason": "Using unauthorized software"
}
```

**Validation Rules:**
- `reason`: String, 5-500 characters

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "blacklisted": true,
    "blacklistReason": "Using unauthorized software",
    "blacklistAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found
- `422 Unprocessable Entity` - Validation error

---

### DELETE /players/{playerId}/blacklist
Removes a player from blacklist, re-enabling event participation.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "blacklisted": false
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found

---

### DELETE /players/{playerId}
**PERMANENTLY** deletes a player record from the system. This action cannot be undone.

**Security:** Requires Bearer token, `admin` role only

**⚠️ Warning:** This operation is irreversible and completely removes the player from Firestore. Use for major violations or data cleanup only.

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "permanently_deleted": true
  },
  "message": "Player permanently deleted from system"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Admin role required
- `404 Not Found` - Player not found

---

## Integrity Routes

### POST /integrity/scan/{playerId}
Scans a player for integrity violations using AI analysis. Creates an investigation case with risk assessment and recommendations.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Behavior:**
- Uses local Ollama (Llama 3.2) for AI analysis
- Detects stat anomalies, suspicious patterns
- Generates risk score (0-100)
- Creates investigation case record

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "caseId": "case_xyz789",
    "playerId": "player_abc123",
    "playerUsername": "ProGamer92",
    "riskScore": 75,
    "riskLevel": "high",
    "flags": [
      {
        "flag": "kdRatioSpike",
        "severity": "high",
        "reason": "K/D ratio increased 300% in last 30 days",
        "detectedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "aiAnalysis": "Player shows significant statistical anomalies suggesting possible unfair play...",
    "status": "open",
    "recommendedAction": "monitor",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Player not found
- `503 Service Unavailable` - Ollama service not running

---

### GET /integrity/cases
Retrieves all integrity investigation cases with optional filtering.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Query Parameters:**
- `status` (string, optional) - Filter by status: `open`, `investigating`, `resolved`, `false_positive`

**Success Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "case_xyz789",
      "playerId": "player_abc123",
      "playerUsername": "ProGamer92",
      "riskScore": 75,
      "riskLevel": "high",
      "status": "investigating",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role

---

### GET /integrity/cases/{caseId}
Retrieves detailed information about a specific integrity case with AI analysis.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "case_xyz789",
    "playerId": "player_abc123",
    "playerUsername": "ProGamer92",
    "playerEmail": "player@esports.com",
    "riskScore": 75,
    "riskLevel": "high",
    "flags": [
      {
        "flag": "kdRatioSpike",
        "severity": "high",
        "reason": "K/D ratio increased 300% in last 30 days",
        "detectedAt": "2024-01-15T10:30:00Z"
      },
      {
        "flag": "winRateSpike",
        "severity": "medium",
        "reason": "Win rate increased 40% in last week",
        "detectedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "aiAnalysis": "Player demonstrates significant statistical anomalies...",
    "status": "investigating",
    "recommendedAction": "monitor",
    "adminNotes": "Under active investigation. Further monitoring recommended.",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Case not found

---

### PATCH /integrity/cases/{caseId}
Updates the status and notes of an integrity investigation case.

**Security:** Requires Bearer token, `admin` or `enforcer` role

**Request Body:**
```json
{
  "status": "resolved",
  "adminNotes": "Investigation complete. No evidence of cheating found.",
  "recommendedAction": "clear"
}
```

**Valid Status Values:** `open`, `investigating`, `resolved`, `false_positive`

**Valid Actions:** `warn`, `monitor`, `temporary_ban`, `blacklist`, `clear`

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "case_xyz789",
    "playerId": "player_abc123",
    "status": "resolved",
    "adminNotes": "Investigation complete. No evidence of cheating found.",
    "recommendedAction": "clear",
    "resolvedBy": "admin_uid_123",
    "resolvedAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Case not found
- `422 Unprocessable Entity` - Validation error

---

## Rating System

### Overview
The player rating system is a comprehensive 4-factor model that assesses player skill and integrity on a 0-5 scale. Each component is weighted to produce an overall rating.

### Rating Formula

**Overall Rating = (Win Rate × 0.35) + (K/D Ratio × 0.30) + (Consistency × 0.20) + (Integrity Score × 0.15)**

### Components

#### 1. Win Rate (35% weight)
- **Calculation:** (Wins / Total Matches) × 5
- **Range:** 0-5
- **Example:** 50 wins out of 100 matches = 2.5

#### 2. K/D Ratio (30% weight)
- **Calculation:** (Total Kills / Total Deaths) × 2.5, capped at 5
- **Range:** 0-5
- **Special Case:** If deaths = 0 and kills > 0, score = 5
- **Example:** 1500 kills, 500 deaths = (1500/500) × 2.5 = 7.5 → capped at 5

#### 3. Consistency (20% weight)
- **Calculation:** (Matches Last 30 Days / 30) × 5
- **Range:** 0-5
- **Maximum:** 30 matches tracked per month
- **Example:** 20 matches in last 30 days = (20/30) × 5 = 3.33

#### 4. Integrity Score (15% weight)
- **Base:** 5.0 (perfect integrity)
- **Deductions:**
  - -1.0 per blacklist incident
  - -0.5 per report/violation
  - -0.3 per suspicious flag detected
- **Range:** 0-5 (minimum 0, maximum 5)
- **Example:** No incidents = 5.0, One blacklist = 4.0

### Risk Level Classification

| Risk Level | Integrity Score | Action |
|-----------|-----------------|--------|
| Low | 4.0-5.0 | No action required |
| Medium | 2.0-3.99 | Monitor player activity |
| High | 0.0-1.99 | Investigate, consider sanctions |

---

## Response Format

### Success Response
All successful responses follow this format:

```json
{
  "status": "success",
  "data": { },
  "message": "Operation completed successfully"
}
```

- `status`: Always `"success"` for 2xx responses
- `data`: Response payload (varies by endpoint)
- `message`: Human-readable description (optional)

### Error Response
All error responses follow this format:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

- `status`: Always `"error"` for error responses
- `error.code`: Machine-readable error code
- `error.message`: Human-readable description

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Typical Causes |
|------|---------|-----------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation error in request body |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | External service (e.g., Ollama) is down |

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `INVALID_TOKEN` | Missing or invalid authentication token | Include valid Bearer token in Authorization header |
| `INSUFFICIENT_ROLE` | User role insufficient for this operation | Contact admin to request role upgrade |
| `PLAYER_EXISTS` | Player with this email already exists | Use different email address |
| `PLAYER_NOT_FOUND` | Player ID not found in database | Verify player ID is correct |
| `AI_SERVICE_ERROR` | Ollama/AI service unavailable | Ensure Ollama is running: `ollama serve` |
| `VALIDATION_ERROR` | Invalid input parameters | Review request body against endpoint documentation |

---

## Quick Examples

### Create Player and Check Rating
```bash
# 1. Create player
curl -X POST http://localhost:3000/api/v1/players \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ProGamer92",
    "email": "player@esports.com",
    "organization": "team_acme",
    "wins": 45,
    "losses": 15,
    "totalKills": 450,
    "totalDeaths": 150,
    "matchesLast30Days": 22
  }'

# 2. Get player rating
curl -X GET http://localhost:3000/api/v1/players/{playerId}/rating \
  -H "Authorization: Bearer {token}"
```

### Integrity Investigation Workflow
```bash
# 1. Scan player for violations
curl -X POST http://localhost:3000/api/v1/integrity/scan/{playerId} \
  -H "Authorization: Bearer {token}"

# 2. View all open cases
curl -X GET "http://localhost:3000/api/v1/integrity/cases?status=open" \
  -H "Authorization: Bearer {token}"

# 3. Get case details
curl -X GET http://localhost:3000/api/v1/integrity/cases/{caseId} \
  -H "Authorization: Bearer {token}"

# 4. Update case status
curl -X PATCH http://localhost:3000/api/v1/integrity/cases/{caseId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "adminNotes": "Cleared after investigation",
    "recommendedAction": "clear"
  }'
```

### Player Discipline
```bash
# 1. Blacklist player
curl -X POST http://localhost:3000/api/v1/players/{playerId}/blacklist \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cheating violation"}'

# 2. Permanently delete player
curl -X DELETE http://localhost:3000/api/v1/players/{playerId} \
  -H "Authorization: Bearer {token}"

# 3. Unblacklist player
curl -X DELETE http://localhost:3000/api/v1/players/{playerId}/blacklist \
  -H "Authorization: Bearer {token}"
```

---

## Additional Resources

- **Swagger UI:** Visit `/api-docs` for interactive API exploration
- **OpenAPI Spec:** Available at `/api-docs/json`
- **Deployment Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security Guide:** See [SECURITY.md](SECURITY.md)
```json
{
  "data": {
    "winRate": 4.2,
    "kdRatio": 2.8,
    "consistency": 3.5,
    "integrityScore": 4.5,
    "overallRating": 3.8,
    "riskLevel": "low"
  }
}
```

## Integrity Routes (AI-Powered Detection)

### POST /integrity/scan/:playerId
Scans a player for integrity violations using AI analysis.

#### Behavior
- Allowed roles: `admin`, `enforcer`
- Analyzes player stats for suspicious patterns
- Uses Llama 3.2 LLM (local Ollama) for natural language analysis
- Creates an integrity investigation case
- No auto-bans: admin must review and make final decision

#### Response (201)
```json
{
  "data": {
    "caseId": "case_abc123",
    "playerId": "player_xyz",
    "riskScore": 72,
    "riskLevel": "high",
    "flags": [
      {
        "flag": "kdRatioSpike",
        "severity": "high",
        "reason": "K/D ratio jumped 4x in last 5 matches"
      }
    ],
    "aiAnalysis": "This player shows significant anomalies in performance metrics...",
    "recommendedAction": "blacklist",
    "status": "open"
  }
}
```

### GET /integrity/cases
Returns all integrity investigation cases.

#### Query Parameters
- `status` (string, optional): Filter by status - `open`, `investigating`, `resolved`, `false_positive`

#### Response
```json
{
  "data": {
    "cases": [
      {
        "id": "case_abc123",
        "playerId": "player_xyz",
        "playerUsername": "ProPlayer92",
        "riskScore": 72,
        "riskLevel": "high",
        "status": "open",
        "createdAt": "2026-04-14T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

### GET /integrity/cases/:caseId
Returns detailed integrity case information.

#### Response
```json
{
  "data": {
    "id": "case_abc123",
    "playerId": "player_xyz",
    "playerUsername": "ProPlayer92",
    "riskScore": 72,
    "riskLevel": "high",
    "flags": [...],
    "aiAnalysis": "...",
    "status": "investigating",
    "recommendedAction": "blacklist",
    "adminNotes": "User manually reviewed on 2026-04-14",
    "createdAt": "2026-04-14T10:00:00Z",
    "updatedAt": "2026-04-14T11:30:00Z"
  }
}
```

### PATCH /integrity/cases/:caseId
Updates integrity case status and notes.

#### Allowed roles: `admin` only

#### Request Body
```json
{
  "status": "resolved",
  "adminNotes": "Confirmed violation - player blacklisted"
}
```

#### Behavior
- Updates case status: `open` → `investigating` → `resolved` or `false_positive`
- Records admin notes for audit trail
- Timestamp automatically updated

## Common Responses
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not allowed
- `404 Not Found` - Resource missing
- `409 Conflict` - Duplicate resource

## Soft Delete Lifecycle
1. Call `DELETE /players/:id` to soft delete a player.
2. Player is hidden from `GET /players` and `GET /players/:id` by default.
3. Use `GET /players?includeDeleted=true` to view deleted players in list output.
4. Call `PATCH /players/:id/restore` to reactivate a deleted player.
