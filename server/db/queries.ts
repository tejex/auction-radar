import {
  databaseProvider,
  getPostgresClient,
  getSqliteClient,
} from "./client.ts"

export type DailyBar = {
  ticker: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: "alpaca" | "massive" | null
  adjustment: "split" | "none" | null
}

function normalizeBar(row: Record<string, unknown>): DailyBar {
  return {
    ticker: String(row.ticker),
    date: String(row.date),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
    source: row.source as DailyBar["source"],
    adjustment: row.adjustment as DailyBar["adjustment"],
  }
}

export async function getBars(ticker: string, limit = 120) {
  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient().query(
      `SELECT ticker, date::text AS date, open, high, low, close,
        volume::double precision AS volume, source, adjustment
      FROM daily_bars
      WHERE ticker = $1
      ORDER BY date DESC
      LIMIT $2`,
      [ticker, limit]
    )

    return rows.map(row => normalizeBar(row))
  }

  return getSqliteClient().prepare(`
    SELECT *
    FROM daily_bars
    WHERE ticker = ?
    ORDER BY date DESC
    LIMIT ?
  `).all(ticker, limit).map(row => normalizeBar(row as Record<string, unknown>))
}

export async function getTickersForLatestDate(): Promise<string[]> {
  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient()`
      SELECT DISTINCT ticker
      FROM daily_bars
      WHERE date = (SELECT MAX(date) FROM daily_bars)
    `

    return rows.map(row => String(row.ticker))
  }

  const rows = getSqliteClient().prepare(`
    SELECT DISTINCT ticker
    FROM daily_bars
    WHERE date = (SELECT MAX(date) FROM daily_bars)
  `).all() as { ticker: string }[]

  return rows.map(row => row.ticker)
}

export async function getEligibleCommonStockTickers(
  minimumMarketCap: number
) {
  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient()`
      SELECT ticker
      FROM security_metadata
      WHERE type = 'CS'
        AND market_cap >= ${minimumMarketCap}
    `

    return new Set(rows.map(row => String(row.ticker)))
  }

  const rows = getSqliteClient().prepare(`
    SELECT ticker
    FROM security_metadata
    WHERE type = 'CS'
      AND market_cap >= ?
  `).all(minimumMarketCap) as { ticker: string }[]

  return new Set(rows.map(row => row.ticker))
}

export async function getLatestBarHistories(limit = 120) {
  const histories = new Map<string, DailyBar[]>()

  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient().query(
      `WITH latest_tickers AS (
        SELECT DISTINCT ticker
        FROM daily_bars
        WHERE date = (SELECT MAX(date) FROM daily_bars)
      )
      SELECT bars.ticker, bars.date::text AS date, bars.open, bars.high,
        bars.low, bars.close, bars.volume::double precision AS volume,
        bars.source, bars.adjustment
      FROM latest_tickers
      CROSS JOIN LATERAL (
        SELECT *
        FROM daily_bars
        WHERE daily_bars.ticker = latest_tickers.ticker
        ORDER BY date DESC
        LIMIT $1
      ) AS bars
      ORDER BY bars.ticker, bars.date DESC`,
      [limit]
    )

    for (const row of rows) {
      const bar = normalizeBar(row)
      const tickerBars = histories.get(bar.ticker) ?? []
      tickerBars.push(bar)
      histories.set(bar.ticker, tickerBars)
    }

    return histories
  }

  const tickers = await getTickersForLatestDate()
  const selectBars = getSqliteClient().prepare(`
    SELECT *
    FROM daily_bars
    WHERE ticker = ?
    ORDER BY date DESC
    LIMIT ?
  `)

  for (const ticker of tickers) {
    const bars = selectBars
      .all(ticker, limit)
      .map(row => normalizeBar(row as Record<string, unknown>))
    histories.set(ticker, bars)
  }

  return histories
}

export async function getDailyBarCount() {
  if (databaseProvider === "postgres") {
    const [row] = await getPostgresClient()`
      SELECT COUNT(*)::double precision AS count FROM daily_bars
    `
    return Number(row?.count ?? 0)
  }

  const row = getSqliteClient()
    .prepare("SELECT COUNT(*) AS count FROM daily_bars")
    .get() as { count: number }

  return row.count
}
