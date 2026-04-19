# Deployment Documentation

## Table of Contents
- [Local Development](#local-development)
- [Development Branch Workflow](#development-branch-workflow)
- [Production Deployment](#production-deployment)
- [GitHub Pages Documentation](#github-pages-documentation)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git
- Firebase project with service account credentials
- Ollama (optional, for AI features)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/esports-hub-backend.git
cd esports-hub-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create a `.env` file in the root directory:

```env
# Development Environment
NODE_ENV=development
PORT=3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[...]\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com

# API Documentation
SWAGGER_SERVER_URL=http://localhost:3000/api/v1

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Optional: AI Service (Ollama)
OLLAMA_URL=http://localhost:11434
```

**To get Firebase credentials:**
1. Go to Firebase Console
2. Select your project
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Copy credentials to `.env`

### Step 4: Set Up Ollama (Optional)

For AI integrity detection features:

```bash
# Install Ollama
# Windows/Mac: Download from https://ollama.ai/download

# Pull Llama 3.2 model
ollama pull llama3.2

# Start Ollama service (runs on port 11434)
ollama serve
```

Ollama will run at `http://localhost:11434`

### Step 5: Run Development Server

```bash
# Start with hot reload
npm run dev

# Output:
# Server running on http://localhost:3000
# API Documentation: http://localhost:3000/api-docs
```

### Step 6: Verify Installation

```bash
# Check API is running
curl http://localhost:3000/api-docs

# Check auth endpoint
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}'
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run unit tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run integration tests
npm test -- tests/integration/

# Lint TypeScript files
npm run lint

# Format code
npm run format

# Generate OpenAPI documentation
npm run docs

# Build production bundle
npm run build

# Start production server
npm start
```

---

## Development Branch Workflow

### Branch Strategy

```
main (production)
  ↑
  ├─ staging (staging environment)
  ↓
development (development environment)
  ├─ feature/* (feature branches)
  ├─ bugfix/* (bug fix branches)
  └─ docs/* (documentation)

documentation (GitHub Pages)
  └─ Generated docs only
```

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

3. **Push to Remote**
   ```bash
   git push origin feature/your-feature
   ```

4. **Create Pull Request**
   - Go to GitHub repository
   - Create PR from `feature/your-feature` → `development`
   - Add description and tests
   - Request review

5. **Merge After Approval**
   ```bash
   git checkout development
   git pull origin development
   git merge feature/your-feature
   git push origin development
   ```

### Generating Documentation

On the development branch:

```bash
# Generate OpenAPI spec and Swagger UI
npm run docs

# This creates/updates:
# - openapi.json
# - docs/index.html

# Commit the generated files
git add openapi.json docs/index.html
git commit -m "docs: generate OpenAPI documentation"
git push origin development
```

### Documentation Branch Workflow

**Important:** Keep `documentation` branch separate from `main` and `development`

1. **Create/Update Documentation Branch**
   ```bash
   # First time setup
   git checkout --orphan documentation
   git rm -rf .
   
   # Or update existing
   git checkout documentation
   ```

2. **Copy Generated Files**
   ```bash
   # From development branch
   git checkout development -- docs/index.html openapi.json

   # Copy to root if needed for Pages
   cp docs/index.html .
   ```

3. **Commit Documentation**
   ```bash
   git add docs/index.html openapi.json
   git commit -m "docs: update generated API documentation"
   git push origin documentation
   ```

4. **Configure GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from branch
   - Branch: `documentation`
   - Folder: `/docs`
   - Click Save

5. **Access Published Docs**
   - URL: `https://your-org.github.io/esports-hub-backend/`
   - Swagger UI loads automatically from `docs/index.html`

---

## Production Deployment

### Cloud Platform Options

#### Option 1: Google Cloud Run (Recommended)

**Advantages:**
- Serverless (auto-scaling)
- Pay per request
- Easy Firebase integration
- Docker support

**Setup:**

1. **Create Dockerfile**
   ```dockerfile
   # Use official Node.js runtime
   FROM node:18-alpine

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm ci --only=production

   # Copy application
   COPY . .

   # Build TypeScript
   RUN npm run build

   # Expose port
   EXPOSE 3000

   # Start server
   CMD ["npm", "start"]
   ```

2. **Build & Push Docker Image**
   ```bash
   # Build image
   docker build -t gcr.io/your-project/esports-hub:v1.0.0 .

   # Push to Google Container Registry
   docker push gcr.io/your-project/esports-hub:v1.0.0
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy esports-hub \
     --image gcr.io/your-project/esports-hub:v1.0.0 \
     --platform managed \
     --region us-central1 \
     --memory 512Mi \
     --cpu 1 \
     --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=your-project \
     --set-env-vars FIREBASE_PRIVATE_KEY="$(cat .env | grep FIREBASE_PRIVATE_KEY | cut -d= -f2)" \
     --set-env-vars FIREBASE_CLIENT_EMAIL="$(cat .env | grep FIREBASE_CLIENT_EMAIL | cut -d= -f2)"
   ```

#### Option 2: Heroku

**Setup:**

1. **Create Procfile**
   ```
   web: npm start
   ```

2. **Create app**
   ```bash
   heroku create esports-hub-prod
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FIREBASE_PROJECT_ID=your-project
   # ... set other env vars
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Option 3: AWS Elastic Beanstalk

**Setup:**

1. **Create `.ebextensions/nodecommand.config`**
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: npm start
   ```

2. **Initialize EB CLI**
   ```bash
   eb init -p node.js-18 esports-hub
   eb create production
   ```

3. **Set environment variables**
   ```bash
   eb setenv NODE_ENV=production FIREBASE_PROJECT_ID=your-project
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### Environment Configuration for Production

Create `.env.production`:

```env
# Production Settings
NODE_ENV=production
PORT=3000

# Firebase (use production project)
FIREBASE_PROJECT_ID=esports-hub-prod
FIREBASE_PRIVATE_KEY="[production key]"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@esports-hub-prod.iam.gserviceaccount.com

# API Server
SWAGGER_SERVER_URL=https://api.esports-hub.com/api/v1

# CORS - Production Domains Only
CORS_ORIGIN=https://app.esports-hub.com,https://admin.esports-hub.com

# AI Service (if using Ollama in production)
OLLAMA_URL=https://ai-service.internal.com:11434
```

### Production Database Setup

**Firestore Security Rules (Production):**

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Admin collection
    match /admin/{doc=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
    
    // Players
    match /players/{player=**} {
      allow read: if isAuthenticated() && 
        request.auth.token.role in ['admin', 'organizer', 'enforcer', 'officer'];
      allow create, update: if isAuthenticated() && 
        request.auth.token.role in ['admin', 'organizer'];
      allow delete: if isAuthenticated() && 
        request.auth.token.role == 'admin';
    }
    
    // Integrity cases
    match /integrity/{case=**} {
      allow read: if isAuthenticated() && 
        request.auth.token.role in ['admin', 'enforcer'];
      allow create, update: if isAuthenticated() && 
        request.auth.token.role in ['admin', 'enforcer'];
    }
    
    // Audit logs (read-only for admins)
    match /audit_logs/{log=**} {
      allow read: if isAuthenticated() && 
        request.auth.token.role == 'admin';
      allow write: if request.auth != null;
    }
  }
  
  function isAuthenticated() {
    return request.auth != null;
  }
}
```

### Production Checklist

- ✅ Environment variables configured
- ✅ Firestore security rules deployed
- ✅ HTTPS enabled
- ✅ CORS restricted to production domains
- ✅ Logging enabled and monitored
- ✅ Error tracking configured (Sentry, etc.)
- ✅ Database backups scheduled
- ✅ SSL certificates installed
- ✅ Load balancer configured
- ✅ Auto-scaling policies set
- ✅ Health checks enabled
- ✅ Monitoring & alerts configured
- ✅ Disaster recovery plan documented

---

## GitHub Pages Documentation

### Publish API Documentation

The API documentation is generated from source code comments using Swagger/OpenAPI.

**Process:**

1. **Generate Documentation**
   ```bash
   npm run docs
   ```

2. **Commit to development**
   ```bash
   git add openapi.json docs/
   git commit -m "docs: update API documentation"
   git push origin development
   ```

3. **Switch to documentation branch**
   ```bash
   git checkout documentation
   ```

4. **Update from development**
   ```bash
   git checkout development -- docs/index.html openapi.json
   ```

5. **Commit and push**
   ```bash
   git add docs/index.html openapi.json
   git commit -m "docs: sync generated documentation"
   git push origin documentation
   ```

### GitHub Pages Configuration

1. Go to repository Settings
2. Navigate to Pages (left sidebar)
3. Source: Deploy from a branch
4. Branch: `documentation`
5. Folder: `/` or `/docs` (based on structure)
6. Click Save

**Access Documentation:**
```
https://your-org.github.io/esports-hub-backend/
```

---

## Environment Configuration

### Development
```env
NODE_ENV=development
PORT=3000
FIREBASE_PROJECT_ID=esports-hub-dev
CORS_ORIGIN=http://localhost:*
```

### Staging
```env
NODE_ENV=staging
PORT=3000
FIREBASE_PROJECT_ID=esports-hub-staging
CORS_ORIGIN=https://staging.esports-hub.com
```

### Production
```env
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=esports-hub-prod
CORS_ORIGIN=https://app.esports-hub.com
```

### Adding New Environment Variables

1. Add to `.env.example` (without actual value)
2. Add to deployment platform settings
3. Document in `.env` template
4. Use `process.env.YOUR_VAR` in code
5. Provide default fallback: `process.env.YOUR_VAR || 'default-value'`

---

## Monitoring & Maintenance

### Application Monitoring

**Recommended Tools:**
- Google Cloud Monitoring
- Datadog
- New Relic
- Sentry (error tracking)

### Key Metrics to Monitor

```typescript
// Server health
- Response time (ms)
- Error rate (%)
- Request throughput (req/sec)
- Database query time (ms)

// Business metrics
- Players created (daily)
- Integrity scans (daily)
- API usage by endpoint
- Authentication failures
```

### Log Aggregation

```bash
# Cloud Logging (GCP)
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View specific service logs
gcloud logging read "resource.service_name=esports-hub" --limit 100
```

### Database Backups

**Firestore Backups:**
```bash
# Automated daily backups (set in GCP Console)
# Or use manual export:

gcloud firestore export gs://your-backup-bucket/backup-2024-01-15
```

### Performance Optimization

1. **Enable Firestore Indexing**
   - Index frequently filtered fields
   - Composite indexes for complex queries

2. **Add Caching Layer**
   - Redis for rating cache
   - Cache integrity scores with TTL

3. **Database Query Optimization**
   - Limit query results
   - Use pagination
   - Add appropriate indexes

### Scaling Strategy

**Horizontal Scaling:**
- Cloud Run handles automatically
- Multiple instances load-balanced

**Vertical Scaling:**
- Increase CPU/Memory on Cloud Run
- Monitor resource usage

**Database Scaling:**
- Firestore scales automatically
- Monitor read/write operations

---

## Troubleshooting

### Server Won't Start

**Error:** `Port already in use`
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Error:** `Firebase initialization failed`
```bash
# Check .env variables
echo $FIREBASE_PROJECT_ID

# Verify JSON format of FIREBASE_PRIVATE_KEY
npm run dev 2>&1 | head -50
```

### API Not Responding

**Check:**
1. Server is running: `npm run dev`
2. Correct port: `PORT=3000`
3. CORS configured correctly
4. Firewall allows traffic

```bash
# Test endpoint
curl -v http://localhost:3000/api-docs
```

### Authentication Failures

**Issue:** 401 Unauthorized
- Verify Firebase token validity
- Check token expiration
- Confirm Firebase credentials

```bash
# Test authentication
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {token}"
```

### Database Connection Issues

**Check Firestore:**
1. Project ID matches `.env`
2. Service account has permissions
3. Network connectivity to Firebase

```bash
# Test connection in Node REPL
node -e "require('./src/config/firebaseConfig.ts')"
```

### Performance Issues

**Steps:**
1. Check database query performance
2. Review API response times
3. Monitor memory usage
4. Check for N+1 queries

```bash
# Monitor resources
npm run dev 2>&1 | grep -i "performance\|error"
```

---

## Rollback Procedures

### Google Cloud Run Rollback

```bash
# List previous revisions
gcloud run revisions list --service=esports-hub

# Deploy previous version
gcloud run deploy esports-hub \
  --image=gcr.io/your-project/esports-hub:v1.0.0-previous
```

### Database Rollback

```bash
# Restore from backup
gcloud firestore import gs://your-backup-bucket/backup-2024-01-15
```

---

## Post-Deployment Verification

After deployment, verify:

1. **API is accessible**
   ```bash
   curl https://api.esports-hub.com/api-docs
   ```

2. **Swagger UI loads**
   - Visit `https://api.esports-hub.com/api-docs`
   - Check endpoints are documented

3. **Authentication works**
   ```bash
   curl -X POST https://api.esports-hub.com/api/v1/auth/login
   ```

4. **CORS configured**
   - Check response headers
   - Verify allowed origins

5. **Database connectivity**
   - Try creating/reading a resource
   - Check Firestore console

6. **Logging operational**
   - Check Cloud Logging dashboard
   - Verify audit logs working

---

## Support & References

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/nodejs-support)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

