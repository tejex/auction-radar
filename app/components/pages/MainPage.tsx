"use client"

import "@/app/globals.css"
import { palette } from "@/app/palette"
import type { ScannerResult } from "@/app/types"
import { useState } from "react"
import { StockChart } from "../ui/Chart/Chart"
import { Table } from "../ui/Table/Table"

type MainPageProps = {
  data: ScannerResult[]
}

export const MainPage = ({ data }: MainPageProps) => {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    data[0]?.ticker ?? null,
  )

  return (
    <main
      className="flex h-dvh w-full flex-col gap-3 overflow-auto p-3 sm:p-4"
      style={{
        backgroundColor: palette.page.background,
        color: palette.page.text,
      }}
    >
      <header
        className="flex min-h-14 min-w-[64rem] shrink-0 items-center rounded-lg border px-4"
        style={{
          backgroundColor: palette.page.headerBackground,
          borderColor: palette.page.headerBorder,
          color: palette.page.headerText,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-md border"
            style={{
              backgroundColor: palette.page.markBackground,
              borderColor: palette.page.markBorder,
            }}
          >
            AR
          </span>
          <span>Auction Radar</span>
        </div>
      </header>

      <div className="grid min-h-[36rem] min-w-[64rem] flex-1 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
        <div className="h-full min-h-0 w-full">
          <Table
            data={data}
            onTickerSelect={setSelectedTicker}
            selectedTicker={selectedTicker}
          />
        </div>

        <div className="h-full min-h-0 w-full overflow-hidden">
          <StockChart key={selectedTicker} ticker={selectedTicker} />
        </div>
      </div>
    </main>
  )
}
