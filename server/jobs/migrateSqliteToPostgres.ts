import { neon } from "@neondatabase/serverless"
import Database from "better-sqlite3"
import { initializeDatabase } from "../db/schema.ts"

const SOURCE_DATABASE = "data/auction-radar.db"
const BATCH_SIZE = 2_000

type SourceBar = {
  migration_rowid: number
  ticker: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: string | null
  adjustment: string | null
}

function buildBarInsert(rows: SourceBar[]) {
  const parameters: unknown[] = []
  const values = rows.map(row => {
    const start = parameters.length + 1
    parameters.push(
      row.ticker,
      row.date,
      row.open,
      row.high,
      row.low,
      row.close,
      row.volume,
      row.source,
      row.adjustment
    )
    return `(${Array.from({ length: 9 }, (_, index) => `$${start + index}`).join(", ")})`
  })

  return {
    text: `INSERT INTO daily_bars
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
    parameters,
  }
}

async function migrateBars(source: Database.Database, databaseUrl: string) {
  const sql = neon(databaseUrl)
  const total = Number(
    (source.prepare("SELECT COUNT(*) AS count FROM daily_bars").get() as { count: number }).count
  )
  const selectBatch = source.prepare(`
    SELECT rowid AS migration_rowid, ticker, date, open, high, low, close,
      volume, source, adjustment
    FROM daily_bars
    WHERE rowid > ?
    ORDER BY rowid
    LIMIT ?
  `)
  let lastRowId = 0
  let migrated = 0

  while (true) {
    const rows = selectBatch.all(lastRowId, BATCH_SIZE) as SourceBar[]
    if (rows.length === 0) break

    const insert = buildBarInsert(rows)
    await sql.query(insert.text, insert.parameters)
    lastRowId = rows[rows.length - 1].migration_rowid
    migrated += rows.length

    const percent = ((migrated / total) * 100).toFixed(1)
    console.log(`Migrated ${migrated.toLocaleString()}/${total.toLocaleString()} bars (${percent}%)`)
  }
}

async function migrateSecurityMetadata(
  source: Database.Database,
  databaseUrl: string
) {
  const sql = neon(databaseUrl)
  const rows = source.prepare(`
    SELECT ticker, type, market_cap, as_of_date
    FROM security_metadata
  `).all() as {
    ticker: string
    type: string | null
    market_cap: number | null
    as_of_date: string
  }[]

  if (rows.length === 0) return

  await sql.transaction(transaction => rows.map(row => transaction`
    INSERT INTO security_metadata (ticker, type, market_cap, as_of_date)
    VALUES (${row.ticker}, ${row.type}, ${row.market_cap}, ${row.as_of_date})
    ON CONFLICT (ticker) DO UPDATE SET
      type = EXCLUDED.type,
      market_cap = EXCLUDED.market_cap,
      as_of_date = EXCLUDED.as_of_date
  `))

  console.log(`Migrated ${rows.length.toLocaleString()} security metadata rows`)
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must point to the destination Neon database")
  }

  await initializeDatabase()

  const source = new Database(SOURCE_DATABASE, {
    readonly: true,
    fileMustExist: true,
  })
  source.pragma("query_only = ON")

  try {
    await migrateBars(source, databaseUrl)
    await migrateSecurityMetadata(source, databaseUrl)
  } finally {
    source.close()
  }

  console.log("SQLite to Postgres migration complete")
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
