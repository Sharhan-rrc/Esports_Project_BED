# Esports Hub Backend - Complete Documentation

## Project Overview

Esports Hub is a comprehensive backend API for managing professional esports tournaments, player ratings, and integrity enforcement. Built with Node.js, Express, and TypeScript, it provides a robust system for player management, skill-based rating calculation, and AI-powered fraud detection.

### Key Capabilities
- Player Management: Create, update, retrieve, and delete player profiles
- Intelligent Rating System: 4-factor rating algorithm combining skill, consistency, and integrity metrics
- AI Integrity Detection: Local Ollama integration (Llama 3.2) for suspicious player detection
- Role-Based Access Control: 4-tier permission system (admin, enforcer, organizer, officer)
- Audit Logging: Complete audit trail for sensitive operations
- Firebase Authentication: Secure token-based authentication
- API Documentation: Interactive Swagger UI with OpenAPI specification

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js | JavaScript runtime |
| Framework | Express.js | HTTP server and routing |
| Language | TypeScript | Type-safe JavaScript |
| Database | Firebase/Firestore | NoSQL document database |
| Authentication | Firebase Admin SDK | User auth and token validation |
| Input Validation | Joi | Schema validation |
| AI/ML | Ollama (Llama 3.2) | Local language model for analysis |
| Documentation | Swagger/OpenAPI | API documentation generation |
| Testing | Jest | Unit and integration testing |
| Security | Helmet, CORS | HTTP security headers |

---

## Project Structure

```
Esports_Project_BED/
├── src/
│   ├── app.ts                          # Express app configuration
│   ├── server.ts                       # Server entry point
│   ├── config/
│   │   ├── corsConfig.ts              # CORS settings
│   │   ├── firebaseConfig.ts          # Firebase initialization
│   │   ├── helmetConfig.ts            # Security headers
│   │   └── swaggerOptions.ts          # Swagger/OpenAPI config
│   ├── constants/
│   │   └── httpConstants.ts           # HTTP status codes
│   └── api/v1/
│       ├── controllers/               # HTTP request handlers
│       │   ├── adminController.ts
│       │   ├── authController.ts
│       │   ├── integrityController.ts
│       │   └── playerController.ts
│       ├── services/                  # Business logic
│       │   ├── playerService.ts
│       │   ├── integrityService.ts
│       │   └── aiService.ts
│       ├── repositories/              # Data access layer
│       │   └── firestoreRepository.ts
│       ├── routes/                    # Route definitions
│       │   ├── adminRoutes.ts
│       │   ├── authRoutes.ts
│       │   ├── integrityRoutes.ts
│       │   └── playerRoutes.ts
│       ├── middleware/                # Express middleware
│       │   ├── authenticate.ts        # Token validation
│       │   ├── authorize.ts           # Role checking
│       │   ├── auditLogger.ts         # Audit trail
│       │   ├── errorHandler.ts        # Error handling
│       │   ├── logger.ts              # Request logging
│       │   └── validate.ts            # Joi validation
│       ├── models/                    # TypeScript interfaces
│       │   ├── playerModel.ts
│       │   ├── integrityModel.ts
│       │   ├── authorizationOptions.ts
│       │   └── responseModel.ts
│       ├── validations/               # Joi schemas
│       │   └── playerSchema.ts
│       ├── errors/                    # Custom errors
│       │   └── errors.ts
│       └── utils/                     # Utilities
│           ├── ratingCalculator.ts
│           └── errorUtils.ts
├── tests/
│   ├── jest.setup.ts
│   ├── unit/
│   │   └── playerService.test.ts
│   └── integration/
│       └── integrationAuth.test.ts
├── docs/
│   ├── API.md                         # API reference
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── SECURITY.md                    # Security practices
│   ├── README.md                      # This file
│   └── index.html                     # Generated Swagger UI
├── scripts/
│   └── generate-openapi.ts            # OpenAPI spec generator
├── logs/                              # Application logs
├── jest.config.js                     # Jest configuration
├── tsconfig.json                      # TypeScript config
├── openapi.json                       # Generated OpenAPI spec
├── package.json                       # Dependencies and scripts
└── .env                               # Environment variables (not committed)
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project with service account credentials
- Ollama installed (optional, for AI features)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Node Environment
NODE_ENV=development
PORT=3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Swagger/API Docs
SWAGGER_SERVER_URL=http://localhost:3000/api/v1

# CORS Configuration (development)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Optional: AI Service
OLLAMA_URL=http://localhost:11434
```

### Step 3: Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Step 4: Verify Installation
```bash
curl http://localhost:3000/api/docs
```

---

## Core Features

### 1. Authentication
- **Firebase ID Token** based authentication
- **One-time admin bootstrap** initialization
- **Role-based access control** for all protected endpoints
- **Audit logging** of all authentication events

**Supported Roles:**
- `admin` - Full system access
- `enforcer` - Integrity enforcement capabilities
- `organizer` - Event and player management
- `officer` - Read-only access

### 2. Player Management
- Create players with optional initial statistics
- Update player information and statistics
- Query players with pagination and filters
- Blacklist/unblacklist players (reversible)
- Hard delete players (permanent removal)
- Retrieve detailed player profiles with ratings

### 3. Rating System
The **4-Factor Player Rating** algorithm:

$$\text{Overall Rating} = (WR \times 0.35) + (KD \times 0.30) + (C \times 0.20) + (IS \times 0.15)$$

Where:
- **WR (Win Rate):** (Wins / Total Matches) × 5 → [0-5]
- **KD (K/D Ratio):** (Kills / Deaths) × 2.5, capped → [0-5]
- **C (Consistency):** (Matches Last 30 Days / 30) × 5 → [0-5]
- **IS (Integrity Score):** Perfect (5.0) minus deductions → [0-5]
  - Blacklist: -1.0 per incident
  - Reports: -0.5 per incident
  - Flags: -0.3 per flag

**Risk Classification:**
- **Low Risk:** Integrity ≥ 4.0
- **Medium Risk:** Integrity 2.0-3.99
- **High Risk:** Integrity < 2.0

### 4. AI Integrity Detection
Powered by **Ollama + Llama 3.2** (runs locally on your machine):

**Detects:**
- K/D ratio anomalies and spikes
- Win rate pattern changes
- Suspicious consistency shifts
- Blacklist history analysis
- Violation pattern recognition

**Produces:**
- Risk scoring (0-100 scale)
- Detailed flag reports
- AI-generated case analysis
- Recommended actions

**Setup (Optional):**
```bash
# Install Ollama from: https://ollama.ai/download
ollama pull llama3.2
ollama serve  # Runs on http://localhost:11434
```

### 5. Discipline System

**Blacklist (Reversible):**
- Prevents event participation
- Records violation reason
- Can be removed to restore access
- Intended for minor/temporary violations

**Hard Delete (Permanent):**
- Completely removes from system
- Cannot be undone
- Requires admin approval
- Intended for major violations or cleanup

### 6. Audit Logging
- All admin operations logged
- Authentication events recorded
- Player modifications tracked
- IP addresses and timestamps recorded
- Facilitates compliance and investigation

### 7. API Security
- **Helmet:** HTTP security headers
- **CORS:** Origin validation
- **Firebase Auth:** Token verification
- **Joi Validation:** Input sanitization
- **Rate Limiting:** Available for production

---

## API Usage Examples

### 1. Initialize System
```bash
# Bootstrap first admin (one-time)
curl -X POST http://localhost:3000/api/v1/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@esports.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Authenticate
```bash
# Firebase login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token": "firebase-token-here"}'

# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {returned-token}"
```

### 3. Create Player
```bash
curl -X POST http://localhost:3000/api/v1/players \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ProGamer92",
    "email": "player@esports.com",
    "organization": "Team Acme",
    "wins": 45,
    "losses": 15,
    "totalKills": 450,
    "totalDeaths": 150,
    "matchesLast30Days": 20
  }'
```

### 4. Check Integrity
```bash
# Scan player with AI
curl -X POST http://localhost:3000/api/v1/integrity/scan/{playerId} \
  -H "Authorization: Bearer {token}"

# View investigation cases
curl -X GET "http://localhost:3000/api/v1/integrity/cases?status=open" \
  -H "Authorization: Bearer {token}"

# Get case details
curl -X GET http://localhost:3000/api/v1/integrity/cases/{caseId} \
  -H "Authorization: Bearer {token}"
```

### 5. Manage Discipline
```bash
# Blacklist player
curl -X POST http://localhost:3000/api/v1/players/{playerId}/blacklist \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cheating violation"}'

# Remove blacklist
curl -X DELETE http://localhost:3000/api/v1/players/{playerId}/blacklist \
  -H "Authorization: Bearer {token}"

# Hard delete (permanent)
curl -X DELETE http://localhost:3000/api/v1/players/{playerId} \
  -H "Authorization: Bearer {token}"
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build production bundle
npm run build

# Start production server
npm start

# Generate OpenAPI documentation
npm run docs

# Lint code
npm run lint
```

---

## Testing

### Unit Tests
```bash
npm test -- tests/unit/playerService.test.ts
```

### Integration Tests
```bash
npm test -- tests/integration/integrationAuth.test.ts
```

### Test Coverage
```bash
npm test -- --coverage
```

---

## Documentation

### API Reference
- **Location:** `docs/API.md`
- **Coverage:** Complete endpoint documentation with examples
- **Format:** Markdown with code examples

### Interactive API Docs
- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI Spec:** http://localhost:3000/api-docs/json
- **Format:** Interactive Swagger interface

### Security Guidelines
- **Location:** `docs/SECURITY.md`
- **Coverage:** Environment variables, Firebase security, best practices

### Deployment Guide
- **Location:** `docs/DEPLOYMENT.md`
- **Coverage:** Local development, GitHub Pages publishing, CI/CD

---

## Key Workflows

### Player Creation & Rating Workflow
1. Create player with initial stats
2. Rating calculated automatically
3. Monitor player performance
4. Update stats as matches progress
5. Rating recalculated on stats update

### Integrity Investigation Workflow
1. Admin/enforcer initiates scan
2. AI analyzes player statistics
3. Investigation case created
4. Case status tracked (open → investigating → resolved)
5. Recommended actions provided
6. Admin resolves or takes disciplinary action

### Player Discipline Workflow

**For Minor Violations:**
1. Admin reviews player
2. Creates blacklist entry with reason
3. Player cannot participate
4. When appropriate, unblacklist to restore

**For Major Violations:**
1. Admin confirms identity and violation
2. Creates hard delete request
3. Permanently removes from system
4. Cannot be reversed

---

## Troubleshooting

### AI Service Unavailable
**Error:** `AI_SERVICE_ERROR: AI Service unavailable`

**Solution:**
1. Ensure Ollama is running: `ollama serve`
2. Check Ollama URL in `.env` matches your setup
3. Verify Llama 3.2 model is pulled: `ollama pull llama3.2`

### Authentication Failed
**Error:** `401 Unauthorized: Invalid or expired token`

**Solution:**
1. Obtain fresh Firebase token
2. Verify token format: `Authorization: Bearer {token}`
3. Check token hasn't expired

### Player Not Found
**Error:** `404 Not Found: Player not found`

**Solution:**
1. Verify player ID is correct
2. Check player hasn't been hard deleted
3. Use `/players` endpoint to list available players

### Insufficient Permissions
**Error:** `403 Forbidden: User role insufficient`

**Solution:**
1. Check your user role: `GET /auth/me`
2. Contact admin to assign required role
3. Use admin endpoint to check: `GET /admin/users/{uid}`

---

## Performance Optimization

### Caching
- Implement Redis for player rating cache
- Cache integrity scores with TTL
- Invalidate on player stat updates

### Database Indexing
- Index on `email` for uniqueness checking
- Index on `playerId` for integrity cases
- Index on `status` for case filtering

### Rate Limiting
- Implement exponential backoff for external APIs
- Rate limit AI scan requests
- Throttle admin operations

---

## Future Enhancements

- [ ] Tournament management system
- [ ] Match result tracking and automated stats
- [ ] Real-time player status updates
- [ ] Advanced analytics dashboard
- [ ] Multi-region deployment
- [ ] Redis caching layer
- [ ] Event-based architecture
- [ ] GraphQL API alternative

---

## License & Support

**Created by:** Sharhan Kaji  
**Project Type:** Esports Hub Backend - BED Assignment  
**Institution:** RRC Polytech, Term 3

**For Support:**
- See [API.md](API.md) for complete API reference
- Check [SECURITY.md](SECURITY.md) for security best practices
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions

---

## Rating System


**Formula**: `Overall = (0.35 × Win Rate) + (0.30 × K/D) + (0.20 × Consistency) + (0.15 × Integrity)`

- **Win Rate** (35%): Success in matches (0-5)
- **K/D Ratio** (30%): Kills per death (0-5)
- **Consistency** (20%): Monthly activity (0-5)
- **Integrity Score** (15%): Behavior/violations (0-5, penalized for blacklist/reports)

**Risk Levels**:
- Low: Integrity Score ≥ 4.0
- Medium: Integrity Score 2.5-3.99
- High: Integrity Score < 2.5

## Important Files
- `docs/index.html` - Generated API documentation
- `openapi.json` - Generated OpenAPI spec
- `src/config/swaggerOptions.ts` - Swagger generation config
- `scripts/generate-openapi.ts` - OpenAPI export script
