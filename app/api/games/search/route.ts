import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json([])
    }

    const supabase = await createClient()

    // Search in our local game_catalog
    const { data: games, error } = await supabase
      .from("game_catalog")
      .select("*")
      .ilike("title", `%${query}%`)
      .limit(20)

    if (error) {
      console.error("[v0] Error searching games:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to the format expected by the frontend (similar to BGG format for compatibility)
    const formattedGames = (games || []).map((game) => ({
      id: game.bgg_id?.toString() || game.id, // Use BGG ID if available for compatibility, else UUID
      name: game.title,
      yearPublished: game.year_published,
      image: game.image,
      thumbnail: game.thumbnail || game.image,
      minPlayers: game.min_players,
      maxPlayers: game.max_players,
      playingTime: game.playing_time,
      description: game.description,
      source: "local", // Flag to indicate this comes from our DB
      db_id: game.id, // Internal UUID
    }))

    return NextResponse.json(formattedGames)
  } catch (error) {
    console.error("[v0] Unexpected error in game search API:", error)
    return NextResponse.json({ error: "Failed to search games. Please try again later." }, { status: 500 })
  }
}
