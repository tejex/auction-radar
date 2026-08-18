# Auction Radar

Auction Radar is a Next.js market scanner backed by SQLite-compatible libSQL.
Local development uses the ignored `data/auction-radar.db` file, while deployed
environments use Turso when `TURSO_DATABASE_URL` is configured.

## Local development

Copy the environment-variable template and add the API keys you use:

```bash
cp .env.example .env
pnpm install
pnpm db:setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No separate Fastify process
is required by the Next.js app. The production scanner endpoint is available at
`/api/scanner`, and chart data is served by `/api/bars/[ticker]`.

When `TURSO_DATABASE_URL` is empty, all database commands use the existing local
SQLite file. The entire `data/` directory remains ignored by Git.

## Import the local database into Turso

Install and authenticate the Turso CLI first:

```bash
brew install tursodatabase/tap/turso
turso auth signup
```

Checkpoint the SQLite WAL so every committed row is in the main database file,
then create the Turso database directly from that file:

```bash
sqlite3 data/auction-radar.db "PRAGMA wal_checkpoint(TRUNCATE);"
pnpm db:import
```

The import creates a Turso database named `auction-radar` with the existing
tables, indexes, and data. It does not translate the database to PostgreSQL or
modify the source schema.

Retrieve the production credentials:

```bash
turso db show auction-radar --url
turso db tokens create auction-radar
```

Set the results in `.env` only if you want local commands to access Turso:

```text
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Leave both variables empty to continue using the local database during
development.

## Load end-of-day market data

Pass a completed market date in `YYYY-MM-DD` format:

```bash
pnpm load:eod -- 2026-08-14
```

The job requests split-adjusted grouped daily bars, refreshes security metadata,
runs the scanner, and saves the ranked results. Running the scanner itself does
not call Massive.

## Deploy to Vercel

Configure these environment variables for Production, Preview, and Development
as appropriate:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
MASSIVE_API_KEY
ALPACA_API_KEY
ALPACA_SECRET_KEY
CRON_SECRET
```

Remove the previous database integration and all `DATABASE_URL`, `POSTGRES_*`,
`PG*`, and provider-created environment variables from the Vercel project.
Redeploy after adding the two Turso credentials.

The production app intentionally refuses to create or use a local SQLite file on
Vercel when Turso credentials are missing.

`vercel.json` invokes `/api/cron/eod` at 23:30 UTC on weekdays. Vercel supplies
`Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is configured. The route
rejects unauthenticated requests and can also be tested manually with a date:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/eod?date=2026-08-14"
```

The Massive metadata endpoint is rate limited. If a daily run needs to refresh
many previously unseen tickers, it can exceed a serverless function's duration;
that refresh should then be moved to a dedicated background worker while the
read APIs remain on Vercel.
