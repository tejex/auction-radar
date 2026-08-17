# Auction Radar

Auction Radar is a Next.js market scanner. It uses the existing SQLite database
for local development and switches to Neon Postgres when `DATABASE_URL` is set.
The local `data/` directory remains ignored by Git.

## Local development

Copy the environment-variable template and add the API keys you use:

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No separate Fastify process
is required by the Next.js app. The production scanner endpoint is available at
`/api/scanner`, and chart data is served by `/api/bars/[ticker]`.

## Load end-of-day market data

Pass a completed market date in `YYYY-MM-DD` format:

```bash
npm run load:eod -- 2026-08-14
```

The job requests split-adjusted grouped daily bars, refreshes security metadata,
runs the scanner, and saves the ranked results. Running the scanner itself does
not call Massive.

## Move the local database to Neon

1. Create a Neon Postgres database and copy its connection string.
2. Set `DATABASE_URL` in `.env` without removing the existing API keys.
3. Create the Postgres tables:

   ```bash
   npm run db:setup
   ```

4. Import `data/auction-radar.db`:

   ```bash
   npm run db:migrate:sqlite
   ```

The import runs in batches, prints progress, and uses upserts, so it is safe to
restart if the connection is interrupted. It never writes to the SQLite source.
Because the source contains more than four million bars, the initial import can
take a while.

To switch local development back to SQLite, remove `DATABASE_URL` from `.env`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository from the Vercel dashboard.
3. Connect the Neon database to the Vercel project.
4. Configure these production environment variables:

   ```text
   DATABASE_URL
   MASSIVE_API_KEY
   ALPACA_API_KEY
   ALPACA_SECRET_KEY
   CRON_SECRET
   ```

5. Deploy after the database import has completed.

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
