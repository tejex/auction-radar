import { MainPage } from "./components/pages/MainPage"
import type { ScannerResult } from "./types"

const Home = async () => {
  const response = await fetch("http://localhost:3001/scanner", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch scanner data: ${response.status}`)
  }

  const data: ScannerResult[] = await response.json()

  return <MainPage data={data} />
}

export default Home
