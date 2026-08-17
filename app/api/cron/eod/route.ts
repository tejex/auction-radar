import { databaseProvider } from "@/server/db/client"
import { initializeDatabase } from "@/server/db/schema"
import { parseMarketDate, runEod } from "@/server/jobs/eod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    )
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const requestedDate = new URL(request.url).searchParams.get("date")
    const date = parseMarketDate(
      requestedDate ?? new Date().toISOString().slice(0, 10)
    )

    if (databaseProvider === "sqlite") {
      await initializeDatabase()
    }
    return Response.json(await runEod(date))
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: error instanceof Error ? error.message : "EOD job failed" },
      { status: 500 }
    )
  }
}
