import type { MRT_ColumnDef } from "material-react-table"
import {
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
    size: 60,
    Cell: ({ cell }) => <TickerValue ticker={cell.getValue<string>()} />,
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
    size: 60,
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
    size: 80,
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
    size: 50,
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
    size: 50,
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
    size: 80,
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
    size: 112,
    Cell: ({ cell }) => (
      <PercentileValue value={cell.getValue<number>()} />
    ),
  },
]
