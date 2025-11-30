import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  console.log("[v0] BoardGameGeek API called with query:", query)

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  const bggToken = process.env.BGG_API_TOKEN
  if (!bggToken) {
    console.error("[v0] BGG_API_TOKEN environment variable is not set")
    return NextResponse.json({
      games: [],
      error: "BGG API Token ist nicht konfiguriert. Bitte Token in den Umgebungsvariablen setzen.",
    })
  }

  try {
    const headers = {
      "User-Agent": "Ludoloop/1.0 (Board Game Community App)",
      Accept: "application/xml, text/xml, */*",
      Authorization: `Bearer ${bggToken}`,
    }

    // Search for games on BoardGameGeek (without www.)
    const searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    console.log("[v0] Fetching from BGG search URL:", searchUrl)

    const searchResponse = await fetch(searchUrl, {
      headers,
      cache: "no-store",
    })
    console.log("[v0] BGG search response status:", searchResponse.status)

    if (searchResponse.status === 401 || searchResponse.status === 403) {
      console.error("[v0] BGG API authentication failed")
      return NextResponse.json({
        games: [],
        error: "BoardGameGeek API Authentifizierung fehlgeschlagen. Bitte Token überprüfen.",
        status: searchResponse.status,
      })
    }

    if (!searchResponse.ok) {
      return NextResponse.json({
        games: [],
        error: "Fehler bei der BGG-Suche. Bitte später erneut versuchen.",
        status: searchResponse.status,
      })
    }

    const searchXml = await searchResponse.text()
    console.log("[v0] BGG search XML length:", searchXml.length)

    // Parse XML to extract game IDs
    const gameIds = extractGameIds(searchXml)
    console.log("[v0] Extracted game IDs:", gameIds)

    if (gameIds.length === 0) {
      console.log("[v0] No game IDs found, returning empty array")
      return NextResponse.json({ games: [] })
    }

    // Get detailed information for the first 10 games
    const detailIds = gameIds.slice(0, 10).join(",")
    const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${detailIds}&stats=1`
    console.log("[v0] Fetching game details from:", detailUrl)

    const detailResponse = await fetch(detailUrl, {
      headers,
      cache: "no-store",
    })
    console.log("[v0] BGG detail response status:", detailResponse.status)

    if (!detailResponse.ok) {
      console.log("[v0] BGG detail fetch failed with status:", detailResponse.status)
      return NextResponse.json({
        games: [],
        error: "Fehler beim Laden der Spieldetails. Bitte später erneut versuchen.",
        status: detailResponse.status,
      })
    }

    const detailXml = await detailResponse.text()
    console.log("[v0] BGG detail XML length:", detailXml.length)

    const games = parseGameDetails(detailXml)
    console.log("[v0] Parsed games count:", games.length)

    return NextResponse.json({ games })
  } catch (error) {
    console.error("[v0] BoardGameGeek API error:", error)
    return NextResponse.json(
      {
        games: [],
        error: "Netzwerkfehler beim Abrufen der Spieldaten.",
      },
      { status: 200 },
    )
  }
}

function extractGameIds(xml: string): string[] {
  const gameIds: string[] = []
  const regex = /<item[^>]+id="(\d+)"[^>]*>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    gameIds.push(match[1])
  }

  return gameIds
}

function parseGameDetails(xml: string): any[] {
  const games: any[] = []
  console.log("[v0] Starting to parse game details XML")

  // Simple XML parsing for game details
  const itemRegex = /<item[^>]*type="boardgame"[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g
  let itemMatch

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const gameId = itemMatch[1]
    const itemContent = itemMatch[2]
    console.log("[v0] Processing game ID:", gameId)

    try {
      // Extract game information with more flexible patterns
      const name =
        extractValue(itemContent, /<name[^>]*type="primary"[^>]*value="([^"]*)"/) ||
        extractValue(itemContent, /<name[^>]*value="([^"]*)"[^>]*type="primary"/)

      const yearPublished = extractValue(itemContent, /<yearpublished[^>]*value="([^"]*)"/)
      const minPlayers = extractValue(itemContent, /<minplayers[^>]*value="([^"]*)"/)
      const maxPlayers = extractValue(itemContent, /<maxplayers[^>]*value="([^"]*)"/)
      const minPlayTime = extractValue(itemContent, /<minplaytime[^>]*value="([^"]*)"/)
      const maxPlayTime = extractValue(itemContent, /<maxplaytime[^>]*value="([^"]*)"/)
      const playingTime = extractValue(itemContent, /<playingtime[^>]*value="([^"]*)"/)
      const minAge = extractValue(itemContent, /<minage[^>]*value="([^"]*)"/)
      const image = extractValue(itemContent, /<image[^>]*>([^<]+)<\/image>/)
      const thumbnail = extractValue(itemContent, /<thumbnail[^>]*>([^<]+)<\/thumbnail>/)

      // Extract publishers with more flexible pattern
      const publishers = extractMultipleValues(itemContent, /<link[^>]*type="boardgamepublisher"[^>]*value="([^"]*)"/)

      // Extract categories
      const categories = extractMultipleValues(itemContent, /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/)

      // Extract mechanics (for game style)
      const mechanics = extractMultipleValues(itemContent, /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/)

      console.log("[v0] Extracted time data for game:", { name, minPlayTime, maxPlayTime, playingTime })

      if (name) {
        const gameData = {
          id: gameId,
          name,
          yearPublished: yearPublished ? Number.parseInt(yearPublished) : null,
          minPlayers: minPlayers ? Number.parseInt(minPlayers) : null,
          maxPlayers: maxPlayers ? Number.parseInt(maxPlayers) : null,
          minPlayTime: minPlayTime ? Number.parseInt(minPlayTime) : null,
          maxPlayTime: maxPlayTime ? Number.parseInt(maxPlayTime) : null,
          playingTime: playingTime ? Number.parseInt(playingTime) : null,
          minAge: minAge ? Number.parseInt(minAge) : null,
          image: image || thumbnail,
          publishers: publishers.slice(0, 3), // Limit to first 3 publishers
          categories: categories.slice(0, 5), // Limit to first 5 categories
          mechanics: mechanics.slice(0, 5), // Limit to first 5 mechanics
        }
        games.push(gameData)
        console.log("[v0] Added game to results:", gameData.name)
      } else {
        console.log("[v0] No name found for game ID:", gameId)
      }
    } catch (error) {
      console.error("[v0] Error parsing game ID", gameId, ":", error)
    }
  }

  console.log("[v0] Final parsed games count:", games.length)
  return games
}

function extractValue(content: string, regex: RegExp): string | null {
  try {
    const match = content.match(regex)
    return match ? match[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : null
  } catch (error) {
    console.error("[v0] Error in extractValue:", error)
    return null
  }
}

function extractMultipleValues(content: string, regex: RegExp): string[] {
  const values: string[] = []
  try {
    let match
    const globalRegex = new RegExp(regex.source, "g")

    while ((match = globalRegex.exec(content)) !== null) {
      values.push(match[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))
    }
  } catch (error) {
    console.error("[v0] Error in extractMultipleValues:", error)
  }

  return values
}
