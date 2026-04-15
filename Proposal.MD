# Esports Hub

## Project summary

- Esports Hub is an API-first backend that stores and serves public esports data including players, teams, tournaments, matches, and aggregated statistics.
- The backend will use TypeScript, Node.js with Express, Firebase Firestore for persistence, and Firebase Authentication for identity and role claims.

- Stored player data is limited to public non-personal fields such as id, name, from, age, organization, and tournaments won.
- The project uses role-based access control with Admin, Organizer, Officer, and Enforcer roles.
- The extra implementation is player blacklist support with audit trail and soft delete.

## Objectives

- Implement a TypeScript Express backend using Firebase Firestore and Firebase Auth.
- Provide a versioned REST API at /api/v1 with OpenAPI documentation.
- Implement CRUD for Players with Joi validation and documented schemas.
- Enforce RBAC using Firebase custom claims: admin, organizer, officer, enforcer.
- Implement AI-powered integrity detection as the core component.
- Add player blacklist and hard delete for discipline.
- Add audit logging for all sensitive operations.
- Add unit and integration tests using Jest and CI using GitHub Actions.
- Publish API documentation to docs/ folder.

## Scope

In scope:
- Player model with performance and integrity scoring.
- CRUD endpoints with Joi validation and Swagger documentation.
- Role-based authorization - admin, organizer, officer, enforcer.
- Blacklist endpoints (non-permanent player discipline).
- Hard delete endpoints (permanent player removal, admin only).
- AI Integrity Detection component using Llama 3.2 (local Ollama).
- 4-factor player rating calculation with integrity scoring.
- Integrity case management (scan, list, detail, update).
- Audit logging for blacklist, delete, and AI operations.
- OpenAPI spec generation and Swagger UI.
- Admin user management and role assignment.

Out of scope:
- Team and Tournament models.
- Personal or sensitive player data (only public fields).
- SQL databases.
- Real-time WebSocket features.
- Multi-tenant support.

## Data model (high level)

Player (Firestore document):
- id (string), Firestore document id
- username (string), player name/handle
- email (string), player email
- organization (string), team/org name
- stats:
  - wins (number), total match wins
  - losses (number), total match losses
  - totalKills (number), total kills across matches
  - totalDeaths (number), total deaths across matches
  - matchesLast30Days (number), activity metric
- rating:
  - winRate (0-5), wins/(wins+losses) normalized
  - kdRatio (0-5), kills/deaths normalized
  - consistency (0-5), monthly activity score
  - integrityScore (0-5), behavior/violations score
  - overallRating (0-5), final overall rating
  - riskLevel (string), "low" | "medium" | "high"
- blacklisted (boolean, default false), discipline status
- blacklistReason (string or null), reason for blacklist
- blacklistBy (string or null), UID of admin/enforcer
- blacklistAt (timestamp or null), when blacklisted
- integrityFlags (number), count of suspicious flags
- createdAt and updatedAt (timestamps)

IntegrityCase (Firestore document):
- id (string), case identifier
- playerId (string), player under investigation
- playerUsername (string), player name for reference
- riskScore (number), 0-100 risk assessment from AI
- riskLevel (string), "low" | "medium" | "high"
- flags (array of objects):
  - flag (string), type of anomaly detected
  - severity (string), "low" | "medium" | "high"
  - reason (string), explanation of the flag
- aiAnalysis (string), LLM-generated natural language analysis
- recommendedAction (string), suggested action - "warn" | "monitor" | "temporary_ban" | "blacklist" | "clear"
- status (string), "open" | "investigating" | "resolved" | "false_positive"
- adminNotes (string), admin review comments
- createdBy (string), UID of admin/enforcer who created case
- createdAt and updatedAt (timestamps)

Audit Log (Firestore document):
- id (string), auto-generated
- action (string), type of action - "blacklist" | "unblacklist" | "hard_delete" | "scan_integrity"
- resourceType (string), "player"
- resourceId (string), player ID
- performedBy (string), user UID
- performedByRole (string), user role
- reason (string), reason for action (optional)
- timestamp (datetime), when action occurred
- meta (object), additional metadata
- ipAddress (string), client IP for audit trail

## Roles and permissions (RBAC)

- Admin: Full system access - create/update/delete players, manage roles, hard delete players, scan integrity, update integrity cases, blacklist players, manage users
- Organizer: Player management - create and update players, view all player data and ratings
- Enforcer: Integrity enforcement - scan players for violations, view/update integrity cases (not mark resolved), blacklist/unblacklist players, view cases
- Officer: Read-only access - view players, teams, ratings, and integrity cases (no modifications)

Permission Matrix:
| Action | Admin | Organizer | Enforcer | Officer |
|--------|-------|-----------|----------|---------|
| Create Player | ✅ | ✅ | ❌ | ❌ |
| Update Player | ✅ | ✅ | ❌ | ❌ |
| Hard Delete Player | ✅ | ❌ | ❌ | ❌ |
| Scan Integrity | ✅ | ❌ | ✅ | ❌ |
| Manage Cases | ✅ | ❌ | ✅ | ❌ |
| Blacklist Player | ✅ | ❌ | ✅ | ❌ |
| View Players | ✅ | ✅ | ✅ | ✅ |
| View Ratings | ✅ | ✅ | ✅ | ✅ |
| View Cases | ✅ | ❌ | ✅ | ✅ |

Enforcement approach:
- Use Firebase custom claims to store role for each user
- authenticate middleware verifies Firebase ID token and attaches req.user = { uid, role, organization }
- isAuthorized(allowedRoles) middleware checks req.user.role against allowed roles
- Audit logger writes entries to audit_logs for blacklist, integrity scan, and hard delete actions
- All sensitive operations logged with timestamp, user, role, and action details

## API surface (examples)

Players:
- GET /api/v1/players, list players (paginated, page and limit query params)
- GET /api/v1/players/:id, get player details with rating and integrity flags
- POST /api/v1/players, create player with initial stats (Admin, Organizer)
- PUT /api/v1/players/:id, update player info (Admin, Organizer)
- DELETE /api/v1/players/:id, hard delete player permanently (Admin only) - CANNOT BE UNDONE
- PATCH /api/v1/players/:id/stats, update stats and recalculate rating (Admin, Enforcer)
- GET /api/v1/players/:id/rating, get detailed rating breakdown
- POST /api/v1/players/:id/blacklist, blacklist player with reason (Admin, Enforcer)
- DELETE /api/v1/players/:id/blacklist, un-blacklist player (Admin, Enforcer)

Integrity Detection (AI-Powered):
- POST /api/v1/integrity/scan/:playerId, scan player for violations using AI analysis (Admin, Enforcer)
  - Detects K/D ratio anomalies, win rate spikes, suspicious patterns
  - Generates LLM analysis using Llama 3.2
  - Creates integrity investigation case
  - Returns risk score (0-100) and recommended action
- GET /api/v1/integrity/cases, list all integrity cases with optional status filter (Admin, Enforcer)
- GET /api/v1/integrity/cases/:caseId, get detailed case with AI analysis and flags (Admin, Enforcer)
- PATCH /api/v1/integrity/cases/:caseId, update case status and admin notes (Admin only)

Admin:
- POST /api/v1/admin/bootstrap, create first admin user (one-time, public)
- POST /api/v1/admin/assign-role, assign role to user (Admin)
- GET /api/v1/admin/users/:uid, get user details (Admin)
- POST /api/v1/admin/users/:uid/disable, disable user account (Admin)
- POST /api/v1/admin/users/:uid/enable, enable user account (Admin)

Auth:
- POST /api/v1/auth/login, login with email and password, returns JWT token
- GET /api/v1/auth/me, get current authenticated user profile

Notes:
- All endpoints validate input with Joi and return consistent response models
- All protected endpoints require Bearer token with valid Firebase JWT
- All sensitive operations are audit-logged (blacklist, delete, integrity scan)
- Endpoints and schemas are documented with OpenAPI JSDoc so swagger-jsdoc can generate openapi.json
- Swagger UI available at /api-docs for interactive API testing

## Security and configuration

- Authentication: Firebase Authentication with ID tokens and custom claims.
- Authorization: middleware validates token claims and enforces RBAC plus organization ownership.
- Validation: Joi for request validation and 422 Unprocessable Entity for validation failures.
- Hardening: Helmet, restricted CORS, express-rate-limit, and input sanitization.
- Secrets: .env and dotenv, no committed service keys or env files, use GitHub Secrets in CI.
- Error handling: centralized AppError classes and global error handler with standardized error responses.

## Documentation and deployment

- Docs generation: use swagger-jsdoc to generate OpenAPI spec from JSDoc and serve /api-docs in development.
- Static docs: generate openapi.json and deploy static docs to GitHub Pages through deploy-docs.yml and gh-pages.
- CI: ci.yml runs lint, tests, and build for pushes and pull requests on develop and main.

## Testing strategy

- Unit tests: Jest for services and controllers with mocked Firestore
- Integration tests: Firestore emulator or dedicated test Firebase project
- Key tests:
  - blacklistPlayer service updates blacklist fields and writes audit log
  - POST /players/:id/blacklist returns 200 and sets blacklisted=true for enforcer token
  - DELETE /players/:id returns 200 for Admin and permanently deletes player
  - Integrity scan creates case with risk score and AI analysis
  - integrityService.detectRedFlags identifies K/D spikes and anomalies
  - Validation failures return 422 with structured error details
  - Rating calculation returns 0-5 scale with all 4 factors

## AI Integrity Detection Component (Core Feature)

### Overview
The AI Integrity Detection component is a sophisticated fraud and violation detection system that leverages local AI (Llama 3.2) to analyze player behavior patterns and flag potential integrity issues.

### Architecture
- **Models**: `src/api/v1/models/integrityModel.ts` - IntegrityCase, IntegrityFlag data structures
- **Service**: `src/api/v1/services/integrityService.ts` - Violation detection, risk calculation, case management
- **AI Service**: `src/api/v1/services/aiService.ts` - Ollama integration for LLM analysis
- **Controller**: `src/api/v1/controllers/integrityController.ts` - HTTP request handlers
- **Routes**: `src/api/v1/routes/integrityRoutes.ts` - Integrity endpoints

### Detection Algorithms

**Red Flag Detection**:
- K/D Ratio Spike: Sudden increase (4x or more) with low match count
- Win Rate Anomaly: 80%+ win rate with fewer than 15 matches
- Suspicious Consistency: Abnormal monthly activity (>25 matches/month)
- Blacklist History: Count of prior blacklist incidents
- Reported Violations: Count of community reports

**Risk Scoring** (0-100 scale):
1. Base score from Integrity Rating (0-40)
2. Add points for detected flags:
   - High severity: +15 points
   - Medium severity: +10 points
   - Low severity: +5 points
3. Cap at 100

**Recommended Actions**:
- warn: Player has been notified
- monitor: Close observation period
- temporary_ban: Short suspension
- blacklist: Long-term discipline
- clear: No action needed

### LLM Analysis
- **Model**: Llama 3.2 (open-source, free)
- **Deployment**: Local Ollama service
- **Prompts**: Custom analysis prompts for each violation type
- **Features**:
  - Natural language case summaries
  - Context-aware recommendations
  - Explainable AI decisions
  - No sensitive data sent to external services
- **Graceful Degradation**: If Ollama unavailable, system continues without AI analysis

### Workflow
1. User initiates scan: POST /integrity/scan/:playerId
2. System detects red flags
3. LLM generates analysis (if available)
4. Case created with risk score and recommendations
5. Admin reviews case: GET /integrity/cases/:caseId
6. Admin updates status: PATCH /integrity/cases/:caseId
7. Decision logged in audit trail

### Data Flow
```
Player Stats → Red Flag Detection → Risk Scoring → LLM Analysis → Integrity Case → Admin Review → Audit Log
```

## Project structure (recommended)

/ (Repo Root)
|- src/
|  |- api/
|  |  |- v1/
|  |  |  |- controllers/
|  |  |  |  |- playerController.ts
|  |  |  |  |- integrityController.ts
|  |  |  |  |- authController.ts
|  |  |  |  |- adminController.ts
|  |  |  |- routes/
|  |  |  |  |- playerRoutes.ts
|  |  |  |  |- integrityRoutes.ts
|  |  |  |  |- authRoutes.ts
|  |  |  |  |- adminRoutes.ts
|  |  |  |- services/
|  |  |  |  |- playerService.ts
|  |  |  |  |- integrityService.ts
|  |  |  |  |- aiService.ts
|  |  |  |- models/
|  |  |  |  |- playerModel.ts
|  |  |  |  |- integrityModel.ts
|  |  |  |  |- authorizationOptions.ts
|  |  |  |- repositories/
|  |  |  |  |- firestoreRepository.ts
|  |  |  |- validations/
|  |  |  |  |- playerSchema.ts
|  |  |  |- middleware/
|  |  |  |  |- authenticate.ts
|  |  |  |  |- authorize.ts
|  |  |  |  |- auditLogger.ts
|  |  |  |  |- logger.ts
|  |  |  |  |- validate.ts
|  |  |  |  |- errorHandler.ts
|  |  |  |- errors/
|  |  |  |  |- errors.ts
|  |  |  |- utils/
|  |  |  |  |- ratingCalculator.ts
|  |  |  |  |- errorUtils.ts
|  |- config/
|  |  |- firebaseConfig.ts
|  |  |- swaggerOptions.ts
|  |  |- corsConfig.ts
|  |  |- helmetConfig.ts
|  |- constants/
|  |  |- httpConstants.ts
|  |- app.ts
|  |- server.ts
|- tests/
|  |- unit/
|  |- integration/
|  |- jest.setup.ts
|- scripts/
|  |- generate-openapi.ts
|- docs/
|  |- API.md (updated with hard delete and integrity)
|  |- README.md (updated with AI features)
|  |- DEPLOYMENT.md
|  |- SECURITY.md
|  |- index.html
|- logs/
|- openapi.json
|- package.json
|- tsconfig.json
|- jest.config.js
|- Proposal.MD
|- API_ENDPOINTS.json
```

## Branching strategy

- main: production-ready branch, protected, requires PR and passing CI.
- develop: integration branch for completed features.
- feature/<name>: feature branches such as feature/players-crud and feature/blacklist-audit, merged into develop.
- release/<version>: release prep branch, merged into main and back to develop.
- hotfix/<name>: urgent fixes from main.
- project-documentation: branch for proposal and docs updates, merged to main.

branch names: (examples)

-Implementaion: Development
- Debugging & Last minute fixes- Hotfix
- Testing- Test
- project-documentation
- Main branch will be used as last submission branch and contain all the final code and documentation.

## Issues, labels, and milestones

Labels:
- feature, bug, docs, security, enhancement, help wanted, urgent

Starter issues:
1. Implement Player model and Firestore service.
2. Implement Player CRUD endpoints with Joi validation.
3. Integrate Firebase Auth and custom claims for roles.
4. Implement blacklist endpoints and audit logging.
5. Add OpenAPI generation and serve /api-docs.
6. Add Helmet, CORS, and rate limiting middleware.
7. Add CI workflow for lint, test, and build.
8. Add Proposal.md and README with setup instructions.

## Acceptance criteria (MVP) (Checklist)

- ✅ Player CRUD endpoints are implemented and validated with Joi schemas
- ✅ Player rating calculation implemented with 4-factor formula (Win Rate, K/D, Consistency, Integrity)
- ✅ Rating includes integrity scoring with penalties for violations
- ✅ Firebase Auth is integrated and roles (Admin, Organizer, Officer, Enforcer) are enforced
- ✅ Blacklist endpoints implemented for non-permanent player discipline
- ✅ Hard delete endpoint implemented (Admin only) for permanent data removal
- ✅ AI Integrity Detection component fully implemented:
  - Detects suspicious stat patterns (K/D spikes, win rate anomalies)
  - Uses Llama 3.2 (local Ollama) for natural language analysis
  - Creates integrity investigation cases with risk scoring (0-100)
  - Case management (scan, list, detail, update)
- ✅ Audit logging for blacklist, integrity scans, and hard delete operations
- ✅ OpenAPI spec is generated and Swagger UI accessible at /api-docs
- ✅ Proposal.md and README.md updated with complete documentation
- ✅ All compilation errors resolved (0 TypeScript errors)
- ✅ API_ENDPOINTS.json and SWAGGER_DOCUMENTATION.md provided

## Risks and mitigations (Checklist)

- Unauthorized changes: enforce RBAC, validate tokens, and keep audit logs.
- Secrets leakage: keep .env in .gitignore and use GitHub Secrets.
- Firestore limits and costs: use efficient queries, pagination, and index planning.
- Incomplete tests: require CI test pass before merges.


** This Proposal might Update as required. **