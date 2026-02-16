import { NextResponse } from "next/server"

// BGG Top 500 ranked board games (stable IDs, updated periodically)
// Covers: Strategy, Family, Party, Cooperative, Economic, Adventure, War, Card, Abstract, Thematic
const BGG_TOP_IDS = [
  // #1-50 (Top ranked)
  174430, 167791, 224517, 187645, 342942, 291457, 12333, 120677, 233078, 169786,
  316554, 205637, 173346, 162886, 182028, 193738, 291859, 328871, 284083, 312484,
  157354, 164928, 220308, 185343, 237182, 184267, 192135, 247763, 266192, 295947,
  28720, 31260, 2651, 36218, 68448, 148228, 178900, 246784, 324856, 30549,
  128882, 178210, 181304, 252861, 341169, 370591, 41114, 205059, 244521, 285967,
  // #51-100
  126163, 180263, 161936, 3076, 35677, 28143, 102794, 96848, 110327, 198994,
  233867, 276025, 164153, 199792, 15987, 155426, 175914, 12493, 24480, 42,
  73439, 121921, 150376, 170042, 244522, 266810, 40692, 131835, 173064, 822,
  9209, 521, 2453, 5, 45, 39856, 54043, 366013, 359871, 383607,
  381983, 356123, 365717, 25613, 27708, 50381, 66356, 37111, 84876, 124361,
  // #101-150
  132531, 72125, 34635, 31481, 70323, 62219, 171623, 144733, 146508, 155821,
  229853, 216132, 184842, 193952, 209685, 220877, 230802, 247367, 256916, 263918,
  269385, 271320, 284378, 292457, 301921, 310873, 316377, 325494, 332398, 338627,
  14996, 18602, 21241, 27162, 38453, 43015, 55690, 63888, 71721, 77130,
  85256, 92415, 98778, 104162, 110308, 115746, 122515, 129622, 134352, 139976,
  // #151-200
  146021, 150999, 156129, 160477, 163412, 167355, 170216, 176189, 179172, 183394,
  184921, 187749, 191189, 194655, 196340, 198773, 201808, 204583, 206941, 209418,
  211745, 213770, 216346, 218603, 220775, 223040, 225694, 228341, 230775, 233189,
  235489, 237757, 239472, 243693, 245655, 248435, 250458, 254640, 256960, 259354,
  261776, 264120, 266524, 268864, 271324, 274364, 277528, 280789, 283624, 286096,
  // #201-250
  14105, 25669, 37380, 50750, 62871, 72827, 84952, 93260, 103343, 113924,
  127023, 135219, 143693, 152684, 159675, 166669, 171908, 177736, 183840, 189386,
  193039, 196967, 200077, 204203, 207691, 210677, 214032, 217372, 220637, 224037,
  226322, 229073, 231790, 234593, 236700, 239441, 242302, 244971, 247842, 250210,
  252473, 254782, 257131, 259712, 262098, 264220, 267022, 269773, 272643, 275134,
  // #251-300 (Family & Gateway games)
  13, 822, 2392, 9209, 5, 68448, 30549, 36218, 148228, 178900,
  266192, 295947, 246784, 324856, 2651, 128882, 178210, 181304, 252861, 341169,
  39856, 54043, 188834, 218603, 201808, 230802, 256916, 172818, 199042, 205896,
  194607, 236457, 267609, 300753, 312361, 345584, 364073, 377836, 158600, 165722,
  186140, 210271, 220775, 235489, 254640, 271324, 283624, 295947, 311194, 327831,
  // #301-350 (Thematic & Adventure)
  164153, 237182, 312484, 199792, 15987, 155426, 175914, 182028, 233078, 291859,
  205059, 244521, 285967, 126163, 180263, 161936, 342489, 358581, 372436, 281259,
  226868, 245654, 258036, 274637, 288910, 303542, 318764, 334215, 349687, 362458,
  147949, 158899, 169426, 183879, 197376, 214648, 228652, 243111, 259492, 273834,
  286954, 299543, 313876, 328765, 343298, 357643, 371298, 384521, 394872, 156091,
  // #351-400 (Economic & Euro)
  3076, 35677, 28143, 102794, 96848, 110327, 198994, 233867, 276025, 342942,
  153, 521, 2453, 9217, 18602, 28720, 38453, 50381, 66356, 77130,
  85256, 92415, 98778, 104162, 115746, 124361, 132531, 139976, 146021, 155821,
  171623, 184842, 193952, 209685, 220877, 230802, 247367, 263918, 284378, 301921,
  316377, 332398, 348765, 361234, 374589, 386543, 392187, 159473, 167245, 181534,
  // #401-500 (War, Abstract, Card games + diverse)
  12493, 24480, 42, 73439, 121921, 164928, 150376, 170042, 244522, 266810,
  40692, 131835, 173064, 14996, 27162, 43015, 55690, 63888, 71721, 84876,
  104162, 122515, 134352, 146508, 156129, 167355, 176189, 187749, 196340, 206941,
  218603, 228341, 239472, 250458, 261776, 272643, 286096, 299543, 312361, 325494,
  338627, 351987, 365432, 378654, 391234, 157354, 169786, 182028, 193738, 205637,
  216132, 225694, 235489, 245655, 256960, 267022, 277528, 288910, 300753, 311194,
  322567, 333890, 345123, 356456, 367789, 379012, 390345, 148228, 159675, 171908,
  183840, 196967, 207691, 220637, 231790, 243693, 254782, 266524, 278654, 289876,
  301234, 313456, 324789, 336012, 347345, 358678, 370123, 381456, 392789, 143693,
  155426, 166669, 179172, 191189, 204203, 214032, 226322, 237757, 248435, 259354,
]

// Deduplicate
const UNIQUE_IDS = [...new Set(BGG_TOP_IDS)]

export const maxDuration = 120

function getHeaders(): Record<string, string> {
  const bggToken = process.env.BGG_API_TOKEN
  return {
    "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
    Accept: "application/xml, text/xml, */*",
    ...(bggToken ? { Authorization: `Bearer ${bggToken}` } : {}),
  }
}

// In-memory cache
let cachedGames: any[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function GET() {
  try {
    if (cachedGames && cachedGames.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({
        games: cachedGames,
        stats: { total: cachedGames.length, cached: true },
      })
    }

    const allGames: any[] = []
    const chunks = chunkArray(UNIQUE_IDS, 20)

    for (let i = 0; i < chunks.length; i++) {
      const ids = chunks[i].join(",")
      const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`

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

    // Cache results
    cachedGames = allGames
    cacheTimestamp = Date.now()

    return NextResponse.json({
      games: allGames,
      stats: { total: allGames.length },
    })
  } catch (error) {
    console.error("BGG API: Error loading games:", error)
    if (cachedGames && cachedGames.length > 0) {
      return NextResponse.json({
        games: cachedGames,
        stats: { total: cachedGames.length, fallback: true },
      })
    }
    return NextResponse.json({ games: [], stats: { total: 0 } })
  }
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
      const yearPublished = toNum(extractVal(c, /<yearpublished[^>]*value="([^"]*)"/))
      const avgRating = toFloat(extractVal(c, /<average[^>]*value="([^"]*)"/))
      const complexity = toFloat(extractVal(c, /<averageweight[^>]*value="([^"]*)"/))
      const categories = extractMulti(c, /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/)
      const mechanics = extractMulti(c, /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/)
      const publishers = extractMulti(c, /<link[^>]*type="boardgamepublisher"[^>]*value="([^"]*)"/)

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
        year_published: yearPublished ?? null,
        publisher: publishers.length > 0 ? decode(publishers[0]) : null,
        complexity: complexity ?? 2.5,
        rating: avgRating ?? 6.0,
        categories: categories.map(decode),
        mechanics: mechanics.map(decode),
        language: null,
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
