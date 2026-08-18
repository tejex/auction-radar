import { getDatabaseClient } from "./client.ts"

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS daily_bars (
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    volume INTEGER NOT NULL,
    source TEXT,
    adjustment TEXT,
    PRIMARY KEY (ticker, date)
  )`,
  `CREATE TABLE IF NOT EXISTS session_features (
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    gap_pct REAL,
    range_pct REAL,
    return_1d REAL,
    return_2d REAL,
    return_3d REAL,
    gap_percentile REAL,
    range_percentile REAL,
    displacement_percentile REAL,
    volume_percentile REAL,
    outlier_score REAL,
    is_outlier INTEGER DEFAULT 0,
    PRIMARY KEY (ticker, date)
  )`,
  `CREATE TABLE IF NOT EXISTS security_metadata (
    ticker TEXT PRIMARY KEY,
    type TEXT,
    market_cap REAL,
    as_of_date TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scanner_results (
    scan_date TEXT NOT NULL,
    ticker TEXT NOT NULL,
    outlier_score REAL NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (scan_date, ticker)
  )`,
  `CREATE INDEX IF NOT EXISTS daily_bars_date_idx
    ON daily_bars (date)`,
  `CREATE INDEX IF NOT EXISTS scanner_results_date_score_idx
    ON scanner_results (scan_date, outlier_score DESC)`,
]

async function migrateLegacySchema() {
  const database = getDatabaseClient()
  const { rows } = await database.execute("PRAGMA table_info(daily_bars)")
  const columns = new Set(rows.map(column => String(column.name)))

  if (!columns.has("source")) {
    await database.execute("ALTER TABLE daily_bars ADD COLUMN source TEXT")
  }

  if (!columns.has("adjustment")) {
    await database.execute("ALTER TABLE daily_bars ADD COLUMN adjustment TEXT")
  }
}

let initialization: Promise<void> | null = null

async function initializeDatabaseOnce() {
  await getDatabaseClient().batch(schemaStatements, "write")
  await migrateLegacySchema()
}

export function initializeDatabase() {
  initialization ??= initializeDatabaseOnce()
  return initialization
}
