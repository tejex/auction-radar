import {
  databaseProvider,
  getPostgresClient,
  getSqliteClient,
} from "../db/client.ts"
import { getMassiveClient } from "../clients/massive.ts"

const REQUESTS_PER_WINDOW = 5
const RATE_LIMIT_WINDOW_MS = 65_000

const sleep = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

async function getRefreshedTickers(asOfDate: string) {
  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient()`
      SELECT ticker
      FROM security_metadata
      WHERE as_of_date = ${asOfDate}
    `
    return new Set(rows.map(row => String(row.ticker)))
  }

  const rows = getSqliteClient().prepare(`
    SELECT ticker
    FROM security_metadata
    WHERE as_of_date = ?
  `).all(asOfDate) as { ticker: string }[]

  return new Set(rows.map(row => row.ticker))
}

async function saveSecurityMetadata(
  ticker: string,
  type: string | null,
  marketCap: number | null,
  asOfDate: string
) {
  if (databaseProvider === "postgres") {
    await getPostgresClient()`
      INSERT INTO security_metadata (ticker, type, market_cap, as_of_date)
      VALUES (${ticker}, ${type}, ${marketCap}, ${asOfDate})
      ON CONFLICT (ticker) DO UPDATE SET
        type = EXCLUDED.type,
        market_cap = EXCLUDED.market_cap,
        as_of_date = EXCLUDED.as_of_date
    `
    return
  }

  getSqliteClient().prepare(`
    INSERT INTO security_metadata (ticker, type, market_cap, as_of_date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      type = excluded.type,
      market_cap = excluded.market_cap,
      as_of_date = excluded.as_of_date
  `).run(ticker, type, marketCap, asOfDate)
}

const isRateLimitError = (error: unknown) => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false
  }

  const response = error.response

  return Boolean(
    response &&
    typeof response === "object" &&
    "status" in response &&
    response.status === 429
  )
}

const getTickerWithRetry = async (ticker: string) => {
  const massive = getMassiveClient()

  try {
    return await massive.getTicker({ ticker })
  } catch (error) {
    if (!isRateLimitError(error)) throw error

    console.log("Massive rate limit reached; retrying in 65 seconds...")
    await sleep(RATE_LIMIT_WINDOW_MS)

    return massive.getTicker({ ticker })
  }
}

export async function refreshSecurityMetadata(
  tickers: string[],
  asOfDate: string
) {
  const alreadyRefreshed = await getRefreshedTickers(asOfDate)
  const pendingTickers = tickers.filter(
    ticker => !alreadyRefreshed.has(ticker)
  )
  let refreshed = 0

  for (let index = 0; index < pendingTickers.length; index++) {
    const ticker = pendingTickers[index]
    const data = await getTickerWithRetry(ticker)
    const security = data.results

    if (!security) continue

    await saveSecurityMetadata(
      security.ticker,
      security.type ?? null,
      security.market_cap ?? null,
      asOfDate
    )

    refreshed += 1

    const hasMore = index < pendingTickers.length - 1
    if (hasMore && refreshed % REQUESTS_PER_WINDOW === 0) {
      console.log(
        `Refreshed ${refreshed}/${pendingTickers.length}; waiting for the next rate-limit window...`
      )
      await sleep(RATE_LIMIT_WINDOW_MS)
    }
  }

  return refreshed
}
