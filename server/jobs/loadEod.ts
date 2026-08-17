import "../db/schema.ts"
import { db } from "../db/client.ts"
import { loadMassiveMarketDay } from "../services/massiveMarketData.ts"
import { getOutlierCandidates } from "../services/serviceFunctions.ts"
import { refreshSecurityMetadata } from "../services/securityMetadata.ts"

function parseDateArgument(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      "Usage: npm run load:eod -- YYYY-MM-DD"
    )
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

async function main() {
  const date = parseDateArgument(process.argv[2])

  console.log(`Loading Massive EOD bars for ${date}...`)

  const count = await loadMassiveMarketDay(date)

  console.log(`Loaded ${count.toLocaleString()} bars for ${date}`)

  const candidateTickers = getOutlierCandidates()
    .map(candidate => candidate.ticker)
  const metadataCount = await refreshSecurityMetadata(
    candidateTickers,
    date
  )

  console.log(
    `Refreshed metadata for ${metadataCount.toLocaleString()} candidates`
  )
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  db.close()
}
