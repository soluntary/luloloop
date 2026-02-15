import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Top-rated and popular board games from BGG (curated list of ~100 well-known games)
// These IDs rarely change and cover a wide range of genres, complexities, and player counts
const TOP_GAME_IDS = [
  // Top Strategy
  174430, 167791, 169786, 187645, 12333, 28720, 31260, 120677, 173346, 162886,
  // Family / Gateway
  13, 30549, 68448, 36218, 148228, 178900, 266192, 295947, 246784, 324856,
  // Party / Light
  128882, 178210, 181304, 205637, 252861, 291457, 341169, 370591, 2651, 41114,
  // Cooperative
  161936, 169786, 224517, 205059, 244521, 291859, 285967, 233078, 126163, 180263,
  // Economic / Trading
  3076, 35677, 28143, 102794, 96848, 110327, 198994, 233867, 276025, 342942,
  // Adventure / Thematic
  164153, 205637, 237182, 312484, 291457, 199792, 15987, 155426, 175914, 182028,
  // War / Conflict
  12493, 2651, 24480, 42, 3076, 73439, 187645, 121921, 161936, 164928,
  // Card Games
  68448, 150376, 170042, 199792, 244522, 266810, 312484, 40692, 131835, 173064,
  // Classics & Modern Classics
  822, 9209, 521, 2453, 5, 45, 30549, 36218, 39856, 54043,
  // Newer / Trending (2022-2025)
  342942, 324856, 370591, 341169, 366013, 359871, 383607, 381983, 356123, 365717,
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
    // 1. Load local games from DB first (always available)
    const localGames = await loadLocalGames()

    // 2. Try to load BGG games (may fail/timeout)
    let bggGames: any[] = []
    try {
      bggGames = await loadBGGGames()
    } catch (err) {
      console.error("BGG loading failed, using local games only:", err)
    }

    // 3. Combine: local games first, then BGG games (deduplicated by title)
    const localTitles = new Set(localGames.map((g) => g.title.toLowerCase()))
    const uniqueBggGames = bggGames.filter((g) => !localTitles.has(g.title.toLowerCase()))
    const allGames = [...localGames, ...uniqueBggGames]

    return NextResponse.json({
      games: allGames,
      stats: { total: allGames.length, local: localGames.length, bgg: uniqueBggGames.length },
    })
  } catch (error) {
    console.error("Error loading games:", error)
    return NextResponse.json({ games: [], stats: { total: 0 } })
  }
}

async function loadLocalGames(): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data: games, error } = await supabase
      .from("games")
      .select("id, title, description, image, publisher, category, type, style, players, min_players, max_players, play_time, duration, age, age_rating, year_published")

    if (error || !games) return []

    return games.map((game) => {
      const categories = game.category
        ? game.category.split(",").map((c: string) => c.trim()).filter(Boolean)
        : []

      const mechanics = [
        ...(game.type ? game.type.split(",").map((t: string) => t.trim()).filter(Boolean) : []),
        ...(game.style ? game.style.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
      ]

      let minPlayers = game.min_players || 2
      let maxPlayers = game.max_players || 4
      if (!game.min_players && game.players) {
        const match = game.players.match(/(\d+)\s*(?:bis|-)\s*(\d+)/)
        if (match) {
          minPlayers = parseInt(match[1], 10)
          maxPlayers = parseInt(match[2], 10)
        }
      }

      let playingTime = game.play_time || 60
      if (!game.play_time && game.duration) {
        const match = game.duration.match(/(\d+)(?:\s*-\s*(\d+))?/)
        if (match) {
          playingTime = match[2]
            ? Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2)
            : parseInt(match[1], 10)
        }
      }

      let age = 10
      if (game.age) {
        const ageMatch = game.age.match(/(\d+)/)
        if (ageMatch) age = parseInt(ageMatch[1], 10)
      }

      return {
        id: game.id,
        title: game.title || "Unbekannt",
        description: game.description || "",
        image: game.image || "",
        thumbnail: game.image || "",
        categories,
        mechanics,
        complexity: 0,
        min_players: minPlayers,
        max_players: maxPlayers,
        playing_time: playingTime,
        min_playtime: playingTime,
        max_playtime: playingTime,
        age,
        rating: 7,
        year_published: game.year_published || undefined,
        source: "local" as const,
      }
    })
  } catch {
    return []
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
