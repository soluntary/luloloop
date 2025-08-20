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
  ShoppingCart,
  Database,
  Store,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

import { useMessages } from "@/contexts/messages-context"
import { useUser } from "@/contexts/user-context"
import { UserLink } from "@/components/user-link"

export default function MarketplacePage() {
  const { user } = useUser()
  const { sendMessage } = useMessages()
  const { marketplaceOffers, loading, error, databaseConnected } = useGames()
  const { user: authUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
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
  const [isSearchAdContactDialogOpen, setIsSearchAdContactDialogOpen] = useState(false)
  const [searchAdContactMessage, setSearchAdContactMessage] = useState("")
  const [selectedSearchAd, setSelectedSearchAd] = useState<any>(null)
  const [filters, setFilters] = useState({
    playerCount: "",
    duration: "",
    age: "",
    language: "",
    category: "",
    style: "",
  })

  const [rentalStartDate, setRentalStartDate] = useState("")
  const [rentalEndDate, setRentalEndDate] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState<string>("")

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

      const matchesPlayerCount =
        !filters.playerCount || (item.itemType === "offer" && item.players?.includes(filters.playerCount))
      const matchesDuration =
        !filters.duration || (item.itemType === "offer" && item.duration?.includes(filters.duration))
      const matchesAge = !filters.age || (item.itemType === "offer" && item.age?.includes(filters.age))
      const matchesLanguage =
        !filters.language ||
        (item.itemType === "offer" && item.language?.toLowerCase().includes(filters.language.toLowerCase()))
      const matchesCategory =
        !filters.category ||
        (item.itemType === "offer" && item.category?.toLowerCase().includes(filters.category.toLowerCase()))
      const matchesStyle =
        !filters.style || (item.itemType === "offer" && item.style?.toLowerCase().includes(filters.style.toLowerCase()))

      return (
        matchesSearch &&
        matchesType &&
        matchesPlayerCount &&
        matchesDuration &&
        matchesAge &&
        matchesLanguage &&
        matchesCategory &&
        matchesStyle
      )
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
        case "title-desc":
          return b.title.localeCompare(a.title)
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

    if (offer.type === "lend" && rentalStartDate && rentalEndDate && calculatedPrice) {
      setContactMessage(
        `Hallo! Ich interessiere mich für dein Spiel "${offer.title}" und möchte es vom ${new Date(rentalStartDate).toLocaleDateString("de-DE")} bis ${new Date(rentalEndDate).toLocaleDateString("de-DE")} ausleihen. 

Berechneter Gesamt-Ausleihgebühr: ${calculatedPrice}

Können wir die Details besprechen?`,
      )
    } else {
      setContactMessage(
        `Hallo! Ich interessiere mich für dein Spiel "${offer.title}". Können wir uns darüber unterhalten?`,
      )
    }

    setIsContactDialogOpen(true)
  }

  const handleSendMessage = async () => {
    if (!user || !selectedOffer || !contactMessage.trim()) return

    try {
      await sendMessage({
        to_user_id: selectedOffer.user_id,
        message: contactMessage,
        game_id: selectedOffer.game_id,
        game_title: selectedOffer.title,
        game_image: selectedOffer.image || "/images/ludoloop-placeholder.png",
        offer_type: selectedOffer.type,
      })

      // Show success message
      alert(`Nachricht an ${selectedOffer.owner} erfolgreich gesendet!`)

      setIsContactDialogOpen(false)
      setContactMessage("")
      setSelectedOffer(null)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Fehler beim Senden der Nachricht. Bitte versuche es erneut.")
    }
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

  const handleContactSearchAdCreator = (searchAd: any) => {
    setSelectedSearchAd(searchAd)
    setSearchAdContactMessage(
      `Hallo! Ich habe deine Suchanzeige "${searchAd.title}" gesehen und könnte dir helfen. Lass uns darüber sprechen!`,
    )
    setIsSearchAdContactDialogOpen(true)
  }

  const handleSendSearchAdMessage = async () => {
    if (!user || !selectedSearchAd || !searchAdContactMessage.trim()) return

    try {
      const mapSearchAdTypeToOfferType = (searchType: string) => {
        switch (searchType) {
          case "buy":
            return "buy"
          case "rent":
            return "lend" // Map rent to lend for consistency
          case "trade":
            return "trade"
          default:
            return searchType
        }
      }

      await sendMessage({
        to_user_id: selectedSearchAd.user_id,
        message: searchAdContactMessage,
        game_id: null, // Search ads don't have a specific game_id
        game_title: selectedSearchAd.title,
        game_image: "/images/ludoloop-placeholder.png",
        offer_type: mapSearchAdTypeToOfferType(selectedSearchAd.type), // Use mapped offer type
      })

      // Show success message
      alert(`Nachricht an ${selectedSearchAd.users?.name || "den Ersteller"} erfolgreich gesendet!`)

      setIsSearchAdContactDialogOpen(false)
      setSearchAdContactMessage("")
      setSelectedSearchAd(null)
    } catch (error) {
      console.error("Error sending search ad message:", error)
      alert("Fehler beim Senden der Nachricht. Bitte versuche es erneut.")
    }
  }

  const calculateRentalPrice = (startDate: string, endDate: string, priceString: string) => {
    if (!startDate || !endDate || !priceString) return ""

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    console.log("[v0] Price calculation debug:", {
      startDate,
      endDate,
      diffDays,
      priceString,
    })

    if (diffDays <= 0) return ""

    // Parse the price string to extract tiered pricing
    const priceRanges = priceString.split(", ")
    let dailyRate = 0

    console.log("[v0] Price ranges:", priceRanges)

    for (const range of priceRanges) {
      console.log("[v0] Checking range:", range, "for", diffDays, "days")

      if (range.includes("1 Tag:") && diffDays === 1) {
        dailyRate = Number.parseFloat(range.match(/(\d+(?:\.\d+)?)/)?.[0] || "0")
        console.log("[v0] Using 1 day rate:", dailyRate)
        break
      } else if (range.includes("2-6 Tage:") && diffDays >= 2 && diffDays <= 6) {
        dailyRate = Number.parseFloat(range.match(/(\d+(?:\.\d+)?)/)?.[0] || "0")
        console.log("[v0] Using 2-6 days rate:", dailyRate)
        break
      } else if (range.includes("7-30 Tage:") && diffDays >= 7 && diffDays <= 30) {
        dailyRate = Number.parseFloat(range.match(/(\d+(?:\.\d+)?)/)?.[0] || "0")
        console.log("[v0] Using 7-30 days rate:", dailyRate)
        break
      } else if (range.includes(">30 Tage:") && diffDays > 30) {
        dailyRate = Number.parseFloat(range.match(/(\d+(?:\.\d+)?)/)?.[0] || "0")
        console.log("[v0] Using >30 days rate:", dailyRate)
        break
      }
    }

    const totalPrice = dailyRate * diffDays
    console.log("[v0] Final calculation:", { dailyRate, diffDays, totalPrice })

    return totalPrice > 0 ? `${totalPrice.toFixed(2)} CHF für ${diffDays} Tag${diffDays > 1 ? "e" : ""}` : ""
  }

  useEffect(() => {
    if (selectedOfferDetails?.type === "lend" && rentalStartDate && rentalEndDate) {
      const calculated = calculateRentalPrice(rentalStartDate, rentalEndDate, selectedOfferDetails.price || "")
      setCalculatedPrice(calculated)
    } else {
      setCalculatedPrice("")
    }
  }, [rentalStartDate, rentalEndDate, selectedOfferDetails])

  useEffect(() => {
    if (!isOfferDetailsOpen) {
      setRentalStartDate("")
      setRentalEndDate("")
      setCalculatedPrice("")
    }
  }, [isOfferDetailsOpen])

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

  const getUniqueFilterValues = () => {
    const offers = marketplaceOffers.filter((offer) => offer.itemType !== "search")

    const playerCounts = [...new Set(offers.map((offer) => offer.players).filter(Boolean))]
    const durations = [...new Set(offers.map((offer) => offer.duration).filter(Boolean))]
    const ages = [...new Set(offers.map((offer) => offer.age).filter(Boolean))]
    const languages = [...new Set(offers.map((offer) => offer.language).filter(Boolean))]
    const categories = [...new Set(offers.map((offer) => offer.category).filter(Boolean))]
    const styles = [...new Set(offers.map((offer) => offer.style).filter(Boolean))]

    return {
      playerCounts: playerCounts.sort(),
      durations: durations.sort(),
      ages: ages.sort(),
      languages: languages.sort(),
      categories: categories.sort(),
      styles: styles.sort(),
    }
  }

  const dynamicFilterOptions = getUniqueFilterValues()

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
          {authUser && databaseConnected && (
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
        <div className="bg-white/50 rounded-lg p-4 border border-orange-200 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="col-span-full mb-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Spiele, Verlage oder Anbieter durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400"
                    disabled={!databaseConnected}
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                  disabled={!databaseConnected}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Suchen
                </Button>
              </div>
            </div>

            {/* Sortierung */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Sortieren nach</Label>
              <Select value={sortBy} onValueChange={setSortBy} disabled={!databaseConnected}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">
                    Neueste zuerst
                  </SelectItem>
                  <SelectItem value="oldest" className="text-xs">
                    Älteste zuerst
                  </SelectItem>
                  <SelectItem value="title" className="text-xs">
                    Spielname A-Z
                  </SelectItem>
                  <SelectItem value="title-desc" className="text-xs">
                    Spielname Z-A
                  </SelectItem>
                  <SelectItem value="price-low" className="text-xs">
                    Preis aufsteigend
                  </SelectItem>
                  <SelectItem value="price-high" className="text-xs">
                    Preis absteigend
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Anzeigeart */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Anzeigeart</Label>
              <Select value={selectedType} onValueChange={setSelectedType} disabled={!databaseConnected}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Alle Anzeigen
                  </SelectItem>
                  <SelectItem value="lend" className="text-xs">
                    Leihangebote
                  </SelectItem>
                  <SelectItem value="trade" className="text-xs">
                    Tauschangebote
                  </SelectItem>
                  <SelectItem value="sell" className="text-xs">
                    Verkaufsangebote
                  </SelectItem>
                  <SelectItem value="search" className="text-xs">
                    Suchanzeigen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Spieleranzahl Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Spieleranzahl</Label>
              <Select
                value={filters.playerCount}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, playerCount: value === "all" ? "" : value }))
                }
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.playerCounts.map((count) => (
                    <SelectItem key={count} value={count}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spieldauer Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Spieldauer</Label>
              <Select
                value={filters.duration}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, duration: value === "all" ? "" : value }))}
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.durations.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Altersempfehlung Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Alter</Label>
              <Select
                value={filters.age}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, age: value === "all" ? "" : value }))}
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.ages.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sprache Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Sprache</Label>
              <Select
                value={filters.language}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, language: value === "all" ? "" : value }))}
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.languages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kategorie Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Kategorie</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value === "all" ? "" : value }))}
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Typus Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Typus</Label>
              <Select
                value={filters.style}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, style: value === "all" ? "" : value }))}
                disabled={!databaseConnected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {dynamicFilterOptions.styles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedType("all")
                  setSortBy("newest")
                  setFilters({
                    playerCount: "",
                    duration: "",
                    age: "",
                    language: "",
                    category: "",
                    style: "",
                  })
                }}
                className="h-8 text-xs border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten"
                disabled={!databaseConnected}
              >
                Filter zurücksetzen
              </Button>
            </div>
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
                          <div className="flex justify">
                            {item.type === "buy" && (
                              <Badge className="bg-purple-500 hover:bg-purple-500 text-white text-xs px-2 py-1 border-0 pointer-events-none">
                                Suche zum Kaufen
                              </Badge>
                            )}
                            {item.type === "rent" && (
                              <Badge className="bg-purple-500 hover:bg-purple-500 text-white text-xs px-2 py-1 border-0 pointer-events-none">
                                Suche zum Ausleihen
                              </Badge>
                            )}
                            {item.type === "trade" && (
                              <Badge className="bg-purple-500 hover:bg-purple-500 text-white text-xs px-2 py-1 border-0 pointer-events-none">
                                Suche zum Tauschen
                              </Badge>
                            )}
                          </div>
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
                  {authUser && (
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
        {!authUser && (
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
        )}
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

              {selectedOffer?.type === "lend" && rentalStartDate && rentalEndDate && (
                <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm text-teal-700 font-medium">
                    Gewünschter Zeitraum: {new Date(rentalStartDate).toLocaleDateString("de-DE")} -{" "}
                    {new Date(rentalEndDate).toLocaleDateString("de-DE")}
                  </p>
                  {calculatedPrice && <p className="text-sm text-teal-800 font-bold mt-1">{calculatedPrice}</p>}
                </div>
              )}
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
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Angebot & Preis</p>
                    <p className="font-semibold text-orange-600 text-2xl">
                      {selectedOfferDetails.price || "Preis auf Anfrage"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Zustand</p>
                    <p className="font-semibold leading-7 text-sm">
                      {selectedOfferDetails.condition || "Nicht angegeben"}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4 text-secondary-foreground">Spieldetails</h2>
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
                      <p className="text-xs text-gray-500 mb-1">Verlag</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOfferDetails.publisher || "Nicht angegeben"}
                      </p>
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
                        <UserLink
                          userId={selectedOfferDetails.user_id}
                          className="text-gray-900 font-semibold text-lg block"
                        >
                          {selectedOfferDetails.owner || selectedOfferDetails.users?.name || "Unbekannter Nutzer"}
                        </UserLink>
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

                {selectedOfferDetails.type === "lend" && (
                  <div className="bg-gradient-to-br from-orange-50 to-cyan-50 rounded-xl p-6 border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Ausleihzeitraum wählen
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-orange-700 mb-2 block">Von</label>
                        <input
                          type="date"
                          value={rentalStartDate}
                          onChange={(e) => setRentalStartDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700 mb-2 block">Bis</label>
                        <input
                          type="date"
                          value={rentalEndDate}
                          onChange={(e) => setRentalEndDate(e.target.value)}
                          min={rentalStartDate || new Date().toISOString().split("T")[0]}
                          className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {calculatedPrice && (
                      <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-700 font-medium">Gesamt-Ausleihgebühr:</span>
                          <span className="text-xl font-bold text-orange-800">{calculatedPrice}</span>
                        </div>
                      </div>
                    )}

                    {rentalStartDate && rentalEndDate && !calculatedPrice && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <p className="text-sm text-orange-700">
                            Für den gewählten Zeitraum ist keine automatische Preisberechnung möglich. Der Anbieter wird
                            Ihnen ein individuelles Angebot unterbreiten.
                          </p>
                        </div>
                      </div>
                    )}

                    {(!rentalStartDate || !rentalEndDate) && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <p className="text-sm text-orange-700">
                            Bitte wählen Sie einen Ausleihzeitraum, um die Gesamt-Ausleihgebühr zu berechnen.
                          </p>
                        </div>
                      </div>
                    )}

                    {rentalStartDate && rentalEndDate && (
                      <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                        <h4 className="text-sm font-semibold text-orange-800 mb-2">Ausleih-Zusammenfassung:</h4>
                        <div className="space-y-1 text-sm text-orange-700">
                          <div className="flex justify-between">
                            <span>Zeitraum:</span>
                            <span className="font-medium">
                              {new Date(rentalStartDate).toLocaleDateString("de-DE")} -{" "}
                              {new Date(rentalEndDate).toLocaleDateString("de-DE")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dauer:</span>
                            <span className="font-medium">
                              {Math.ceil(
                                (new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}{" "}
                              Tag
                              {Math.ceil(
                                (new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              ) > 1
                                ? "e"
                                : ""}
                            </span>
                          </div>
                          {calculatedPrice && (
                            <div className="flex justify-between border-t border-orange-200 pt-2 mt-2">
                              <span className="font-semibold">Gesamt-Ausleihgebühr:</span>
                              <span className="font-bold">{calculatedPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setIsOfferDetailsOpen(false)
                      if (selectedOfferDetails.itemType === "offer") {
                        handleContactSeller(selectedOfferDetails)
                      }
                    }}
                    disabled={selectedOfferDetails.type === "lend" && (!rentalStartDate || !rentalEndDate)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {selectedOfferDetails.type === "lend"
                      ? rentalStartDate && rentalEndDate
                        ? "Ausleihe anfragen"
                        : "Zeitraum wählen"
                      : selectedOfferDetails.itemType === "offer"
                        ? "Anfragen"
                        : "Antworten"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOfferDetailsOpen(false)}
                    className="px-8 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                  >
                    Schliessen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Ad Details Modal */}
      <Dialog open={isSearchAdDetailsOpen} onOpenChange={setIsSearchAdDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedSearchAdDetails && (
            <div className="relative">
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/images/ludoloop-placeholder.png"
                    alt={selectedSearchAdDetails.title}
                    className="h-40 w-auto object-contain rounded-lg shadow-lg mb-4"
                  />
                </div>
                <div className="absolute top-4 right-4">
                  <Search className="w-6 h-6 text-purple-500" />
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Title and type */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">{selectedSearchAdDetails.title}</h1>
                  <Badge
                    className={`${
                      selectedSearchAdDetails.type === "buy"
                        ? "bg-purple-500 hover:bg-purple-500"
                        : selectedSearchAdDetails.type === "rent"
                          ? "bg-purple-500 hover:bg-purple-500"
                          : "bg-purple-500 hover:bg-purple-500"
                    } text-white px-4 py-2 border-0 pointer-events-none`}
                  >
                    {selectedSearchAdDetails.type === "buy"
                      ? "Suche zum Kaufen"
                      : selectedSearchAdDetails.type === "rent"
                        ? "Suche zum Ausleihen"
                        : "Suche zum Tauschen"}
                  </Badge>
                </div>

                {/* Description */}
                {selectedSearchAdDetails.description && (
                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedSearchAdDetails.description}</p>
                  </div>
                )}

                {/* User info */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Erstellt von</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">
                        {(selectedSearchAdDetails.users?.name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <UserLink userId={selectedSearchAdDetails.user_id} className="text-gray-900 font-semibold block">
                        {selectedSearchAdDetails.users?.name || "Unbekannter Nutzer"}
                      </UserLink>
                      <p className="text-sm text-gray-500">
                        Erstellt am {new Date(selectedSearchAdDetails.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setIsSearchAdDetailsOpen(false)
                      handleContactSearchAdCreator(selectedSearchAdDetails)
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Antworten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSearchAdDetailsOpen(false)}
                    className="px-8 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                  >
                    Schliessen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSearchAdContactDialogOpen} onOpenChange={setIsSearchAdContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">
              Nachricht an {selectedSearchAd?.users?.name || "Ersteller"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <img
                src="/images/ludoloop-placeholder.png"
                alt={selectedSearchAd?.title}
                className="w-24 h-32 mx-auto rounded-lg shadow-lg mb-4"
              />
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">{selectedSearchAd?.title}</h3>
              <Badge className="bg-purple-500 hover:bg-purple-500 text-white px-3 py-1 border-0 pointer-events-none">
                {selectedSearchAd?.type === "buy"
                  ? "Suche zum Kaufen"
                  : selectedSearchAd?.type === "rent"
                    ? "Suche zum Ausleihen"
                    : "Suche zum Tauschen"}
              </Badge>
            </div>

            <div>
              <Label className="font-body">Deine Nachricht:</Label>
              <Textarea
                value={searchAdContactMessage}
                onChange={(e) => setSearchAdContactMessage(e.target.value)}
                placeholder="Schreibe eine freundliche Nachricht..."
                className="font-body"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchAdContactDialogOpen(false)}
                className="flex-1 font-handwritten"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSendSearchAdMessage}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-handwritten"
                disabled={!searchAdContactMessage.trim()}
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
