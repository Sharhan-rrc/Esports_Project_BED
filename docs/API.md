# API Documentation

## Base URL
`http://localhost:3000/api/v1`

## Authentication
Most protected endpoints require a Firebase ID token in the `Authorization` header.

```http
Authorization: Bearer <firebase_id_token>
```

## Authentication Routes

### POST /auth/login
Verifies a Firebase ID token and returns basic user information.

#### Request Body
```json
{
  "token": "firebase-id-token-here"
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "uid": "user_123",
    "email": "user@example.com",
    "token": "firebase-id-token-here"
  }
}
```

### GET /auth/me
Returns the current authenticated user.

## Admin Routes

### POST /admin/bootstrap
Creates the first admin user.

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123!"
}
```

## Player Routes

### POST /players
Creates a new player.

#### Request Body
```json
{
  "username": "ProGamer92",
  "email": "player@example.com",
  "organization": "team_456def"
}
```

### GET /players
Returns a list of players.

#### Query Parameters
- `page` (number, default: `1`)
- `limit` (number, default: `10`, max: `100`)

### GET /players/:id
Returns a player by ID with rating and integrity information.

### PUT /players/:id
Updates player information.

### DELETE /players/:id
Permanently deletes a player (hard delete).

#### Behavior
- Allowed roles: `admin` only
- Completely removes the document from Firestore
- Cannot be undone - use with caution
- Returns a success payload with deleted player ID

#### Example Response
```json
{
  "data": {
    "id": "player_abc123",
    "permanently_deleted": true
  },
  "message": "Player permanently deleted from system"
}
```

### POST /players/:id/blacklist
Blacklists a player from participation.

#### Request Body
```json
{
  "reason": "Using unauthorized software/cheating"
}
```

#### Behavior
- Allowed roles: `admin`, `enforcer`
- Sets `blacklisted=true` and records reason
- Player is prevented from participating in events
- Non-permanent: can be reversed

### DELETE /players/:id/blacklist
Removes a player from blacklist.

#### Behavior
- Allowed roles: `admin`, `enforcer`
- Sets `blacklisted=false`
- Player can participate again

### PATCH /players/:id/stats
Updates player stats and recalculates rating.

#### Request Body
```json
{
  "wins": 50,
  "losses": 10,
  "totalKills": 1500,
  "totalDeaths": 500,
  "matchesLast30Days": 15
}
```

#### Behavior
- Allowed roles: `admin`, `enforcer`
- Updates player statistics
- Recalculates rating based on 4-factor formula:
  - Win Rate (35%): wins/(wins+losses)
  - K/D Ratio (30%): kills/deaths (capped at 5)
  - Consistency (20%): activity in last 30 days (max 30 matches)
  - Integrity Score (15%): behavioral score (0-5, penalized for violations)

### GET /players/:id/rating
Returns player rating details.

#### Response
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
