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
  Star,
  MessageCircle,
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
  const [selectedOfferDetails, setSelectedOfferDetails] = useState<any>(null)
  const [isOfferDetailsOpen, setIsOfferDetailsOpen] = useState(false)
  const [selectedSearchAdDetails, setSelectedSearchAdDetails] = useState<any>(null)
  const [isSearchAdDetailsOpen, setIsSearchAdDetailsOpen] = useState(false)

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
          id,
          title,
          description,
          type,
          created_at,
          active,
          user_id
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading search ads:", error)
        return
      }

      // Get user names separately to avoid relationship issues
      const searchAdsWithUsers = await Promise.all(
        (data || []).map(async (ad) => {
          const { data: userData } = await supabase.from("users").select("name").eq("id", ad.user_id).single()

          return {
            ...ad,
            users: userData || { name: "Unbekannt" },
          }
        }),
      )

      setSearchAds(searchAdsWithUsers)
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
        return "Ausleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Kaufen"
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

  const handleOfferClick = async (item: any) => {
    if (item.itemType === "search") {
      setSelectedSearchAdDetails(item)
      setIsSearchAdDetailsOpen(true)
    } else if (item.itemType === "offer" && item.game_id) {
      try {
        const { data: gameData, error } = await supabase
          .from("games")
          .select("duration, players, category, style, age, language")
          .eq("id", item.game_id)
          .single()

        if (!error && gameData) {
          // Merge game details with offer data
          setSelectedOfferDetails({
            ...item,
            duration: gameData.duration,
            players: gameData.players,
            category: gameData.category,
            style: gameData.style,
            age: gameData.age,
            language: gameData.language,
          })
        } else {
          setSelectedOfferDetails(item)
        }
      } catch (error) {
        console.error("Error fetching game details:", error)
        setSelectedOfferDetails(item)
      }
      setIsOfferDetailsOpen(true)
    } else {
      setSelectedOfferDetails(item)
      setIsOfferDetailsOpen(true)
    }
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
                <SelectItem value="lend">Leihangebote</SelectItem>
                <SelectItem value="trade">Tauschangebote</SelectItem>
                <SelectItem value="sell">Verkaufsangebote</SelectItem>
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
              <span>Leihangebote</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Tauschangebote</span>
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>Verkaufsangebot</span>
              <Search className="w-4 h-4 text-purple-500" />
              <span>Suchanzeigen</span>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {databaseConnected ? (
            filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Card
                  key={`${item.itemType}-${item.id}`}
                  className="group bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => handleOfferClick(item)}
                >
                  <CardContent className="p-0">
                    {item.itemType === "offer" ? (
                      <>
                        {/* Minimalist image section */}
                        <div className="relative">
                          <img
                            src={item.image || "/images/ludoloop-placeholder.png"}
                            alt={item.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <div className={`w-3 h-3 ${getTypeColor(item.type)} rounded-full`}></div>
                          </div>
                        </div>

                        {/* Minimalist content section */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{item.title}</h3>
                          <p className="text-gray-500 text-xs mb-3">{item.publisher}</p>

                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-600 text-sm">{item.price}</span>
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {item.condition}
                            </Badge>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Minimalist search ad card */
                      <>
                        {/* Image section for search ads */}
                        <div className="relative">
                          <img
                            src="/images/ludoloop-placeholder.png"
                            alt={item.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Search className="w-4 h-4 text-purple-500" />
                          </div>
                        </div>

                        {/* Content section */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{item.title}</h3>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">Keine passenden Spiele gefunden</h3>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Erstell eine Suchanzeige und teile der Community mit, welches Spiel du suchst!
                  </p>
                  {user && (
                    <Button
                      onClick={() => setIsCreateSearchAdOpen(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-xl px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
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
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 max-w-md mx-auto">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">Datenbank nicht verfügbar</h3>
                <p className="text-gray-500 leading-relaxed">
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

      {/* Detailed Offer View Modal */}
      <Dialog open={isOfferDetailsOpen} onOpenChange={setIsOfferDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {selectedOfferDetails && (
            <div className="relative">
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-pink-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={selectedOfferDetails.image || "/images/ludoloop-placeholder.png"}
                    alt={selectedOfferDetails.title}
                    className="h-40 w-auto object-contain rounded-lg shadow-lg mb-4"
                  />
                </div>
                <div className="absolute top-4 right-4">
                  <div className={`w-4 h-4 ${getTypeColor(selectedOfferDetails.type)} rounded-full shadow-sm`}></div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Title and type */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">{selectedOfferDetails.title}</h1>
                  <Badge
                    variant="outline"
                    className={`${getTypeColor(selectedOfferDetails.type)} text-white border-0 px-4 py-1 text-sm`}
                  >
                    {getTypeText(selectedOfferDetails.type)}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Angebot & Preis</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedOfferDetails.price}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Zustand</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedOfferDetails.condition}</p>
                  </div>
                </div>

                {/* Game details section with proper JSX structure */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Spieldetails</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Spieldauer</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.duration || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Spieleranzahl</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.players || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Altersempfehlung</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.age || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Kategorie</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.category || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Typus</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.style || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Sprache</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.language || "Nicht angegeben"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{selectedOfferDetails.publisher || "Nicht angegeben"}</p>
                    </div>
                  </div>
                </div>

                {selectedOfferDetails.description && (
                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedOfferDetails.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Standort</h3>
                    <div className="flex items-start space-x-3">
                      <div>
                        <p className="text-gray-900 font-medium">{selectedOfferDetails.location}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedOfferDetails.distance}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Anbieter</h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm border-2 border-orange-200">
                        <img
                          src={
                            selectedOfferDetails.avatar ||
                            `/placeholder.svg?height=64&width=64&query=avatar+${encodeURIComponent(selectedOfferDetails.owner || selectedOfferDetails.users?.name || "User")}`
                          }
                          alt={`${selectedOfferDetails.owner || selectedOfferDetails.users?.name || "User"} Avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initial avatar if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = "flex"
                          }}
                        />
                        <div
                          className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <span className="text-orange-600 font-bold text-xl">
                            {(selectedOfferDetails.owner || selectedOfferDetails.users?.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-lg">
                          {selectedOfferDetails.owner || selectedOfferDetails.users?.name || "Unbekannter Nutzer"}
                        </p>
                        {selectedOfferDetails.rating && (
                          <div className="flex items-center mt-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 ml-1 font-medium">
                              {selectedOfferDetails.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setIsOfferDetailsOpen(false)
                      if (selectedOfferDetails.itemType === "offer") {
                        handleContactSeller(selectedOfferDetails)
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {selectedOfferDetails.itemType === "offer" ? "Anfragen" : "Antworten"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOfferDetailsOpen(false)}
                    className="px-8 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                  >
                    Schließen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Ad Details Modal */}
      <Dialog open={isSearchAdDetailsOpen} onOpenChange={setIsSearchAdDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSearchAdDetails && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                  {selectedSearchAdDetails.title}
                </DialogTitle>
              </DialogHeader>

              {/* Search ad image */}
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src="/images/ludoloop-placeholder.png"
                    alt={selectedSearchAdDetails.title}
                    className="h-32 w-auto object-contain rounded-lg shadow-sm"
                  />
                  <div className="absolute top-2 right-2">
                    <Search className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Search type */}
              <div className="text-center">
                <Badge
                  className={`${selectedSearchAdDetails.type === "buy" ? "bg-green-500" : "bg-blue-500"} text-white px-4 py-2`}
                >
                  {selectedSearchAdDetails.type === "buy" ? "Kaufgesuch" : "Leihgesuch"}
                </Badge>
              </div>

              {/* Description */}
              {selectedSearchAdDetails.description && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedSearchAdDetails.description}</p>
                </div>
              )}

              {/* User info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Erstellt von</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">
                      {(selectedSearchAdDetails.users?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">
                      {selectedSearchAdDetails.users?.name || "Unbekannter Nutzer"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Erstellt am {new Date(selectedSearchAdDetails.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => {
                    setIsSearchAdDetailsOpen(false)
                    // Here you could implement contact functionality for search ads
                  }}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Antworten
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSearchAdDetailsOpen(false)}
                  className="px-8 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}
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
