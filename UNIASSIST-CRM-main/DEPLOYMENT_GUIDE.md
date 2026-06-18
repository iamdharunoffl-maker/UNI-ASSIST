# Deployment Guide

**Updated:** 2026-06-17  
**Target Platforms:** Local Development, Render, Vercel  
**Database:** SQLite 3 (local development), PostgreSQL (recommended production)

## Quick Start (Local Development)

### Prerequisites

- **Node.js:** v18 or higher
- **npm:** v9 or higher
- **Git:** For cloning repository
- **StudentManagement.xlsx:** In project root (optional for migration)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd uni-assist-crm
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
```

Expected output:
```
added 45 packages, and audited 46 packages in 5s
```

Verify packages installed:
```bash
npm list sqlite3 sqlite
# sqlite@4.1.2
# sqlite3@5.1.6
```

### Step 3: Initialize Database

```bash
npm run dev
```

First run output should include:
```
Database initialized at server/database/crm.db
Migrations: Checking for pending migrations...
Excel migration completed - StudentManagement.xlsx deleted
Starting backup schedule (every 30 minutes)
Server running on port 5000
```

### Step 4: Verify Backend

```bash
curl http://localhost:5000/health
# Response: {"status":"UP","database":"SQLite connected"}
```

### Step 5: Install Frontend Dependencies

```bash
cd ../client
npm install
```

### Step 6: Start Frontend

```bash
npm run dev
```

Expected output:
```
Local:    http://localhost:5173
```

### Step 7: Access Application

Open browser: `http://localhost:5173`

**Default Credentials:**
- Username: `admin`
- Password: `Admin@123`

---

## Environment Variables

### Backend (server/.env)

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
DB_PATH=server/database/crm.db
DB_BACKUP_INTERVAL=30

# Authentication
JWT_SECRET=your_secret_key_here_min_32_chars
JWT_EXPIRY=24h

# Excel Migration
EXCEL_PATH=StudentManagement.xlsx
```

### Frontend (client/.env)

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Development Workflow

### Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Code Changes

- **Backend changes:** Auto-reloaded via `nodemon`
- **Frontend changes:** Auto-reloaded via Vite

### Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

---

## Production Deployment

### Option 1: Render (Full Stack)

#### Backend Deployment (Render)

1. **Connect GitHub Repository**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `uni-assist-crm` repository

2. **Configure Backend Service**
   - Name: `uni-assist-crm-backend`
   - Runtime: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     PORT=5000
     CLIENT_URL=https://your-frontend-url.vercel.app
     JWT_SECRET=generate_a_random_string_min_32_chars
     DB_PATH=/tmp/crm.db
     ```

3. **Database Considerations**
   - ⚠️ Render filesystem is ephemeral (lost on redeploy)
   - Solution 1: Add backup service to S3
   - Solution 2: Use Render PostgreSQL database (recommended)
   - Solution 3: Accept data loss on redeploy (dev only)

4. **Recommended: Switch to PostgreSQL**

   Create PostgreSQL database in Render:
   ```
   - Database name: uni-assist-crm
   - PostgreSQL version: 14+
   ```

   Update backend code:
   - Replace `sqlite3` with `pg` package
   - Update `server/services/databaseService.js`
   - Same API, different backend

#### Frontend Deployment (Vercel)

1. **Connect GitHub Repository**
   - Go to https://vercel.com
   - Click "New Project"
   - Import `uni-assist-crm` repository
   - Select `client` directory as root

2. **Configure Frontend**
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_BASE_URL=https://your-backend-url.onrender.com
     ```

3. **Deploy**
   - Click "Deploy"
   - Vercel automatically redeploys on GitHub push

#### Verification Steps

1. Check backend health:
   ```bash
   curl https://your-backend-url.onrender.com/health
   # Should return: {"status":"UP","database":"SQLite connected"}
   ```

2. Check frontend:
   - Open https://your-frontend-url.vercel.app
   - Should load without errors
   - Check browser console for API errors

3. Test login:
   - Username: `admin`
   - Password: `Admin@123`

---

### Option 2: Railway or Fly.io (Alternative)

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Fly.io:**
```bash
# Install Fly CLI
curl https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

---

## Database Migration (SQLite to PostgreSQL)

For production deployments with multiple instances:

### Step 1: Create PostgreSQL Database

```bash
# Using Render PostgreSQL
# Via Render dashboard: Create new PostgreSQL database
```

### Step 2: Update Dependencies

```bash
cd server
npm uninstall sqlite sqlite3
npm install pg sequelize
npm install --save-dev sequelize-cli
```

### Step 3: Update Database Service

```javascript
// server/services/databaseService.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false
});

const User = sequelize.define('User', {
  username: DataTypes.STRING,
  password: DataTypes.STRING,
  role: DataTypes.STRING
});

const Lead = sequelize.define('Lead', {
  leadId: DataTypes.STRING,
  name: DataTypes.STRING,
  // ... other fields
});

// ... similar for other models

module.exports = { sequelize, User, Lead, Student, Country, University, Course, Setting, Migration };
```

### Step 4: Export and Import Data

```bash
# Export from SQLite
sqlite3 server/database/crm.db ".mode csv" ".output export.csv" "SELECT * FROM leads;"

# Import to PostgreSQL
psql $DATABASE_URL -c "COPY leads FROM STDIN WITH CSV"
```

---

## Performance Optimization

### Frontend (Vercel)

- ✅ Automatic CDN caching
- ✅ Automatic code splitting
- ✅ Automatic image optimization
- ✅ Edge caching enabled

### Backend (Render)

Enable caching headers:
```javascript
// server/index.js
app.use((req, res, next) => {
  if (req.path.startsWith('/api/masters')) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  next();
});
```

### Database

```sql
-- Add indexes
ANALYZE;

-- Optimize queries (PostgreSQL)
VACUUM ANALYZE;
```

---

## Monitoring

### Error Tracking

Use Render/Vercel dashboards:
- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard

### Logs

**Render Backend Logs:**
```bash
# View real-time logs
# Via Render dashboard → Service → Logs
```

**Vercel Frontend Logs:**
```bash
# View build and deployment logs
# Via Vercel dashboard → Project → Deployments
```

### Health Checks

```bash
# Backend health
curl -H "Accept: application/json" \
  https://your-backend.onrender.com/health

# Database connectivity
curl -H "Accept: application/json" \
  https://your-backend.onrender.com/api/config
```

---

## Backup Strategy

### For SQLite (Development Only)

```bash
# Manual backup
cp server/database/crm.db backups/manual_backup_$(date +%Y%m%d_%H%M%S).db

# Automated backups (scheduled)
# Already configured: Every 30 minutes to `backups/` directory
```

### For PostgreSQL (Production)

Render PostgreSQL includes:
- ✅ Automatic backups
- ✅ Point-in-time recovery
- ✅ Replicas for redundancy

Configure in Render dashboard:
- Backup Frequency: Daily
- Retention: 30 days
- Enable Read Replicas

---

## Troubleshooting

### Backend Won't Start

1. **Check Node version:**
   ```bash
   node --version
   # Should be v18+
   ```

2. **Check dependencies:**
   ```bash
   cd server
   npm install
   npm list sqlite3
   ```

3. **Check database permissions:**
   ```bash
   ls -la server/database/
   # crm.db should exist and be readable
   ```

4. **Check port:**
   ```bash
   lsof -i :5000
   # Kill process if needed: kill -9 <PID>
   ```

### Frontend Connection Issues

1. **Check API URL:**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_API_BASE_URL);
   ```

2. **Check CORS:**
   ```bash
   # Should see CORS headers
   curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     http://localhost:5000/health -v
   ```

3. **Check frontend build:**
   ```bash
   cd client
   npm run build
   # Should create `dist/` folder
   ```

### Database Issues

1. **Check SQLite file:**
   ```bash
   sqlite3 server/database/crm.db ".tables"
   # Should list: countries courses leads migrations settings students universities users
   ```

2. **Check migration status:**
   ```bash
   sqlite3 server/database/crm.db "SELECT * FROM migrations;"
   # Should show: 1|excel_migration_v1|2026-06-17...
   ```

3. **Repair corrupted database:**
   ```bash
   sqlite3 server/database/crm.db "PRAGMA integrity_check;"
   # If corrupted, restore from backup
   rm server/database/crm.db
   cp backups/crm_*.db server/database/crm.db
   ```

### Login Issues

1. **Reset admin password:**
   ```bash
   sqlite3 server/database/crm.db
   
   -- Get hashed password from failed attempt
   SELECT password FROM users WHERE username = 'admin';
   
   -- Delete and recreate admin user (from initializeDb)
   DELETE FROM users WHERE username = 'admin';
   -- Then restart server to re-seed
   ```

2. **Check JWT configuration:**
   ```javascript
   // Verify JWT_SECRET is set
   console.log(process.env.JWT_SECRET);
   ```

---

## Scaling Considerations

### Current Architecture Limits

- **Single SQLite file:** ~100GB theoretical max, ~10GB practical
- **Concurrent users:** 100-1000 depending on usage patterns
- **Requests per second:** 1000+ (Render can handle)

### When to Scale

Scale horizontally when:
- Data grows beyond 10GB
- Concurrent users exceed 1000
- Requests exceed 5000/sec
- Geographic distribution needed

### Migration Path

```
Current:                    Phase 1:                    Phase 2:
┌──────────────┐           ┌──────────────┐            ┌──────────────┐
│ Render       │           │ Render       │            │ Render Multi │
│ + SQLite     │  --→      │ + PostgreSQL │  --→       │ + PostgreSQL │
│ Single       │           │ Single       │            │ Multiple     │
└──────────────┘           └──────────────┘            └──────────────┘
   0-10GB                     10-100GB                   100GB+
```

---

## Security Checklist

- ✅ Change default admin password immediately
- ✅ Set strong JWT_SECRET (min 32 characters)
- ✅ Enable HTTPS (automatic on Render/Vercel)
- ✅ Enable rate limiting (configured in code)
- ✅ Setup CORS for production frontend domain
- ✅ Remove sensitive data from logs
- ✅ Use environment variables for secrets
- ✅ Enable database backups
- ✅ Setup monitoring and alerts
- ✅ Review and update dependencies monthly

---

## Rollback Procedure

### If Deployment Fails

1. **Revert to Previous Version:**
   ```bash
   git revert <commit-hash>
   git push
   # Render/Vercel automatically redeploy
   ```

2. **Restore Database from Backup:**
   ```bash
   # Via Render PostgreSQL dashboard
   # Or manually
   cp backups/crm_YYYY-MM-DD*.db server/database/crm.db
   ```

3. **Clear Vercel Cache:**
   ```bash
   # Via Vercel dashboard → Deployments → Redeploy
   ```

---

## Maintenance Schedule

### Daily

- Monitor error logs
- Check application health endpoints
- Monitor resource usage

### Weekly

- Review user activity
- Check database size
- Verify backups

### Monthly

- Update dependencies: `npm update`
- Review security vulnerabilities: `npm audit`
- Review and optimize slow queries
- Update admin password

### Quarterly

- Full security audit
- Database optimization
- Performance benchmarking

---

## Support Resources

- **SQLite Documentation:** https://www.sqlite.org/docs.html
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Express.js Guide:** https://expressjs.com/
- **Node.js Guide:** https://nodejs.org/en/docs/

---

## Estimated Costs

### Local Development
- **Free** (only compute and internet)

### Render Deployment
- **Backend:** $7-12/month (starter)
- **Database (PostgreSQL):** $15/month (if needed)
- **Total:** $22-27/month minimum

### Vercel Deployment
- **Frontend:** $0/month (free tier generous) or $20+/month (pro)
- **Total:** $0-20/month

### Combined Production
- **Estimate:** $22-47/month (small-medium deployment)

---

**Last Updated:** 2026-06-17  
**Version:** 1.0  
**Status:** Production Ready
