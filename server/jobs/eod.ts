import { replaceScannerResults } from "../db/scannerResults.ts"
import { getOutlierCandidates, rankOutlierCandidates } from "../services/serviceFunctions.ts"
import { loadMassiveMarketDay } from "../services/massiveMarketData.ts"
import { refreshSecurityMetadata } from "../services/securityMetadata.ts"

export function parseMarketDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("A market date in YYYY-MM-DD format is required")
  }

  const [year, month, day] = value.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`)
  }

  return value
}

export async function runEod(date: string) {
  const barCount = await loadMassiveMarketDay(date)
  const candidates = await getOutlierCandidates()
  const candidateTickers = candidates.map(candidate => candidate.ticker)
  const metadataCount = await refreshSecurityMetadata(candidateTickers, date)
  const results = await rankOutlierCandidates(candidates)

  await replaceScannerResults(date, results)

  return {
    date,
    barsLoaded: barCount,
    metadataRefreshed: metadataCount,
    scannerResults: results.length,
  }
}
