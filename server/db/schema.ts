import { db } from "./client.ts"

// Store normalized daily bars and the scanner features computed from them.
db.exec(`
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
`)

type TableColumn = {
    name: string
}

const dailyBarColumns = new Set(
    (db.prepare("PRAGMA table_info(daily_bars)").all() as TableColumn[])
        .map(column => column.name)
)

if (!dailyBarColumns.has("source")) {
    db.exec("ALTER TABLE daily_bars ADD COLUMN source TEXT")
}

if (!dailyBarColumns.has("adjustment")) {
    db.exec("ALTER TABLE daily_bars ADD COLUMN adjustment TEXT")
}
