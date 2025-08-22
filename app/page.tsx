"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Repeat,
  Dices,
  ArrowRightFromLine,
  Store,
  Plus,
  HandCoins,
  Library,
  CheckCircle,
  Expand,
  Heart,
  Target,
  Coins,
  Leaf,
  Globe,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-800 mb-6 transform -rotate-1 font-handwritten">
            Bring deine Spiele ins Spiel
          </h2>
          <p className="text-xl text-gray-600 mb-8 transform rotate-1 font-body">
            Entdecke, teile und geniesse Brettspiele wie nie zuvor
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 mb-16">
        <h2 className="text-4xl font-handwritten text-center text-gray-800 mb-12 transform rotate-1">
          Entdecke unsere Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-pink-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <Library className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Digitales Spielregal</h3>
              <p className="text-gray-600 font-body mb-4">
                Lege deine Spiele digital an und behalte den Überblick über deine Sammlung.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/library">Zur Spielebibliothek</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <Expand className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Verleihen</h3>
              <p className="text-gray-600 font-body mb-4">
                Leihe deine Spiele aus und verdiene dabei etwas. Sicher und einfach!
              </p>
              <Button
                asChild
                variant="outline"
                className="border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/marketplace?filter=lend">Zum Spielemarkt</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Repeat className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Tauschen</h3>
              <p className="text-gray-600 font-body mb-4">Tausche Spiele mit anderen und entdecke neue Spiele!</p>
              <Button
                asChild
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/marketplace?filter=trade">Zum Spielemarkt</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-pink-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <HandCoins className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Verkaufen</h3>
              <p className="text-gray-600 font-body mb-4">
                Verkaufe Spiele, die du nicht mehr brauchst. Schnell und sicher!
              </p>
              <Button
                asChild
                variant="outline"
                className="border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/marketplace?filter=sell">Zum Spielemarkt</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Marktplatz</h3>
              <p className="text-gray-600 font-body mb-4">
                Entdecke spannende Angebote von anderen Mitgliedern und finde tolle Spiele zum Ausleihen, Kaufen oder
                Tauschen.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/marketplace?filter=sell">Zum Spielemarkt</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-pink-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Spielgruppen & Community</h3>
              <p className="text-gray-600 font-body mb-4">
                Tritt Spielgruppen bei oder gründe deine eigene und finde Gleichgesinnte für gemeinsame Spielrunden.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/groups?tab=communities">Zu Spielgruppen</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Dices className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">Events & Spielrunden</h3>
              <p className="text-gray-600 font-body mb-4">
                Organisiere deine nächste Spielrunde im Handumdrehen und finde Mitspieler.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten bg-transparent"
              >
                <Link href="/groups?tab=communities">Zu Events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 mb-16">
        <h2 className="text-4xl font-handwritten text-center text-gray-800 mb-4 transform -rotate-1">
          Vorteile auf einen Blick
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 font-body transform rotate-1">
          Warum LudoLoop die perfekte Wahl für Brettspiel-Liebhaber ist
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 transform -rotate-12">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Alles an einem Ort</h3>
              <p className="text-gray-600 font-body">
                Digitales Spielregal, Verleih, Tausch, Verkauf und Community - alles vereint in einer Plattform.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform -rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center flex-shrink-0 transform rotate-12">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Community-Feeling</h3>
              <p className="text-gray-600 font-body">
                Gleichgesinnte finden, Freundschaften knüpfen und Leidenschaft teilen.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0 transform -rotate-12">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Spielvielfalt</h3>
              <p className="text-gray-600 font-body">
                Einfacher Zugang zu tollen Spielen.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform -rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 transform rotate-12">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Nachhaltig und kostensparend</h3>
              <p className="text-gray-600 font-body">
                Weniger ungenutzte Spiele im Regal, mehr Kreislauf durch Tausch und Verleih - gut für Umwelt und Geldbeutel.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0 transform -rotate-12">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Sicher & vertrauensvoll</h3>
              <p className="text-gray-600 font-body">
                Verifizierte Profile und sichere Transaktionen für sorgenfreies Spielen.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform -rotate-1 hover:rotate-0 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 transform rotate-12">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">Flexibel & kosteneffizient</h3>
              <p className="text-gray-600 font-body">
                Spiele nur dann kaufen, wenn sie wirklich gefallen - erst testen, dann entscheiden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-400 via-orange-400 to-pink-400 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-6 transform rotate-1 font-handwritten">
            Bereit für dein Spiele-Abenteuer?
          </h3>
          <p className="text-xl text-white mb-8 transform -rotate-1 font-body">
            Schliesse dich tausenden von Brettspiel-Fans an und bringe deine Spielleidenschaft auf ein neues Level!
          </p>
          <Button
            asChild
            className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 text-lg transform rotate-1 hover:rotate-0 transition-all font-handwritten"
          >
            <Link href="/register">
              <Plus className="w-5 h-5 mr-2" />
              Jetzt loslegen
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
