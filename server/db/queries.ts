import { getDatabaseClient } from "./client.ts"

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
  const { rows } = await getDatabaseClient().execute({
    sql: `SELECT ticker, date, open, high, low, close, volume, source,
      adjustment
    FROM daily_bars
    WHERE ticker = ?
    ORDER BY date DESC
    LIMIT ?`,
    args: [ticker, limit],
  })

  return rows.map(row => normalizeBar(row))
}

export async function getTickersForLatestDate(): Promise<string[]> {
  const { rows } = await getDatabaseClient().execute(`
    SELECT DISTINCT ticker
    FROM daily_bars
    WHERE date = (SELECT MAX(date) FROM daily_bars)
  `)

  return rows.map(row => String(row.ticker))
}

export async function getEligibleCommonStockTickers(
  minimumMarketCap: number
) {
  const { rows } = await getDatabaseClient().execute({
    sql: `SELECT ticker
    FROM security_metadata
    WHERE type = 'CS'
      AND market_cap >= ?`,
    args: [minimumMarketCap],
  })

  return new Set(rows.map(row => String(row.ticker)))
}

export async function getLatestBarHistories(limit = 120) {
  const histories = new Map<string, DailyBar[]>()
  const tickers = await getTickersForLatestDate()
  const database = getDatabaseClient()
  const batchSize = 100

  for (let offset = 0; offset < tickers.length; offset += batchSize) {
    const batchTickers = tickers.slice(offset, offset + batchSize)
    const results = await database.batch(
      batchTickers.map(ticker => ({
        sql: `SELECT ticker, date, open, high, low, close, volume, source,
          adjustment
        FROM daily_bars
        WHERE ticker = ?
        ORDER BY date DESC
        LIMIT ?`,
        args: [ticker, limit],
      })),
      "read"
    )

    for (let index = 0; index < batchTickers.length; index++) {
      histories.set(
        batchTickers[index],
        results[index].rows.map(row => normalizeBar(row))
      )
    }
  }

  return histories
}

export async function getDailyBarCount() {
  const { rows } = await getDatabaseClient().execute(
    "SELECT COUNT(*) AS count FROM daily_bars"
  )

  return Number(rows[0]?.count ?? 0)
}
