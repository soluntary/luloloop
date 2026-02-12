import { type NextRequest, NextResponse } from "next/server"

// Fetches games from BoardGameGeek for the Brettspiel-O-Mat

const BGG_HEADERS = {
  "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
  Accept: "application/xml, text/xml, */*",
}

export async function GET(request: NextRequest) {
  try {
    const bggGames = await loadBGGHotGames()

    return NextResponse.json({
      games: bggGames,
      stats: {
        bgg: bggGames.length,
        total: bggGames.length,
      },
    })
  } catch (error) {
    console.error("Error loading games for Brettspiel-O-Mat:", error)
    return NextResponse.json({ games: [], stats: { bgg: 0, total: 0 } })
  }
}

async function loadBGGHotGames(): Promise<any[]> {
  try {
    // Fetch BGG Hot list
    console.log("[v0] Fetching BGG hot list...")
    const hotRes = await fetch("https://boardgamegeek.com/xmlapi2/hot?type=boardgame", {
      headers: BGG_HEADERS,
      next: { revalidate: 3600 },
    })
    console.log("[v0] BGG hot list status:", hotRes.status)
    if (!hotRes.ok) return []

    const hotXml = await hotRes.text()
    const hotIds = extractHotIds(hotXml)
    console.log("[v0] Found", hotIds.length, "hot game IDs")
    if (hotIds.length === 0) return []

    // Fetch details for all hot games (BGG allows up to ~20 IDs per request)
    const allGames: any[] = []
    const chunks = chunkArray(hotIds, 20)

    for (const chunk of chunks) {
      const ids = chunk.join(",")
      console.log("[v0] Fetching details for", chunk.length, "games...")
      const detailRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`,
        { headers: BGG_HEADERS, next: { revalidate: 3600 } }
      )
      if (detailRes.ok) {
        const detailXml = await detailRes.text()
        const games = parseBGGGameDetails(detailXml)
        console.log("[v0] Parsed", games.length, "games from batch")
        allGames.push(...games)
      }
    }

    console.log("[v0] Total BGG games loaded:", allGames.length)
    return allGames
  } catch (error) {
    console.error("Error loading BGG hot games:", error)
    return []
  }
}

function extractHotIds(xml: string): string[] {
  const ids: string[] = []
  const regex = /<item[^>]+id="(\d+)"[^>]*>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    ids.push(match[1])
  }
  return ids
}

function parseBGGGameDetails(xml: string): any[] {
  const games: any[] = []
  const itemRegex = /<item[^>]*type="boardgame"[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g
  let itemMatch

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const bggId = itemMatch[1]
    const content = itemMatch[2]

    try {
      // Try multiple patterns for the primary name (BGG attribute order varies)
      let title =
        extractVal(content, /<name[^>]*type="primary"[^>]*value="([^"]*)"/) ||
        extractVal(content, /<name[^>]*value="([^"]*)"[^>]*type="primary"/)
      // Fallback: just take the first name
      if (!title) {
        title = extractVal(content, /<name[^>]*value="([^"]*)"/)
      }
      if (!title) continue

      const minPlayers = toNum(extractVal(content, /<minplayers[^>]*value="([^"]*)"/))
      const maxPlayers = toNum(extractVal(content, /<maxplayers[^>]*value="([^"]*)"/))
      const playingTime = toNum(extractVal(content, /<playingtime[^>]*value="([^"]*)"/))
      const minPlaytime = toNum(extractVal(content, /<minplaytime[^>]*value="([^"]*)"/))
      const maxPlaytime = toNum(extractVal(content, /<maxplaytime[^>]*value="([^"]*)"/))
      const minAge = toNum(extractVal(content, /<minage[^>]*value="([^"]*)"/))
      const image = extractVal(content, /<image[^>]*>([^<]+)<\/image>/)
      const thumbnail = extractVal(content, /<thumbnail[^>]*>([^<]+)<\/thumbnail>/)
      const avgRating = toFloat(extractVal(content, /<average[^>]*value="([^"]*)"/))
      const complexity = toFloat(extractVal(content, /<averageweight[^>]*value="([^"]*)"/))
      const categories = extractMulti(content, /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/)
      const mechanics = extractMulti(content, /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/)

      games.push({
        id: `bgg-${bggId}`,
        bgg_id: Number(bggId),
        title: decodeEntities(title),
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
        categories: categories.map(decodeEntities),
        mechanics: mechanics.map(decodeEntities),
        source: "bgg" as const,
      })
    } catch {
      // skip this game
    }
  }

  return games
}

function extractVal(content: string, regex: RegExp): string | null {
  const m = content.match(regex)
  return m ? m[1] : null
}

function extractMulti(content: string, regex: RegExp): string[] {
  const results: string[] = []
  const g = new RegExp(regex.source, "g")
  let m
  while ((m = g.exec(content)) !== null) {
    results.push(m[1])
  }
  return results
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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, "\n")
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
