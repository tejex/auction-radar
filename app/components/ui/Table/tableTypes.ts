import type { ScannerResult } from "@/app/types"

export type TimeWindow = "1D" | "2D" | "3D"
export type MovementMetric = "gap" | "range"
export type MovementPercentileMetric = "gapPercentile" | "rangePercentile"
export type VolumeMetric = "volume" | "volumePercentile"

export type ScannerTableRow = ScannerResult & {
  selectedReturn: number | null
  displacementPercentile: number | null
}

export const TIME_WINDOWS: TimeWindow[] = ["1D", "2D", "3D"]

export const MOVEMENT_METRIC_OPTIONS = [
  { label: "Gap", value: "gap" },
  { label: "Range", value: "range" },
] as const satisfies readonly {
  label: string
  value: MovementMetric
}[]

export const MOVEMENT_PERCENTILE_METRIC_OPTIONS = [
  { label: "Gap %", value: "gapPercentile" },
  { label: "Range %", value: "rangePercentile" },
] as const satisfies readonly {
  label: string
  value: MovementPercentileMetric
}[]

export const VOLUME_METRIC_OPTIONS = [
  { label: "Volume", value: "volume" },
  { label: "Volume %", value: "volumePercentile" },
] as const satisfies readonly {
  label: string
  value: VolumeMetric
}[]

export const RETURN_FIELDS = {
  "1D": "return1d",
  "2D": "return2d",
  "3D": "return3d",
} as const

export const DISPLACEMENT_PERCENTILE_FIELDS = {
  "1D": "return1dPercentile",
  "2D": "return2dPercentile",
  "3D": "return3dPercentile",
} as const
