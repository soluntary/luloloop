"use client"

import { useState } from "react"
import { MapPin, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocationMapProps {
  location: string
  className?: string
}

export function LocationMap({ location, className = "" }: LocationMapProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (!location) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 rounded-lg p-6 ${className}`}>
        <MapPin className="h-12 w-12 text-slate-400 mb-3" />
        <p className="text-sm text-slate-600">Kein Standort angegeben</p>
      </div>
    )
  }

  const encodedLocation = encodeURIComponent(location)
  const embedUrl = `https://www.google.com/maps?q=${encodedLocation}&output=embed`
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Karte wird geladen...</p>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Karte von ${location}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
      />

      {!loading && !error && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(mapsUrl, "_blank")}
          className="absolute bottom-3 right-3 shadow-lg text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          In Google Maps öffnen
        </Button>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
          <MapPin className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm text-slate-600 mb-3">Karte konnte nicht geladen werden</p>
          <Button variant="outline" size="sm" onClick={() => window.open(mapsUrl, "_blank")} className="text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            In Google Maps öffnen
          </Button>
        </div>
      )}
    </div>
  )
}
