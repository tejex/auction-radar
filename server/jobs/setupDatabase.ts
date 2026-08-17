import { databaseProvider } from "../db/client.ts"
import { initializeDatabase } from "../db/schema.ts"

await initializeDatabase()
console.log(`Initialized the ${databaseProvider} database schema`)
