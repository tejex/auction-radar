const params = new URLSearchParams({
  symbols: "MSFT",
  timeframe: "1Day",
  start: "2026-01-01",
  end: "2026-01-10",
  feed: "sip",
  adjustment: "split",
})

const response = await fetch(
  `https://data.alpaca.markets/v2/stocks/bars?${params}`,
  {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY!,
      "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
    },
  }
)

console.log(response.status)
console.log(await response.json())

export {}