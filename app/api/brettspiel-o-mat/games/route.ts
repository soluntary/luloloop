import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fetches and merges games from local DB + BGG Hot list for the Brettspiel-O-Mat

const BGG_HEADERS = {
  "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
  Accept: "application/xml, text/xml, */*",
}

export async function GET(request: NextRequest) {
  try {
    // 1. Load local game_catalog from Supabase
    const supabase = await createClient()
    const { data: localGames } = await supabase
      .from("game_catalog")
      .select("*")
      .order("rating", { ascending: false })
      .limit(500)

    // 2. Load BGG Hot list in parallel
    const bggGames = await loadBGGHotGames()

    // 3. Merge: local games first, then BGG games that aren't duplicates
    const localBggIds = new Set(
      (localGames || []).filter((g) => g.bgg_id).map((g) => String(g.bgg_id))
    )
    const localTitles = new Set(
      (localGames || []).map((g) => g.title?.toLowerCase().trim())
    )

    const uniqueBggGames = bggGames.filter(
      (g) => !localBggIds.has(String(g.bgg_id)) && !localTitles.has(g.title?.toLowerCase().trim())
    )

    // Normalize local games to a common format
    const normalizedLocal = (localGames || []).map((g) => ({
      id: g.id,
      bgg_id: g.bgg_id,
      title: g.title,
      description: g.description,
      image: g.image || g.thumbnail,
      thumbnail: g.thumbnail || g.image,
      min_players: g.min_players,
      max_players: g.max_players,
      playing_time: g.playing_time,
      min_playtime: g.min_playtime,
      max_playtime: g.max_playtime,
      age: g.age,
      complexity: g.complexity,
      rating: g.rating,
      categories: g.categories || [],
      mechanics: g.mechanics || [],
      source: "local" as const,
    }))

    const allGames = [...normalizedLocal, ...uniqueBggGames]

    return NextResponse.json({
      games: allGames,
      stats: {
        local: normalizedLocal.length,
        bgg: uniqueBggGames.length,
        total: allGames.length,
      },
    })
  } catch (error) {
    console.error("Error loading games for Brettspiel-O-Mat:", error)
    return NextResponse.json({ games: [], stats: { local: 0, bgg: 0, total: 0 } })
  }
}

async function loadBGGHotGames(): Promise<any[]> {
  try {
    // Fetch BGG Hot list
    const hotRes = await fetch("https://boardgamegeek.com/xmlapi2/hot?type=boardgame", {
      headers: BGG_HEADERS,
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    if (!hotRes.ok) return []

    const hotXml = await hotRes.text()
    const hotIds = extractHotIds(hotXml)
    if (hotIds.length === 0) return []

    // Fetch details for all hot games (BGG allows up to ~20 IDs per request)
    const allGames: any[] = []
    const chunks = chunkArray(hotIds, 20)

    for (const chunk of chunks) {
      const ids = chunk.join(",")
      const detailRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`,
        { headers: BGG_HEADERS, next: { revalidate: 3600 } }
      )
      if (detailRes.ok) {
        const detailXml = await detailRes.text()
        const games = parseBGGGameDetails(detailXml)
        allGames.push(...games)
      }
    }

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
      const title =
        extractVal(content, /<name[^>]*type="primary"[^>]*value="([^"]*)"/) ||
        extractVal(content, /<name[^>]*value="([^"]*)"[^>]*type="primary"/)
      if (!title) continue

      const minPlayers = toNum(extractVal(content, /<minplayers[^>]*value="([^"]*)"/))
      const maxPlayers = toNum(extractVal(content, /<maxplayers[^>]*value="([^"]*)"/))
      const playingTime = toNum(extractVal(content, /<playingtime[^>]*value="([^"]*)"/))
      const minPlaytime = toNum(extractVal(content, /<minplaytime[^>]*value="([^"]*)"/))
      const maxPlaytime = toNum(extractVal(content, /<maxplaytime[^>]*value="([^"]*)"/))
      const minAge = toNum(extractVal(content, /<minage[^>]*value="([^"]*)"/))
      const image = extractVal(content, /<image[^>]*>([^<]+)<\/image>/)
      const thumbnail = extractVal(content, /<thumbnail[^>]*>([^<]+)<\/thumbnail>/)

      // Rating from statistics
      const avgRating = toFloat(extractVal(content, /<average[^>]*value="([^"]*)"/))
      // Complexity / weight
      const complexity = toFloat(extractVal(content, /<averageweight[^>]*value="([^"]*)"/))

      // Categories and mechanics
      const categories = extractMulti(content, /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/)
      const mechanics = extractMulti(content, /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/)

      games.push({
        id: `bgg-${bggId}`,
        bgg_id: Number(bggId),
        title: decodeEntities(title),
        description: null,
        image: image || thumbnail,
        thumbnail: thumbnail || image,
        min_players: minPlayers,
        max_players: maxPlayers,
        playing_time: playingTime,
        min_playtime: minPlaytime,
        max_playtime: maxPlaytime,
        age: minAge,
        complexity,
        rating: avgRating || 0,
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
