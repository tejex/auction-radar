import { restClient } from "@massive.com/client-js"

let client: ReturnType<typeof restClient> | null = null

export function getMassiveClient() {
  if (client) return client

  const apiKey = process.env.MASSIVE_API_KEY

  if (!apiKey) {
    throw new Error("MASSIVE_API_KEY is required to load EOD market data")
  }

  client = restClient(apiKey)
  return client
}
