"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Recycle, Heart, Target, Mail, MapPin } from 'lucide-react'
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { FaHeart } from "react-icons/fa"
import { FiTarget, FiMail } from "react-icons/fi"
import { FaUsersRectangle, FaLocationDot } from "react-icons/fa6"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Navigation */}
      <Navigation currentPage="about" />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6 transform -rotate-1 font-handwritten">Über Ludoloop</h1>
          <p className="text-gray-600 max-w-3xl mx-auto transform rotate-1 font-body text-base">
            Wir sind mehr als nur eine Plattform - wir sind eine lebendige Community von Brettspiel-Enthusiasten, die ihre Leidenschaft teilen und gemeinsam die Welt der Brettspiele neu erleben.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                <FiTarget className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-bold text-gray-800 mb-4 font-handwritten text-lg">Unsere Mission</h2>
              <p className="text-gray-600 font-body text-xs text-justify">
                LudoLoop entstand aus einer einfachen Beobachtung: Viele von uns haben Regale voller wunderbarer Brettspiele, die nur selten gespielt werden, während andere genau nach diesen Spielen suchen. Gleichzeitig ist es oft schwierig, Gleichgesinnte für spontane oder regelmässige Spielrunden zu finden oder neue Spiele auszuprobieren, bevor man sie kauft. Als begeisterte Brettspieler wollten wir eine Lösung schaffen, die mehrere Probleme gleichzeitig löst: Den Zugang zu einer grösseren Spielevielfalt ermöglichen, ohne dass jeder jedes Spiel neu kaufen muss. Eine Community aufbauen, in der sich Spieler einfach finden und vernetzen können. Und dabei auch noch nachhaltig mit Ressourcen umgehen. So entstand LudoLoop - eine Plattform, die all diese Bedürfnisse vereint und das Beste aus der Sharing Economy mit der Leidenschaft für Brettspiele verbindet.
              </p>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12">
                <FaHeart className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-bold text-gray-800 mb-4 font-handwritten text-lg">Unsere Vision</h2>
              <p className="text-gray-600 font-body text-xs text-justify">
                Wir glauben, dass Gesellschaftsspiele mehr sind als nur Unterhaltung – sie sind Brücken zwischen
                Menschen. Unsere Vision ist es, die grösste digitale Gemeinschaft rund um Brett- und Gesellschaftsspiele
                aufzubauen, in der Spiele nicht unbenutzt im Regal verstauben, sondern immer wieder neue Freude
                bereiten. Wir möchten das gemeinsame Spielen fördern, den Zugang zu Spielen erleichtern und nachhaltigen
                Umgang mit Spielen unterstützen.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="font-bold text-gray-800 text-center mb-12 transform rotate-1 font-handwritten text-2xl">
            Unsere Werte
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-pink-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                  <FaUsersRectangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 font-handwritten">Gemeinschaft</h3>
                <p className="text-gray-600 text-xs font-body">
                  Wir verbinden Menschen durch die Liebe zu Brett- und Gesellschaftsspiele und schaffen einen Raum für echte Begegnungen.
                </p>
              </CardContent>
            </Card>

            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                  <Recycle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 font-handwritten">Nachhaltigkeit</h3>
                <p className="text-gray-600 text-xs font-body">
                  Spiele teilen statt horten - gut für Umwelt und Geldbeutel
                </p>
              </CardContent>
            </Card>

            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                  <FaHeart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 font-handwritten">Vertrauen & Fairness</h3>
                <p className="text-gray-600 text-xs font-body">Sichere und faire Transaktionen für alle Mitglieder</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="font-bold text-gray-800 text-center mb-12 transform -rotate-1 font-handwritten text-2xl">
            Das Team
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs text-gray-600 mb-8 font-body text-center">
              Unser kleines, aber feines Team arbeitet täglich daran, die beste Plattform für Spielbegeisterte zu
              schaffen. Wir sind selbst begeisterte Brettspieler und verstehen die Bedürfnisse unserer Community aus
              eigener Erfahrung. Mit Leidenschaft, Engagement und einer Prise Spielfreude entwickeln wir LudoLoop kontinuierlich weiter.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <Card className="max-w-2xl mx-auto transform rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-handwritten">Kontakt & Support</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <FiMail className="w-5 h-5 text-teal-600" />
                <span className="font-body text-xs">support@ludoloop.ch</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <FaLocationDot className="w-5 h-5 text-teal-600" />
                <span className="font-body text-xs">Zufikon AG, Schweiz</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6 font-body text-xs">
              Hast du Fragen, Feedback oder Anregungen? Wir freuen uns auf deine Nachricht und helfen dir gerne weiter!
            </p>
            <Button
              asChild
              className="bg-teal-400 hover:bg-teal-500 text-white transform hover:rotate-1 transition-all font-handwritten"
            >
              <Link href="/register">Jetzt mitmachen!</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
