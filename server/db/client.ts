import { createClient } from "@libsql/client"
import { mkdirSync } from "node:fs"

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL?.trim() || undefined
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined

export const databaseProvider = tursoDatabaseUrl ? "turso" : "sqlite"

if (tursoDatabaseUrl && !tursoAuthToken) {
  throw new Error(
    "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is configured"
  )
}

if (!tursoDatabaseUrl && process.env.VERCEL) {
  throw new Error(
    "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for this Vercel deployment"
  )
}

if (!tursoDatabaseUrl) {
  mkdirSync("data", { recursive: true })
}

const database = createClient({
  url: tursoDatabaseUrl ?? "file:data/auction-radar.db",
  authToken: tursoAuthToken,
})

export function getDatabaseClient() {
  return database
}

export function closeDatabase() {
  database.close()
}
