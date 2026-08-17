import type { ScannerResult } from "../../app/types.ts"
import {
  getBars,
  getEligibleCommonStockTickers,
  getLatestBarHistories,
} from "../db/queries.ts"
import type { DailyBar } from "../db/queries.ts"

const MINIMUM_MARKET_CAP = 1_000_000_000
const MINIMUM_HISTORY_SESSIONS = 120
const LIQUIDITY_WINDOW_SESSIONS = 20
const MINIMUM_AVERAGE_DOLLAR_VOLUME = 25_000_000
const RESULT_LIMIT = 40

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

export const calculateGap = (open: number, prevClose: number) =>
  ((open - prevClose) / prevClose) * 100

export const calculateReturn = (current: number, previous: number) =>
  ((current - previous) / previous) * 100

export const calculateRange = (
  high: number,
  low: number,
  prevClose: number
) => ((high - low) / prevClose) * 100

const percentileRank = (value: number, history: number[]) => {
  if (history.length === 0) return null
  return (history.filter(item => item <= value).length / history.length) * 100
}

const meetsPercentile = (value: number | null, minimum: number) =>
  value !== null && value >= minimum

const calculateAverageDollarVolume = (bars: DailyBar[]) =>
  average(
    bars
      .slice(0, LIQUIDITY_WINDOW_SESSIONS)
      .map(bar => bar.close * bar.volume)
  )

const calculateOutlierScore = ({
  displacement,
  range,
  gap,
  volume,
}: {
  displacement: number
  range: number
  gap: number
  volume: number
}) =>
  displacement * 0.4 + range * 0.3 + gap * 0.2 + volume * 0.1

const buildHistoricalMetric = (
  bars: DailyBar[],
  calculate: (bar: DailyBar, prevBar: DailyBar) => number
) => {
  const values: number[] = []

  for (let index = 1; index < bars.length - 1; index++) {
    values.push(calculate(bars[index], bars[index + 1]))
  }

  return values
}

const buildHistoricalReturns = (bars: DailyBar[], days: number) => {
  const values: number[] = []

  for (let index = 1; index + days < bars.length; index++) {
    values.push(
      Math.abs(calculateReturn(bars[index].close, bars[index + days].close))
    )
  }

  return values
}

export function scanBars(ticker: string, bars: DailyBar[]): ScannerResult | null {
  if (bars.length < MINIMUM_HISTORY_SESSIONS) return null

  const averageDollarVolume = calculateAverageDollarVolume(bars)
  if (averageDollarVolume < MINIMUM_AVERAGE_DOLLAR_VOLUME) return null

  const today = bars[0]
  const previous = bars[1]
  const gap = calculateGap(today.open, previous.close)
  const range = calculateRange(today.high, today.low, previous.close)
  const return1d = calculateReturn(today.close, previous.close)
  const return2d = calculateReturn(today.close, bars[2].close)
  const return3d = calculateReturn(today.close, bars[3].close)
  const rangePercentile = percentileRank(
    range,
    buildHistoricalMetric(
      bars,
      (bar, prev) => calculateRange(bar.high, bar.low, prev.close)
    )
  )
  const gapPercentile = percentileRank(
    Math.abs(gap),
    buildHistoricalMetric(
      bars,
      (bar, prev) => Math.abs(calculateGap(bar.open, prev.close))
    )
  )
  const return1dPercentile = percentileRank(
    Math.abs(return1d),
    buildHistoricalReturns(bars, 1)
  )
  const return2dPercentile = percentileRank(
    Math.abs(return2d),
    buildHistoricalReturns(bars, 2)
  )
  const return3dPercentile = percentileRank(
    Math.abs(return3d),
    buildHistoricalReturns(bars, 3)
  )
  const historicalVolumes = bars.slice(1).map(bar => bar.volume)
  const volumePercentile = percentileRank(today.volume, historicalVolumes)
  const maxDisplacementPercentile = Math.max(
    return1dPercentile ?? 0,
    return2dPercentile ?? 0,
    return3dPercentile ?? 0
  )
  const isExtremeGap =
    meetsPercentile(gapPercentile, 99) &&
    (meetsPercentile(rangePercentile, 90) ||
      meetsPercentile(volumePercentile, 80))
  const isAuctionShift =
    meetsPercentile(rangePercentile, 97) &&
    maxDisplacementPercentile >= 98
  const isOutlier = isExtremeGap || isAuctionShift
  const outlierScore = calculateOutlierScore({
    displacement: maxDisplacementPercentile,
    range: rangePercentile ?? 0,
    gap: gapPercentile ?? 0,
    volume: volumePercentile ?? 0,
  })

  return {
    ticker,
    gap,
    range,
    return1d,
    return2d,
    return3d,
    rangePercentile,
    gapPercentile,
    return1dPercentile,
    return2dPercentile,
    return3dPercentile,
    volume: today.volume,
    volumePercentile,
    historySessions: bars.length,
    averageDollarVolume,
    maxDisplacementPercentile,
    outlierScore,
    isOutlier,
  }
}

export async function scanTicker(ticker: string) {
  return scanBars(ticker, await getBars(ticker, MINIMUM_HISTORY_SESSIONS))
}

export async function getOutlierCandidates() {
  const histories = await getLatestBarHistories(MINIMUM_HISTORY_SESSIONS)

  return Array.from(histories, ([ticker, bars]) => scanBars(ticker, bars))
    .filter(
      (result): result is ScannerResult => result?.isOutlier === true
    )
}

export async function rankOutlierCandidates(candidates: ScannerResult[]) {
  const eligibleTickers = await getEligibleCommonStockTickers(
    MINIMUM_MARKET_CAP
  )

  return candidates
    .filter(result => eligibleTickers.has(result.ticker))
    .sort((a, b) => b.outlierScore - a.outlierScore)
    .slice(0, RESULT_LIMIT)
}

export async function runScanner() {
  return rankOutlierCandidates(await getOutlierCandidates())
}
