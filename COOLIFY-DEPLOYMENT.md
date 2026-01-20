# Complete Coolify Deployment Guide - Tyotrack

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Coolify Configuration](#coolify-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ Coolify instance running on your VPS
✅ PostgreSQL database (either Coolify-managed or external)
✅ GitHub repository: `https://github.com/Dasindu2025/Tyo`
✅ Domain name (optional, can use IP)

---

## Repository Setup

Your repository is already configured correctly with:

```
Tyo/
├── Dockerfile              # Multi-stage build (Backend + Frontend)
├── docker-compose.yml      # Optional, we'll use Dockerfile directly
├── backend/
│   ├── src/               # Express.js API
│   ├── prisma/            # Database schema & migrations
│   └── package.json
├── frontend/
│   ├── src/               # React application
│   └── package.json
└── README.md
```

---

## Coolify Configuration

### Step 1: Create New Application

1. **Login to Coolify Dashboard**
2. **Click "+ New Resource"**
3. **Select "Application"**
4. **Choose "GitHub"** as source

### Step 2: Connect Repository

1. **Repository URL:** `https://github.com/Dasindu2025/Tyo`
2. **Branch:** `main`
3. **Select your Coolify server**
4. **Click "Continue"**

### Step 3: Build Configuration

**Build Pack:** Select **"Dockerfile"**

**Important Settings:**

```
Build Context: ./
Dockerfile Location: ./Dockerfile
Dockerfile Target Stage: (leave empty - will use final stage)
```

**Port Mapping:**

```
Container Port: 3000
Public Port: 80 (or any available port)
```

**Health Check Path:** `/health`

---

## Environment Variables

### Required Environment Variables

Add these in Coolify's **Environment Variables** section:

#### 1. Database Connection

```bash
DATABASE_URL=postgresql://root:Dasindu2025@tyotrack-tyotrack-42xw30:5432/tyotrack
```

_Note: If using external database, use IP instead of hostname_

Alternative for external database:

```bash
DATABASE_URL=postgresql://root:Dasindu2025@72.60.178.81:5432/tyotrack
```

#### 2. JWT Secrets (CRITICAL - Generate secure random strings!)

```bash
JWT_SECRET=8f3a9d2b7c4e1f6a5d8b9c2e4f7a1d3b6c9e2f5a8d1b4c7e0f3a6d9b2e5f8a1c4
JWT_REFRESH_SECRET=2a5d8f1c4e7b0a3d6f9c2e5b8a1d4f7c0e3b6a9d2f5c8e1b4a7d0f3c6b9e2a5d8
```

#### 3. Application Configuration

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

_Replace `yourdomain.com` with your actual domain, or use `_` for development\*

#### 4. Optional - Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Variables Format in Coolify

In Coolify, add each variable as:

```
Key: DATABASE_URL
Value: postgresql://root:Dasindu2025@tyotrack-tyotrack-42xw30:5432/tyotrack
```

---

## Deployment Steps

### Step 1: Configure Application

1. **General Settings:**
   - Application Name: `tyotrack`
   - Description: "Enterprise Worktime Tracking System"

2. **Build Settings:**
   - Build Pack: Dockerfile
   - Dockerfile Path: `./Dockerfile`
   - Build Context: `./`

3. **Network Settings:**
   - Port: `3000`
   - Expose: Yes
   - Domain: Your domain or use Coolify's generated domain

### Step 2: Set Environment Variables

Copy all environment variables from the section above into Coolify's environment section.

### Step 3: Advanced Settings (Optional)

**Resource Limits:**

```
Memory Limit: 512MB (recommended minimum)
CPU Limit: 1 core
```

**Restart Policy:**

```
Restart: Always
```

**Health Checks:**

```
Health Check Path: /health
Health Check Interval: 30s
Health Check Timeout: 10s
Health Check Retries: 3
```

### Step 4: Deploy

1. **Click "Save"**
2. **Click "Deploy"**
3. **Monitor deployment logs**

---

## Deployment Process Explained

### What Happens During Deployment:

1. **Clone Repository** ✅

   ```
   Coolify clones from GitHub
   Switches to 'main' branch
   ```

2. **Build Stage 1: Backend** ⏳

   ```
   - Install Node.js dependencies
   - Generate Prisma Client
   - Compile TypeScript to JavaScript
   ```

3. **Build Stage 2: Frontend** ⏳

   ```
   - Install frontend dependencies
   - Build React app with Vite
   - Generate static files
   ```

4. **Build Stage 3: Production** ⏳

   ```
   - Create lightweight Alpine Linux image
   - Install PostgreSQL client & OpenSSL
   - Copy backend build + node_modules
   - Rebuild bcrypt for Alpine
   - Regenerate Prisma Client for Alpine
   - Copy frontend static files
   ```

5. **Start Container** 🚀
   ```
   - Run Prisma migrations: npx prisma migrate deploy
   - Start Node.js server: node dist/server.js
   - Server listens on port 3000
   ```

**Total Build Time:** ~3-5 minutes (first build, cached builds ~30-60 seconds)

---

## Post-Deployment

### 1. Verify Deployment

**Check Health Endpoint:**

```bash
curl https://yourdomain.com/health
```

Expected response:

```json
{
  "success": true,
  "message": "Worktime Management API is running",
  "timestamp": "2026-01-20T..."
}
```

### 2. Seed Database (Optional)

**Access Coolify terminal for your application:**

```bash
npm run seed
```

This creates demo data:

- 1 Super Admin
- 1 Company with Admin
- 3 Employees
- 2 Projects
- 2 Workplaces
- Sample time entries

### 3. Test Login

**Demo Credentials:**

**Super Admin:**

```
Email: superadmin@worktime.com
Password: password123
```

**Company Admin:**

```
Email: admin@techsolutions.com
Password: password123
```

**Employee:**

```
Email: alice@techsolutions.com
Password: password123
```

⚠️ **IMPORTANT:** Change these passwords after first login!

### 4. Configure Domain (Optional)

1. **In Coolify:** Go to your application → Domains
2. **Add your domain:** `tyotrack.yourdomain.com`
3. **Enable SSL:** Coolify auto-generates Let's Encrypt certificate
4. **Update CORS_ORIGIN** environment variable to match your domain

---

## Application Structure

### API Endpoints

**Authentication:**

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

**Employee Routes:**

```
GET    /api/employee/time-entries
POST   /api/employee/time-entries
PUT    /api/employee/time-entries/:id
DELETE /api/employee/time-entries/:id
GET    /api/employee/projects
GET    /api/employee/workplaces
GET    /api/employee/dashboard-stats
```

**Admin Routes:**

```
GET    /api/admin/employees
POST   /api/admin/employees
PUT    /api/admin/employees/:id
DELETE /api/admin/employees/:id
GET    /api/admin/time-entries
PUT    /api/admin/time-entries/:id/approve
PUT    /api/admin/time-entries/:id/reject
GET    /api/admin/reports/export
```

**Super Admin Routes:**

```
GET    /api/super-admin/companies
POST   /api/super-admin/companies
PUT    /api/super-admin/companies/:id
DELETE /api/super-admin/companies/:id
GET    /api/super-admin/admins
POST   /api/super-admin/admins
```

### Frontend Routes

```
/                          # Login page
/dashboard                 # Employee dashboard
/admin/dashboard           # Admin dashboard
/super-admin/dashboard     # Super admin dashboard
```

---

## Troubleshooting

### Issue: Build Fails

**Check logs for:**

```
npm install errors → Check package.json
Prisma errors → Verify DATABASE_URL
TypeScript errors → Code syntax issues
```

**Common fixes:**

```bash
# Clear build cache in Coolify
Click "Clean Build Cache" → Redeploy
```

### Issue: Container Starts Then Crashes

**Check application logs:**

```
Database connection error → Verify DATABASE_URL
Port already in use → Check port mapping
Missing environment variables → Verify all variables set
```

**View logs:**

```
Coolify → Your Application → Logs tab
```

### Issue: Can't Connect to Database

**If using Coolify-managed database:**

```
Use internal hostname: tyotrack-tyotrack-42xw30
Port: 5432 (internal)
```

**If using external database:**

```
Verify firewall allows connection from Coolify server IP
Test connection: telnet <db-ip> 5432
```

### Issue: Frontend Shows 404

**Possible causes:**

1. Static files not copied correctly
2. Express not serving frontend

**Fix:** Verify in logs that frontend build completed:

```
Successfully compiled X modules
vite build completed
```

### Issue: API Requests Fail

**Check CORS:**

```
CORS_ORIGIN must match your domain
For development, use: CORS_ORIGIN=*
For production, use: CORS_ORIGIN=https://yourdomain.com
```

---

## Performance Optimization

### 1. Enable Coolify CDN

- Serves static assets faster
- Reduces server load

### 2. Configure Redis (Optional)

For session storage and caching:

```bash
# Add Redis in Coolify
# Update backend to use Redis for sessions
```

### 3. Database Connection Pooling

Already configured in Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Backup & Maintenance

### Database Backups

**In Coolify:**

1. Go to your PostgreSQL database
2. Enable automatic backups
3. Set backup schedule (recommended: daily)

**Manual backup:**

```bash
pg_dump -h hostname -U root -d tyotrack > backup.sql
```

### Application Updates

**To deploy code changes:**

1. Push to GitHub (main branch)
2. Coolify auto-deploys (if auto-deploy enabled)
3. Or click "Deploy" button manually

---

## Security Checklist

✅ Change default passwords
✅ Use strong JWT secrets (64+ characters)
✅ Set proper CORS_ORIGIN (not \*)
✅ Enable HTTPS (Coolify handles this)
✅ Regular database backups
✅ Keep dependencies updated
✅ Monitor application logs
✅ Set up rate limiting (already configured)
✅ Use environment variables for secrets (never commit to git)

---

## Success Metrics

After deployment, verify:

✅ Health endpoint responds
✅ Can login with demo credentials
✅ Can create time entries
✅ Midnight-split works correctly
✅ Approvals system functional
✅ Reports can be generated
✅ All API endpoints accessible
✅ Frontend loads properly
✅ No console errors

---

## Support & Documentation

**Application Features:**

- Multi-company support
- Role-based access (Super Admin, Admin, Employee)
- Time entry with midnight-split
- Hour type calculation (day/evening/night)
- Approval workflows
- Auto-generated entity codes
- Report generation ready

**Tech Stack:**

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** PostgreSQL
- **Deployment:** Docker (Alpine Linux)

---

## Quick Reference

**Repository:** https://github.com/Dasindu2025/Tyo
**Branch:** main
**Build:** Dockerfile
**Port:** 3000
**Health Check:** /health
**Database:** PostgreSQL (Coolify-managed or external)

---

🎉 **You're all set! Your enterprise worktime tracking system is now ready for deployment on Coolify!**
