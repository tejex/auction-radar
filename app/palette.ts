/**
 * Basic color values. Add a color here once, then assign it to the page part
 * that should use it in `palette` below.
 */
export const colors = {
  black: "#111111",
  gray50: "#fafafa",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  green: "#16a34a",
  red: "#dc2626",
  transparent: "transparent",
  white: "#ffffff",
} as const

/**
 * Semantic page palette. Components only read from their own section, so a
 * color can be changed or removed without searching through component code.
 */
export const palette = {
  page: {
    background: colors.white,
    headerBackground: colors.white,
    headerBorder: colors.gray200,
    headerText: colors.black,
    markBackground: colors.gray100,
    markBorder: colors.gray200,
    text: colors.black,
  },
  table: {
    background: colors.white,
    border: colors.gray200,
    controlBackground: colors.white,
    focus: colors.gray600,
    headerBackground: colors.gray100,
    hoverRowBackground: colors.gray100,
    mutedText: colors.gray600,
    rowBackground: colors.white,
    rowBackgroundAlternate: colors.gray50,
    scrollbarThumb: colors.gray400,
    scrollbarTrack: colors.gray100,
    selectedRowBackground: colors.gray200,
    text: colors.black,
  },
  chart: {
    axis: colors.white,
    background: colors.black,
    border: colors.gray200,
    candleDown: colors.red,
    candleUp: colors.white,
    crosshair: colors.transparent,
    error: colors.red,
    grid: "#9ca3af3b",
    mutedText: colors.white,
    priceLine: colors.gray400,
    text: colors.white,
    volumeDown: colors.red,
    volumeUp: colors.white,
  },
} as const
