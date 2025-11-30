import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { games } = await req.json()

    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Map CSV fields to database columns
    const mappedGames = games.map((game: any) => ({
      bgg_id: game.game_id || game.id || null, // Try different ID fields
      title: game.names || game.name || game.title || "Unknown Game",
      min_players: Number.parseInt(game.min_players) || 1,
      max_players: Number.parseInt(game.max_players) || 99,
      playing_time: Number.parseInt(game.playing_time) || 30,
      min_playtime: Number.parseInt(game.min_time) || Number.parseInt(game.playing_time) || 30,
      max_playtime: Number.parseInt(game.max_time) || Number.parseInt(game.playing_time) || 30,
      age: Number.parseInt(game.min_age) || Number.parseInt(game.age) || 8,
      year_published: Number.parseInt(game.year) || Number.parseInt(game.year_published) || null,
      description: (game.description || "").substring(0, 1000), // Truncate if too long
      image: game.image_url || game.image || null,
      thumbnail: game.thumb_url || game.thumbnail || null,
      publisher: game.publisher || null,
      mechanics: game.mechanic ? game.mechanic.split(",").map((s: string) => s.trim()) : [],
      categories: game.category ? game.category.split(",").map((s: string) => s.trim()) : [],
      rating: Number.parseFloat(game.avg_rating) || null,
      complexity: Number.parseFloat(game.weight) || null,
    }))

    // Filter out invalid entries (e.g. missing title)
    const validGames = mappedGames.filter((g: any) => g.title && g.title !== "Unknown Game")

    if (validGames.length === 0) {
      return NextResponse.json({ imported: 0, errors: games.length })
    }

    // Upsert into game_catalog
    // On conflict with bgg_id, update fields
    const { error } = await supabase.from("game_catalog").upsert(validGames, {
      onConflict: "bgg_id",
      ignoreDuplicates: true,
    })

    if (error) {
      console.error("Database insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      imported: validGames.length,
      errors: games.length - validGames.length,
    })
  } catch (error) {
    console.error("Import API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
