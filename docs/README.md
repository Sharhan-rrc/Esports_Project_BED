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
- Player management and blacklist workflow
- Audit logging
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

## Important Files
- `docs/index.html` - Generated API documentation
- `openapi.json` - Generated OpenAPI spec
- `src/config/swaggerOptions.ts` - Swagger generation config
- `scripts/generate-openapi.ts` - OpenAPI export script
