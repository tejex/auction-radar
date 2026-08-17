import { neon } from "@neondatabase/serverless"
import Database from "better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.trim()

export const databaseProvider = databaseUrl ? "postgres" : "sqlite"

const postgresClient = databaseUrl ? neon(databaseUrl) : null
let sqliteClient: Database.Database | null = null

export function getPostgresClient() {
  if (!postgresClient) {
    throw new Error("DATABASE_URL is required for the Postgres database")
  }

  return postgresClient
}

export function getSqliteClient() {
  if (databaseProvider !== "sqlite") {
    throw new Error("SQLite is unavailable while DATABASE_URL is configured")
  }

  if (!sqliteClient) {
    sqliteClient = new Database("data/auction-radar.db")
    sqliteClient.pragma("journal_mode = WAL")
  }

  return sqliteClient
}

export function closeDatabase() {
  sqliteClient?.close()
  sqliteClient = null
}
