import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.ludoloop_READ_WRITE_TOKEN
    console.log("[v0] Token available:", !!token)
    console.log("[v0] Checking BLOB_READ_WRITE_TOKEN:", !!process.env.BLOB_READ_WRITE_TOKEN)
    console.log("[v0] Checking ludoloop_READ_WRITE_TOKEN:", !!process.env.ludoloop_READ_WRITE_TOKEN)

    if (!token) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not found in environment")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size: 5MB" }, { status: 400 })
    }

    const filename = `ludo-events/${Date.now()}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
      token: token,
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)

    if (error instanceof Error) {
      if (error.message?.includes("Too Many Requests") || error.message?.includes("429")) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut." },
          { status: 429 },
        )
      }

      if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        return NextResponse.json({ error: "Authentifizierungsfehler. Bitte versuchen Sie es erneut." }, { status: 401 })
      }
    }

    return NextResponse.json(
      { error: "Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut." },
      { status: 500 },
    )
  }
}
