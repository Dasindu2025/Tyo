# Tyotrack - Enterprise Work Tracking

Multi-tenant work time and project tracking application.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Recharts
- **Backend**: NestJS, Prisma, PostgreSQL, BullMQ, Redis
- **Infra**: Docker, pnpm workspaces

## How to Run Locally

1. **Prerequisites**:
   - Docker & Docker Compose
   - pnpm installed (`npm install -g pnpm`)

2. **Setup**:
   ```bash
   pnpm install
   ```

3. **Start Development Infrastructure**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d postgres redis
   ```

4. **Initialize Database**:
   ```bash
   cd apps/api
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start All Services**:
   ```bash
   pnpm dev
   ```
   Or use Docker for everything:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

## API Access
- **API Base**: `http://localhost:3050`
- **Swagger Docs**: `http://localhost:3050/api/docs`

## Core Logic: Time Splitting
The system automatically splits time entries that cross midnight.
Example: `Sat 22:00 -> Sun 02:00` becomes:
- `Sat 22:00 -> 00:00 (2h Night)`
- `Sun 00:00 -> 02:00 (2h Night)`

Hour breakdown is calculated based on company rules (Day/Evening/Night).

## Multi-tenancy
Isolation is enforced at the query level using `companyId` (derived from JWT) on all Prisma calls.

## Deployment on VPS
1. Clone repo on VPS.
2. Setup environment variables in a `.env` file.
3. Run:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Configure Nginx/Traefik to point to port 3000 (web) and 3050 (api).
