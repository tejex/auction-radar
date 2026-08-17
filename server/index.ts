import Fastify from "fastify"
import { getDailyBarCount } from "./db/queries.ts"
import { initializeDatabase } from "./db/schema.ts"
import { scannerRoutes } from "./routes/scanner.ts"
import { runScanner } from "./services/serviceFunctions.ts"

await initializeDatabase()

const fastify = Fastify({ logger: true })

fastify.register(scannerRoutes)

fastify.get("/", async () => ({
  service: "auction-radar-api",
  status: "ok",
}))

fastify.get("/count", async () => ({
  count: await getDailyBarCount(),
}))

fastify.get("/scanner", async () => await runScanner())

try {
  await fastify.listen({ port: 3001 })
} catch (error) {
  fastify.log.error(error)
  process.exit(1)
}
