# Hope for Haiti

Local development guide for the Hope for Haiti web app (Next.js + Prisma + Postgres).

## Quick Start

1) Install deps: `npm install`  
2) Create `.env` (see "Environment Variables")  
3) Start Postgres (see "Database Setup")  
4) Run migrations + seed: `npm run db:migrate && npm run db:seed`  
5) Start the app: `npm run dev`  
6) Open `http://localhost:3000`

## Prerequisites

- Node.js 18.17+ (or 20 LTS recommended)
- npm (comes with Node)
- PostgreSQL 15+ (Postgres 17 recommended)
- `pgvector` extension enabled in your database

### Database Setup (Docker with pgvector preinstalled)

Use the pgvector image so the extension is always available:

```bash
docker run \
  --name postgres-17 \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -v ~/.postgres:/var/lib/postgresql/data \
  -d \
  pgvector/pgvector:pg17
```

Then create the database and enable the extension (run in docker exec):

```bash
createdb -h localhost -U postgres hope_for_haiti
```

## Environment Variables

Create a `.env` file at the project root. Start with this template:

```bash
# Auth.js
AUTH_SECRET="replace-with-generated-secret" # npx auth secret --raw

# App
BASE_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/hope_for_haiti"

# Stream Chat (required for chat)
NEXT_PUBLIC_STREAMIO_API_KEY="your-stream-public-key"
STREAMIO_SECRET_KEY="your-stream-secret-key"

# Email (optional; if omitted, emails open locally in email-previews/)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_SENDER="no-reply@example.com"

# Realtime (required for notifications)
ABLY_API_KEY="your-ably-api-key"

# Azure Blob Storage (optional; required for signature uploads)
AZURE_STORAGE_CONNECTION_STRING="your-azure-connection-string"
AZURE_STORAGE_ACCOUNT_NAME="your-azure-account-name"
AZURE_STORAGE_ACCOUNT_KEY="your-azure-account-key"
AZURE_STORAGE_CONTAINER_NAME="signatures"

# Azure OpenAI (optional; required for AI features)
AZURE_OPENAI_API_KEY="your-azure-openai-key"
AZURE_OPENAI_DEPLOYMENT="omni-moderate"
```
Ask the project Engineering Manager to access env variables.

Notes:
- If `SENDGRID_API_KEY` is not set, emails are saved under `email-previews/`.
- `NEXT_PUBLIC_STREAMIO_API_KEY` and `STREAMIO_SECRET_KEY` are required to run `npm run db:seed`.
- `ABLY_API_KEY` is required only for realtime notifications.

## Install Dependencies

```bash
npm install
```

## Initialize the Database

```bash
npm run db:migrate
npm run db:seed
```

Seeded users (all use password `root`):
- `superadmin@test.com`
- `distribution@test.com`
- `donoroffers@test.com`
- `readonly@test.com`
- `internal@test.com`
- `external@test.com`
- `pending@test.com`

## Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
# Prisma Studio
npm run db:view

# Clear the database
npm run db:clear

# Create or update a staff user with full permissions
npm run db:createStaffUser

# Email template dev server (React Email)
npm run email:dev

# Netlify functions locally
npm run netlify
```

## Troubleshooting

- If `npm run db:seed` fails due to Stream Chat, verify `NEXT_PUBLIC_STREAMIO_API_KEY` and `STREAMIO_SECRET_KEY`.
- If uploads or signatures fail, verify Azure Storage env vars.
- If notifications throw `ABLY_API_KEY not configured`, set `ABLY_API_KEY` or avoid notification flows.
