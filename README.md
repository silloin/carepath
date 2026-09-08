# Carepath

Carepath is an original medical-tourism marketplace for discovering verified hospitals in India, comparing real treatment estimates, and managing a private patient case journey.

## Current release

Release 5 MVP hardening is in place across the Release 1–4 workflow:

- React + Vite client with responsive public, patient, hospital, and admin surfaces
- Express + Socket.IO API with Helmet, CORS, rate limiting, structured errors, and request logging
- PostgreSQL + Prisma schema with ownership indexes and private document access logs
- JWT HTTP-only cookie authentication with PATIENT, HOSPITAL, and ADMIN role guards
- Hospital marketplace, treatment discovery, backend 0/1/2+ provider logic, and cost estimation
- Patient cases, private PDF/JPG/PNG reports, hospital responses, appointments, notifications, chat, and reviews
- Fictional demo seed data for admin, patient, hospitals, treatments, specialties, and provider-count scenarios

## Run locally

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Client: `http://localhost:5173`  
API health: `http://localhost:4000/api/health`

Copy `server/.env.example` to `server/.env`, set valid PostgreSQL credentials, then run:

```bash
npm run db:push
npm run db:seed
```

The public marketplace reads only from PostgreSQL. If the database is unavailable, the UI shows an explicit loading/error state rather than inventing hospitals or prices.

For a production database, set valid credentials in `server/.env` before migration and seed commands. The local database must be reachable and authenticated; otherwise Prisma commands fail with `P1000`.

## Environment

Copy `server/.env.example` to `server/.env` and configure:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/carepath"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
SERVER_URL="http://localhost:4000"
PORT=4000
ADMIN_EMAIL="admin@carepath.local"
ADMIN_PASSWORD="change-this-development-password"
DEMO_PATIENT_EMAIL="patient.demo@carepath.local"
DEMO_PATIENT_PASSWORD="change-this-demo-password"
UPLOAD_MAX_MB=10
```

Optional AWS variables are documented in `server/.env.example` for replacing local private storage in production.

## Verification

```bash
npm run build
npm test
npm run check
```

The test suite covers provider-state logic and JWT role claims. Runtime database tests require valid PostgreSQL credentials.

## Demo accounts

After seeding:

- Admin: `admin@carepath.local` / `change-this-development-password`
- Patient: `patient.demo@carepath.local` / `change-this-demo-password`
- Hospital accounts: `hospital1.demo@carepath.local` through `hospital10.demo@carepath.local`, using `change-this-demo-password`

Change all development passwords before deployment.

## API groups

- Auth: `/api/auth/*`
- Public discovery: `/api/public/treatments`, `/api/public/hospitals`, `/api/public/compare/hospitals`, `/api/public/cost-estimate`
- Hospital marketplace: `/api/hospitals/me/*`
- Patient workflow: `/api/patient/cases/*`, `/api/patient/notifications`
- Hospital workflow: `/api/hospital/cases/*`, `/api/hospital/appointments/*`
- Admin controls: `/api/admin/*`
- Health: `/api/health`

## Product boundary

The MVP focuses on treatment discovery, verified hospital marketplace data, hospital-specific estimated costs, comparison when two or more real providers exist, and the patient case workflow. It does not include public doctor discovery, diagnosis, travel booking, payments, insurance integrations, or Phase 2/3 travel and AI features.
# carepath
