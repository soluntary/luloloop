"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Cookie, Settings, BarChart3, Shield, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="cookies" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-handwritten text-gray-800 mb-6 text-center transform -rotate-1">
            Cookie-Richtlinie
          </h1>
          <p className="text-lg text-gray-600 mb-12 text-center font-body transform rotate-1">
            Wie wir Cookies verwenden, um deine Erfahrung zu verbessern
          </p>

          <div className="space-y-8">
            {/* What are Cookies */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Cookie className="w-6 h-6 text-blue-400" />
                  Was sind Cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>
                  Cookies sind kleine Textdateien, die auf deinem Gerät gespeichert werden, wenn du unsere Website
                  besuchst. Sie helfen uns dabei, deine Präferenzen zu speichern und die Website-Funktionalität zu
                  verbessern.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p>
                    <strong>Wichtig:</strong> Cookies enthalten keine persönlichen Daten wie Passwörter oder
                    Kreditkarteninformationen.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Essential Cookies */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-green-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-400" />
                  Notwendige Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert
                  werden.
                </p>

                <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Authentifizierung</h4>
                    <p>
                      <strong>Zweck:</strong> Anmeldestatus und Sitzungsverwaltung
                    </p>
                    <p>
                      <strong>Dauer:</strong> Bis zur Abmeldung oder 30 Tage
                    </p>
                    <p>
                      <strong>Cookies:</strong> auth-token, session-id
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Sicherheit</h4>
                    <p>
                      <strong>Zweck:</strong> Schutz vor CSRF-Angriffen und Spam
                    </p>
                    <p>
                      <strong>Dauer:</strong> Sitzung
                    </p>
                    <p>
                      <strong>Cookies:</strong> csrf-token, security-check
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Funktionalität</h4>
                    <p>
                      <strong>Zweck:</strong> Warenkorb, Spracheinstellungen, Theme
                    </p>
                    <p>
                      <strong>Dauer:</strong> 1 Jahr
                    </p>
                    <p>
                      <strong>Cookies:</strong> preferences, cart-data, theme-mode
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Functional Cookies */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-orange-400" />
                  Funktionale Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>Diese Cookies verbessern deine Nutzererfahrung, sind aber nicht zwingend erforderlich.</p>

                <div className="space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Personalisierung</h4>
                    <p>
                      <strong>Zweck:</strong> Gespeicherte Suchfilter, Favoriten, Layout-Präferenzen
                    </p>
                    <p>
                      <strong>Dauer:</strong> 6 Monate
                    </p>
                    <p>
                      <strong>Cookies:</strong> user-preferences, saved-searches, layout-settings
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Standort</h4>
                    <p>
                      <strong>Zweck:</strong> Lokale Suchergebnisse und Events
                    </p>
                    <p>
                      <strong>Dauer:</strong> 3 Monate
                    </p>
                    <p>
                      <strong>Cookies:</strong> location-preference, geo-data
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-orange-100 p-4 rounded-lg">
                  <span className="font-semibold">Funktionale Cookies aktiviert</span>
                  <Button variant="outline" size="sm" className="font-handwritten bg-transparent">
                    Einstellungen ändern
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-pink-400" />
                  Analyse-Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>Diese Cookies helfen uns zu verstehen, wie die Website genutzt wird, um sie zu verbessern.</p>

                <div className="space-y-3">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Website-Analyse</h4>
                    <p>
                      <strong>Zweck:</strong> Seitenaufrufe, Verweildauer, beliebte Inhalte
                    </p>
                    <p>
                      <strong>Dauer:</strong> 2 Jahre
                    </p>
                    <p>
                      <strong>Anbieter:</strong> Google Analytics (anonymisiert)
                    </p>
                    <p>
                      <strong>Cookies:</strong> _ga, _ga_*, _gid
                    </p>
                  </div>

                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Performance-Monitoring</h4>
                    <p>
                      <strong>Zweck:</strong> Ladezeiten, Fehleranalyse, Optimierung
                    </p>
                    <p>
                      <strong>Dauer:</strong> 1 Jahr
                    </p>
                    <p>
                      <strong>Anbieter:</strong> Vercel Analytics
                    </p>
                    <p>
                      <strong>Cookies:</strong> _vercel_insights
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-pink-100 p-4 rounded-lg">
                  <span className="font-semibold">Analyse-Cookies aktiviert</span>
                  <Button variant="outline" size="sm" className="font-handwritten bg-transparent">
                    Deaktivieren
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Third Party Cookies */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-purple-400" />
                  Drittanbieter-Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>
                  Einige Funktionen unserer Website nutzen Dienste von Drittanbietern, die eigene Cookies setzen können.
                </p>

                <div className="space-y-3">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Karten & Standorte</h4>
                    <p>
                      <strong>Anbieter:</strong> Google Maps
                    </p>
                    <p>
                      <strong>Zweck:</strong> Anzeige von Karten und Standorten
                    </p>
                    <p>
                      <strong>Datenschutz:</strong>{" "}
                      <a href="https://policies.google.com/privacy" className="text-purple-400 hover:underline">
                        Google Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Zahlungsabwicklung</h4>
                    <p>
                      <strong>Anbieter:</strong> Stripe
                    </p>
                    <p>
                      <strong>Zweck:</strong> Sichere Zahlungsabwicklung
                    </p>
                    <p>
                      <strong>Datenschutz:</strong>{" "}
                      <a href="https://stripe.com/privacy" className="text-purple-400 hover:underline">
                        Stripe Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Support-Chat</h4>
                    <p>
                      <strong>Anbieter:</strong> Intercom
                    </p>
                    <p>
                      <strong>Zweck:</strong> Live-Chat und Kundensupport
                    </p>
                    <p>
                      <strong>Datenschutz:</strong>{" "}
                      <a href="https://www.intercom.com/legal/privacy" className="text-purple-400 hover:underline">
                        Intercom Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cookie Management */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Trash2 className="w-6 h-6 text-teal-400" />
                  Cookie-Verwaltung
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Browser-Einstellungen</h4>
                <p>Du kannst Cookies in deinem Browser verwalten:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Chrome:</strong> Einstellungen → Datenschutz und Sicherheit → Cookies
                  </li>
                  <li>
                    <strong>Firefox:</strong> Einstellungen → Datenschutz & Sicherheit → Cookies
                  </li>
                  <li>
                    <strong>Safari:</strong> Einstellungen → Datenschutz → Cookies verwalten
                  </li>
                  <li>
                    <strong>Edge:</strong> Einstellungen → Cookies und Websiteberechtigungen
                  </li>
                </ul>

                <h4 className="font-semibold text-gray-800">Unsere Cookie-Einstellungen</h4>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten">
                      Cookie-Einstellungen öffnen
                    </Button>
                    <Button variant="outline" className="font-handwritten bg-transparent">
                      Alle Cookies löschen
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p>
                    <strong>Hinweis:</strong> Das Deaktivieren von Cookies kann die Funktionalität der Website
                    beeinträchtigen.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Updates */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-red-200">
              <CardContent className="p-8 text-center">
                <h3 className="font-handwritten text-2xl text-gray-800 mb-4">Fragen zu Cookies?</h3>
                <p className="font-body text-gray-600 mb-6">
                  Bei Fragen zu unserer Cookie-Nutzung kontaktiere uns gerne.
                </p>
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="font-body">
                    <strong>Datenschutz-Team:</strong>
                    <br />
                    E-Mail: privacy@ludoloop.com
                    <br />
                    Telefon: +41 44 123 45 67
                  </p>
                </div>
                <p className="font-body text-sm text-gray-500">
                  Diese Cookie-Richtlinie wurde zuletzt im Januar 2025 aktualisiert.
                  <br />
                  Wir informieren dich über wesentliche Änderungen per E-Mail oder Website-Banner.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
