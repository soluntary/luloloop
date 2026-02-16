import { NextResponse } from "next/server"

export const maxDuration = 120 // Allow up to 120s for many BGG API calls

function getHeaders(): Record<string, string> {
  const bggToken = process.env.BGG_API_TOKEN
  return {
    "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
    Accept: "application/xml, text/xml, */*",
    ...(bggToken ? { Authorization: `Bearer ${bggToken}` } : {}),
  }
}

// In-memory cache to avoid re-fetching on every request
let cachedGames: any[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function GET() {
  try {
    // Return cached games if still fresh
    if (cachedGames && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({
        games: cachedGames,
        stats: { total: cachedGames.length, cached: true },
      })
    }

    // 1. Fetch game IDs from multiple BGG ranked lists (each returns up to 100)
    const gameIds = await fetchBGGGameIds()

    // 2. Fetch full details for all IDs
    const games = await fetchGameDetails(gameIds)

    // Cache results
    cachedGames = games
    cacheTimestamp = Date.now()

    return NextResponse.json({
      games,
      stats: { total: games.length, cached: false },
    })
  } catch (error) {
    console.error("BGG API: Error loading games:", error)
    // Return cached games as fallback if available
    if (cachedGames) {
      return NextResponse.json({
        games: cachedGames,
        stats: { total: cachedGames.length, cached: true, fallback: true },
      })
    }
    return NextResponse.json({ games: [], stats: { total: 0 } })
  }
}

/**
 * Fetch game IDs from multiple BGG ranked/hot lists.
 * BGG sitemap XML and the "hot" endpoint give us broad coverage.
 * We fetch pages 1-10 of the top ranked boardgames (~1000 games).
 */
async function fetchBGGGameIds(): Promise<number[]> {
  const allIds = new Set<number>()

  // Fetch BGG Hot list (50 trending games)
  try {
    const hotRes = await fetch("https://boardgamegeek.com/xmlapi2/hot?type=boardgame", {
      headers: getHeaders(),
      cache: "no-store",
    })
    if (hotRes.ok) {
      const hotXml = await hotRes.text()
      const idMatches = hotXml.matchAll(/item\s+id="(\d+)"/g)
      for (const m of idMatches) allIds.add(Number(m[1]))
    }
  } catch { /* skip */ }

  // Fetch top ranked games from BGG search sorted by rank (pages 1-10, ~100 per page)
  // BGG XMLAPI2 doesn't have a direct "top list" endpoint, so we use a known list approach:
  // We'll scrape the sitemap or use the browse endpoint
  const topListPages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  for (const page of topListPages) {
    try {
      const browseRes = await fetch(
        `https://boardgamegeek.com/browse/boardgame/page/${page}`,
        { headers: { ...getHeaders(), Accept: "text/html" }, cache: "no-store" }
      )
      if (browseRes.ok) {
        const html = await browseRes.text()
        // Extract game IDs from the browse page HTML
        const idMatches = html.matchAll(/\/boardgame\/(\d+)/g)
        for (const m of idMatches) allIds.add(Number(m[1]))
      }
      // Small delay between page fetches
      await new Promise((r) => setTimeout(r, 800))
    } catch { /* skip page */ }
  }

  return [...allIds]
}

/**
 * Fetch full game details from BGG XML API in chunks of 20.
 * Sequential with delay to respect rate limits.
 */
async function fetchGameDetails(ids: number[]): Promise<any[]> {
  const allGames: any[] = []
  const chunks = chunkArray(ids, 20)

  for (let i = 0; i < chunks.length; i++) {
    const idsStr = chunks[i].join(",")
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${idsStr}&stats=1`

    if (i > 0) await new Promise((r) => setTimeout(r, 1000))

    try {
      let res = await fetch(url, { headers: getHeaders(), cache: "no-store" })

      if (res.status === 202) {
        await new Promise((r) => setTimeout(r, 3000))
        res = await fetch(url, { headers: getHeaders(), cache: "no-store" })
      }

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 5000))
        res = await fetch(url, { headers: getHeaders(), cache: "no-store" })
      }

      if (!res.ok) continue

      const xml = await res.text()
      const parsed = parseGames(xml)
      allGames.push(...parsed)
    } catch {
      // skip failed chunk
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
