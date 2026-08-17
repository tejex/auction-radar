
import type { FastifyInstance } from "fastify"
import { scanTicker } from "../services/serviceFunctions.ts"

export async function scannerRoutes(fastify: FastifyInstance) {
  fastify.get("/scanner/:ticker", async (request) => {
    const { ticker } = request.params as { ticker: string }

    return scanTicker(ticker)
  })
}