import { NextResponse } from "next/server"

// Top-rated and popular board games from BGG - curated list covering many genres
const TOP_GAME_IDS = [
  // Top Strategy
  174430, 167791, 169786, 187645, 12333, 28720, 31260, 120677, 173346, 162886,
  // Family / Gateway
  13, 30549, 68448, 36218, 148228, 178900, 266192, 295947, 246784, 324856,
  // Party / Light
  128882, 178210, 181304, 205637, 252861, 291457, 341169, 370591, 2651, 41114,
  // Cooperative
  161936, 224517, 205059, 244521, 291859, 285967, 233078, 126163, 180263,
  // Economic / Trading
  3076, 35677, 28143, 102794, 96848, 110327, 198994, 233867, 276025, 342942,
  // Adventure / Thematic
  164153, 237182, 312484, 199792, 15987, 155426, 175914, 182028,
  // War / Conflict
  12493, 24480, 42, 73439, 121921, 164928,
  // Card Games
  150376, 170042, 244522, 266810, 40692, 131835, 173064,
  // Classics & Modern Classics
  822, 9209, 521, 2453, 5, 45, 39856, 54043,
  // Newer / Trending (2022-2025)
  366013, 359871, 383607, 381983, 356123, 365717,
]

// Deduplicate IDs
const UNIQUE_IDS = [...new Set(TOP_GAME_IDS)]

const BGG_HEADERS = {
  "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
  Accept: "application/xml, text/xml, */*",
}

export const maxDuration = 30 // Allow up to 30s for BGG API calls

export async function GET() {
  try {
    const games = await loadBGGGames()
    return NextResponse.json({
      games,
      stats: { total: games.length },
    })
  } catch (error) {
    console.error("Error loading BGG games:", error)
    return NextResponse.json({ games: [], stats: { total: 0 } })
  }
}

async function loadBGGGames(): Promise<any[]> {
  const allGames: any[] = []
  // BGG allows up to 20 IDs per request
  const chunks = chunkArray(UNIQUE_IDS, 20)

  // Run all chunks in parallel for speed
  const results = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const ids = chunk.join(",")
      const res = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`,
        { headers: BGG_HEADERS, next: { revalidate: 3600 } }
      )
      if (!res.ok) return []
      const xml = await res.text()
      return parseGames(xml)
    })
  )

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      allGames.push(...r.value)
    }
  }

  return allGames
}

function parseGames(xml: string): any[] {
  const games: any[] = []
  const itemRegex = /<item[^>]*type="boardgame"[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g
  let m

  while ((m = itemRegex.exec(xml)) !== null) {
    const bggId = m[1]
    const c = m[2]

    try {
      const title =
        extractVal(c, /<name[^>]*type="primary"[^>]*value="([^"]*)"/) ||
        extractVal(c, /<name[^>]*value="([^"]*)"[^>]*type="primary"/) ||
        extractVal(c, /<name[^>]*value="([^"]*)"/)
      if (!title) continue

      const minPlayers = toNum(extractVal(c, /<minplayers[^>]*value="([^"]*)"/))
      const maxPlayers = toNum(extractVal(c, /<maxplayers[^>]*value="([^"]*)"/))
      const playingTime = toNum(extractVal(c, /<playingtime[^>]*value="([^"]*)"/))
      const minPlaytime = toNum(extractVal(c, /<minplaytime[^>]*value="([^"]*)"/))
      const maxPlaytime = toNum(extractVal(c, /<maxplaytime[^>]*value="([^"]*)"/))
      const minAge = toNum(extractVal(c, /<minage[^>]*value="([^"]*)"/))
      const image = extractVal(c, /<image[^>]*>([^<]+)<\/image>/)
      const thumbnail = extractVal(c, /<thumbnail[^>]*>([^<]+)<\/thumbnail>/)
      const avgRating = toFloat(extractVal(c, /<average[^>]*value="([^"]*)"/))
      const complexity = toFloat(extractVal(c, /<averageweight[^>]*value="([^"]*)"/))
      const categories = extractMulti(c, /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/)
      const mechanics = extractMulti(c, /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/)

      games.push({
        id: `bgg-${bggId}`,
        bgg_id: Number(bggId),
        title: decode(title),
        description: "",
        image: image || thumbnail || "",
        thumbnail: thumbnail || image || "",
        min_players: minPlayers ?? 1,
        max_players: maxPlayers ?? 4,
        playing_time: playingTime ?? 60,
        min_playtime: minPlaytime ?? playingTime ?? 30,
        max_playtime: maxPlaytime ?? playingTime ?? 90,
        age: minAge ?? 10,
        complexity: complexity ?? 2.5,
        rating: avgRating ?? 6.0,
        categories: categories.map(decode),
        mechanics: mechanics.map(decode),
        source: "bgg" as const,
      })
    } catch {
      // skip
    }
  }

  return games
}

function extractVal(c: string, re: RegExp): string | null {
  const m = c.match(re)
  return m ? m[1] : null
}

function extractMulti(c: string, re: RegExp): string[] {
  const r: string[] = []
  const g = new RegExp(re.source, "g")
  let m
  while ((m = g.exec(c)) !== null) r.push(m[1])
  return r
}

function toNum(s: string | null): number | null {
  if (!s) return null
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

function toFloat(s: string | null): number | null {
  if (!s) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#10;/g, "\n")
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
