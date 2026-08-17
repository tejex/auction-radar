import { closeDatabase } from "../db/client.ts"
import { initializeDatabase } from "../db/schema.ts"
import { parseMarketDate, runEod } from "./eod.ts"

async function main() {
  const date = parseMarketDate(process.argv[2])
  await initializeDatabase()

  console.log(`Loading Massive EOD bars for ${date}...`)
  const result = await runEod(date)
  console.log(JSON.stringify(result, null, 2))
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
