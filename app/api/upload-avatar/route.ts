import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 })
    }

    // Create a unique filename with user ID
    const fileExt = file.name.split(".").pop()
    const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
