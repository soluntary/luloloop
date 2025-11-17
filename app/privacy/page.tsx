"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Shield, Eye, Lock, Database, Mail, UserCheck } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="privacy" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-handwritten text-gray-800 mb-6 text-center transform -rotate-1">
            Datenschutzerklärung
          </h1>
          <p className="text-lg text-gray-600 mb-12 text-center font-body transform rotate-1">
            Deine Privatsphäre ist uns wichtig. Hier erfährst du, wie wir deine Daten schützen.
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-400" />
                  Einleitung
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>
                  Diese Datenschutzerklärung informiert Sie über die Art, den Umfang und Zweck der Verarbeitung von
                  personenbezogenen Daten durch LudoLoop (nachfolgend "wir" oder "uns") auf unserer Website und
                  Plattform.
                </p>
                <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>LudoLoop GmbH</strong>
                    <br />
                    Musterstrasse 123
                    <br />
                    8000 Zürich, Schweiz
                    <br />
                    E-Mail: privacy@ludoloop.com
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Database className="w-6 h-6 text-green-400" />
                  Welche Daten sammeln wir?
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <h4 className="font-semibold text-sm text-gray-800">Registrierungsdaten:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name und E-Mail-Adresse</li>
                  <li>Gewähltes Passwort (verschlüsselt gespeichert)</li>
                  <li>Standortinformationen (optional)</li>
                  <li>Profilbild (optional)</li>
                </ul>

                <h4 className="font-semibold text-sm text-gray-800">Nutzungsdaten:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informationen über deine Spiele und Angebote</li>
                  <li>Nachrichten und Kommunikation mit anderen Nutzern</li>
                  <li>Bewertungen und Kommentare</li>
                  <li>Aktivitätsdaten (Logins, Seitenaufrufe)</li>
                </ul>

                <h4 className="font-semibold text-sm text-gray-800">Technische Daten:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP-Adresse und Browser-Informationen</li>
                  <li>Geräteinformationen</li>
                  <li>Cookies und ähnliche Technologien</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-orange-400" />
                  Wie verwenden wir deine Daten?
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>Wir verwenden deine Daten für folgende Zwecke:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Bereitstellung der Plattform:</strong> Kontoverwaltung, Spielebibliothek, Marktplatz
                  </li>
                  <li>
                    <strong>Kommunikation:</strong> Nachrichten zwischen Nutzern, Support-Anfragen
                  </li>
                  <li>
                    <strong>Sicherheit:</strong> Betrugsschutz, Identitätsprüfung
                  </li>
                  <li>
                    <strong>Verbesserung:</strong> Analyse der Nutzung zur Optimierung der Plattform
                  </li>
                  <li>
                    <strong>Marketing:</strong> Newsletter und Benachrichtigungen (nur mit Einverständnis)
                  </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Rechtsgrundlage:</strong> Die Verarbeitung erfolgt auf Basis deiner Einwilligung (Art. 6
                    Abs. 1 lit. a DSGVO) oder zur Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-pink-400" />
                  Datenweitergabe
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>Wir geben deine Daten nur in folgenden Fällen weiter:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>An andere Nutzer:</strong> Profilinformationen, die du öffentlich teilst
                  </li>
                  <li>
                    <strong>An Dienstleister:</strong> Hosting, E-Mail-Versand, Zahlungsabwicklung (nur soweit nötig)
                  </li>
                  <li>
                    <strong>Bei rechtlichen Anforderungen:</strong> Wenn gesetzlich vorgeschrieben
                  </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Wichtig:</strong> Wir verkaufen deine Daten niemals an Dritte für Werbezwecke!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-purple-400" />
                  Datensicherheit
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>Wir schützen deine Daten durch:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL-Verschlüsselung für alle Datenübertragungen</li>
                  <li>Sichere Server in europäischen Rechenzentren</li>
                  <li>Regelmäßige Sicherheitsupdates und -überprüfungen</li>
                  <li>Zugriffsbeschränkungen für Mitarbeiter</li>
                  <li>Backup-Systeme zum Schutz vor Datenverlust</li>
                </ul>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-teal-400" />
                  Deine Rechte
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>Du hast folgende Rechte bezüglich deiner Daten:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Auskunft:</strong> Information über gespeicherte Daten
                  </li>
                  <li>
                    <strong>Berichtigung:</strong> Korrektur falscher Daten
                  </li>
                  <li>
                    <strong>Löschung:</strong> Entfernung deiner Daten ("Recht auf Vergessenwerden")
                  </li>
                  <li>
                    <strong>Einschränkung:</strong> Begrenzung der Datenverarbeitung
                  </li>
                  <li>
                    <strong>Übertragbarkeit:</strong> Export deiner Daten
                  </li>
                  <li>
                    <strong>Widerspruch:</strong> Widerspruch gegen Datenverarbeitung
                  </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Kontakt:</strong> Für Anfragen zu deinen Rechten schreibe an privacy@ludoloop.com
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800">Cookies & Tracking</CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <p>Wir verwenden Cookies für:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Notwendige Cookies:</strong> Login, Sicherheit, Grundfunktionen
                  </li>
                  <li>
                    <strong>Funktionale Cookies:</strong> Einstellungen, Präferenzen
                  </li>
                  <li>
                    <strong>Analytische Cookies:</strong> Nutzungsstatistiken (anonymisiert)
                  </li>
                </ul>
                <p>
                  Du kannst Cookies in deinen Browser-Einstellungen verwalten. Weitere Details findest du in unserer{" "}
                  <a href="/cookies" className="text-orange-400 hover:underline">
                    Cookie-Richtlinie
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <h3 className="font-handwritten text-2xl text-gray-800 mb-4">Fragen zum Datenschutz?</h3>
                <p className="font-body text-xs text-gray-600 mb-6">
                  Bei Fragen oder Anliegen zum Datenschutz kontaktiere uns gerne.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-body text-xs">
                    <strong>Datenschutzbeauftragte:</strong>
                    <br />
                    E-Mail: privacy@ludoloop.com
                    <br />
                    Telefon: +41 XX XXX XX XX
                  </p>
                </div>
                <p className="font-body text-sm text-gray-500 mt-4">Letzte Aktualisierung: Januar 2025</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
