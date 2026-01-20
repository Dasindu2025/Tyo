# Enterprise Worktime Tracking System

A production-grade, enterprise-level worktime tracking web application with React frontend, Node.js backend, and PostgreSQL database. Fully Dockerized for easy deployment.

## Features

- **Multi-Company Operations**: Super admin creates companies, company admins manage employees
- **Role-Based Access**: Super Admin → Company Admin → Employees
- **Time Tracking**: Automatic cross-midnight splitting, hour type calculation (day/evening/night)
- **Auto-Generated Codes**: Unique codes for employees (EMP001), projects (PRO001), workplaces (LOC001)
- **Calendar Visualization**: Monthly calendar with daily hours totals
- **Time Approvals**: Admin can approve/reject employee time entries
- **Reports**: Generate reports by employee, project, workplace with Excel/CSV export

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Query, Zustand
- **Backend**: Node.js 20, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT with refresh tokens, bcrypt password hashing
- **Validation**: Zod schemas (frontend & backend)
- **Deployment**: Docker with multi-stage builds

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Docker Deployment (Recommended)

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.production .env
   ```
3. Edit `.env` and set strong passwords and JWT secrets
4. Start the application:
   ```bash
   docker-compose up -d
   ```
5. Access the application at `http://localhost:3000`

### Local Development

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials

After running the seed script, you can login with:

- **Super Admin**: `superadmin@worktime.com` / `password123`
- **Company Admin**: `admin@techsolutions.com` / `password123`
- **Employee**: `alice@techsolutions.com` / `password123`

## Project Structure

```
.
├── backend/
│   ├── prisma/              # Database schema and migrations
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── middleware/      # Express middleware
│   │   ├── schemas/         # Zod validation schemas
│   │   └── utils/           # Utility functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages/components
│   │   ├── stores/          # Zustand state stores
│   │   ├── lib/             # Utilities and API client
│   │   └── App.tsx
│   └── package.json
├── Dockerfile               # Multi-stage production build
└── docker-compose.yml       # PostgreSQL + App containers
```

## Database Schema

- `super_admins` - System administrators
- `companies` - Companies with auto-generated codes
- `company_admins` - Company administrators
- `employees` - Employees with auto-codes
- `projects` - Projects with auto-codes
- `workplaces` - Workplaces with auto-codes
- `working_hour_types` - Configurable day/evening/night hours
- `time_entries` - Time tracking records with automatic splitting
- `time_entry_audit_log` - Complete audit trail
- `entity_code_counters` - Auto-code generation counters
- `sessions` - JWT refresh token storage

## API Endpoints

### Authentication

- `POST /api/auth/super-admin/login`
- `POST /api/auth/admin/login`
- `POST /api/auth/employee/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Super Admin

- `GET /api/super-admin/companies` - List companies
- `POST /api/super-admin/companies` - Create company + first admin
- `PATCH /api/super-admin/companies/:id` - Update company
- `DELETE /api/super-admin/companies/:id` - Soft delete

### Admin

- Employee, Project, Workplace CRUD endpoints
- `PUT /api/admin/working-hours` - Configure hour types
- `PATCH /api/admin/time-entries/:id/approve` - Approve/reject entries
- `POST /api/admin/reports/generate` - Generate reports

### Employee

- `GET /api/employee/profile` - Get profile
- `POST /api/employee/time-entries` - Create time entry (auto-splits)
- `GET /api/employee/calendar/:year/:month` - Calendar data
- `GET /api/employee/projects` - Active projects
- `GET /api/employee/workplaces` - Active workplaces

## Security Features

- JWT access tokens (15min) + refresh tokens (7 days)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 requests per 15 minutes)
- Input validation (Zod)
- Company-level data isolation
- Row-level soft deletes

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
CORS_ORIGIN=https://yourdomain.com
```

### Docploy Deployment

1. Push code to GitHub
2. In Docploy:
   - Connect repository
   - Set environment variables
   - Deploy using docker-compose.yml

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
