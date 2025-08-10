"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dice6, Users, ShoppingBag, RefreshCw, Search, Plus } from 'lucide-react'
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
            Deine Spiele. Deine Community. Dein Abenteuer.
          </h2>
          <p className="text-xl text-gray-600 mb-8 transform rotate-1 font-body">
            Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke großartige Spiele!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white px-8 py-3 text-lg transform rotate-1 hover:rotate-0 transition-all font-handwritten">
              <Link href="/marketplace">
                <Search className="w-5 h-5 mr-2" />
                Markplatz erkunden
              </Link>
            </Button>
            <Button asChild className="bg-teal-400 hover:bg-teal-500 text-white px-8 py-3 text-lg transform rotate-1 hover:rotate-0 transition-all font-handwritten">
              <Link href="/register">
                <Dice6 className="w-5 h-5 mr-2" />
                Jetzt loslegen
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <Dice6 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                Verleihen
              </h3>
              <p className="text-gray-600 font-body mb-4">
                Leihe deine Spiele aus und verdiene dabei. Sicher und einfach!
              </p>
              <Button asChild variant="outline" className="border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten">
                <Link href="/marketplace?filter=lend">
                  Zum Marktplatz
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                Tauschen
              </h3>
              <p className="text-gray-600 font-body mb-4">
                Tausche Spiele mit anderen und entdecke neue Spiele!
              </p>
              <Button asChild variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten">
                <Link href="/marketplace?filter=trade">
                  Zum Marktplatz
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-pink-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                Verkaufen
              </h3>
              <p className="text-gray-600 font-body mb-4">
                Verkaufe Spiele, die du nicht mehr brauchst. Schnell und sicher!
              </p>
              <Button asChild variant="outline" className="border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten">
                <Link href="/marketplace?filter=sell">
                  Zum Marktplatz
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">
                Community
              </h3>
              <p className="text-gray-600 font-body mb-4">
                Finde Gleichgesinnte und tritt spannende Spielgruppen bei!
              </p>
              <Button asChild variant="outline" className="border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten">
                <Link href="/groups">
                  Zur Community
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-400 via-orange-400 to-pink-400 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-6 transform rotate-1 font-handwritten">
            Bereit für dein Spiele-Abenteuer?
          </h3>
          <p className="text-xl text-white mb-8 transform -rotate-1 font-body">
            Starte jetzt und entdecke eine neue Welt des Spielens!
          </p>
          <Button asChild className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 text-lg transform rotate-1 hover:rotate-0 transition-all font-handwritten">
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
