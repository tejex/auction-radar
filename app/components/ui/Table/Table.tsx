"use client"

import type { ScannerResult } from "@/app/types"
import { palette } from "@/app/palette"
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table"
import { useMemo, useState } from "react"
import { createTableColumns } from "./columns"
import { TABLE_PRESENTATION_OPTIONS } from "./tableStyles"
import { TableToolbar } from "./TableToolbar"
import {
  DISPLACEMENT_PERCENTILE_FIELDS,
  RETURN_FIELDS,
  type MovementMetric,
  type MovementPercentileMetric,
  type ScannerTableRow,
  type TimeWindow,
  type VolumeMetric,
} from "./tableTypes"

type TableProps = {
  data: ScannerResult[]
  onTickerSelect: (ticker: string) => void
  selectedTicker: string | null
}

export const Table = ({
  data,
  onTickerSelect,
  selectedTicker,
}: TableProps) => {
  const [returnWindow, setReturnWindow] =
    useState<TimeWindow>("1D")
  const [displacementWindow, setDisplacementWindow] =
    useState<TimeWindow>("1D")
  const [movementMetric, setMovementMetric] =
    useState<MovementMetric>("gap")
  const [movementPercentileMetric, setMovementPercentileMetric] =
    useState<MovementPercentileMetric>("gapPercentile")
  const [volumeMetric, setVolumeMetric] =
    useState<VolumeMetric>("volume")

  const tableData = useMemo<ScannerTableRow[]>(
    () => data.map(row => ({
      ...row,
      selectedReturn: row[RETURN_FIELDS[returnWindow]],
      displacementPercentile:
        row[DISPLACEMENT_PERCENTILE_FIELDS[displacementWindow]],
    })),
    [data, displacementWindow, returnWindow],
  )

  const columns = useMemo(
    () => createTableColumns({
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
    }),
    [
      displacementWindow,
      movementMetric,
      movementPercentileMetric,
      returnWindow,
      volumeMetric,
    ],
  )

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    ...TABLE_PRESENTATION_OPTIONS,
    muiTableBodyRowProps: ({ row }) => {
      const isSelected = row.original.ticker === selectedTicker

      return {
        "aria-label": `Show ${row.original.ticker} chart`,
        "aria-selected": isSelected,
        onClick: () => onTickerSelect(row.original.ticker),
        onKeyDown: event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onTickerSelect(row.original.ticker)
          }
        },
        tabIndex: 0,
        sx: {
          backgroundColor: isSelected
            ? palette.table.selectedRowBackground
            : row.index % 2 === 0
              ? palette.table.rowBackground
              : palette.table.rowBackgroundAlternate,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: `${palette.table.hoverRowBackground} !important`,
          },
          "&:focus-visible": {
            outline: `2px solid ${palette.table.focus}`,
            outlineOffset: "-2px",
          },
          "& > td:last-child": {
            borderBottom: `1px solid ${palette.table.border}`,
          },
        },
      }
    },
    renderTopToolbar: () => <TableToolbar count={data.length} />,
  })

  return <MaterialReactTable table={table} />
}
