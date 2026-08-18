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
    sql: `SELECT scanner_results.payload, security_metadata.market_cap
    FROM scanner_results
    LEFT JOIN security_metadata
      ON security_metadata.ticker = scanner_results.ticker
    WHERE scanner_results.scan_date = (
      SELECT MAX(scan_date) FROM scanner_results
    )
    ORDER BY scanner_results.outlier_score DESC
    LIMIT ?`,
    args: [limit],
  })

  return rows.map(row => {
    const result = parsePayload(row.payload)
    const storedMarketCap = row.market_cap

    return {
      ...result,
      marketCap: storedMarketCap === null || storedMarketCap === undefined
        ? result.marketCap ?? null
        : Number(storedMarketCap),
    }
  })
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
