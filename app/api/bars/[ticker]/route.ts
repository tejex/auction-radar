import { getBars } from "@/server/db/queries"

export const runtime = "nodejs"

const DEFAULT_LIMIT = 252
const MAX_LIMIT = 405

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.trim().toUpperCase()

  if (!ticker || ticker.length > 32) {
    return Response.json({ error: "Invalid ticker" }, { status: 400 })
  }

  const requestedLimit = Number(
    new URL(request.url).searchParams.get("limit") ?? DEFAULT_LIMIT,
  )
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  const bars = getBars(ticker, limit)
    .reverse()
    .map(bar => ({
      time: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }))

  if (bars.length === 0) {
    return Response.json({ error: "Ticker not found" }, { status: 404 })
  }

  return Response.json(bars, {
    headers: { "Cache-Control": "private, max-age=300" },
  })
}
