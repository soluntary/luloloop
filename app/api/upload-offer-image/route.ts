import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.ludoloop_READ_WRITE_TOKEN

    if (!token) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not found in environment")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Nur JPG, PNG und WebP Dateien sind erlaubt." }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Die Datei ist zu groß. Maximum 5MB erlaubt." }, { status: 400 })
    }

    const filename = `marketplace-offers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    const blob = await put(filename, file, {
      access: "public",
      token: token,
    })

    console.log("[v0] Offer image upload successful:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Offer image upload error:", error)

    if (error instanceof Error) {
      if (error.message?.includes("Too Many Requests") || error.message?.includes("429")) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut." },
          { status: 429 }
        )
      }

      if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        return NextResponse.json({ error: "Authentifizierungsfehler. Bitte versuchen Sie es erneut." }, { status: 401 })
      }
    }

    return NextResponse.json(
      { error: "Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut." },
      { status: 500 }
    )
  }
}
