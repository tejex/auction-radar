export type ScannerResult = {
  ticker: string
  gap: number
  range: number
  return1d: number
  return2d: number | null
  return3d: number | null
  rangePercentile: number | null
  gapPercentile: number | null
  return1dPercentile: number | null
  return2dPercentile: number | null
  return3dPercentile: number | null
  volume: number
  volumePercentile: number | null
  historySessions: number
  averageDollarVolume: number
  maxDisplacementPercentile: number
  outlierScore: number
  isOutlier: boolean
}

export type ChartBar = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
