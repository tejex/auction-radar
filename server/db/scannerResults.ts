import type { ScannerResult } from "../../app/types.ts"
import { getDatabaseClient } from "./client.ts"

function parsePayload(payload: unknown): ScannerResult {
  if (typeof payload === "string") {
    return JSON.parse(payload) as ScannerResult
  }

  return payload as ScannerResult
}

export async function getLatestScannerResults(limit = 40) {
  const { rows } = await getDatabaseClient().execute({
    sql: `SELECT payload
    FROM scanner_results
    WHERE scan_date = (SELECT MAX(scan_date) FROM scanner_results)
    ORDER BY outlier_score DESC
    LIMIT ?`,
    args: [limit],
  })

  return rows.map(row => parsePayload(row.payload))
}

export async function replaceScannerResults(
  scanDate: string,
  results: ScannerResult[]
) {
  await getDatabaseClient().batch(
    [
      {
        sql: "DELETE FROM scanner_results WHERE scan_date = ?",
        args: [scanDate],
      },
      ...results.map(result => ({
        sql: `INSERT INTO scanner_results
          (scan_date, ticker, outlier_score, payload)
        VALUES (?, ?, ?, ?)`,
        args: [
          scanDate,
          result.ticker,
          result.outlierScore,
          JSON.stringify(result),
        ],
      })),
    ],
    "write"
  )
}
