import { generateText } from "ai"
import { NextResponse } from "next/server"

// In-memory cache for translations
const translationCache = new Map<string, string>()

export async function POST(req: Request) {
  try {
    const { text, gameId } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ translation: "" })
    }

    // Check cache first
    if (gameId && translationCache.has(gameId)) {
      return NextResponse.json({ translation: translationCache.get(gameId) })
    }

    // Truncate very long descriptions to save tokens
    const truncated = text.length > 2000 ? text.slice(0, 2000) + "..." : text

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      system:
        "Du bist ein professioneller Uebersetzer fuer Brettspiel-Beschreibungen. Uebersetze den folgenden englischen Text ins Deutsche. Behalte Eigennamen und Spielnamen bei. Gib nur die Uebersetzung zurueck, ohne Erklaerungen.",
      prompt: truncated,
    })

    const translation = result.text.trim()

    // Cache the result
    if (gameId) {
      translationCache.set(gameId, translation)
    }

    return NextResponse.json({ translation })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ translation: "" })
  }
}
