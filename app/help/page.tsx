"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Navigation } from "@/components/navigation"
import { MessageCircle, Mail, Phone, HelpCircle, Users, Gamepad2, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="help" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-handwritten text-gray-800 mb-6 text-center transform -rotate-1">Hilfe & FAQ</h1>
          <p className="text-xl text-gray-600 mb-12 text-center font-body transform rotate-1">
            Hier findest du Antworten auf die häufigsten Fragen rund um LudoLoop
          </p>

          {/* Contact Section */}
          <Card className="mb-8 transform rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-orange-400" />
                Brauchst du persönliche Hilfe?
              </CardTitle>
            </CardHeader>
            <CardContent className="font-body">
              <p className="text-gray-600 mb-4">Unser Support-Team ist gerne für dich da! Kontaktiere uns über:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Mail className="w-5 h-5 text-orange-400" />
                  <span>support@ludoloop.com</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Phone className="w-5 h-5 text-pink-400" />
                  <span>+41 XX XXX XX XX</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {/* Getting Started */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-teal-400" />
                  Erste Schritte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="registration">
                    <AccordionTrigger className="font-body">Wie registriere ich mich bei LudoLoop?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Die Registrierung ist ganz einfach! Klicke auf "Registrieren" und fülle das Formular mit deinen
                      Daten aus. Du erhältst eine Bestätigungs-E-Mail, um dein Konto zu aktivieren. Danach kannst du
                      sofort loslegen!
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="profile">
                    <AccordionTrigger className="font-body">Wie vervollständige ich mein Profil?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Gehe zu deinem Profil und fülle alle wichtigen Informationen aus: Profilbild, Standort,
                      Lieblingsspiele und eine kurze Beschreibung über dich. Ein vollständiges Profil schafft Vertrauen
                      in der Community!
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="first-game">
                    <AccordionTrigger className="font-body">Wie füge ich mein erstes Spiel hinzu?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Gehe zur Spielebibliothek und klicke auf "Spiel hinzufügen". Du kannst Spiele über die Suche
                      finden oder manuell eingeben. Füge Fotos hinzu und wähle aus, ob du das Spiel verleihen, verkaufen
                      oder tauschen möchtest.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Marketplace */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-pink-400" />
                  Spielemarkt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="selling">
                    <AccordionTrigger className="font-body">Wie verkaufe ich ein Spiel?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Gehe zu deiner Spielebibliothek, wähle das Spiel aus und aktiviere "Zum Verkauf". Setze einen
                      fairen Preis und füge eine detaillierte Beschreibung hinzu. Interessenten können dich dann direkt
                      kontaktieren.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="lending">
                    <AccordionTrigger className="font-body">Wie funktioniert das Verleihen?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Aktiviere "Zum Verleih" bei deinen Spielen und setze einen Tagespreis. Leihnehmer können eine
                      Anfrage stellen, und ihr vereinbart Übergabe und Rückgabe. Eine Kaution kann optional vereinbart
                      werden.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="trading">
                    <AccordionTrigger className="font-body">Wie tausche ich Spiele?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Markiere deine Spiele als "Zum Tausch" und durchstöbere andere Tauschangebote. Wenn du ein
                      interessantes Spiel findest, schlage einen Tausch vor. Ihr könnt auch Wertunterschiede mit Geld
                      ausgleichen.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Community */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange-400" />
                  Community & Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="groups">
                    <AccordionTrigger className="font-body">Wie finde ich Spielgruppen?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Gehe zu "Spielgruppen" und durchstöbere lokale Gruppen in deiner Nähe. Du kannst nach Spieltypen,
                      Schwierigkeitsgrad oder Altersgruppe filtern. Tritt interessanten Gruppen bei oder gründe deine
                      eigene!
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="events">
                    <AccordionTrigger className="font-body">Wie organisiere ich ein Event?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Klicke auf "Event erstellen", wähle Datum, Ort und Spiele aus. Beschreibe dein Event und lade
                      andere Spieler ein. Du kannst öffentliche oder private Events erstellen.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="friends">
                    <AccordionTrigger className="font-body">Wie füge ich Freunde hinzu?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Besuche Profile anderer Spieler und sende Freundschaftsanfragen. Freunde sehen deine Aktivitäten
                      und können einfacher mit dir spielen. Du kannst auch über gemeinsame Events neue Freunde finden.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Safety & Trust */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-green-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-green-400" />
                  Sicherheit & Vertrauen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="safety">
                    <AccordionTrigger className="font-body">Wie sicher sind Transaktionen?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Alle Nutzer sind verifiziert und haben Bewertungen. Treffe dich an öffentlichen Orten für
                      Übergaben. Bei wertvollen Spielen empfehlen wir eine Kaution. Melde verdächtige Aktivitäten
                      unserem Support-Team.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="disputes">
                    <AccordionTrigger className="font-body">Was passiert bei Problemen?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Kontaktiere zuerst den anderen Nutzer direkt. Falls keine Lösung gefunden wird, wende dich an
                      unser Support-Team. Wir helfen bei der Vermittlung und können bei schwerwiegenden Verstößen
                      Maßnahmen ergreifen.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="ratings">
                    <AccordionTrigger className="font-body">Wie funktioniert das Bewertungssystem?</AccordionTrigger>
                    <AccordionContent className="font-body text-gray-600">
                      Nach jeder Transaktion könnt ihr euch gegenseitig bewerten. Ehrliche Bewertungen helfen der
                      Community, vertrauensvolle Mitglieder zu erkennen. Bewertungen sind öffentlich und können nicht
                      gelöscht werden.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Still need help */}
          <Card className="mt-12 transform -rotate-1 hover:rotate-0 transition-all border-2 border-purple-200">
            <CardContent className="p-8 text-center">
              <h3 className="font-handwritten text-2xl text-gray-800 mb-4">Immer noch Fragen?</h3>
              <p className="font-body text-gray-600 mb-6">
                Unser Support-Team hilft dir gerne weiter! Schreibe uns eine E-Mail oder schau in unserer Community
                vorbei.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="mailto:support@ludoloop.com"
                  className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-handwritten transform hover:scale-105 transition-all"
                >
                  E-Mail schreiben
                </Link>
                <Link
                  href="/ludo-mitglieder"
                  className="bg-pink-400 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-handwritten transform hover:scale-105 transition-all"
                >
                  Community besuchen
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
