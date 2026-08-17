import { getMassiveClient } from "../clients/massive.ts"
import { saveDailyBars } from "./marketData.ts"

export async function loadMassiveMarketDay(date: string) {
  const data = await getMassiveClient().getGroupedStocksAggregates({
    date,
    adjusted: true,
  })

  const bars = data.results ?? []

  if (bars.length === 0) {
    throw new Error(`Massive returned no bars for ${date}`)
  }

  await saveDailyBars(bars, date, {
    source: "massive",
    adjustment: "split",
  })

  return bars.length
}
