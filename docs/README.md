# Esports Hub Backend Documentation

## Overview
Esports Hub Backend is an Express and TypeScript API for managing players, admins, authentication, and player ratings for the esports platform.

## Tech Stack
- Node.js
- Express
- TypeScript
- Firebase Admin SDK
- Joi
- Swagger / OpenAPI
- Jest

## Main Features
- Firebase authentication and admin bootstrap
- Player management with AI-powered integrity detection
- Hard delete for permanent player removal (admin only)
- Blacklist system for player discipline (non-permanent)
- AI-based fraud detection using Llama 3.2 (local Ollama)
- 4-factor player rating calculation with integrity scoring
- Integrity case management system
- Audit logging for all sensitive operations
- API validation with Joi
- Swagger API documentation
- Security middleware with CORS and Helmet

## Project Structure
- `src/app.ts` - Express app setup
- `src/server.ts` - Server entry point
- `src/config/` - App configuration files
- `src/api/v1/controllers/` - Route handlers
- `src/api/v1/services/` - Business logic
- `src/api/v1/repositories/` - Database access
- `src/api/v1/routes/` - API routes
- `src/api/v1/validations/` - Joi schemas
- `docs/` - Documentation output and markdown files

## Documentation Workflow
1. Update or add API comments in the route and schema files.
2. Run `npm run docs` on the development branch.
3. Commit generated files if needed.
4. Copy or keep the Markdown docs in `docs/` for the main branch.
5. Publish the generated HTML docs from the documentation branch with GitHub Pages.

## Player Discipline Strategy

### Blacklist (Non-Permanent)
- `POST /api/v1/players/:id/blacklist` - Blacklist a player for violations
- `DELETE /api/v1/players/:id/blacklist` - Un-blacklist a player
- Use for minor violations or rule-breaking
- Can be reversed at any time
- Prevents player from participating in events

### Hard Delete (Permanent)
- `DELETE /api/v1/players/:id` - Permanently remove player from system (admin only)
- Completely removes player record from Firestore
- Cannot be reversed - use cautiously
- Use for major violations or data cleanup

## AI Integrity Detection

### Overview
The system includes an AI-powered integrity detection component using Llama 3.2 (runs locally on your machine, completely free).

### Features
- Detects K/D ratio anomalies and stat spikes
- Identifies suspicious win rate patterns
- Flags abnormal play consistency
- Analyzes blacklist and violation history
- Generates natural language case summaries
- Risk scoring (0-100 scale)

### Setup (Optional)
```bash
# Install Ollama
# Download from: https://ollama.ai/download

# Pull Llama 3.2 model
ollama pull llama3.2

# Start Ollama service
ollama serve
# Runs on http://localhost:11434
```

### API Usage
```bash
# Scan player
POST /api/v1/integrity/scan/{playerId}

# View cases
GET /api/v1/integrity/cases

# Update case
PATCH /api/v1/integrity/cases/{caseId}
```

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
