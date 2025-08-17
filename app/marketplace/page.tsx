"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CreateMarketplaceOfferForm } from "@/components/create-marketplace-offer-form"
import { CreateSearchAdForm } from "@/components/create-search-ad-form"
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
  Store,
  AlertCircle,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

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
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false)
  const [searchAds, setSearchAds] = useState<any[]>([])
  const [isCreateSearchAdOpen, setIsCreateSearchAdOpen] = useState(false)

  useEffect(() => {
    if (databaseConnected) {
      loadSearchAds()
    }
  }, [databaseConnected])

  const loadSearchAds = async () => {
    try {
      const { data, error } = await supabase
        .from("search_ads")
        .select(`
          *,
          users (
            name
          )
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading search ads:", error)
        return
      }

      setSearchAds(data || [])
    } catch (error) {
      console.error("Error loading search ads:", error)
    }
  }

  const allItems = [
    ...marketplaceOffers.map((offer) => ({ ...offer, itemType: "offer" })),
    ...searchAds.map((ad) => ({ ...ad, itemType: "search" })),
  ]

  const filteredItems = allItems
    .filter((item) => {
      const matchesSearch =
        item.itemType === "offer"
          ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.publisher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.owner?.toLowerCase().includes(searchTerm.toLowerCase())
          : item.title.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType =
        selectedType === "all" ||
        (item.itemType === "offer" && item.type === selectedType) ||
        (item.itemType === "search" && selectedType === "search")

      const matchesCondition =
        selectedCondition === "all" || (item.itemType === "offer" && item.condition === selectedCondition)

      return matchesSearch && matchesType && matchesCondition
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-low":
          if (a.itemType === "offer" && b.itemType === "offer") {
            const priceA = Number.parseFloat(a.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
            const priceB = Number.parseFloat(b.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
            return priceA - priceB
          }
          return 0
        case "price-high":
          if (a.itemType === "offer" && b.itemType === "offer") {
            const priceA = Number.parseFloat(a.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
            const priceB = Number.parseFloat(b.price?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0")
            return priceB - priceA
          }
          return 0
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
      case "buy":
        return "bg-green-400"
      case "borrow":
        return "bg-blue-400"
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
      case "buy":
        return "Kaufen"
      case "borrow":
        return "Ausleihen"
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
      <Navigation currentPage="spielemarkt" />

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
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">Spielemarkt</h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
            Entdecke, tausche, teile und finde deine Lieblingsspiele!
          </p>
          {user && databaseConnected && (
            <div className="mt-6 flex gap-4 justify-center">
              <Button
                onClick={() => setIsCreateOfferOpen(true)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-handwritten text-lg px-8 py-3 transform hover:scale-105 hover:rotate-1 transition-all"
              >
                <Store className="w-5 h-5 mr-2" />
                Neues Angebot erstellen
              </Button>
              <Button
                onClick={() => setIsCreateSearchAdOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-white font-handwritten text-lg px-8 py-3 transform hover:scale-105 hover:-rotate-1 transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Suchanzeige erstellen
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-orange-200/50">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
              <Input
                placeholder="Spiele, Verlage oder Anbieter durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-orange-200 focus:border-orange-400 rounded-lg font-body"
                disabled={!databaseConnected}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={!databaseConnected}>
              <SelectTrigger className="border-2 border-orange-200 rounded-lg font-body">
                <SelectValue placeholder="Alle Angebote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Angebote</SelectItem>
                <SelectItem value="lend">Verleihen</SelectItem>
                <SelectItem value="trade">Tauschen</SelectItem>
                <SelectItem value="sell">Verkaufen</SelectItem>
                <SelectItem value="search">Suchanzeigen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCondition} onValueChange={setSelectedCondition} disabled={!databaseConnected}>
              <SelectTrigger className="border-2 border-orange-200 rounded-lg font-body">
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-white/50 backdrop-blur-sm rounded-lg"
                disabled={!databaseConnected}
              >
                <Search className="w-4 h-4 mr-2" />
                Suchen
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten bg-white/50 backdrop-blur-sm rounded-lg"
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
              <SelectTrigger className="w-48 border-2 border-orange-200 rounded-lg font-body">
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
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 font-body text-lg">
              <span className="font-bold text-orange-600">{filteredItems.length}</span>{" "}
              {filteredItems.length === 1 ? "Eintrag" : "Einträge"} gefunden
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500 font-body">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              <span>Verleihen</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Tauschen</span>
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>Verkaufen</span>
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Suchanzeigen</span>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {databaseConnected ? (
            filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Card
                  key={`${item.itemType}-${item.id}`}
                  className={`group transform hover:scale-105 hover:-rotate-1 transition-all duration-300 border-2 ${
                    item.itemType === "search"
                      ? "border-amber-200/50 hover:border-amber-400"
                      : "border-orange-200/50 hover:border-orange-400"
                  } cursor-pointer bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl rounded-xl overflow-hidden`}
                >
                  <CardContent className="p-0">
                    {item.itemType === "offer" ? (
                      <>
                        <div className="relative overflow-hidden">
                          <img
                            src={item.image || "/images/ludoloop-placeholder.png"}
                            alt={item.title}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Badge
                            className={`absolute top-3 right-3 ${getTypeColor(item.type)} text-white font-body shadow-lg`}
                          >
                            {getTypeText(item.type)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-3 left-3 bg-white/90 hover:bg-white border-gray-300 shadow-lg backdrop-blur-sm"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="p-5">
                          <h3 className="font-bold text-lg mb-2 font-handwritten text-gray-800 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 font-body">{item.publisher}</p>

                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="font-body border-orange-200 text-orange-700">
                              {item.condition}
                            </Badge>
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm ml-1 font-body font-medium">{item.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-500 text-sm mb-4 font-body">
                            <MapPin className="w-4 h-4 mr-1 text-orange-400" />
                            <span>{item.location}</span>
                            <span className="mx-2 text-orange-300">•</span>
                            <span>{item.distance}</span>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-xl text-orange-600 font-handwritten">{item.price}</span>
                            <span className="text-sm text-gray-500 font-body">von {item.owner}</span>
                          </div>

                          <Button
                            onClick={() => handleContactSeller(item)}
                            className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-handwritten shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                            disabled={!databaseConnected}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Kontaktieren
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <Badge
                            className={`${
                              item.type === "buy" ? "bg-green-400" : "bg-blue-400"
                            } text-white font-body shadow-lg`}
                          >
                            {item.type === "buy" ? "Kaufen" : "Ausleihen"}
                          </Badge>
                          <Search className="w-5 h-5 text-amber-400" />
                        </div>

                        <h3 className="font-bold text-lg mb-3 font-handwritten text-gray-800 line-clamp-2">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-gray-600 text-sm mb-4 font-body line-clamp-3">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500 font-body">von {item.users?.name || "Unbekannt"}</span>
                          <span className="text-xs text-gray-400 font-body">
                            {new Date(item.created_at).toLocaleDateString("de-DE")}
                          </span>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-handwritten shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Antworten
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-orange-200/50">
                  <AlertCircle className="w-20 h-20 text-orange-300 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-gray-600 mb-4 font-handwritten">
                    Keine passenden Spiele gefunden
                  </h3>
                  <p className="text-gray-500 font-body text-lg mb-6">
                    Erstell eine Suchanzeige und teile der Community mit, welches Spiel du suchst!
                  </p>
                  {user && (
                    <Button
                      onClick={() => setIsCreateSearchAdOpen(true)}
                      className="bg-amber-400 hover:bg-amber-500 text-white font-handwritten text-lg px-8 py-3 transform hover:scale-105 hover:-rotate-1 transition-all"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Suchanzeige erstellen
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-orange-200/50">
                <Database className="w-20 h-20 text-orange-300 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-600 mb-4 font-handwritten">Datenbank nicht verfügbar</h3>
                <p className="text-gray-500 font-body text-lg">
                  Führe die SQL-Skripte aus, um Marktplatz-Angebote zu sehen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-teal-400 via-orange-400 to-pink-400 rounded-xl p-8 text-center text-white mb-8 shadow-2xl">
          <h2 className="text-4xl font-bold mb-6 font-handwritten transform -rotate-1">Mitmachen!</h2>
          <p className="text-lg mb-6 font-body opacity-90">
            Werde Teil unserer Gaming-Community und entdecke neue Spielerlebnisse!
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              className="bg-white text-teal-600 hover:bg-gray-100 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all shadow-lg rounded-lg"
              onClick={() => {
                window.location.href = "/register"
              }}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registrieren
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-teal-600 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all bg-white/10 backdrop-blur-sm rounded-lg"
              onClick={() => {
                window.location.href = "/login"
              }}
            >
              <LogIn className="w-5 h-5 mr-2" />
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

      {/* Create Marketplace Offer Dialog */}
      <CreateMarketplaceOfferForm
        isOpen={isCreateOfferOpen}
        onClose={() => setIsCreateOfferOpen(false)}
        onSuccess={() => {
          // Refresh the page or show success message
          window.location.reload()
        }}
      />

      {/* Create Search Ad Dialog */}
      <CreateSearchAdForm
        isOpen={isCreateSearchAdOpen}
        onClose={() => setIsCreateSearchAdOpen(false)}
        onSuccess={() => {
          loadSearchAds()
        }}
      />
    </div>
  )
}
