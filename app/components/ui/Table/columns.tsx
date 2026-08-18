import type { MRT_ColumnDef } from "material-react-table"
import {
  MarketCapValue,
  MovementValue,
  PercentileValue,
  TickerValue,
  VolumeValue,
} from "./cells"
import { HeaderSelect } from "./HeaderSelect"
import {
  MOVEMENT_METRIC_OPTIONS,
  MOVEMENT_PERCENTILE_METRIC_OPTIONS,
  VOLUME_METRIC_OPTIONS,
  type MovementMetric,
  type MovementPercentileMetric,
  type ScannerTableRow,
  type TimeWindow,
  type VolumeMetric,
} from "./tableTypes"
import { WindowSelect } from "./WindowSelect"

type CreateTableColumnsOptions = {
  displacementWindow: TimeWindow
  movementMetric: MovementMetric
  movementPercentileMetric: MovementPercentileMetric
  returnWindow: TimeWindow
  setDisplacementWindow: (value: TimeWindow) => void
  setMovementMetric: (value: MovementMetric) => void
  setMovementPercentileMetric: (value: MovementPercentileMetric) => void
  setReturnWindow: (value: TimeWindow) => void
  setVolumeMetric: (value: VolumeMetric) => void
  volumeMetric: VolumeMetric
}

const compareNullableNumbers = (
  first: number | null,
  second: number | null,
) => (first ?? Number.NEGATIVE_INFINITY) - (second ?? Number.NEGATIVE_INFINITY)

export const createTableColumns = ({
  displacementWindow,
  movementMetric,
  movementPercentileMetric,
  returnWindow,
  setDisplacementWindow,
  setMovementMetric,
  setMovementPercentileMetric,
  setReturnWindow,
  setVolumeMetric,
  volumeMetric,
}: CreateTableColumnsOptions): MRT_ColumnDef<ScannerTableRow>[] => [
  {
    accessorKey: "ticker",
    header: "Ticker",
    size: 76,
    Cell: ({ cell }) => <TickerValue ticker={cell.getValue<string>()} />,
  },
  {
    accessorKey: "marketCap",
    header: "Market Cap",
    size: 100,
    sortingFn: (rowA, rowB) => compareNullableNumbers(
      rowA.original.marketCap,
      rowB.original.marketCap,
    ),
    Cell: ({ cell }) => (
      <MarketCapValue value={cell.getValue<number | null>()} />
    ),
  },
  {
    id: "movementMetric",
    accessorFn: row => row[movementMetric],
    header: "Gap / Range",
    Header: () => (
      <HeaderSelect
        ariaLabel="Gap or range column"
        onChange={setMovementMetric}
        options={MOVEMENT_METRIC_OPTIONS}
        value={movementMetric}
      />
    ),
    size: 92,
    sortingFn: (rowA, rowB) => compareNullableNumbers(
      rowA.original[movementMetric],
      rowB.original[movementMetric],
    ),
    Cell: ({ row }) => (
      <MovementValue value={row.original[movementMetric]} />
    ),
  },
  {
    accessorKey: "selectedReturn",
    header: "Return",
    Header: () => (
      <WindowSelect
        ariaLabel="Return window"
        onChange={setReturnWindow}
        suffix="Return"
        value={returnWindow}
      />
    ),
    size: 116,
    Cell: ({ cell }) => (
      <MovementValue value={cell.getValue<number | null>()} />
    ),
  },
  {
    id: "movementPercentileMetric",
    accessorFn: row => row[movementPercentileMetric],
    header: "Gap / Range %",
    Header: () => (
      <HeaderSelect
        ariaLabel="Gap or range percentile column"
        onChange={setMovementPercentileMetric}
        options={MOVEMENT_PERCENTILE_METRIC_OPTIONS}
        value={movementPercentileMetric}
      />
    ),
    size: 108,
    sortingFn: (rowA, rowB) => compareNullableNumbers(
      rowA.original[movementPercentileMetric],
      rowB.original[movementPercentileMetric],
    ),
    Cell: ({ row }) => (
      <PercentileValue value={row.original[movementPercentileMetric]} />
    ),
  },
  {
    accessorKey: "displacementPercentile",
    header: "Displacement %",
    Header: () => (
      <WindowSelect
        ariaLabel="Displacement percentile window"
        onChange={setDisplacementWindow}
        suffix="%"
        value={displacementWindow}
      />
    ),
    size: 88,
    Cell: ({ cell }) => (
      <PercentileValue value={cell.getValue<number | null>()} />
    ),
  },
  {
    id: "volumeMetric",
    accessorFn: row => row[volumeMetric],
    header: "Volume / Volume %",
    Header: () => (
      <HeaderSelect
        ariaLabel="Volume or volume percentile column"
        onChange={setVolumeMetric}
        options={VOLUME_METRIC_OPTIONS}
        value={volumeMetric}
      />
    ),
    size: 114,
    sortingFn: (rowA, rowB) => compareNullableNumbers(
      rowA.original[volumeMetric],
      rowB.original[volumeMetric],
    ),
    Cell: ({ row }) => volumeMetric === "volume"
      ? <VolumeValue value={row.original.volume} />
      : <PercentileValue value={row.original.volumePercentile} />,
  },
  {
    accessorKey: "maxDisplacementPercentile",
    header: "Max Disp. %",
    size: 100,
    Cell: ({ cell }) => (
      <PercentileValue value={cell.getValue<number>()} />
    ),
  },
]
