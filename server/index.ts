import Fastify from "fastify"
import { db } from "./db/client.ts"
import { scannerRoutes } from "./routes/scanner.ts"
import { runScanner } from "./services/serviceFunctions.ts"
import "./db/schema.ts"

const fastify = Fastify({
  logger: true
})

fastify.register(scannerRoutes)

/****************************************************************/
fastify.get('/', async () => {
  return {
    service: "auction-radar-api",
    status: "ok",
  }
})
/****************************************************************/
fastify.get("/count", async () => {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM daily_bars")
    .get()

  return row
})
fastify.get("/scanner", async () => {
  return runScanner()
})

try {
  await fastify.listen({ port: 3001 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
/****************************************************************/
