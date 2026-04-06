# Security Documentation

## Overview
This project uses standard API security practices to protect endpoints and configuration.

## Environment Variables
Sensitive values are stored in `.env` and not committed to the repository.

Example values include:
- `NODE_ENV`
- `PORT`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `SWAGGER_SERVER_URL`

## Helmet
Helmet adds security-related HTTP headers to the API response.

Purpose:
- hide server details
- reduce common browser-based attack risks
- improve baseline HTTP security

## CORS
CORS controls which origins can call the API.

Development behavior:
- allow local testing more freely

Production behavior:
- restrict origins using environment settings
- allow only approved methods and headers

## Firebase Admin
Firebase Admin SDK is initialized with service account credentials from environment variables.

Security rules:
- never hardcode secrets in source files
- do not commit real private keys
- rotate credentials if exposed

## Good Practices
- Keep `.env` out of Git
- Use `.env.example` for placeholders only
- Protect admin routes with authentication
- Validate all request bodies with Joi
- Use HTTPS in production
