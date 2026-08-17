import { palette } from "@/app/palette"

export const formatPercent = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(2)}%`

const formatCompactNumber = (value: number) => {
  const units = [
    { minimum: 1_000_000_000, suffix: "B" },
    { minimum: 1_000_000, suffix: "M" },
    { minimum: 1_000, suffix: "k" },
  ]
  const unit = units.find(({ minimum }) => Math.abs(value) >= minimum)

  if (!unit) return value.toLocaleString()

  return `${(value / unit.minimum).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}${unit.suffix}`
}

export const TickerValue = ({ ticker }: { ticker: string }) => (
  <span>{ticker}</span>
)

export const MovementValue = ({ value }: { value: number | null }) => (
  <span>{formatPercent(value)}</span>
)

export const PercentileValue = ({ value }: { value: number | null }) => (
  <span
    className="inline-flex min-w-[70px] justify-center rounded-full border px-2 py-1"
    style={{ borderColor: palette.table.border }}
  >
    {formatPercent(value)}
  </span>
)

export const VolumeValue = ({ value }: { value: number }) => (
  <span title={value.toLocaleString("en-US")}>{formatCompactNumber(value)}</span>
)
