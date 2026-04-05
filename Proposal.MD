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
- Implement CRUD for Players and Teams with Joi validation and documented schemas.
- Enforce RBAC using Firebase custom claims: admin, organizer, officer, enforcer.
- Add player blacklist, audit trail, and soft delete as the extra feature.
- Add unit and integration tests using Jest and CI using GitHub Actions.
- Publish static API docs to GitHub Pages through Actions.

## Scope

In scope:
- Player and Team models and CRUD endpoints.
- Role-based authorization and Firebase Auth integration.
- Blacklist endpoints, audit logging, and soft delete by id.
- OpenAPI generation and /api-docs.
- CI for lint, test, build, and docs deployment.

Out of scope:
- Personal or sensitive data beyond listed public player fields.
- SQL databases.
- Real-time WebSocket features.

## Data model (high level)

Player (Firestore document):
- id (string), Firestore document id
- name (string)
- from (string), city or country
- age (number)
- organization (string), for example S8UL or Alter Ego
- tournamentsWon (number)
- blacklisted (boolean, default false)
- blacklistReason (string or null)
- blacklistBy (string or null), UID of enforcer or admin
- blacklistAt (timestamp or null)
- isDeleted (boolean, default false), soft delete flag
- deletedAt (timestamp or null)
- createdAt and updatedAt (timestamps)

Team:
- id, name, region, foundedAt, playerIds (array)

Tournament and Match (minimal MVP):
- tournament: id, name, season, winnerTeamId, startDate, endDate
- match: id, tournamentId, teamAId, teamBId, score, date

Audit log collection (audit_logs):
- id
- action: BLACKLIST, UNBLACKLIST, SOFT_DELETE, RESTORE
- resourceType: player
- resourceId
- performedBy (uid)
- performedByRole
- reason
- timestamp
- meta (optional)

## Roles and permissions (RBAC)

- Admin: full access to create, read, update, and soft delete players and teams, and manage roles.
- Organizer: can create and update players and teams for their organization, cannot delete, can read all players.
- Officer: read-only access to players, teams, matches, and stats.
- Enforcer: can read and update player records including blacklist fields, cannot create or delete.

Enforcement approach:
- Use Firebase custom claims to store role and organization for organizers.
- authenticate middleware verifies Firebase ID token and attaches req.user = { uid, role, organization }.
- authorize(allowedRoles: string[]) middleware checks req.user.role.
- authorizeOrg middleware ensures organizers can only update resources in their organization.
- Audit logger writes entries to audit_logs for blacklist, soft delete, and restore actions.

## API surface (examples)

Players:
- GET /api/v1/players, list players and exclude soft deleted by default
- GET /api/v1/players/:id, get player details
- POST /api/v1/players, create player for Organizer or Admin
- PUT /api/v1/players/:id, update player for Organizer (own org), Enforcer (allowed updates), or Admin
- DELETE /api/v1/players/:id, soft delete player by setting isDeleted=true and deletedAt, Admin only
- POST /api/v1/players/:id/blacklist, blacklist player for Enforcer or Admin with body { reason: string }
- POST /api/v1/players/:id/unblacklist, unblacklist player, Admin only
- POST /api/v1/players/:id/restore, restore soft deleted player, Admin only
- GET /api/v1/players?includeBlacklisted=true, controlled visibility of blacklisted players

Teams:
- GET /api/v1/teams
- GET /api/v1/teams/:id
- POST /api/v1/teams
- PUT /api/v1/teams/:id
- DELETE /api/v1/teams/:id, Admin for delete

Notes:
- All endpoints validate input with Joi and return consistent response models.
- Endpoints and schemas are documented with OpenAPI JSDoc so swagger-jsdoc can generate openapi.json.

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

- Unit tests: Jest for services and controllers with mocked Firestore.
- Integration tests: Firestore emulator or a dedicated test Firebase project, with mocked or emulator auth flows.
- Key tests:
  - blacklistPlayer service updates blacklist fields and writes audit log.
  - POST /players/:id/blacklist returns 200 and sets blacklisted=true for enforcer token.
  - DELETE /players/:id returns 403 for Organizer and 200 for Admin, and sets isDeleted and deletedAt.
  - Validation failures return 422 with structured error details.

## Project structure (recommended)

/ (Repo Root)
|- src/
|  |- api/
|  |  |- v1/
|  |  |  |- controllers/
|  |  |  |  |- player.controller.ts
|  |  |  |- routes/
|  |  |  |  |- player.routes.ts
|  |  |  |- validations/
|  |  |  |  |- player.schema.ts
|  |  |  |- services/
|  |  |     |- player.service.ts
|  |- config/
|  |  |- firebaseConfig.ts
|  |  |- swaggerOptions.ts
|  |- middleware/
|  |  |- auth.ts
|  |  |- rbac.ts
|  |  |- auditLogger.ts
|  |  |- errorHandler.ts
|  |- utils/
|  |- app.ts
|  |- server.ts
|- tests/
|- scripts/
|  |- generate-openapi.ts
|- docs/
|- openapi.json
|- .github/workflows/
|- .env.example
|- package.json
|- tsconfig.json
|- Proposal.md
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

- Player and Team CRUD endpoints are implemented and validated.
- Firebase Auth is integrated and roles are enforced for Admin, Organizer, Officer, and Enforcer.
- Blacklist endpoints are implemented and audit logs are created for blacklist, unblacklist, soft delete, and restore.
- Soft delete by id is implemented with isDeleted and deletedAt, and delete-all operations are not supported.
- OpenAPI spec is generated and accessible, and Proposal.md exists at repo root on main.
- CI runs lint and tests on pull requests.

## Risks and mitigations (Checklist)

- Unauthorized changes: enforce RBAC, validate tokens, and keep audit logs.
- Secrets leakage: keep .env in .gitignore and use GitHub Secrets.
- Firestore limits and costs: use efficient queries, pagination, and index planning.
- Incomplete tests: require CI test pass before merges.


** This Proposal might Update as required. **