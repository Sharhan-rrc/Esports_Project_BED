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
- `includeDeleted` (boolean, default: `false`)

When `includeDeleted=false`, soft-deleted players are hidden from list results.

### GET /players/:id
Returns a player by ID.

If the player is soft-deleted, this endpoint returns `404 Not Found`.

### PUT /players/:id
Updates player information.

### DELETE /players/:id
Soft deletes a player.

#### Behavior
- Does not remove the document from Firestore.
- Sets `isDeleted=true` and records `deletedAt`.
- Returns a success payload with deleted player ID.

#### Example Response
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "deleted": true
  },
  "message": "Player deleted successfully",
  "timestamp": "2026-04-11T18:22:11.211Z"
}
```

### PATCH /players/:id/restore
Restores a soft-deleted player.

#### Behavior
- Allowed roles: `admin`, `enforcer`
- Sets `isDeleted=false`
- Removes `deletedAt`
- Returns the restored player in compact response format

#### Example Response
```json
{
  "status": "success",
  "data": {
    "id": "player_abc123",
    "name": "Sam",
    "organization": "Team SL",
    "stats": {
      "totalMatches": 105,
      "wins": 95,
      "losses": 10,
      "totalKills": 702,
      "totalDeaths": 0,
      "winRate": 4.52,
      "kdRatio": 5,
      "consistency": 5,
      "overallRating": 4.81,
      "matchesLast30Days": 0
    }
  },
  "message": "Player restored successfully",
  "timestamp": "2026-04-11T18:22:11.211Z"
}
```

### POST /players/:id/blacklist
Blacklists a player.

### DELETE /players/:id/blacklist
Removes a player from blacklist.

### PUT /players/:id/stats
Updates player stats and recalculates rating.

### GET /players/:id/rating
Returns player rating details.

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
