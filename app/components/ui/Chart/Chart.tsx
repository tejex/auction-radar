"use client"

import type { ChartBar } from "@/app/types"
import { palette } from "@/app/palette"
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type CandlestickData,
} from "lightweight-charts"
import { useEffect, useMemo, useRef, useState } from "react"

const HISTORY_SESSIONS = 252
const barsCache = new Map<string, ChartBar[]>()

type StockChartProps = {
  ticker: string | null
}

export const StockChart = ({ ticker }: StockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const initialBars = ticker ? (barsCache.get(ticker) ?? []) : []
  const [bars, setBars] = useState<ChartBar[]>(initialBars)
  const [activeBar, setActiveBar] = useState<ChartBar | null>(
    initialBars.at(-1) ?? null,
  )
  const [isLoading, setIsLoading] = useState(
    Boolean(ticker && initialBars.length === 0),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker || barsCache.has(ticker)) return

    const controller = new AbortController()

    const loadBars = async () => {
      try {
        const response = await fetch(
          `/api/bars/${encodeURIComponent(ticker)}?limit=${HISTORY_SESSIONS}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Chart data request failed (${response.status})`)
        }

        const nextBars = (await response.json()) as ChartBar[]

        if (nextBars.length === 0) {
          throw new Error(`No daily bars are available for ${ticker}`)
        }

        barsCache.set(ticker, nextBars)
        setBars(nextBars)
        setActiveBar(nextBars.at(-1) ?? null)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load chart data",
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadBars()

    return () => controller.abort()
  }, [ticker])

  useEffect(() => {
    const container = chartContainerRef.current

    if (!container || bars.length === 0) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        attributionLogo: true,
        background: {
          type: ColorType.Solid,
          color: palette.chart.background,
        },
        textColor: palette.chart.mutedText,
      },
      grid: {
        vertLines: { color: palette.chart.grid },
        horzLines: { color: palette.chart.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: palette.chart.crosshair },
        horzLine: { color: palette.chart.crosshair },
      },
      rightPriceScale: {
        borderColor: palette.chart.axis,
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderColor: palette.chart.axis,
        rightOffset: 6,
        timeVisible: false,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
      downColor: palette.chart.candleDown,
      priceLineColor: palette.chart.priceLine,
      upColor: palette.chart.candleUp,
      wickDownColor: palette.chart.candleDown,
      wickUpColor: palette.chart.candleUp,
    })

    candleSeries.setData(
      bars.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      })),
    )

    const volumeSeries = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      priceScaleId: "volume",
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    })
    volumeSeries.setData(
      bars.map(bar => ({
        time: bar.time,
        value: bar.volume,
        color:
          bar.close >= bar.open
            ? palette.chart.volumeUp
            : palette.chart.volumeDown,
      })),
    )

    chart.subscribeCrosshairMove(param => {
      const candle = param.seriesData.get(candleSeries) as
        | CandlestickData
        | undefined

      if (!candle || typeof candle.time !== "string") {
        setActiveBar(bars.at(-1) ?? null)
        return
      }

      const matchingBar = bars.find(bar => bar.time === candle.time)
      setActiveBar(matchingBar ?? bars.at(-1) ?? null)
    })

    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [bars])

  const change = useMemo(() => {
    if (!activeBar) return null

    const previousIndex = bars.findIndex(bar => bar.time === activeBar.time) - 1
    const previousClose = bars[previousIndex]?.close

    if (!previousClose) return null

    return ((activeBar.close - previousClose) / previousClose) * 100
  }, [activeBar, bars])

  return (
    <section
      className="relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: palette.chart.background,
        borderColor: palette.chart.border,
        color: palette.chart.text,
      }}
    >
      <header
        className="flex min-h-12 shrink-0 items-center gap-3 border-b px-4 py-2"
        style={{ borderColor: palette.chart.border }}
      >
        <span>{ticker ?? "No ticker selected"}</span>
        {change !== null && (
          <span
            style={{
              color: change >= 0
                ? palette.chart.candleUp
                : palette.chart.candleDown,
            }}
          >
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={chartContainerRef} className="absolute inset-0" />

        {isLoading && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{
              backgroundColor: palette.chart.background,
              color: palette.chart.mutedText,
            }}
          >
            Loading {ticker} history…
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 grid place-items-center px-6 text-center"
            style={{
              backgroundColor: palette.chart.background,
              color: palette.chart.error,
            }}
          >
            {error}
          </div>
        )}

        {!ticker && !isLoading && !error && (
          <div
            className="absolute inset-0 grid place-items-center px-6 text-center"
            style={{ color: palette.chart.mutedText }}
          >
            Select a ticker in the scanner to view its chart.
          </div>
        )}
      </div>
    </section>
  )
}
