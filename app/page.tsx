import { MainPage } from "./components/pages/MainPage"
import { databaseProvider } from "@/server/db/client"
import { getLatestScannerResults } from "@/server/db/scannerResults"
import { initializeDatabase } from "@/server/db/schema"

export const dynamic = "force-dynamic"

const Home = async () => {
  if (databaseProvider === "sqlite") {
    await initializeDatabase()
  }
  const data = await getLatestScannerResults()

  return <MainPage data={data} />
}

export default Home
