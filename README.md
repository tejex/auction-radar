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

## Run the daily scanner with GitHub Actions

The workflow in `.github/workflows/daily-eod.yml` runs at approximately 6:30 PM
Eastern on weekdays. It loads that day's Massive bars, refreshes metadata, runs
the scanner, and writes the results to Turso. The timezone-aware schedule stays
at the same Eastern time across daylight-saving changes.

Add these repository secrets under **Settings > Secrets and variables > Actions**:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
MASSIVE_API_KEY
```

After the workflow reaches the default branch, use **Actions > Daily EOD scanner
> Run workflow** to run the first scan immediately. You can optionally enter a
completed market date; otherwise the workflow uses today's New York date.

The scheduled job runs only from the default branch. It may start a few minutes
after the requested time when GitHub Actions is busy.

## Deploy to Vercel

Configure these environment variables for Production, Preview, and Development
as appropriate:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

`MASSIVE_API_KEY` now belongs in GitHub Actions, not Vercel. `CRON_SECRET` and
`MASSIVE_API_KEY` are only needed in Vercel if you want to keep using the manual
`/api/cron/eod` route. The Alpaca credentials are only used by local backfill and
API-test jobs.

Remove the previous database integration and all `DATABASE_URL`, `POSTGRES_*`,
`PG*`, and provider-created environment variables from the Vercel project.
Redeploy after adding the two Turso credentials.

The production app intentionally refuses to create or use a local SQLite file on
Vercel when Turso credentials are missing.

The GitHub Actions workflow owns the production schedule, so Vercel does not run
a second copy of the job. The `/api/cron/eod` route remains available for manual
testing when `CRON_SECRET` is configured:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/eod?date=2026-08-14"
```

The Massive metadata endpoint is rate limited. If a daily run needs to refresh
many previously unseen tickers, it can exceed a serverless function's duration;
that refresh should then be moved to a dedicated background worker while the
read APIs remain on Vercel.
