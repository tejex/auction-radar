import { massive } from "../clients/massive.ts"
import { saveDailyBars } from "./marketData.ts"

export async function loadMassiveMarketDay(date: string) {
  const data = await massive.getGroupedStocksAggregates({
    date,
    adjusted: true,
  })

  const bars = data.results ?? []

  if (bars.length === 0) {
    throw new Error(`Massive returned no bars for ${date}`)
  }

  saveDailyBars(bars, date, {
    source: "massive",
    adjustment: "split",
  })

  return bars.length
}
