import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const input = searchParams.get("input")

  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&language=de&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Places API error:", error)
    return NextResponse.json({ predictions: [] })
  }
}
