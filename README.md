# hope-for-haiti

## Prerequisites

- Accessible PostgreSQL server with a database. You can create one using Docker:

```bash
docker run \
  --name postgres-17 \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -v ~/.postgres:/var/lib/postgresql/data \
  -d \
  postgres:17
```

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Generate Auth.js secret (and create your `.env` file)

```bash
# This will generate the .env file for you
echo "AUTH_SECRET=\"$(npx auth secret --raw)\"" >> .env
```

3. Set the `DATABASE_URL` env var in `.env`

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/hope_for_haiti"
```

4. (OPTIONAL) Set the `SENDGRID_API_KEY` and `SENDGRID_SENDER` env vars in `.env`

```bash
SENDGRID_API_KEY="abcdefg"
SENDGRID_SENDER="something@something.com"
```

5. Initialize the database

```bash
npm run db:migrate
npm run db:seed
```

## Development Guide

### Database Usage

This project uses [Prisma](https://www.prisma.io/) as its ORM, but wraps some of its commands for ease of access.

**Viewing the Database**

```bash
npm run db:view
```

**Making Schema Changes**

1. Change the schema
2. Generate the migration

```bash
# This will prompt you to name the migration. Usually something like "add xyz table"
npm run db:migrate
```

**Seeding the Database**

```bash
npm run db:seed
```
