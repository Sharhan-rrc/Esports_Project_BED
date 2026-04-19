# Security Documentation

## Overview

This document outlines the security architecture, best practices, and guidelines for the Esports Hub Backend API. Security is implemented at multiple layers to protect data, prevent unauthorized access, and maintain system integrity.

---

## Security Layers

### 1. Environment Configuration
All sensitive data is stored in environment variables and **NOT committed to version control**.

**Required Environment Variables:**
```env
# Core Configuration
NODE_ENV=development|production
PORT=3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com

# API Configuration
SWAGGER_SERVER_URL=http://localhost:3000/api/v1

# CORS Settings
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Optional AI Service
OLLAMA_URL=http://localhost:11434
```

**Best Practices:**
- ✅ Use `.env` for development (gitignored)
- ✅ Use `.env.example` as template only (safe to commit)
- ✅ Rotate credentials if exposed
- ✅ Use different credentials for dev/staging/production
- ✅ Never hardcode secrets in source code

**⚠️ Critical:** Never commit `.env` file. If credentials are exposed:
1. Immediately rotate all keys
2. Update credentials in Firebase Console
3. Reissue service account keys if necessary

---

### 2. HTTP Security Headers (Helmet)

**Helmet** middleware adds critical security headers to all HTTP responses:

```typescript
// Configured in src/config/helmetConfig.ts
```

**Headers Applied:**
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Blocks clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS filtering
- `Strict-Transport-Security` - Enforces HTTPS (in production)
- `Content-Security-Policy` - Controls resource loading
- `Referrer-Policy` - Controls referrer information

**Development Setup:**
```typescript
app.use(helmet());
```

**Production Enhancement:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
}));
```

---

### 3. CORS (Cross-Origin Resource Sharing)

**Purpose:** Control which external domains can access the API

**Development Configuration:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

**Production Configuration:**
```env
CORS_ORIGIN=https://app.esports-hub.com,https://admin.esports-hub.com
```

**Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

**Allowed Headers:**
- `Content-Type`
- `Authorization`
- `X-Requested-With`

**Behavior:**
- ❌ Requests from unauthorized origins are rejected
- ✅ Preflight requests (`OPTIONS`) handled automatically
- ✅ Credentials allowed if explicitly enabled
- ✅ Response headers validated server-side

**Best Practices:**
- ✅ Whitelist specific domains only
- ❌ Never use `CORS_ORIGIN=*` in production
- ✅ Use HTTPS in production
- ✅ Separate credentials and tokens from cookies

---

### 4. Authentication & Authorization

#### Firebase Admin SDK

**Purpose:** Secure server-to-server communication and token verification

**Security Features:**
- Service account key authentication
- Token validation on every protected request
- Automatic token expiration handling
- Firebase Security Rules enforcement

**Implementation:**
```typescript
// src/config/firebaseConfig.ts
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});
```

**⚠️ Security Rules:** Set up proper Firestore security rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only admin can access
    match /admin/{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
    
    // Players accessible by authenticated users with proper roles
    match /players/{player=**} {
      allow read: if request.auth != null && 
        (request.auth.token.role in ['admin', 'organizer', 'enforcer', 'officer']);
      allow write: if request.auth != null && 
        (request.auth.token.role in ['admin', 'organizer']);
    }
    
    // Integrity cases for admin/enforcer only
    match /integrity/{case=**} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role in ['admin', 'enforcer']);
    }
  }
}
```

#### Token-Based Authentication

**Process:**
1. Client obtains Firebase ID Token via Firebase Auth
2. Client sends token in `Authorization: Bearer {token}` header
3. Server validates token signature and expiration
4. Server extracts user ID and role from token claims
5. Server enforces role-based access control

**Token Validation:**
```typescript
// src/api/v1/middleware/authenticate.ts
const decodedToken = await admin.auth().verifyIdToken(token);
const uid = decodedToken.uid;
const role = decodedToken.role || 'officer'; // default role
```

**Token Expiration:**
- Firebase tokens expire after 1 hour
- Client must refresh tokens periodically
- Expired tokens return 401 Unauthorized

**Best Practices:**
- ✅ Always validate token signature
- ✅ Check token expiration
- ✅ Extract user ID from token only
- ✅ Never trust client-provided user IDs
- ✅ Log failed authentication attempts
- ❌ Never store tokens in localStorage (use secure HTTP-only cookies)

#### Role-Based Access Control (RBAC)

**Four-Tier Role System:**

| Role | Permissions | Use Case |
|------|-------------|----------|
| `admin` | All operations, user management | System administrator |
| `enforcer` | Blacklist, integrity scanning | Integrity officer |
| `organizer` | Player CRUD, event management | Tournament organizer |
| `officer` | Read-only access | Observer/reporting |

**Implementation:**
```typescript
// src/api/v1/middleware/authorize.ts
const isAuthorized = (options: AuthorizationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = res.locals.role;
    if (!options.hasRole.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Insufficient permissions for this operation'
        }
      });
    }
    next();
  };
};
```

**Usage:**
```typescript
router.post(
  '/players',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'organizer'] }),
  validateRequest(schemas.create),
  createPlayer
);
```

---

### 5. Input Validation & Sanitization

**Validation Framework:** Joi

**Purpose:** Prevent invalid data and injection attacks

**Player Creation Schema Example:**
```typescript
create: {
  body: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    organization: Joi.string()
      .min(2)
      .max(100)
      .required(),
  }),
}
```

**Validation Rules:**
- ✅ Type checking (string, number, boolean)
- ✅ Format validation (email, URL, regex)
- ✅ Length constraints (min, max)
- ✅ Custom validation functions
- ✅ Whitelist allowed values (enums)
- ✅ Reject unknown properties

**Middleware Implementation:**
```typescript
// src/api/v1/middleware/validate.ts
export const validateRequest = (schemas: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        await schemas.params.validateAsync(req.params);
      }
      if (schemas.body) {
        await schemas.body.validateAsync(req.body);
      }
      if (schemas.query) {
        await schemas.query.validateAsync(req.query);
      }
      next();
    } catch (error: any) {
      res.status(422).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details.map(d => d.message)
        }
      });
    }
  };
};
```

**Best Practices:**
- ✅ Validate all input (body, params, query)
- ✅ Use strict schemas (reject unknown fields)
- ✅ Sanitize output for responses
- ✅ Never trust client-provided values
- ❌ Don't rely on client-side validation alone

---

### 6. Audit Logging

**Purpose:** Maintain accountability and security trail

**Logged Operations:**
- User authentication events
- Player CRUD operations
- Admin role assignments
- Blacklist/unblacklist actions
- Hard delete operations
- Integrity case changes
- Failed authorization attempts

**Information Captured:**
- Timestamp
- User ID and role
- Operation type (CREATE, UPDATE, DELETE)
- Resource ID
- IP address
- Request details
- Status (success/failure)

**Implementation:**
```typescript
// src/api/v1/middleware/auditLogger.ts
export const logAuditEntry = async (entry: {
  userId: string;
  operation: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'failure';
  ipAddress?: string;
}) => {
  // Store in Firestore audit collection
  await db.collection('audit_logs').add({
    ...entry,
    timestamp: new Date(),
  });
};
```

**Log Storage:**
- `audit_logs` collection in Firestore
- Indexed by timestamp and userId
- Retention: 2 years minimum
- Encrypted at rest

**Access:**
- ✅ Only admin can view audit logs
- ✅ Logs are append-only (immutable)
- ✅ Regular audit log reviews recommended

---

### 7. Data Protection

#### At Rest
- Firestore encryption: Enabled by default in GCP
- Private keys: Stored in `.env`, never committed
- Sensitive data: Use Firestore encryption rules

#### In Transit
- **HTTPS Only** (enforced in production)
- TLS 1.2+ minimum
- Certificate pinning (recommended for mobile clients)

#### Data Deletion
- **Soft Delete:** Not implemented (use blacklist instead)
- **Hard Delete:** Completely removes from Firestore
- **Audit Trail:** Deletion logged for compliance

**Example - Secure Hard Delete:**
```typescript
export const hardDeletePlayer = async (
  playerId: string,
  userId: string,
  ipAddress?: string
) => {
  // Log the deletion before removing
  await logAuditEntry({
    userId,
    operation: 'HARD_DELETE',
    resource: 'player',
    resourceId: playerId,
    status: 'success',
    ipAddress,
  });
  
  // Permanently remove from Firestore
  await db.collection('players').doc(playerId).delete();
};
```

---

### 8. Dependency Security

**Vulnerable Dependency Management:**
```bash
# Check for vulnerabilities
npm audit

# Fix known vulnerabilities
npm audit fix

# Force update
npm audit fix --force
```

**Regular Updates:**
- Review dependencies monthly
- Update minor/patch versions weekly
- Test major updates before deploying
- Subscribe to security advisories

---

### 9. Rate Limiting & DOS Protection

**Recommended (Not yet implemented):**

```typescript
import rateLimit from 'express-rate-limit';

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per windowMs
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 5 login attempts per 15 minutes
});

app.use('/api/', limiter);
app.use('/auth/login', authLimiter);
```

**Benefits:**
- ✅ Prevents brute force attacks
- ✅ Protects against DOS attacks
- ✅ Limits AI service consumption
- ✅ Identifies suspicious patterns

---

### 10. API Security Checklist

- ✅ HTTPS only in production
- ✅ Valid SSL certificates
- ✅ Security headers (Helmet)
- ✅ CORS configured
- ✅ Token-based authentication
- ✅ Role-based authorization
- ✅ Input validation
- ✅ Audit logging
- ✅ Error handling (no sensitive info leaks)
- ✅ Dependency updates current
- ✅ `.env` files gitignored
- ✅ Secrets not in code
- ✅ Firestore security rules
- ✅ Firebase Console access controlled
- ✅ Regular security reviews

---

## Security Incident Response

### If Credentials Are Exposed

1. **Immediate Actions:**
   - Rotate all exposed credentials immediately
   - Update environment variables in deployment
   - Restart all running instances

2. **Firebase Console:**
   - Generate new service account key
   - Disable old keys
   - Update firebaseConfig.ts

3. **Audit:**
   - Review audit logs for unauthorized access
   - Check for unusual activity
   - Document incident

4. **Communication:**
   - Notify affected parties if needed
   - Document remediation steps
   - Update security procedures

### If Unauthorized Access Detected

1. **Contain:**
   - Immediately rotate credentials
   - Review and revoke compromised tokens
   - Disable affected user accounts

2. **Investigate:**
   - Analyze audit logs
   - Identify affected data
   - Determine access scope

3. **Remediate:**
   - Restore from secure backup if needed
   - Patch identified vulnerabilities
   - Deploy security updates

4. **Prevent:**
   - Implement additional monitoring
   - Strengthen authentication
   - Add security headers

---

## Security Best Practices

### For Developers

- ✅ Never commit secrets
- ✅ Use environment variables
- ✅ Validate all input
- ✅ Log security events
- ✅ Use HTTPS everywhere
- ✅ Keep dependencies updated
- ✅ Review security regularly
- ❌ Don't hardcode credentials
- ❌ Don't disable validation
- ❌ Don't override auth checks

### For Administrators

- ✅ Rotate credentials regularly
- ✅ Review audit logs frequently
- ✅ Monitor for suspicious activity
- ✅ Keep systems patched
- ✅ Use strong passwords
- ✅ Enable 2FA on Firebase Console
- ❌ Share credentials via email
- ❌ Disable security features
- ❌ Use weak passwords
- ❌ Allow default configurations

### For Operations

- ✅ Enable VPC/security groups
- ✅ Use private endpoints
- ✅ Monitor API usage
- ✅ Set up alerts
- ✅ Regular backups
- ✅ Disaster recovery plan
- ❌ Expose admin endpoints
- ❌ Disable logging
- ❌ Use development settings in production
- ❌ Ignore security alerts

---

## Compliance & Standards

- **OWASP Top 10:** Addressed in design
- **Firebase Best Practices:** Implemented
- **Data Protection:** GDPR compliant design
- **Audit Trail:** Full implementation

---

## Support & Questions

For security concerns or vulnerability reports, please contact the development team immediately.

**Do not** disclose security vulnerabilities publicly. Report privately to project administrators.

