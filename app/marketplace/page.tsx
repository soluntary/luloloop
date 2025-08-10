"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  LogIn,
  UserPlus,
  MapPin,
  Star,
  MessageCircle,
  Heart,
  Filter,
  SortAsc,
  ShoppingCart,
  Database,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

export default function MarketplacePage() {
  const { marketplaceOffers, loading, error, databaseConnected } = useGames()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedCondition, setSelectedCondition] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedOffer, setSelectedOffer] = useState<(typeof marketplaceOffers)[0] | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")

  const filteredOffers = marketplaceOffers
    .filter((offer) => {
      const matchesSearch =
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.publisher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.owner?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = selectedType === "all" || offer.type === selectedType
      const matchesCondition = selectedCondition === "all" || offer.condition === selectedCondition

      return matchesSearch && matchesType && matchesCondition
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-low":
          const priceA = Number.parseFloat(a.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
          const priceB = Number.parseFloat(b.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
          return priceA - priceB
        case "price-high":
          const priceA2 = Number.parseFloat(a.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
          const priceB2 = Number.parseFloat(b.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
          return priceB2 - priceA2
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lend":
        return "bg-teal-400"
      case "trade":
        return "bg-orange-400"
      case "sell":
        return "bg-pink-400"
      default:
        return "bg-gray-400"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "lend":
        return "Verleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Verkaufen"
      default:
        return type
    }
  }

  const handleContactSeller = (offer: (typeof marketplaceOffers)[0]) => {
    setSelectedOffer(offer)
    setContactMessage(
      `Hallo! Ich interessiere mich für dein Spiel "${offer.title}". Können wir uns darüber unterhalten?`,
    )
    setIsContactDialogOpen(true)
  }

  const handleSendMessage = () => {
    // Here you would typically send the message to the seller
    alert(`Nachricht an ${selectedOffer?.owner} gesendet!`)
    setIsContactDialogOpen(false)
    setContactMessage("")
    setSelectedOffer(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Marktplatz wird geladen...
          </h2>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
            Die besten Angebote werden für dich gesucht!
          </p>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div
              className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="marketplace" />

      <div className="container mx-auto px-4 py-8">
        {/* Database Error Banner */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start space-x-4">
              <Database className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-700 font-handwritten text-xl mb-2">
                  🚨 Datenbank-Setup erforderlich
                </h3>
                <p className="text-red-600 font-body mb-4">{error}</p>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-700 font-handwritten mb-2">Setup-Anleitung:</h4>
                  <ol className="text-red-600 font-body space-y-1 text-sm">
                    <li>1. Öffne dein Supabase-Dashboard</li>
                    <li>2. Gehe zum SQL Editor</li>
                    <li>3. Führe die Skripte in dieser Reihenfolge aus:</li>
                    <li className="ml-4">• scripts/01-create-tables.sql</li>
                    <li className="ml-4">• scripts/02-create-policies.sql</li>
                    <li className="ml-4">• scripts/03-seed-data.sql (optional)</li>
                    <li>4. Aktualisiere die Seite</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Spielemarktplatz
          </h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
            Entdecke, tausche und teile deine Lieblingsspiele!
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-orange-200">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Spiele, Verlage oder Anbieter durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-orange-200 focus:border-orange-400"
                disabled={!databaseConnected}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={!databaseConnected}>
              <SelectTrigger className="border-2 border-orange-200">
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="lend">Verleihen</SelectItem>
                <SelectItem value="trade">Tauschen</SelectItem>
                <SelectItem value="sell">Verkaufen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCondition} onValueChange={setSelectedCondition} disabled={!databaseConnected}>
              <SelectTrigger className="border-2 border-orange-200">
                <SelectValue placeholder="Alle Zustände" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zustände</SelectItem>
                <SelectItem value="Wie neu">Wie neu</SelectItem>
                <SelectItem value="Sehr gut">Sehr gut</SelectItem>
                <SelectItem value="Gut">Gut</SelectItem>
                <SelectItem value="Akzeptabel">Akzeptabel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                disabled={!databaseConnected}
              >
                <Search className="w-4 h-4 mr-2" />
                Suchen
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedType("all")
                  setSelectedCondition("all")
                  setSortBy("newest")
                }}
                disabled={!databaseConnected}
              >
                <Filter className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
            </div>

            <Select value={sortBy} onValueChange={setSortBy} disabled={!databaseConnected}>
              <SelectTrigger className="w-48 border-2 border-orange-200">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Neueste zuerst</SelectItem>
                <SelectItem value="oldest">Älteste zuerst</SelectItem>
                <SelectItem value="title">Titel A-Z</SelectItem>
                <SelectItem value="price-low">Preis aufsteigend</SelectItem>
                <SelectItem value="price-high">Preis absteigend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        {databaseConnected && (
          <div className="mb-6">
            <p className="text-gray-600 font-body">
              {filteredOffers.length} {filteredOffers.length === 1 ? "Angebot" : "Angebote"} gefunden
            </p>
          </div>
        )}

        {/* Marketplace Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {databaseConnected ? (
            filteredOffers.length > 0 ? (
              filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="transform hover:scale-105 hover:rotate-1 transition-all duration-300 border-2 border-orange-200 hover:border-orange-400 cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={offer.image || "/images/ludoloop-placeholder.png"}
                        alt={offer.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className={`absolute top-2 right-2 ${getTypeColor(offer.type)} text-white font-body`}>
                        {getTypeText(offer.type)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 left-2 bg-white/90 hover:bg-white border-gray-300"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 font-handwritten text-gray-800">{offer.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 font-body">{offer.publisher}</p>

                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="font-body">
                          {offer.condition}
                        </Badge>
                        <div className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm ml-1 font-body">{offer.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-500 text-sm mb-3 font-body">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{offer.location}</span>
                        <span className="mx-2">•</span>
                        <span>{offer.distance}</span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-lg text-gray-800 font-handwritten">{offer.price}</span>
                        <span className="text-sm text-gray-500 font-body">von {offer.owner}</span>
                      </div>

                      <Button
                        onClick={() => handleContactSeller(offer)}
                        className="w-full bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
                        disabled={!databaseConnected}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Kontaktieren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2 font-handwritten">Keine Angebote gefunden</h3>
                <p className="text-gray-500 font-body">
                  Versuche andere Suchbegriffe oder Filter, um mehr Ergebnisse zu finden.
                </p>
              </div>
            )
          ) : (
            <div className="col-span-full text-center py-12">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2 font-handwritten">Datenbank nicht verfügbar</h3>
              <p className="text-gray-500 font-body">Führe die SQL-Skripte aus, um Marktplatz-Angebote zu sehen.</p>
            </div>
          )}
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-teal-400 to-orange-400 rounded-lg p-8 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-4 font-handwritten transform -rotate-1">Mitmachen!</h2>
          <div className="flex gap-4 justify-center">
            <Button
              className="bg-white text-teal-600 hover:bg-gray-100 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all"
              onClick={() => {
                window.location.href = "/register"
              }}
            >
              <UserPlus className="w-8 h-8 text-teal-600" />
              Registrieren
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-teal-600 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all bg-transparent"
              onClick={() => {
                window.location.href = "/login"
              }}
            >
              <LogIn className="w-4 h-4 text-white" />
              Anmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Seller Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">
              Nachricht an {selectedOffer?.owner}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={selectedOffer?.image || "/images/ludoloop-placeholder.png"}
                alt={selectedOffer?.title}
                className="w-24 h-32 mx-auto rounded-lg shadow-lg mb-4"
              />
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">{selectedOffer?.title}</h3>
              <p className="text-gray-600 font-body">
                {getTypeText(selectedOffer?.type || "")} - {selectedOffer?.price}
              </p>
            </div>

            <div>
              <Label className="font-body">Deine Nachricht:</Label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Schreibe eine freundliche Nachricht..."
                className="font-body"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactDialogOpen(false)}
                className="flex-1 font-handwritten"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSendMessage}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
                disabled={!contactMessage.trim()}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Senden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
