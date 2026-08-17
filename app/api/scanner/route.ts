import { databaseProvider } from "@/server/db/client"
import { getLatestScannerResults } from "@/server/db/scannerResults"
import { initializeDatabase } from "@/server/db/schema"
import { runScanner } from "@/server/services/serviceFunctions"

export const runtime = "nodejs"

export async function GET() {
  if (databaseProvider === "sqlite") {
    await initializeDatabase()
  }
  const storedResults = await getLatestScannerResults()
  const results = storedResults.length > 0
    ? storedResults
    : await runScanner()

  return Response.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
