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

### GET /players/:id
Returns a player by ID.

### PUT /players/:id
Updates player information.

### DELETE /players/:id
Soft deletes a player.

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
- `204 No Content` - Successful delete
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not allowed
- `404 Not Found` - Resource missing
- `409 Conflict` - Duplicate resource
