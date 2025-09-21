"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { FileText, Users, ShoppingCart, Shield, AlertTriangle, Scale } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="terms" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-handwritten text-gray-800 mb-6 text-center transform -rotate-1">
            Nutzungsbedingungen
          </h1>
          <p className="text-lg text-gray-600 mb-12 text-center font-body transform rotate-1">
            Die Spielregeln für unsere Community - fair und transparent
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-400" />
                  Willkommen bei LudoLoop
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <p>
                  Diese Nutzungsbedingungen regeln die Nutzung der LudoLoop-Plattform. Mit der Registrierung stimmst du
                  diesen Bedingungen zu.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p>
                    <strong>Anbieter:</strong>
                    <br />
                    LudoLoop GmbH
                    <br />
                    Musterstrasse 123
                    <br />
                    8000 Zürich, Schweiz
                    <br />
                    E-Mail: legal@ludoloop.com
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account & Registration */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-green-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-green-400" />
                  Konto & Registrierung
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Voraussetzungen:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mindestalter: 16 Jahre (unter 18 mit Einverständnis der Eltern)</li>
                  <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
                  <li>Ein Konto pro Person</li>
                  <li>Sichere Aufbewahrung der Zugangsdaten</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Deine Pflichten:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Aktualisierung deiner Kontodaten</li>
                  <li>Sofortige Meldung bei Missbrauch deines Kontos</li>
                  <li>Verantwortung für alle Aktivitäten unter deinem Konto</li>
                </ul>
              </CardContent>
            </Card>

            {/* Platform Usage */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-orange-400" />
                  Nutzung der Plattform
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Erlaubte Nutzung:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verkauf, Verleih und Tausch von Brettspielen</li>
                  <li>Teilnahme an Spielgruppen und Events</li>
                  <li>Kommunikation mit anderen Nutzern</li>
                  <li>Bewertung von Transaktionen</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Verbotene Aktivitäten:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verkauf gefälschter oder beschädigter Spiele ohne Hinweis</li>
                  <li>Belästigung oder Diskriminierung anderer Nutzer</li>
                  <li>Spam oder unerwünschte Werbung</li>
                  <li>Umgehung von Sicherheitsmaßnahmen</li>
                  <li>Automatisierte Datensammlung (Scraping)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-pink-400" />
                  Transaktionen & Verträge
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Wichtige Hinweise:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>LudoLoop ist nur Vermittler - Verträge entstehen zwischen den Nutzern</li>
                  <li>Preise und Konditionen werden von den Nutzern festgelegt</li>
                  <li>Zahlungsabwicklung erfolgt direkt zwischen den Parteien</li>
                  <li>Übergabe und Versand sind Sache der Nutzer</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Unsere Rolle:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bereitstellung der Plattform</li>
                  <li>Vermittlung zwischen Nutzern</li>
                  <li>Support bei Problemen</li>
                  <li>Durchsetzung der Community-Regeln</li>
                </ul>

                <div className="bg-pink-50 p-4 rounded-lg">
                  <p>
                    <strong>Haftungsausschluss:</strong> LudoLoop haftet nicht für Schäden aus Transaktionen zwischen
                    Nutzern.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content & Intellectual Property */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800">Inhalte & Urheberrecht</CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Deine Inhalte:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Du behältst die Rechte an deinen Fotos und Texten</li>
                  <li>Du gibst uns das Recht, deine Inhalte auf der Plattform zu zeigen</li>
                  <li>Du bist verantwortlich für die Rechtmäßigkeit deiner Inhalte</li>
                  <li>Keine Urheberrechtsverletzungen oder illegale Inhalte</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Unsere Inhalte:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>LudoLoop-Logo und Design sind geschützt</li>
                  <li>Keine Nutzung ohne Erlaubnis</li>
                  <li>Spieledatenbank und -informationen</li>
                </ul>
              </CardContent>
            </Card>

            {/* Safety & Community */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-teal-400" />
                  Sicherheit & Community-Regeln
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Community-Standards:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Respektvoller Umgang miteinander</li>
                  <li>Ehrliche und genaue Produktbeschreibungen</li>
                  <li>Pünktlichkeit bei Terminen</li>
                  <li>Faire Preisgestaltung</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Sicherheitsmaßnahmen:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bewertungssystem für Vertrauen</li>
                  <li>Meldung verdächtiger Aktivitäten</li>
                  <li>Verifizierung von Nutzerprofilen</li>
                  <li>Moderierte Community</li>
                </ul>
              </CardContent>
            </Card>

            {/* Liability & Disclaimers */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-yellow-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  Haftung & Gewährleistung
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Haftungsausschluss:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keine Haftung für Transaktionen zwischen Nutzern</li>
                  <li>Keine Gewährleistung für Spielqualität oder -zustand</li>
                  <li>Keine Haftung für Nutzerinhalte</li>
                  <li>Technische Störungen können auftreten</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Unsere Haftung:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Beschränkt auf vorsätzliche oder grob fahrlässige Schäden</li>
                  <li>Maximale Haftung: Jahresbeitrag des Nutzers</li>
                  <li>Keine Haftung für entgangenen Gewinn</li>
                </ul>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p>
                    <strong>Wichtig:</strong> Bei wertvollen Transaktionen empfehlen wir zusätzliche Absicherungen.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-red-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800">Kündigung & Sperrung</CardTitle>
              </CardHeader>
              <CardContent className="font-body text-gray-600 space-y-4">
                <h4 className="font-semibold text-gray-800">Deine Kündigung:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Jederzeit ohne Angabe von Gründen möglich</li>
                  <li>Löschung über Profileinstellungen oder E-Mail</li>
                  <li>Offene Transaktionen müssen abgewickelt werden</li>
                </ul>

                <h4 className="font-semibold text-gray-800">Sperrung durch uns:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bei Verstößen gegen diese Bedingungen</li>
                  <li>Bei betrügerischem Verhalten</li>
                  <li>Bei wiederholten Beschwerden</li>
                  <li>Vorherige Warnung, außer bei schweren Verstößen</li>
                </ul>
              </CardContent>
            </Card>

            {/* Final Provisions */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardContent className="p-8">
                <h3 className="font-handwritten text-2xl text-gray-800 mb-4 text-center">Schlussbestimmungen</h3>
                <div className="font-body text-gray-600 space-y-4">
                  <p>
                    <strong>Anwendbares Recht:</strong> Schweizer Recht
                  </p>
                  <p>
                    <strong>Gerichtsstand:</strong> Zürich, Schweiz
                  </p>
                  <p>
                    <strong>Änderungen:</strong> Wir können diese Bedingungen mit 30 Tagen Vorlauf ändern
                  </p>
                  <p>
                    <strong>Salvatorische Klausel:</strong> Unwirksame Bestimmungen berühren nicht die Gültigkeit der
                    übrigen Bedingungen
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <p className="font-body text-sm text-gray-500 text-center">
                    Stand: Januar 2025
                    <br />
                    Bei Fragen: legal@ludoloop.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
