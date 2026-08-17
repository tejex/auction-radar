import {
  getBars,
  getEligibleCommonStockTickers,
  getTickersForLatestDate,
} from "../db/queries.ts"
import type { DailyBar } from "../db/queries.ts"

const MINIMUM_MARKET_CAP = 1_000_000_000
const MINIMUM_HISTORY_SESSIONS = 120
const LIQUIDITY_WINDOW_SESSIONS = 20
const MINIMUM_AVERAGE_DOLLAR_VOLUME = 25_000_000
const RESULT_LIMIT = 40

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

export const calculateGap = (open: number, prevClose: number) => {
    return ((open - prevClose) / prevClose) * 100
}

export const calculateReturn = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100
}

export const calculateRange = (high: number, low: number, prevClose: number) => {
    return ((high - low) / prevClose) * 100
}

const percentileRank = (value: number, history: number[]) => {
  if (history.length === 0) return null

  const belowOrEqual = history.filter(x => x <= value).length

  return (belowOrEqual / history.length) * 100
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
  displacement * 0.4 +
  range * 0.3 +
  gap * 0.2 +
  volume * 0.1

const buildHistoricalMetric = (
  bars: DailyBar[],
  calculate: (bar: DailyBar, prevBar: DailyBar) => number
) => {
  const values: number[] = []

  for (let i = 1; i < bars.length - 1; i++) {
    values.push(calculate(bars[i], bars[i + 1]))
  }

  return values
}

const buildHistoricalReturns = (
  bars: DailyBar[],
  days: number
) => {
  const values: number[] = []

  for (let i = 1; i + days < bars.length; i++) {
    values.push(
      Math.abs(
        calculateReturn(
          bars[i].close,
          bars[i + days].close
        )
      )
    )
  }

  return values
}

export function scanTicker(ticker: string) {
  const bars = getBars(ticker, MINIMUM_HISTORY_SESSIONS)

  if (bars.length < MINIMUM_HISTORY_SESSIONS) return null

  const averageDollarVolume = calculateAverageDollarVolume(bars)

  if (averageDollarVolume < MINIMUM_AVERAGE_DOLLAR_VOLUME) return null

  const today = bars[0]
  const previous = bars[1]

  const gap = calculateGap(today.open, previous.close)
  const range = calculateRange(today.high, today.low, previous.close)
  const return1d = calculateReturn(today.close, previous.close)

  const return2d = bars.length >= 3 ? calculateReturn(today.close, bars[2].close) : null
  const return3d = bars.length >= 4 ? calculateReturn(today.close, bars[3].close) : null

  const historicalRanges = buildHistoricalMetric(
    bars,
    (bar, prev) => calculateRange(bar.high, bar.low, prev.close)
  )
  const rangePercentile = percentileRank(range, historicalRanges)
  const historicalGaps = buildHistoricalMetric(bars, (bar, prev) => Math.abs(calculateGap(bar.open, prev.close)))

  const gapPercentile = percentileRank(
    Math.abs(gap),
    historicalGaps
  )

  const return1dPercentile = percentileRank(
    Math.abs(return1d),
    buildHistoricalReturns(bars, 1)
  )

  const return2dPercentile = return2d !== null
    ? percentileRank(
        Math.abs(return2d),
        buildHistoricalReturns(bars, 2)
      )
    : null

  const return3dPercentile = return3d !== null
    ? percentileRank(
        Math.abs(return3d),
        buildHistoricalReturns(bars, 3)
      )
    : null

  const historicalVolumes = bars
    .slice(1)
    .map(bar => bar.volume)

  const volumePercentile = percentileRank(
    today.volume,
    historicalVolumes
  )

  const displacementPercentiles = [
    return1dPercentile,
    return2dPercentile,
    return3dPercentile,
  ].filter((value): value is number => value !== null)

  const maxDisplacementPercentile =
    Math.max(...displacementPercentiles)

  const isExtremeGap =
    meetsPercentile(gapPercentile, 99) &&
    (
      meetsPercentile(rangePercentile, 90) ||
      meetsPercentile(volumePercentile, 80)
    )

  const isAuctionShift =
    meetsPercentile(rangePercentile, 97) &&
    maxDisplacementPercentile >= 98

  const isOutlier =
    isExtremeGap || isAuctionShift

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
    isOutlier
  }
}

export const getOutlierCandidates = () => {
  const tickers = getTickersForLatestDate()

  return tickers
    .map(ticker => scanTicker(ticker))
    .filter(
      (result): result is NonNullable<typeof result> =>
        result?.isOutlier === true
    )
}

export const runScanner = () => {
  const eligibleTickers = getEligibleCommonStockTickers(
    MINIMUM_MARKET_CAP
  )

  return getOutlierCandidates()
    .filter(result => eligibleTickers.has(result.ticker))
    .sort((a, b) => b.outlierScore - a.outlierScore)
    .slice(0, RESULT_LIMIT)
}
