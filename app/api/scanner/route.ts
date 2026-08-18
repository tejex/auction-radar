import { databaseProvider } from "@/server/db/client"
import { getLatestScannerResults } from "@/server/db/scannerResults"
import { initializeDatabase } from "@/server/db/schema"

export const runtime = "nodejs"

export async function GET() {
  if (databaseProvider === "sqlite") {
    await initializeDatabase()
  }
  const results = await getLatestScannerResults()

  return Response.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
