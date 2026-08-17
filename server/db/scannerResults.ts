import type { ScannerResult } from "../../app/types.ts"
import {
  databaseProvider,
  getPostgresClient,
  getSqliteClient,
} from "./client.ts"

function parsePayload(payload: unknown): ScannerResult {
  if (typeof payload === "string") {
    return JSON.parse(payload) as ScannerResult
  }

  return payload as ScannerResult
}

export async function getLatestScannerResults(limit = 40) {
  if (databaseProvider === "postgres") {
    const rows = await getPostgresClient().query(
      `SELECT payload
      FROM scanner_results
      WHERE scan_date = (SELECT MAX(scan_date) FROM scanner_results)
      ORDER BY outlier_score DESC
      LIMIT $1`,
      [limit]
    )
    return rows.map(row => parsePayload(row.payload))
  }

  const rows = getSqliteClient().prepare(`
    SELECT payload
    FROM scanner_results
    WHERE scan_date = (SELECT MAX(scan_date) FROM scanner_results)
    ORDER BY outlier_score DESC
    LIMIT ?
  `).all(limit) as { payload: string }[]

  return rows.map(row => parsePayload(row.payload))
}

export async function replaceScannerResults(
  scanDate: string,
  results: ScannerResult[]
) {
  if (databaseProvider === "postgres") {
    const sql = getPostgresClient()
    await sql.transaction(transaction => [
      transaction`DELETE FROM scanner_results WHERE scan_date = ${scanDate}`,
      ...results.map(result => transaction`
        INSERT INTO scanner_results
          (scan_date, ticker, outlier_score, payload)
        VALUES (
          ${scanDate},
          ${result.ticker},
          ${result.outlierScore},
          ${JSON.stringify(result)}::jsonb
        )
      `),
    ])
    return
  }

  const db = getSqliteClient()
  const remove = db.prepare(
    "DELETE FROM scanner_results WHERE scan_date = ?"
  )
  const insert = db.prepare(`
    INSERT INTO scanner_results
      (scan_date, ticker, outlier_score, payload)
    VALUES (?, ?, ?, ?)
  `)

  db.transaction(() => {
    remove.run(scanDate)
    for (const result of results) {
      insert.run(
        scanDate,
        result.ticker,
        result.outlierScore,
        JSON.stringify(result)
      )
    }
  })()
}
