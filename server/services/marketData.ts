import { getDatabaseClient } from "../db/client.ts"

export type BarSource = "alpaca" | "massive"

export type BarMetadata = {
  source: BarSource
  adjustment: "split" | "none"
}

export type MarketBar = {
  T: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

const BATCH_SIZE = 100

export async function saveDailyBars(
  bars: MarketBar[],
  date: string,
  metadata: BarMetadata
) {
  const database = getDatabaseClient()

  for (let offset = 0; offset < bars.length; offset += BATCH_SIZE) {
    const batch = bars.slice(offset, offset + BATCH_SIZE)
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const args = batch.flatMap(bar => [
      bar.T,
      date,
      bar.o,
      bar.h,
      bar.l,
      bar.c,
      bar.v,
      metadata.source,
      metadata.adjustment,
    ])

    await database.execute({
      sql: `INSERT INTO daily_bars
        (ticker, date, open, high, low, close, volume, source, adjustment)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT(ticker, date) DO UPDATE SET
        open = excluded.open,
        high = excluded.high,
        low = excluded.low,
        close = excluded.close,
        volume = excluded.volume,
        source = excluded.source,
        adjustment = excluded.adjustment`,
      args,
    })
  }
}

export const getDates = (start: string, end: string): string[] => {
  const dates: string[] = []
  const current = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)

  while (current <= endDate) {
    const day = current.getDay()

    if (day !== 6 && day !== 0) {
      dates.push(current.toISOString().split("T")[0])
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}
