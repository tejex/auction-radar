import {
  databaseProvider,
  getPostgresClient,
  getSqliteClient,
} from "./client.ts"

const sqliteSchema = `
  CREATE TABLE IF NOT EXISTS daily_bars (
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
  );

  CREATE TABLE IF NOT EXISTS session_features (
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
  );

  CREATE TABLE IF NOT EXISTS security_metadata (
    ticker TEXT PRIMARY KEY,
    type TEXT,
    market_cap REAL,
    as_of_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scanner_results (
    scan_date TEXT NOT NULL,
    ticker TEXT NOT NULL,
    outlier_score REAL NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (scan_date, ticker)
  );

  CREATE INDEX IF NOT EXISTS daily_bars_date_idx
    ON daily_bars (date);

  CREATE INDEX IF NOT EXISTS scanner_results_date_score_idx
    ON scanner_results (scan_date, outlier_score DESC);
`

const postgresStatements = [
  `CREATE TABLE IF NOT EXISTS daily_bars (
    ticker TEXT NOT NULL,
    date DATE NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    source TEXT,
    adjustment TEXT,
    PRIMARY KEY (ticker, date)
  )`,
  `CREATE TABLE IF NOT EXISTS session_features (
    ticker TEXT NOT NULL,
    date DATE NOT NULL,
    gap_pct DOUBLE PRECISION,
    range_pct DOUBLE PRECISION,
    return_1d DOUBLE PRECISION,
    return_2d DOUBLE PRECISION,
    return_3d DOUBLE PRECISION,
    gap_percentile DOUBLE PRECISION,
    range_percentile DOUBLE PRECISION,
    displacement_percentile DOUBLE PRECISION,
    volume_percentile DOUBLE PRECISION,
    outlier_score DOUBLE PRECISION,
    is_outlier BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (ticker, date)
  )`,
  `CREATE TABLE IF NOT EXISTS security_metadata (
    ticker TEXT PRIMARY KEY,
    type TEXT,
    market_cap DOUBLE PRECISION,
    as_of_date DATE NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scanner_results (
    scan_date DATE NOT NULL,
    ticker TEXT NOT NULL,
    outlier_score DOUBLE PRECISION NOT NULL,
    payload JSONB NOT NULL,
    PRIMARY KEY (scan_date, ticker)
  )`,
  `CREATE INDEX IF NOT EXISTS daily_bars_date_idx
    ON daily_bars (date)`,
  `CREATE INDEX IF NOT EXISTS scanner_results_date_score_idx
    ON scanner_results (scan_date, outlier_score DESC)`,
]

function migrateLegacySqliteSchema() {
  const db = getSqliteClient()
  const columns = new Set(
    (db.prepare("PRAGMA table_info(daily_bars)").all() as { name: string }[])
      .map(column => column.name)
  )

  if (!columns.has("source")) {
    db.exec("ALTER TABLE daily_bars ADD COLUMN source TEXT")
  }

  if (!columns.has("adjustment")) {
    db.exec("ALTER TABLE daily_bars ADD COLUMN adjustment TEXT")
  }
}

let initialization: Promise<void> | null = null

async function initializeDatabaseOnce() {
  if (databaseProvider === "postgres") {
    const sql = getPostgresClient()
    await sql.transaction(
      postgresStatements.map(statement => sql.query(statement))
    )
    return
  }

  getSqliteClient().exec(sqliteSchema)
  migrateLegacySqliteSchema()
}

export function initializeDatabase() {
  initialization ??= initializeDatabaseOnce()
  return initialization
}
