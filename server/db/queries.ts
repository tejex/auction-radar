import { db } from "./client.ts"

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

export const getBars = (ticker: string, limit = 120) => {
  return db.prepare(`
    SELECT *
    FROM daily_bars
    WHERE ticker = ?
    ORDER BY date DESC
    LIMIT ?
  `).all(ticker, limit) as DailyBar[]
}

export const getTickersForLatestDate = (): string[] => {  
  const rows = db.prepare(`
    SELECT DISTINCT ticker
    FROM daily_bars
    WHERE date = (
      SELECT MAX(date)
      FROM daily_bars
    )
  `).all() as { ticker: string }[]

  return rows.map(row => row.ticker)
}

export const getEligibleCommonStockTickers = (
  minimumMarketCap: number
) => {
  const rows = db.prepare(`
    SELECT ticker
    FROM security_metadata
    WHERE type = 'CS'
      AND market_cap >= ?
  `).all(minimumMarketCap) as { ticker: string }[]

  return new Set(rows.map(row => row.ticker))
}
