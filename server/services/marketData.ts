import {
  databaseProvider,
  getPostgresClient,
  getSqliteClient,
} from "../db/client.ts"

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

const POSTGRES_BATCH_SIZE = 1_000

async function savePostgresBars(
  bars: MarketBar[],
  date: string,
  metadata: BarMetadata
) {
  const sql = getPostgresClient()

  for (let offset = 0; offset < bars.length; offset += POSTGRES_BATCH_SIZE) {
    const batch = bars.slice(offset, offset + POSTGRES_BATCH_SIZE)
    const parameters: unknown[] = []
    const values = batch.map(bar => {
      const start = parameters.length + 1
      parameters.push(
        bar.T,
        date,
        bar.o,
        bar.h,
        bar.l,
        bar.c,
        bar.v,
        metadata.source,
        metadata.adjustment
      )
      return `(${Array.from({ length: 9 }, (_, index) => `$${start + index}`).join(", ")})`
    })

    await sql.query(
      `INSERT INTO daily_bars
        (ticker, date, open, high, low, close, volume, source, adjustment)
      VALUES ${values.join(", ")}
      ON CONFLICT (ticker, date) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        source = EXCLUDED.source,
        adjustment = EXCLUDED.adjustment`,
      parameters
    )
  }
}

export async function saveDailyBars(
  bars: MarketBar[],
  date: string,
  metadata: BarMetadata
) {
  if (databaseProvider === "postgres") {
    await savePostgresBars(bars, date, metadata)
    return
  }

  const db = getSqliteClient()
  const insertBar = db.prepare(`
    INSERT OR REPLACE INTO daily_bars
    (ticker, date, open, high, low, close, volume, source, adjustment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    for (const bar of bars) {
      insertBar.run(
        bar.T,
        date,
        bar.o,
        bar.h,
        bar.l,
        bar.c,
        bar.v,
        metadata.source,
        metadata.adjustment
      )
    }
  })()
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
