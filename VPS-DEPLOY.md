# VPS Deployment Guide - Worktime Management System

## Quick Deployment Steps

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Connect to Dokploy

1. Go to your Dokploy dashboard
2. Click "Create Project" → "GitHub Repository"
3. Select your repository
4. Choose deployment method: **Docker Compose**

### 3. Set Environment Variables in Dokploy

```env
NODE_ENV=production
DATABASE_URL=postgresql://root:Sasindu2006@72.60.178.81:5432/tyotrack
JWT_SECRET=your-random-64-character-secret-key-change-this
JWT_REFRESH_SECRET=another-different-64-character-secret-key
CORS_ORIGIN=https://yourdomain.com
```

### 4. Deploy

Click "Deploy" in Dokploy. It will:

- Build the Docker image
- Start the container
- Run database migrations automatically
- Serve the application on the configured port

### 5. Seed Demo Data (Optional)

SSH into your VPS or use Dokploy terminal:

```bash
docker exec -it worktime-app npm run seed
```

## Access Your Application

- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api/*`
- Health: `https://yourdomain.com/health`

## Demo Login Credentials

- **Super Admin:** superadmin@worktime.com / password123
- **Company Admin:** admin@techsolutions.com / password123
- **Employee:** alice@techsolutions.com / password123

**⚠️ IMPORTANT:** Change these passwords after first login!

## Architecture

- **Database:** External PostgreSQL on VPS (72.60.178.81:5432)
- **Backend:** Node.js/Express/TypeScript
- **Frontend:** React/Vite (served as static files)
- **Container:** Single Docker container with multi-stage build

## Features Included

✅ Role-based authentication (JWT)
✅ Multi-company support
✅ Time tracking with midnight-split
✅ Auto-generated entity codes
✅ Hour type calculation (day/evening/night)
✅ Time entry approvals
✅ Report generation (Excel/CSV ready)
✅ Complete REST API
✅ Production-ready Docker setup

## Troubleshooting

**Container won't start:**

```bash
docker logs worktime-app
```

**Database connection issues:**

- Verify DATABASE_URL is correct
- Check firewall allows connections from your VPS IP to database

**Application not accessible:**

- Check Dokploy port mapping
- Verify domain/SSL configuration in Dokploy
