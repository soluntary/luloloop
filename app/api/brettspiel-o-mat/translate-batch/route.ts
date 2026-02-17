import { generateText } from "ai"
import { NextResponse } from "next/server"

// In-memory cache for translations
const translationCache = new Map<string, string>()

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { items } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ translations: {} })
    }

    // Limit to 20 items max
    const toTranslate = items.slice(0, 20)
    const translations: Record<string, string> = {}

    // Return cached translations immediately
    const uncached: { gameId: string; text: string }[] = []
    for (const item of toTranslate) {
      if (item.gameId && translationCache.has(item.gameId)) {
        translations[item.gameId] = translationCache.get(item.gameId)!
      } else if (item.text && item.gameId) {
        uncached.push(item)
      }
    }

    // Translate uncached items in a single prompt
    if (uncached.length > 0) {
      const numbered = uncached
        .map((item, i) => `[${i + 1}] ${(item.text || "").slice(0, 800)}`)
        .join("\n\n")

      try {
        const result = await generateText({
          model: "openai/gpt-4o-mini",
          system: `Du bist ein professioneller Uebersetzer fuer Brettspiel-Beschreibungen. 
Uebersetze die folgenden nummerierten englischen Texte ins Deutsche. 
Behalte Eigennamen und Spielnamen bei.
Gib die Uebersetzungen im exakt gleichen nummerierten Format zurueck: [1] Uebersetzung... [2] Uebersetzung... usw.
Gib NUR die Uebersetzungen zurueck, ohne Erklaerungen.`,
          prompt: numbered,
        })

        // Parse numbered translations
        const responseText = result.text.trim()
        const parts = responseText.split(/\[(\d+)\]\s*/)

        for (let i = 1; i < parts.length; i += 2) {
          const idx = parseInt(parts[i], 10) - 1
          const translation = (parts[i + 1] || "").trim()
          if (idx >= 0 && idx < uncached.length && translation) {
            const gameId = uncached[idx].gameId
            translations[gameId] = translation
            translationCache.set(gameId, translation)
          }
        }

        // Fallback: if parsing failed, try to handle single-item case
        if (uncached.length === 1 && !translations[uncached[0].gameId]) {
          const cleaned = responseText.replace(/^\[\d+\]\s*/, "").trim()
          if (cleaned) {
            translations[uncached[0].gameId] = cleaned
            translationCache.set(uncached[0].gameId, cleaned)
          }
        }
      } catch (error) {
        console.error("Batch translation error:", error)
        // Return original texts for failed translations
        for (const item of uncached) {
          if (!translations[item.gameId]) {
            translations[item.gameId] = item.text
          }
        }
      }
    }

    return NextResponse.json({ translations })
  } catch (error) {
    console.error("Batch translate route error:", error)
    return NextResponse.json({ translations: {} })
  }
}
