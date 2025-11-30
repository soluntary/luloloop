"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, X } from "lucide-react"
import { useGeolocation } from "@/contexts/geolocation-context"

export function LocationPermissionBanner() {
  const { permission, requestLocation, loading } = useGeolocation()
  const [dismissed, setDismissed] = useState(false)

  if (permission !== "prompt" || dismissed) {
    return null
  }

  return (
    <Card className="mx-4 mt-4 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-xs text-blue-900">Standort für bessere Ergebnisse aktivieren</p>
            <p className="text-xs text-blue-700">Finde Spiele, Gruppen und Events in deiner Nähe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDismissed(true)}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={requestLocation} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Wird ermittelt..." : "Standort aktivieren"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
