import { restClient } from "@massive.com/client-js"

const apiKey = process.env.MASSIVE_API_KEY

if (!apiKey) {
  throw new Error("MASSIVE_API_KEY is required to load EOD market data")
}

export const massive = restClient(apiKey)
