"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Monitor } from "lucide-react"
import { getSecurityEvents } from "@/app/actions/security-notifications"

interface SecurityEvent {
  id: string
  event_type: string
  event_data: any
  ip_address: string
  user_agent: string
  location?: string
  device_info?: string
  success: boolean
  created_at: string
}

export function SecurityEventsDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSecurityEvents()
  }, [])

  const loadSecurityEvents = async () => {
    try {
      setLoading(true)
      const result = await getSecurityEvents(20)

      if (result.success) {
        setEvents(result.events || [])
      } else {
        setError(result.error || "Fehler beim Laden der Sicherheitsereignisse")
      }
    } catch (err) {
      setError("Unerwarteter Fehler beim Laden der Sicherheitsereignisse")
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return <XCircle className="w-4 h-4 text-red-500" />

    switch (eventType) {
      case "login_attempt":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "password_change":
        return <Shield className="w-4 h-4 text-blue-500" />
      case "email_change":
        return <Shield className="w-4 h-4 text-blue-500" />
      case "suspicious_activity":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case "new_device_login":
        return <Monitor className="w-4 h-4 text-purple-500" />
      case "security_settings_change":
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getEventTitle = (eventType: string) => {
    const titles: Record<string, string> = {
      login_attempt: "Anmeldeversuch",
      password_change: "Passwort geändert",
      email_change: "E-Mail geändert",
      suspicious_activity: "Verdächtige Aktivität",
      new_device_login: "Neues Gerät",
      account_recovery: "Konto-Wiederherstellung",
      security_settings_change: "Sicherheitseinstellungen",
    }
    return titles[eventType] || eventType
  }

  const getEventDescription = (event: SecurityEvent) => {
    const { event_type, event_data, success } = event

    if (event_type === "login_attempt") {
      if (success) {
        return event_data?.action === "logout" ? "Erfolgreich abgemeldet" : "Erfolgreich angemeldet"
      } else {
        return `Fehlgeschlagener Anmeldeversuch: ${event_data?.error || "Unbekannter Fehler"}`
      }
    }

    if (event_type === "suspicious_activity") {
      return event_data?.reason || "Verdächtige Aktivität erkannt"
    }

    if (event_type === "new_device_login") {
      return "Anmeldung von einem neuen Gerät erkannt"
    }

    if (event_type === "security_settings_change") {
      return "Sicherheitseinstellungen wurden geändert"
    }

    return "Sicherheitsereignis"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Unbekannt"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sicherheitsereignisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Lade Sicherheitsereignisse...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sicherheitsereignisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadSecurityEvents} className="mt-2">
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Sicherheitsereignisse
        </CardTitle>
        <CardDescription>Übersicht über die letzten Sicherheitsaktivitäten deines Kontos</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-600">Keine Sicherheitsereignisse gefunden.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">{getEventIcon(event.event_type, event.success)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-xs">{getEventTitle(event.event_type)}</h4>
                    <Badge variant={event.success ? "default" : "destructive"} className="text-xs">
                      {event.success ? "Erfolgreich" : "Fehlgeschlagen"}
                    </Badge>
                  </div>

                  <p className="font-medium text-xs">{getEventDescription(event)}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.created_at)}
                    </div>

                    {event.ip_address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.ip_address}
                      </div>
                    )}

                    {event.user_agent && (
                      <div className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {getBrowserInfo(event.user_agent)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadSecurityEvents}>
                Aktualisieren
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
