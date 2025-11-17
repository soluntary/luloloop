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
import { useSearchParams } from "next/navigation"
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
  CalendarDaysIcon,
  MapPin,
  Filter,
  ChevronDown,
  Truck,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

import { useMessages } from "@/contexts/messages-context"
import { UserLink } from "@/components/user-link"

import { SimpleLocationSearch } from "@/components/simple-location-search"
import { LocationPermissionBanner } from "@/components/location-permission-banner"
import { DistanceBadge } from "@/components/distance-badge"
import { useLocationSearch } from "@/contexts/location-search-context"
import { WideSkyscraperAd } from "@/components/advertising/ad-placements"

import { ShareButton } from "@/components/share-button"
import { LocationMap } from "@/components/location-map"
import { toast } from "sonner"
import { ExpandableDescription } from "@/components/expandable-description"
import { getPostalCodeAndCity } from "@/lib/utils"

export default function MarketplacePage() {
  const { sendMessage } = useMessages()
  const { marketplaceOffers, loading, error, databaseConnected, games } = useGames()
  const { user, user: authUser } = useAuth()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedOffer, setSelectedOffer] = useState<(typeof marketplaceOffers)[0] | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<"pickup" | "shipping" | "">("")
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false)
  const [preSelectedGameId, setPreSelectedGameId] = useState<string | null>(null)
  const [preSelectedOfferType, setPreSelectedOfferType] = useState<string | null>(null)
  const [preSelectedGame, setPreSelectedGame] = useState<any | null>(null)
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
    condition: "",
  })

  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)

  const [rentalStartDate, setRentalStartDate] = useState("")
  const [rentalEndDate, setRentalEndDate] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState<string>("")

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Initialize useSearchParams for handling URL query parameters
  // const searchParams = useSearchParams() // This was duplicated, removed the second declaration

  const { searchByAddress, searchMarketplaceOffersNearby } = useLocationSearch()

  useEffect(() => {
    const createOffer = searchParams.get("createOffer")
    const gameId = searchParams.get("gameId")
    const offerType = searchParams.get("offerType")

    if (createOffer === "true" && gameId && offerType) {
      console.log("[v0] Auto-opening offer form with gameId:", gameId, "offerType:", offerType)
      setPreSelectedGameId(gameId)
      setPreSelectedOfferType(offerType)

      const foundGame = games.find((g) => g.id === gameId)
      if (foundGame) {
        console.log("[v0] Found game object:", foundGame)
        setPreSelectedGame(foundGame)
      } else {
        console.log("[v0] Game not found in games array, will use gameId only")
        setPreSelectedGame(null)
      }

      setIsCreateOfferOpen(true)
    }
  }, [searchParams, games])

  const handleLocationSearch = async (address: string, radius: number) => {
    console.log("[v0] Location search initiated for:", address, "radius:", radius)
    try {
      const results = await searchByAddress(address, radius)
      console.log("[v0] Location search results received:", results)

      let searchResults: any[] = []
      if (Array.isArray(results)) {
        searchResults = results
      } else if (results && typeof results === "object") {
        // If results is a single object, wrap it in an array
        searchResults = [results]
      } else {
        // If results is a string or other type, create empty array
        searchResults = []
      }

      setLocationSearchResults(searchResults)
      setShowLocationResults(true)
    } catch (error) {
      console.error("[v0] Location search error:", error)
      setLocationSearchResults([])
      setShowLocationResults(false)
    }
  }

  const handleNearbySearch = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation wird von deinem Browser nicht unterstützt")
      return
    }

    const confirmed = confirm("Möchtest du nach Angeboten in deiner Nähe suchen?")
    if (!confirmed) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("[v0] User location:", { latitude, longitude })

        try {
          const results = await searchMarketplaceOffersNearby(latitude, longitude, 50) // 50km radius
          console.log("[v0] Nearby offers found:", results)

          setLocationSearchResults(results || [])
          setShowLocationResults(true)
          alert(`${results?.length || 0} Angebote in deiner Nähe gefunden`)
        } catch (error) {
          console.error("[v0] Error searching nearby offers:", error)
          alert("Fehler bei der Standortsuche")
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        alert("Standort konnte nicht ermittelt werden")
      },
    )
  }

  // FilteredItems are now processed based on whether location results are shown or not.
  // If location results are shown, only those are considered. Otherwise, all offers and search ads are considered.
  const allItems = showLocationResults
    ? (Array.isArray(locationSearchResults) ? locationSearchResults : []).map((item) => ({
        ...item,
        itemType: "offer",
      }))
    : [
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
      const matchesCondition =
        !filters.condition ||
        (item.itemType === "offer" && item.condition?.toLowerCase().includes(filters.condition.toLowerCase()))

      return (
        matchesSearch &&
        matchesType &&
        matchesPlayerCount &&
        matchesDuration &&
        matchesAge &&
        matchesLanguage &&
        matchesCategory &&
        matchesStyle &&
        matchesCondition
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance
          }
          return 0
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
        return "Mieten"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Kaufen"
      case "buy":
        return "Kaufen"
      case "borrow":
        return "Mieten"
      default:
        return type
    }
  }

  const handleContactSeller = (offer: (typeof marketplaceOffers)[0]) => {
    if (user && offer.user_id === user.id) {
      toast.error("Du kannst keine Nachricht an dich selbst senden")
      return
    }

    setSelectedOffer(offer)
    setSelectedDeliveryOption("")

    let baseMessage = ""
    if (offer.type === "lend" && rentalStartDate && rentalEndDate && calculatedPrice) {
      baseMessage = `Hallo! Ich interessiere mich für dein Spiel "${offer.title}" und möchte es vom ${new Date(rentalStartDate).toLocaleDateString("de-DE")} bis ${new Date(rentalEndDate).toLocaleDateString("de-DE")} mieten.

Berechneter Gesamt-Mietgebühr: ${calculatedPrice}`
    } else {
      baseMessage = `Hallo! Ich interessiere mich für dein Spiel "${offer.title}".`
    }

    const hasBothOptions = offer.pickup_available && offer.shipping_available
    if (!hasBothOptions) {
      if (offer.pickup_available) {
        baseMessage += `\n\nIch würde das Spiel gerne abholen.`
      } else if (offer.shipping_available) {
        baseMessage += `\n\nIch würde das Spiel gerne per Versand erhalten.`
      }
      baseMessage += `\n\nKönnen wir die Details besprechen?`
    } else {
      baseMessage += `\n\nKönnen wir die Details besprechen?`
    }

    setContactMessage(baseMessage)
    setIsContactDialogOpen(true)
  }

  const updateMessageWithDeliveryOption = (deliveryOption: "pickup" | "shipping") => {
    if (!selectedOffer) return

    let baseMessage = ""
    if (selectedOffer.type === "lend" && rentalStartDate && rentalEndDate && calculatedPrice) {
      baseMessage = `Hallo! Ich interessiere mich für dein Spiel "${selectedOffer.title}" und möchte es vom ${new Date(rentalStartDate).toLocaleDateString("de-DE")} bis ${new Date(rentalEndDate).toLocaleDateString("de-DE")} mieten.

Berechneter Gesamt-Mietgebühr: ${calculatedPrice}`
    } else {
      baseMessage = `Hallo! Ich interessiere mich für dein Spiel "${selectedOffer.title}".`
    }

    if (deliveryOption === "pickup") {
      baseMessage += `\n\nIch würde das Spiel gerne abholen.`
    } else if (deliveryOption === "shipping") {
      baseMessage += `\n\nIch würde das Spiel gerne per Versand erhalten.`
    }

    baseMessage += `\n\nKönnen wir die Details besprechen?`
    setContactMessage(baseMessage)
  }

  const handleSendMessage = async () => {
    if (!user || !selectedOffer || !contactMessage.trim()) return // Changed authUser to user

    const hasBothOptions = selectedOffer.pickup_available && selectedOffer.shipping_available
    if (hasBothOptions && !selectedDeliveryOption) {
      alert("Bitte wähle eine Zustellungsoption aus.")
      return
    }

    try {
      const deliveryPreference = hasBothOptions
        ? selectedDeliveryOption
        : selectedOffer.pickup_available
          ? "pickup"
          : selectedOffer.shipping_available
            ? "shipping"
            : undefined

      await sendMessage({
        to_user_id: selectedOffer.user_id,
        message: contactMessage,
        game_id: selectedOffer.game_id,
        game_image: selectedOffer.image || "/images/ludoloop-placeholder.png",
        offer_type: selectedOffer.type,
        delivery_preference: deliveryPreference,
      })

      toast.success(`Nachricht erfolgreich gesendet`)

      setIsContactDialogOpen(false)
      setContactMessage("")
      setSelectedOffer(null)
      setSelectedDeliveryOption("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Fehler beim Senden der Nachricht. Bitte versuche es erneut.")
    }
  }

  const handleOfferClick = async (item: any) => {
    console.log("[v0] Offer clicked, game_id:", item.game_id)
    console.log("[v0] Current item data:", JSON.stringify(item).substring(0, 200) + "...")

    if (item.itemType === "search") {
      setSelectedSearchAdDetails(item)
      setIsSearchAdDetailsOpen(true)
    } else if (item.itemType === "offer" && item.game_id) {
      try {
        const supabase = createClient()
        const { data: gameData, error } = await supabase
          .from("games")
          .select("id, duration, players, category, style, age, language, type") // Added id to select
          .eq("id", item.game_id)
          .single()

        console.log("[v0] Game data fetched:", gameData)
        if (error) {
          console.log("[v0] Fetch error:", error.message)
        }

        if (!error && gameData) {
          console.log("[v0] Merging game data with offer data")
          // We expect `users` to be joined in the `marketplaceOffers` data from the context provider
          setSelectedOfferDetails({
            ...item,
            // Merge game details, prioritizing existing offer details if they exist and are valid
            duration: gameData.duration || item.duration,
            players: gameData.players || item.players,
            category: gameData.category || item.category,
            style: gameData.style || item.style,
            age: gameData.age || item.age,
            language: gameData.language || item.language,
            game_types: gameData.style || item.style, // Map style to game_types for Typus display
            // Ensure game_id is correctly set if it was missing in the original item
            game_id: gameData.id || item.game_id,
          })
        } else {
          console.log("[v0] No game data found or error occurred, using item data only")
          setSelectedOfferDetails(item)
        }
      } catch (error) {
        console.error("[v0] Error fetching game details:", error)
        setSelectedOfferDetails(item)
      }
      setIsOfferDetailsOpen(true)
    } else {
      // Fallback for items that are not offers or search ads, or have no game_id
      setSelectedOfferDetails(item)
      setIsOfferDetailsOpen(true)
    }
  }

  const handleContactSearchAdCreator = (searchAd: any) => {
    if (user && searchAd.user_id === user.id) {
      toast.error("Du kannst keine Nachricht an dich selbst senden")
      return
    }

    setSelectedSearchAd(searchAd)
    setSearchAdContactMessage(
      `Hallo! Ich habe deine Suchanzeige "${searchAd.title}" gesehen und könnte dir helfen. Lass uns darüber sprechen!`,
    )
    setIsSearchAdContactDialogOpen(true)
  }

  const handleSendSearchAdMessage = async () => {
    if (!user || !selectedSearchAd || !searchAdContactMessage.trim()) return // Changed authUser to user

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

      toast.success("Nachricht erfolgreich gesendet")

      setIsSearchAdContactDialogOpen(false)
      setSearchAdContactMessage("")
      setSelectedSearchAd(null)
    } catch (error) {
      console.error("Error sending search ad message:", error)
      toast.error("Fehler beim Senden der Nachricht. Bitte versuche es erneut.")
    }
  }

  const calculateRentalPrice = (startDate: string, endDate: string, priceString: string) => {
    if (!startDate || !endDate) return ""

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

    if (!priceString || priceString.trim() === "") {
      console.log("[v0] Price string is empty, cannot calculate")
      return ""
    }

    // Parse the price string to extract tiered pricing
    const priceRanges = priceString.split(", ")
    let dailyRate = 0

    console.log("[v0] Price ranges:", priceRanges)

    for (const range of priceRanges) {
      console.log("[v0] Checking range:", range, "for", diffDays, "days")

      const priceMatch = range.match(/(\d+(?:[.,]\d+)?)\s*CHF/i)
      const extractedPrice = priceMatch ? Number.parseFloat(priceMatch[1].replace(",", ".")) : 0

      if (range.includes("1 Tag:") && diffDays === 1) {
        dailyRate = extractedPrice
        console.log("[v0] Using 1 day rate:", dailyRate)
        break
      } else if (range.includes("2-6 Tage:") && diffDays >= 2 && diffDays <= 6) {
        dailyRate = extractedPrice
        console.log("[v0] Using 2-6 days rate:", dailyRate)
        break
      } else if (range.includes("7-30 Tage:") && diffDays >= 7 && diffDays <= 30) {
        dailyRate = extractedPrice
        console.log("[v0] Using 7-30 days rate:", dailyRate)
        break
      } else if (range.includes(">30 Tage:") && diffDays > 30) {
        dailyRate = extractedPrice
        console.log("[v0] Using >30 days rate:", dailyRate)
        break
      }
    }

    if (dailyRate === 0 && priceRanges.length > 0) {
      const firstRateMatch = priceRanges[0].match(/(\d+(?:[.,]\d+)?)\s*CHF/i)
      if (firstRateMatch) {
        dailyRate = Number.parseFloat(firstRateMatch[1].replace(",", "."))
        console.log("[v0] Using first available rate as fallback:", dailyRate)
      }
    }

    const totalPrice = dailyRate * diffDays
    console.log("[v0] Final calculation:", { dailyRate, diffDays, totalPrice })

    return totalPrice > 0 ? `${totalPrice.toFixed(2)} CHF für ${diffDays} Tag${diffDays > 1 ? "e" : ""}` : ""
  }

  const formatDailyRates = (priceString: string) => {
    if (!priceString || priceString.trim() === "") return null

    if (priceString.includes("Tag:") || priceString.includes("Tage:") || priceString === "Offen für Vorschläge") {
      const rates = priceString.split(", ")
      return (
        <div className="w-full space-y-1 my-3.5">
          {rates.map((rate, index) => {
            // Parse the rate to separate period and price
            const parts = rate.split(":")
            if (parts.length === 2) {
              const period = parts[0].trim()
              const price = parts[1].trim().replace("CHF", " CHF")
              return (
                <div key={index} className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-gray-700">{period}</span>
                  <span className="text-sm font-bold px-20 mx-0 border-0 mr-0 border-l-0 border-r-0 text-left pr-0 ml-20 text-foreground">
                    {price}
                  </span>
                </div>
              )
            }
            // Fallback for unexpected format or "Offen für Vorschläge"
            return (
              <div key={index} className="text-sm w-full">
                {rate.replace("CHF", " CHF")}
              </div>
            )
          })}
        </div>
      )
    }

    // For non-lending offers, return the price as is
    return <span className="text-foreground text-xs font-bold my-[px]x">{priceString}</span>
  }

  useEffect(() => {
    // Initial load of marketplace offers and search ads
    // This effect now only handles the search parameters and doesn't fetch data itself.
    // Data fetching is now handled by the useGames() context and the loadSearchAds() function.
    const offerId = searchParams.get("offer")
    const type = searchParams.get("type")
    const gameId = searchParams.get("gameId")

    if (offerId) {
      setPreSelectedGameId(gameId || null) // Store gameId if present
      setPreSelectedOfferType(type || null) // Store type if present
      const offer = marketplaceOffers.find((o) => o.id === offerId)
      if (offer) {
        handleOfferClick(offer)
      }
    }

    const searchAdId = searchParams.get("searchad")
    if (searchAdId) {
      const ad = searchAds.find((a) => a.id === searchAdId)
      if (ad) {
        handleOfferClick(ad)
      }
    }
  }, [searchParams, marketplaceOffers, searchAds]) // Depend on searchParams, marketplaceOffers, and searchAds

  useEffect(() => {
    if (selectedOfferDetails?.type === "lend" && rentalStartDate && rentalEndDate) {
      const calculated = calculateRentalPrice(rentalStartDate, rentalEndDate, selectedOfferDetails.price || "")
      console.log("[v0] Calculated price updated:", calculated)
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

  // Moved loadSearchAds here to comply with hook rules
  const loadSearchAds = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("search_ads").select("*")
      if (error) {
        console.error("Error fetching search ads:", error)
      } else {
        setSearchAds(data || [])
      }
    } catch (error) {
      console.error("Error fetching search ads:", error)
    }
  }

  useEffect(() => {
    loadSearchAds()
  }, [])

  if (loading) {
    console.log("[v0] Marketplace showing loading state")
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

  if (error && !databaseConnected) {
    console.log("[v0] Database connection error, showing fallback content")
  }

  const getUniqueFilterValues = (offersToFilter: typeof marketplaceOffers) => {
    const offers = offersToFilter.filter((offer) => offer.itemType !== "search")

    console.log("[v0] getUniqueFilterValues - total offers:", offersToFilter.length)
    console.log("[v0] getUniqueFilterValues - filtered offers (excluding search):", offers.length)
    console.log("[v0] getUniqueFilterValues - sample offer:", offers[0])

    const playerCounts = [...new Set(offers.map((offer) => offer.players).filter(Boolean))]
    const durations = [...new Set(offers.map((offer) => offer.duration).filter(Boolean))]
    const ages = [...new Set(offers.map((offer) => offer.age).filter(Boolean))]
    const languages = [...new Set(offers.map((offer) => offer.language).filter(Boolean))]
    const categories = [...new Set(offers.map((offer) => offer.category).filter(Boolean))]
    const styles = [...new Set(offers.map((offer) => offer.style).filter(Boolean))]
    const conditions = [...new Set(offers.map((offer) => offer.condition).filter(Boolean))]

    console.log("[v0] Extracted filter values:", {
      playerCounts,
      durations,
      ages,
      languages,
      categories,
      styles,
      conditions,
    })

    return {
      playerCounts: playerCounts.sort(),
      durations: durations.sort(),
      ages: ages.sort(),
      languages: languages.sort(),
      categories: categories.sort(),
      styles: styles.sort(),
      conditions: conditions.sort(),
    }
  }

  const baseFilteredOffers = marketplaceOffers.filter((offer) => {
    const matchesSearch =
      searchTerm === "" ||
      offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "all" || offer.type === selectedType

    return matchesSearch && matchesType
  })

  console.log("[v0] baseFilteredOffers count:", baseFilteredOffers.length)
  console.log("[v0] searchTerm:", searchTerm, "selectedType:", selectedType)

  const dynamicFilterOptions = getUniqueFilterValues(baseFilteredOffers)

  console.log("[v0] dynamicFilterOptions:", dynamicFilterOptions)

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
          {authUser && databaseConnected && (
            <div className="mt-6 flex gap-4 justify-center">
              <Button
                onClick={() => setIsCreateOfferOpen(true)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-handwritten text-lg px-8 py-3 transform hover:scale-105 hover:rotate-1 transition-all"
              >
                <Store className="w-5 h-5 mr-2" />
                Angebot erstellen
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

        {/* Location Permission Banner */}
        <LocationPermissionBanner />

        {/* Search and Filter Bar */}
        <div className="bg-white/50 rounded-lg p-4 border border-gray-200 mb-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Spiele, Verlage oder Anbieter durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/80 border-gray-200 focus:border-orange-500 text-base"
                />
              </div>
            </div>

            {/* Location Search */}
            <div className="space-y-3">
              <SimpleLocationSearch onLocationSearch={handleLocationSearch} onNearbySearch={handleNearbySearch} />
            </div>

            {showLocationResults && (
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-orange-800 font-medium">
                    Zeige Ergebnisse in der Nähe ({locationSearchResults.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="text-orange-600 border-orange-300 hover:bg-orange-100"
                >
                  Alle Angebote zeigen
                </Button>
              </div>
            )}

            {/* Basic Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">Sortieren nach</Label>
                  <Select value={sortBy} onValueChange={setSortBy} disabled={!databaseConnected}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {showLocationResults && <SelectItem value="distance">Nach Entfernung</SelectItem>}
                      <SelectItem value="newest">Neueste zuerst</SelectItem>
                      <SelectItem value="oldest">Älteste zuerst</SelectItem>
                      <SelectItem value="title">Spielname A-Z</SelectItem>
                      <SelectItem value="price-low">Preis aufsteigend</SelectItem>
                      <SelectItem value="price-high">Preis absteigend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">Anzeigeart</Label>
                  <Select value={selectedType} onValueChange={setSelectedType} disabled={!databaseConnected}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="lend">Mietangebote</SelectItem>
                      <SelectItem value="trade">Tauschangebote</SelectItem>
                      <SelectItem value="sell">Verkaufsangebote</SelectItem>
                      <SelectItem value="search">Suchanzeigen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 flex items-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="h-12 flex-1 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-medium"
                    disabled={!databaseConnected}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Erweiterte Filter
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                    />
                  </Button>
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
                        condition: "",
                      })
                      setShowLocationResults(false)
                      setLocationSearchResults([])
                    }}
                    className="h-12 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                    disabled={!databaseConnected}
                  >
                    Filter zurücksetzen
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-700 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Erweiterte Filter
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Spieleranzahl</Label>
                      <Select
                        value={filters.playerCount}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, playerCount: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Spieldauer</Label>
                      <Select
                        value={filters.duration}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, duration: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Altersempfehlung</Label>
                      <Select
                        value={filters.age}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, age: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Sprache</Label>
                      <Select
                        value={filters.language}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, language: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Kategorie</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, category: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Typus</Label>
                      <Select
                        value={filters.style}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, style: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
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

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Zustand</Label>
                      <Select
                        value={filters.condition}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, condition: value === "all" ? "" : value }))
                        }
                        disabled={!databaseConnected}
                      >
                        <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-orange-500">
                          <SelectValue placeholder="Alle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle</SelectItem>
                          {dynamicFilterOptions.conditions.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-thin text-xs">
            <span className="text-gray-600 font-normal">{filteredItems.length}</span>{" "}
            {filteredItems.length === 1 ? "Eintrag" : "Anzeigen"}
            {!databaseConnected && <span className="text-red-500 ml-2">(Offline-Modus)</span>}
          </p>
        </div>

        {/* Content Grid with Sidebar */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <Card
                    key={`${item.itemType}-${item.id}`}
                    className="group bg-white rounded-xl border border-gray-200/60 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => handleOfferClick(item)}
                  >
                    <CardContent className="p-0">
                      {item.itemType === "offer" ? (
                        <>
                          {/* Image section */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                            <img
                              src={item.image || "/images/ludoloop-placeholder.png"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 z-20">
                              <div
                                className={`${getTypeColor(item.type)} text-white text-[10px] px-2 py-1 rounded-full shadow-sm font-medium bg-opacity-90`}
                              >
                                {item.type === "lend" && "Mietangebot"}
                                {item.type === "trade" && "Tauschangebot"}
                                {item.type === "sell" && "Verkaufsangebot"}
                              </div>
                            </div>
                            {/* Distance badge overlay */}
                            {item.distance !== undefined && (
                              <div className="absolute bottom-3 left-3 z-10">
                                <DistanceBadge distance={item.distance} />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-handwritten font-bold text-gray-900 mb-1.5 truncate group-hover:text-gray-700 transition-colors text-xs">
                              {item.title}
                            </h3>

                            {/* Type label */}

                            {/* Delivery options */}
                            {(item.pickup_available || item.shipping_available) && (
                              <div className="flex items-center gap-2 mb-3">
                                {item.pickup_available && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Abholung möglich</span>
                                  </div>
                                )}
                                {item.pickup_available && item.shipping_available && (
                                  <span className="text-gray-300">•</span>
                                )}
                                {item.shipping_available && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Versand möglich</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Price */}
                            <div className="pt-3 border-t border-gray-100">
                              <p className="font-semibold text-gray-900 text-xs">
                                {item.type === "trade" && item.price
                                  ? item.price === "Offen für Vorschläge"
                                    ? "Offen für Vorschläge"
                                    : `Tausch gegen ${item.price}`
                                  : formatDailyRates(item.price)}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Search ad card */
                        <>
                          {/* Image section for search ads (placeholder) */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Search className="w-16 h-16 text-orange-300" />
                            </div>
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-orange-500 bg-opacity-90 text-white text-[10px] px-2 py-1 rounded-full shadow-sm font-medium">
                                Suchanzeige
                              </div>
                            </div>
                            {/* Distance badge overlay */}
                            {item.distance !== undefined && (
                              <div className="absolute bottom-3 left-3 z-10">
                                <DistanceBadge distance={item.distance} />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-handwritten font-bold text-gray-900 mb-1.5 truncate group-hover:text-gray-700 transition-colors text-xs">
                              {item.title}
                            </h3>

                            <p className="text-xs text-gray-500 mb-2">
                              {item.type === "buy" && "Gesucht zum Kaufen"}
                              {item.type === "rent" && "Gesucht zum Mieten"}
                              {item.type === "trade" && "Gesucht zum Tauschen"}
                            </p>

                            <div className="pt-3 border-t border-gray-100">
                              {item.type === "rent" && item.rental_duration && (
                                <p className="text-xs flex items-center gap-1.5 font-semibold text-black">
                                  Gewünschte Mietdauer: {item.rental_duration}
                                </p>
                              )}
                              {item.type === "buy" && item.max_price && (
                                <p className="text-xs flex items-center gap-1.5 font-semibold text-black">
                                  Vorbehaltspreis: bis {item.max_price} CHF
                                </p>
                              )}
                              {item.type === "trade" && item.trade_game_title && (
                                <p className="text-xs flex items-center gap-1.5 font-semibold text-black">
                                  Tauschspiel: {item.trade_game_title}
                                </p>
                              )}
                              {!item.rental_duration && !item.max_price && !item.trade_game_title && (
                                <p className="text-xs text-gray-400">Details auf Anfrage</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-4 font-handwritten">
                    {!databaseConnected ? "Marktplatz temporär nicht verfügbar" : "Keine Angebote gefunden"}
                  </h3>
                  <p className="text-gray-500 font-body">
                    {!databaseConnected
                      ? "Bitte versuche es später erneut oder melde dich an für den vollen Zugriff."
                      : "Versuche andere Suchbegriffe oder erstelle selbst ein Angebot!"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-8">
              <WideSkyscraperAd />
            </div>
          </div>
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
                className="bg-white text-orange-600 hover:bg-gray-100 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all shadow-lg rounded-lg"
                onClick={() => {
                  window.location.href = "/register"
                }}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Registrieren
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-handwritten text-lg px-8 py-3 transform hover:scale-105 transition-all bg-white/10 backdrop-blur-sm rounded-lg"
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
              <h3 className="font-handwritten text-gray-800 mb-2 text-base">{selectedOffer?.title}</h3>

              {selectedOffer?.type === "lend" && rentalStartDate && rentalEndDate && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium">
                    Gewünschter Zeitraum: {new Date(rentalStartDate).toLocaleDateString("de-DE")} -{" "}
                    {new Date(rentalEndDate).toLocaleDateString("de-DE")}
                  </p>
                  {calculatedPrice && <p className="text-xs text-orange-800 font-bold mt-1">{calculatedPrice}</p>}
                </div>
              )}
            </div>

            {selectedOffer?.pickup_available && selectedOffer?.shipping_available && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="text-xs font-semibold text-indigo-800 mb-3">Welche Option bevorzugst du?</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="pickup-option"
                      name="delivery-option"
                      value="pickup"
                      checked={selectedDeliveryOption === "pickup"}
                      onChange={(e) => {
                        setSelectedDeliveryOption("pickup")
                        updateMessageWithDeliveryOption("pickup")
                      }}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 focus:ring-2"
                    />
                    <Label htmlFor="pickup-option" className="text-xs font-medium text-indigo-800 cursor-pointer">
                      Abholung
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="shipping-option"
                      name="delivery-option"
                      value="shipping"
                      checked={selectedDeliveryOption === "shipping"}
                      onChange={(e) => {
                        setSelectedDeliveryOption("shipping")
                        updateMessageWithDeliveryOption("shipping")
                      }}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 focus:ring-2"
                    />
                    <Label htmlFor="shipping-option" className="text-xs font-medium text-indigo-800 cursor-pointer">
                      Postversand (Kosten zu deinen Lasten)
                    </Label>
                  </div>
                </div>

                {selectedDeliveryOption === "pickup" && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700">Weitere Details mit dem/der Spielanbieter/-in besprechen.</p>
                  </div>
                )}
              </div>
            )}

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
                onClick={() => {
                  setIsContactDialogOpen(false)
                  setSelectedDeliveryOption("")
                }}
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
      {/* Redesigned the offer details dialog with a cleaner, more cohesive design */}
      <Dialog open={isOfferDetailsOpen} onOpenChange={setIsOfferDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-base text-gray-800 mb-2">
              {selectedOfferDetails?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedOfferDetails && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="relative">
                <div className="relative h-56 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={selectedOfferDetails.image || "/images/ludoloop-placeholder.png"}
                      alt={selectedOfferDetails.title}
                      className="h-44 w-auto object-contain rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="absolute top-6 right-6">
                    <Badge
                      className={`${getTypeColor(selectedOfferDetails.type)} text-white border-0 px-4 py-2 text-xs font-medium shadow-sm`}
                    >
                      {getTypeText(selectedOfferDetails.type)}
                    </Badge>
                  </div>
                  <div className="absolute top-6 left-6">
                    <ShareButton
                      title={selectedOfferDetails.title}
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/marketplace?offer=${selectedOfferDetails.id}`}
                      description={`${getTypeText(selectedOfferDetails.type)} - ${selectedOfferDetails.price} - ${selectedOfferDetails.description || ""}`}
                      className="bg-white/90 hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Price and Condition */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-500 mb-2 text-sm">
                    {selectedOfferDetails.type === "lend"
                      ? "Mietgebühr"
                      : selectedOfferDetails.type === "sell"
                        ? "Preis"
                        : selectedOfferDetails.type === "trade"
                          ? "Wunschspiel"
                          : "Preis"}
                  </p>
                  <div className="text-xs font-bold text-slate-900">
                    {formatDailyRates(selectedOfferDetails.price) || (
                      <span className="font-bold text-slate-900 text-xs">Auf Anfrage</span>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-500 mb-2 text-sm">Zustand</p>
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedOfferDetails.condition || "Nicht angegeben"}
                  </p>
                </div>
              </div>

              {/* Game Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="font-bold mb-6 text-base">Spieldetails</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 rounded-xl bg-slate-50">
                    <p className="mb-2 font-normal text-xs text-slate-500">Verlag</p>
                    <p className="font-semibold text-black text-xs">
                      {selectedOfferDetails.publisher || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Sprache</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.language || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Spieleranzahl</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.players || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Spieldauer</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.duration || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Altersempfehlung</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.age || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Kategorie</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.category || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Typus</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {selectedOfferDetails.game_types || selectedOfferDetails.style || "Nicht angegeben"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedOfferDetails.description && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 text-black text-base">Beschreibung</h3>
                  <ExpandableDescription text={selectedOfferDetails.description} />
                </div>
              )}

              {/* Provider */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 text-black text-sm">Anbieter</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200">
                    <img
                      src={
                        selectedOfferDetails.users?.avatar ||
                        selectedOfferDetails.avatar ||
                        `/placeholder.svg?height=64&width=64&query=avatar+${encodeURIComponent(selectedOfferDetails.users?.username || selectedOfferDetails.owner || "User")}`
                      }
                      alt={`${selectedOfferDetails.users?.username || selectedOfferDetails.owner || "User"} Avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = "flex"
                      }}
                    />
                    <div
                      className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center"
                      style={{ display: "none" }}
                    >
                      <span className="text-slate-600 font-bold text-xl">
                        {(selectedOfferDetails.users?.username || selectedOfferDetails.owner || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <UserLink
                      userId={selectedOfferDetails.user_id}
                      className="text-slate-900 font-semibold text-lg block hover:text-teal-600"
                    >
                      {selectedOfferDetails.users?.username || selectedOfferDetails.owner || "Unbekannter Nutzer"}
                    </UserLink>
                    {selectedOfferDetails.rating && (
                      <div className="flex items-center mt-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xs text-slate-600 ml-1 font-medium">{selectedOfferDetails.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              {(selectedOfferDetails.pickup_available || selectedOfferDetails.shipping_available) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h4 className="font-semibold mb-4 text-foreground text-sm">
                    Der Spielanbieter bietet folgende Option(en) an:
                  </h4>
                  <div className="space-y-3">
                    {selectedOfferDetails.pickup_available && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <MapPin className="w-4 h-4 text-slate-700" />
                          <span className="text-slate-900 text-sm font-normal">Abholung</span>
                        </div>
                        {selectedOfferDetails.pickup_address && (
                          <p className="text-slate-600 font-normal text-xs">
                            In:{" "}
                            {selectedOfferDetails.show_full_address
                              ? selectedOfferDetails.pickup_address
                              : getPostalCodeAndCity(selectedOfferDetails.pickup_address)}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedOfferDetails.pickup_available && selectedOfferDetails.shipping_available && (
                      <div className="text-center py-2">
                        <span className="text-slate-500 font-medium">oder</span>
                      </div>
                    )}
                    {selectedOfferDetails.shipping_available && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-slate-700" />
                          <span className="text-slate-900 text-sm font-normal">Postversand</span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          Kosten zu deinen Lasten. Weitere Details mit dem/der Spielanbieter/-in besprechen.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="space-y-4">
                  <LocationMap
                    location={
                      selectedOfferDetails.pickup_address
                        ? selectedOfferDetails.show_full_address
                          ? selectedOfferDetails.pickup_address
                          : getPostalCodeAndCity(selectedOfferDetails.pickup_address)
                        : selectedOfferDetails.location
                    }
                    className="h-64 w-full rounded-lg"
                  />
                </div>
              </div>

              {/* Rental Period Selection for Lending */}
              {selectedOfferDetails.type === "lend" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-black text-sm font-semibold">
                    <CalendarDaysIcon className="w-5 h-5" />
                    Mietdauer auswählen
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="mb-2 block text-foreground font-normal text-xs">Von</label>
                      <input
                        type="date"
                        value={rentalStartDate}
                        onChange={(e) => setRentalStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full p-3 border rounded-xl focus:border-orange-400 focus:outline-none bg-white text-sm border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-foreground font-normal text-xs">Bis</label>
                      <input
                        type="date"
                        value={rentalEndDate}
                        onChange={(e) => setRentalEndDate(e.target.value)}
                        min={rentalStartDate || new Date().toISOString().split("T")[0]}
                        className="w-full p-3 border rounded-xl focus:border-orange-400 focus:outline-none bg-white text-sm border-slate-200"
                      />
                    </div>
                  </div>

                  {calculatedPrice && (
                    <div className="bg-white p-4 rounded-xl border border-orange-200 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-orange-800 font-semibold">Gesamt-Mietgebühr:</span>
                        <span className="text-orange-900 text-xs font-semibold">{calculatedPrice}</span>
                      </div>
                    </div>
                  )}

                  {rentalStartDate && rentalEndDate && !calculatedPrice && (
                    <div className="bg-orange-100 p-4 rounded-xl border border-orange-200 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-700" />
                        <p className="text-xs text-orange-800">
                          Für den gewählten Zeitraum ist keine automatische Preisberechnung möglich. Der Anbieter wird
                          Ihnen ein individuelles Angebot unterbreiten.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-slate-200">
                {selectedOfferDetails.user_id !== user?.id && (
                  <Button
                    onClick={() => {
                      setIsOfferDetailsOpen(false)
                      // When closing details, check if it's a valid offer to then proceed to contact
                      if (selectedOfferDetails.itemType === "offer" || selectedOfferDetails.type) {
                        handleContactSeller(selectedOfferDetails)
                      }
                    }}
                    disabled={selectedOfferDetails.type === "lend" && (!rentalStartDate || !rentalEndDate)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {selectedOfferDetails.type === "lend"
                      ? rentalStartDate && rentalEndDate
                        ? "Miete anfragen"
                        : "Zeitraum wählen"
                      : selectedOfferDetails.itemType === "offer"
                        ? "Anfragen"
                        : "Antworten"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsOfferDetailsOpen(false)}
                  className="ml-auto px-8 py-3 rounded-xl border-slate-300 hover:bg-slate-50 font-medium"
                >
                  Schliessen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Ad Details Modal */}
      <Dialog open={isSearchAdDetailsOpen} onOpenChange={setIsSearchAdDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-base text-gray-800 mb-2">
              {selectedSearchAdDetails?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedSearchAdDetails && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="relative">
                <div className="relative h-56 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl overflow-hidden border border-purple-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
                      <Search className="w-16 h-16 text-purple-400" />
                    </div>
                  </div>
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-purple-500 hover:bg-purple-500 text-white border-0 px-4 py-2 text-xs font-medium shadow-sm">
                      Suchanzeige
                    </Badge>
                  </div>
                  <div className="absolute top-6 left-6">
                    <ShareButton
                      title={selectedSearchAdDetails.title}
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/marketplace?searchad=${selectedSearchAdDetails.id}`}
                      description={selectedSearchAdDetails.description || ""}
                      className="bg-white/90 hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Type and Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-500 mb-2 text-sm">Gesucht zum</p>
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedSearchAdDetails.type === "buy"
                      ? "Kaufen"
                      : selectedSearchAdDetails.type === "rent"
                        ? "Mieten"
                        : "Tauschen"}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-500 mb-2 text-sm">
                    {selectedSearchAdDetails.type === "buy"
                      ? "Vorbehaltspreis"
                      : selectedSearchAdDetails.type === "rent"
                        ? "Gewünschte Mietdauer"
                        : "Tauschspiel"}
                  </p>
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedSearchAdDetails.type === "buy" && selectedSearchAdDetails.max_price
                      ? `bis CHF ${selectedSearchAdDetails.max_price}`
                      : selectedSearchAdDetails.type === "rent" && selectedSearchAdDetails.rental_duration
                        ? selectedSearchAdDetails.rental_duration
                        : selectedSearchAdDetails.type === "trade" && selectedSearchAdDetails.trade_game_title
                          ? selectedSearchAdDetails.trade_game_title
                          : "Nicht angegeben"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedSearchAdDetails.description && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 text-black text-base">Beschreibung</h3>
                  <ExpandableDescription text={selectedSearchAdDetails.description} />
                </div>
              )}

              {/* Creator */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 text-black text-xs">Gesucht von</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 relative">
                    <img
                      src={
                        selectedSearchAdDetails.users?.avatar ||
                        `/placeholder.svg?height=64&width=64&query=avatar+${encodeURIComponent(selectedSearchAdDetails.users?.username || "User")}`
                      }
                      alt={`${selectedSearchAdDetails.users?.username || "User"} Avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = "flex"
                      }}
                    />
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{ display: "none" }}
                    >
                      <span className="text-slate-600 font-bold text-xl">
                        {(selectedSearchAdDetails.users?.username || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <UserLink
                      userId={selectedSearchAdDetails.user_id}
                      className="text-slate-900 font-semibold text-lg block hover:text-teal-600"
                    >
                      {selectedSearchAdDetails.users?.username || "Unbekannter Nutzer"}
                    </UserLink>
                    {selectedSearchAdDetails.users?.rating && (
                      <div className="flex items-center mt-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xs text-slate-600 ml-1 font-medium">
                          {selectedSearchAdDetails.users.rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Map */}
              {selectedSearchAdDetails.location && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="space-y-4">
                    <LocationMap location={selectedSearchAdDetails.location} className="h-64 w-full rounded-lg" />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                {selectedSearchAdDetails.user_id !== user?.id && (
                  <Button
                    onClick={() => {
                      setIsSearchAdDetailsOpen(false)
                      handleContactSearchAdCreator(selectedSearchAdDetails)
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Antworten
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsSearchAdDetailsOpen(false)}
                  className="ml-auto px-8 py-3 rounded-xl border-slate-300 hover:bg-slate-50 font-medium"
                >
                  Schliessen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Marketplace Offer Dialog */}
      <Dialog open={isCreateOfferOpen} onOpenChange={setIsCreateOfferOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 -m-6 mb-6 z-10">
            <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">Angebot erstellen</DialogTitle>
            <p className="text-sm text-gray-600">
              Erstelle ein Angebot zum Verkaufen, Vermieten oder Tauschen deiner Spiele
            </p>
          </div>
          <CreateMarketplaceOfferForm
            isOpen={isCreateOfferOpen}
            onClose={() => setIsCreateOfferOpen(false)}
            onSuccess={() => {
              window.location.reload()
            }}
            preselectedGame={preSelectedGame}
            preselectedOfferType={preSelectedOfferType}
            /* Pass initialStep=2 to skip step 1 when coming from library */
            initialStep={preSelectedGame ? 2 : 1}
          />
        </DialogContent>
      </Dialog>

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
