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

function formatAddressClean(displayName: string, addressDetails?: any, name?: string): string {
  // For OpenStreetMap results, parse and format cleanly
  if (addressDetails) {
    // Check if this is a named location (POI) like "Gameorama"
    // Named locations have a name that's different from the road name
    const isNamedLocation =
      name &&
      name !== addressDetails.road &&
      name !== addressDetails.city &&
      name !== addressDetails.town &&
      name !== addressDetails.village

    if (isNamedLocation) {
      // For named locations, show: "Name, Postal Code City"
      const parts: string[] = [name]

      const cityParts: string[] = []
      if (addressDetails.postcode) {
        cityParts.push(addressDetails.postcode)
      }
      if (addressDetails.city || addressDetails.town || addressDetails.village) {
        cityParts.push(addressDetails.city || addressDetails.town || addressDetails.village)
      }

      if (cityParts.length > 0) {
        parts.push(cityParts.join(" "))
      }

      return parts.join(", ")
    }

    // For regular addresses, show: "Street House Number, Postal Code City"
    const parts: string[] = []

    // Add street and house number
    if (addressDetails.road) {
      if (addressDetails.house_number) {
        parts.push(`${addressDetails.road} ${addressDetails.house_number}`)
      } else {
        parts.push(addressDetails.road)
      }
    }

    // Add postal code and city
    const cityParts: string[] = []
    if (addressDetails.postcode) {
      cityParts.push(addressDetails.postcode)
    }
    if (addressDetails.city || addressDetails.town || addressDetails.village) {
      cityParts.push(addressDetails.city || addressDetails.town || addressDetails.village)
    }

    if (cityParts.length > 0) {
      parts.push(cityParts.join(" "))
    }

    return parts.length > 0 ? parts.join(", ") : displayName
  }

  // Fallback: parse display_name and extract essential parts
  const parts = displayName.split(",").map((p) => p.trim())

  // Try to find postal code pattern (e.g., "5621")
  const postalCodeIndex = parts.findIndex((p) => /^\d{4,5}$/.test(p))

  if (postalCodeIndex !== -1 && postalCodeIndex > 0) {
    // Get street (first part), postal code, and city (part before postal code)
    const street = parts[0]
    const postalCode = parts[postalCodeIndex]
    const city = parts[postalCodeIndex - 1]

    return `${street}, ${postalCode} ${city}`
  }

  // If no postal code found, just return first 2-3 parts
  return parts.slice(0, Math.min(3, parts.length)).join(", ")
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
        return data.map((item: any, index: number) => {
          const cleanAddress = formatAddressClean(item.display_name, item.address, item.name)
          return {
            place_id: `osm_${item.place_id || index}`,
            description: cleanAddress,
            structured_formatting: {
              main_text: item.name || item.address?.road || cleanAddress.split(",")[0],
              secondary_text: cleanAddress,
            },
          }
        })
      }
      return []
    }

    // Use Google Maps API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:de|country:at|country:ch&language=de`,
    )
    const data = await response.json()

    if (data.status === "OK" && data.predictions) {
      return data.predictions.map((prediction: any) => {
        // Google already provides structured formatting, but we can clean the description
        const parts = prediction.description.split(",").map((p: string) => p.trim())

        // Remove country name if it's the last part
        if (
          parts.length > 0 &&
          /schweiz|suisse|svizzera|svizra|deutschland|germany|österreich|austria/i.test(parts[parts.length - 1])
        ) {
          parts.pop()
        }

        // Remove canton/state if it's the second to last part
        if (parts.length > 2) {
          const secondLast = parts[parts.length - 1]
          if (/aargau|zürich|bern|basel|luzern|st\. gallen|thurgau|bayern|baden-württemberg/i.test(secondLast)) {
            parts.pop()
          }
        }

        const cleanDescription = parts.slice(0, Math.min(3, parts.length)).join(", ")

        return {
          ...prediction,
          description: cleanDescription,
          structured_formatting: {
            ...prediction.structured_formatting,
            secondary_text: cleanDescription,
          },
        }
      })
    }
    return []
  } catch (error) {
    console.error("Address autocomplete error:", error)
    return []
  }
}
