import type { MRT_TableOptions } from "material-react-table"
import { palette } from "@/app/palette"
import type { ScannerTableRow } from "./tableTypes"

const GROUP_START_COLUMNS = new Set([
  "movementPercentileMetric",
  "volumeMetric",
  "maxDisplacementPercentile",
])

export const TABLE_PRESENTATION_OPTIONS = {
  defaultColumn: {
    grow: true,
    maxSize: 140,
    minSize: 68,
    size: 88,
  },
  layoutMode: "grid",
  enableSorting: true,
  enableFilters: false,
  enableColumnActions: false,
  enableRowActions: false,
  enableHiding: false,
  enableDensityToggle: false,
  enableFullScreenToggle: false,
  enablePagination: false,
  enableTopToolbar: true,
  enableBottomToolbar: false,
  enableStickyHeader: true,
  muiTablePaperProps: {
    sx: {
      backgroundColor: palette.table.background,
      border: `1px solid ${palette.table.border}`,
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    },
  },
  muiTableContainerProps: {
    sx: {
      backgroundColor: palette.table.background,
      flex: 1,
      height: "auto",
      maxHeight: "none",
      minHeight: 0,
      scrollbarColor: `${palette.table.scrollbarThumb} ${palette.table.scrollbarTrack}`,
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": {
        height: "10px",
        width: "10px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: palette.table.scrollbarTrack,
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: palette.table.scrollbarThumb,
        border: `2px solid ${palette.table.scrollbarTrack}`,
        borderRadius: "999px",
      },
    },
  },
  muiTableProps: {
    sx: {
      backgroundColor: palette.table.background,
      minWidth: "50rem",
      "@media (min-width: 112rem)": {
        minWidth: "58rem",
      },
    },
  },
  muiTableHeadRowProps: {
    sx: {
      backgroundColor: palette.table.headerBackground,
      "& > th:last-child": {
        borderBottom: `1px solid ${palette.table.border}`,
      },
    },
  },
  muiTableHeadCellProps: ({ column }) => ({
    sx: {
      backgroundColor: palette.table.headerBackground,
      borderBottom: `1px solid ${palette.table.border}`,
      borderLeft: GROUP_START_COLUMNS.has(column.id)
        ? `1px solid ${palette.table.border}`
        : undefined,
      color: palette.table.text,
      fontSize: "0.6875rem",
      px: 0.75,
      py: 1.5,
      whiteSpace: "nowrap",
      "@media (min-width: 40rem)": {
        fontSize: "0.75rem",
      },
      "@media (min-width: 112rem)": {
        fontSize: "0.875rem",
        px: 1.25,
      },
      "& .MuiTableSortLabel-root": {
        color: `${palette.table.mutedText} !important`,
        opacity: 1,
      },
      "& .MuiBadge-root": {
        width: "1.0625rem",
        "@media (min-width: 112rem)": {
          width: "auto",
        },
      },
      "& .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active": {
        color: `${palette.table.text} !important`,
      },
      "& .MuiTableSortLabel-icon": {
        color: `${palette.table.text} !important`,
        fontSize: "0.75rem",
        marginLeft: "0.0625rem",
        marginRight: 0,
        opacity: "0.9 !important",
        "@media (min-width: 112rem)": {
          fontSize: "1.125rem",
          marginLeft: "0.25rem",
        },
      },
      "& .MuiTableSortLabel-root.Mui-active .MuiTableSortLabel-icon": {
        color: `${palette.table.text} !important`,
      },
      "& .MuiTableSortLabel-root:hover .MuiTableSortLabel-icon": {
        color: `${palette.table.text} !important`,
      },
    },
  }),
  muiTableBodyCellProps: ({ column }) => ({
    sx: {
      borderBottom: `1px solid ${palette.table.border}`,
      borderLeft: GROUP_START_COLUMNS.has(column.id)
        ? `1px solid ${palette.table.border}`
        : undefined,
      color: palette.table.text,
      px: 0.75,
      py: 1.15,
      whiteSpace: "nowrap",
      "@media (min-width: 112rem)": {
        px: 1.25,
      },
    },
  }),
} satisfies Partial<MRT_TableOptions<ScannerTableRow>>
