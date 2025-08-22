"use server"

interface GeocodeResult {
  lat: number
  lng: number
}

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.log("Google Maps API key not found, using OpenStreetMap fallback")

      // Fallback to OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=de,at,ch&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "LudoLoop/1.0 (contact@ludoloop.com)",
          },
        },
      )

      if (!response.ok) {
        console.error("OpenStreetMap API error:", response.status)
        return null
      }

      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
      return null
    }

    // Use Google Maps API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&components=country:DE|country:AT|country:CH`,
    )
    const data = await response.json()

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
      }
    }
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

export async function getAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  try {
    if (input.length < 3) {
      return []
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.log("Google Maps API key not found, using OpenStreetMap fallback")

      // Fallback to OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=de,at,ch&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "LudoLoop/1.0 (contact@ludoloop.com)",
          },
        },
      )

      if (!response.ok) {
        console.error("OpenStreetMap API error:", response.status)
        return []
      }

      const data = await response.json()

      if (data && data.length > 0) {
        return data.map((item: any, index: number) => ({
          place_id: `osm_${item.place_id || index}`,
          description: item.display_name,
          structured_formatting: {
            main_text: item.name || item.display_name.split(",")[0],
            secondary_text: item.display_name,
          },
        }))
      }
      return []
    }

    // Use Google Maps API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:de|country:at|country:ch&language=de`,
    )
    const data = await response.json()

    if (data.status === "OK" && data.predictions) {
      return data.predictions
    }
    return []
  } catch (error) {
    console.error("Address autocomplete error:", error)
    return []
  }
}
