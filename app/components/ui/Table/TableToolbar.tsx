import { palette } from "@/app/palette"

export const TableToolbar = ({ count }: { count: number }) => (
  <div
    className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
    style={{
      backgroundColor: palette.table.headerBackground,
      borderColor: palette.table.border,
    }}
  >
    <div>
      <p>Scanner results</p>
      <p>
        {count.toLocaleString()} auction {count === 1 ? "outlier" : "outliers"}
      </p>
    </div>
  </div>
)
