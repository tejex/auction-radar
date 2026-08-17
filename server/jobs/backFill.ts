// import { getDates, saveMarketDay } from "../services/marketData.ts";


import { getTickersForLatestDate } from "../db/queries.ts"
import { saveDailyBars } from "../services/marketData.ts"
import type { MarketBar } from "../services/marketData.ts"

type AlpacaBar = {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

type AlpacaResponse = {
  bars: Record<string, AlpacaBar[]>
  next_page_token: string | null
}

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = []

    for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

async function fetchBatch(symbols: string[]) {
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      symbols: symbols.join(","),
      timeframe: "1Day",
      start: "2025-01-01",
      end: "2026-08-13",
      limit: "10000",

      // Massive adjusted=true adjusts for splits,
      // so keep Alpaca consistent.
      adjustment: "split",

      feed: "sip",
    })

    if (pageToken) {
      params.set("page_token", pageToken)
    }

    const response = await fetch(
      `https://data.alpaca.markets/v2/stocks/bars?${params}`,
      {
        headers: {
          "APCA-API-KEY-ID": process.env.ALPACA_API_KEY!,
          "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const data = await response.json() as AlpacaResponse

    const barsByDate = new Map<string, MarketBar[]>()

    for (const [ticker, bars] of Object.entries(data.bars ?? {})) {
      for (const bar of bars) {
        const date = bar.t.slice(0, 10)

        if (!barsByDate.has(date)) {
          barsByDate.set(date, [])
        }

        barsByDate.get(date)!.push({
          T: ticker,
          o: bar.o,
          h: bar.h,
          l: bar.l,
          c: bar.c,
          v: bar.v,
        })
      }
    }

    for (const [date, bars] of barsByDate) {
      await saveDailyBars(bars, date, {
        source: "alpaca",
        adjustment: "split",
      })
    }

    pageToken = data.next_page_token ?? undefined

    await sleep(400)

  } while (pageToken)
}

async function backFill() {
  const tickers = await getTickersForLatestDate()

  // Don't put thousands of symbols into one URL
  const batches = chunk(tickers, 200)

  for (let i = 0; i < batches.length; i++) {
    console.log(
      `Batch ${i + 1}/${batches.length}`
    )

    await fetchBatch(batches[i])
  }

  console.log("Backfill complete")
}

backFill().catch(console.error)
