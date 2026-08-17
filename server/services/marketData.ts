import { db } from "../db/client.ts"

export type BarSource = "alpaca" | "massive"

export type BarMetadata = {
  source: BarSource
  adjustment: "split" | "none"
}

export type MarketBar = {
  T: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

const insertBar = db.prepare(`
  INSERT OR REPLACE INTO daily_bars
  (ticker, date, open, high, low, close, volume, source, adjustment)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
/****************************************************************/
export function saveDailyBars(
  bars: MarketBar[],
  date: string,
  metadata: BarMetadata
) {
  const transaction = db.transaction(() => {
    for (const bar of bars) {
      insertBar.run(
        bar.T,
        date,
        bar.o,
        bar.h,
        bar.l,
        bar.c,
        bar.v,
        metadata.source,
        metadata.adjustment
      )
    }
  })

  transaction()
}
/****************************************************************/
export const getDates = (start: string, end: string): string[] => {
  const dates: string[] = []

  const current = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)

  while(current <= endDate){

    const day = current.getDay()

    //Checking for weekend. 
    if(day != 6 && day != 0){
      dates.push(current.toISOString().split("T")[0])
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}
