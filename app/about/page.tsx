"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Recycle, Heart, Target, Mail, MapPin } from 'lucide-react'
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Navigation */}
      <Navigation currentPage="about" />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6 transform -rotate-1 font-handwritten">
            Über Ludoloop
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto transform rotate-1 font-body">
            Gesellschaftsspiele bringen Menschen zusammen, schaffen unvergessliche Erlebnisse und fördern Gemeinschaft. Doch oft stehen tolle Spiele ungenutzt im Regal, während andere nach genau diesem Spiel suchen. Mit unserer Plattform möchten wir diese Lücke schliessen, den Zugang zu Spielen für alle erleichtern und eine lebendige Gemeinschaft schaffen, die den Geist des gemeinsamen Spielens fördert. Ob Du Deine Lieblingsspiele teilen möchtest, auf der Suche nach neuen (Spiel-)Freunde bist oder einfach Deine Sammlung verkaufen möchtest – bei Ludoloop findest Du die passende Möglichkeit.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 font-handwritten">
                Unsere Mission
              </h2>
              <p className="text-gray-600 font-body">
                Gesellschaftsspiele bringen Menschen zusammen, schaffen unvergessliche Erlebnisse und fördern Gemeinschaft. Doch oft stehen tolle Spiele ungenutzt im Regal, während andere nach genau diesem Spiel suchen. Mit unserer Plattform möchten wir diese Lücke schliessen, den Zugang zu Spielen für alle erleichtern und eine lebendige Gemeinschaft schaffen, die den Geist des gemeinsamen Spielens fördert. Ob Du Deine Sammlung erweitern, neue (Spiel-)Freunde finden oder einfach nur Deine Lieblingsspiele teilen möchtest: Ludoloop macht es möglich und ganz ohne grossen Aufwand.
              </p>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 font-handwritten">
                Unsere Vision
              </h2>
              <p className="text-gray-600 font-body">
                
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 transform rotate-1 font-handwritten">
            Unsere Werte
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-pink-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                  Gemeinschaft
                </h3>
                <p className="text-gray-600 text-sm font-body">
                  Wir verbinden Menschen durch die Liebe zu  Brett- und Gesellschaftsspiele
                </p>
              </CardContent>
            </Card>

            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                  <Recycle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                  Nachhaltigkeit
                </h3>
                <p className="text-gray-600 text-sm font-body">
                  Spiele teilen statt horten - gut für Umwelt und Geldbeutel
                </p>
              </CardContent>
            </Card>

            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                  Vertrauen & Fairness
                </h3>
                <p className="text-gray-600 text-sm font-body">
                  Sichere und faire Transaktionen für alle Mitglieder
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 transform -rotate-1 font-handwritten">
            Das Team
          </h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-gray-600 mb-8 font-body">
              Ludoloop wurde von leidenschaftlichen Brettspielfans gegründet, 
              die ihre Liebe zum Spielen mit der ganzen Welt teilen möchten. 
              Unser Team arbeitet täglich daran, die beste Plattform für 
              Spieleliebhaber zu schaffen.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center transform rotate-12">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center transform -rotate-12">
                <span className="text-2xl">🎲</span>
              </div>
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center transform rotate-12">
                <span className="text-2xl">🎮</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <Card className="max-w-2xl mx-auto transform rotate-1 hover:rotate-0 transition-all border-2 border-teal-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-handwritten">
              Kontakt & Support
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <span className="font-body">support@ludoloop.de</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <MapPin className="w-5 h-5 text-teal-600" />
                <span className="font-body">Zufikon AG, Schweiz</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6 font-body">
              Hast du Fragen oder Feedback? Wir freuen uns auf deine Nachricht!
            </p>
            <Button asChild className="bg-teal-400 hover:bg-teal-500 text-white transform hover:rotate-1 transition-all font-handwritten">
              <Link href="/register">
                Jetzt mitmachen!
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
