"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Filter, MapPin, Clock, Users, Plus, LogIn, UserPlus } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from 'react'
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"

const getTypeColor = (type: string) => {
  switch(type) {
    case 'lend': return 'bg-teal-400'
    case 'trade': return 'bg-orange-400'
    case 'sell': return 'bg-pink-400'
    default: return 'bg-gray-400'
  }
}

const getTypeText = (type: string) => {
  switch(type) {
    case 'lend': return 'Verleihen'
    case 'trade': return 'Tauschen'
    case 'sell': return 'Verkaufen'
    default: return type
  }
}

function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <Search className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Marktplatz wird geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
          Wir sammeln die besten Spiele-Angebote für dich!
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

function MarketplaceContent() {
  const { games: libraryGames, marketplaceOffers, addMarketplaceOffer } = useGames()
  const { user } = useAuth()
  const { sendMessage } = useMessages()
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState("")
  const [offerType, setOfferType] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  
  // Anfrage Dialog States
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [inquiryMessage, setInquiryMessage] = useState("")

  // Detail Dialog States
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedDetailOffer, setSelectedDetailOffer] = useState<any>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<'all' | 'lend' | 'trade' | 'sell'>('all')

  // Filter marketplace offers
  const filteredOffers = marketplaceOffers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.publisher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === 'all' || offer.type === activeFilter
    
    return matchesSearch && matchesFilter
  })

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGame || !offerType) {
      alert("Bitte wähle ein Spiel und einen Angebotstyp aus!")
      return
    }
    
    const game = libraryGames.find(g => g.id.toString() === selectedGame)
    if (!game) return
    
    // Add to marketplace using context
    addMarketplaceOffer({
      title: game.title,
      publisher: game.publisher,
      condition: game.condition,
      type: offerType as 'lend' | 'trade' | 'sell',
      price: price || (offerType === 'trade' ? 'Tausch angeboten' : 'Preis auf Anfrage'),
      location: "Berlin Mitte",
      distance: "0.5 km", 
      owner: user?.name || "Du",
      rating: 5.0,
      image: game.image,
      gameId: game.id,
      description: description.trim() || undefined
    })
    
    alert(`${game.title} wurde erfolgreich zum ${getTypeText(offerType)} angeboten!`)
    
    // Reset form
    setSelectedGame("")
    setOfferType("")
    setPrice("")
    setDescription("")
    setIsOfferDialogOpen(false)
  }

  const handleInquiry = (offer: any) => {
    setSelectedOffer(offer)
    setInquiryMessage("")
    setIsInquiryDialogOpen(true)
  }

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inquiryMessage.trim() || !selectedOffer || !user) {
      alert("Bitte gib eine Nachricht ein!")
      return
    }

    // Send message to offer owner
    sendMessage({
      fromUser: user.name,
      toUser: selectedOffer.owner,
      gameTitle: selectedOffer.title,
      gameId: selectedOffer.gameId,
      offerType: selectedOffer.type,
      message: inquiryMessage.trim(),
      gameImage: selectedOffer.image
    })

    alert(`Deine Anfrage wurde an ${selectedOffer.owner} gesendet!`)
    
    // Reset form
    setInquiryMessage("")
    setSelectedOffer(null)
    setIsInquiryDialogOpen(false)
  }

  const handleOfferClick = (offer: any) => {
    setSelectedDetailOffer(offer)
    setIsDetailDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 font-body">
      {/* Header */}
      <Navigation currentPage="marketplace" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Spiele-Marktplatz
          </h2>
          <p className="text-xl text-gray-600 transform rotate-1 font-body">
            Entdecke großartige Spiele in deiner Nähe!
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Nach Spielen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-teal-200 focus:border-teal-400 font-body text-base"
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Button variant="outline" className="flex-1 sm:flex-none border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten text-sm">
              <Filter className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none border-2 border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten text-sm">
              <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Standort</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 justify-center flex-wrap">
          <Button 
            onClick={() => setActiveFilter('all')}
            className={`text-xs sm:text-sm ${
              activeFilter === 'all' 
                ? 'bg-teal-400 hover:bg-teal-500 text-white' 
                : 'bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white'
            } transform -rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
          >
            Alle ({marketplaceOffers.length})
          </Button>
          <Button 
            onClick={() => setActiveFilter('lend')}
            className={`text-xs sm:text-sm ${
              activeFilter === 'lend' 
                ? 'bg-teal-400 hover:bg-teal-500 text-white' 
                : 'bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white'
            } transform rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
          >
            Verleihen ({marketplaceOffers.filter(o => o.type === 'lend').length})
          </Button>
          <Button 
            onClick={() => setActiveFilter('trade')}
            className={`text-xs sm:text-sm ${
              activeFilter === 'trade' 
                ? 'bg-orange-400 hover:bg-orange-500 text-white' 
                : 'bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white'
            } transform -rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
          >
            Tauschen ({marketplaceOffers.filter(o => o.type === 'trade').length})
          </Button>
          <Button 
            onClick={() => setActiveFilter('sell')}
            className={`text-xs sm:text-sm ${
              activeFilter === 'sell' 
                ? 'bg-pink-400 hover:bg-pink-500 text-white' 
                : 'bg-white border-2 border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white'
            } transform rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
          >
            Verkaufen ({marketplaceOffers.filter(o => o.type === 'sell').length})
          </Button>
        </div>

        {/* Results Counter */}
        <div className="text-center mb-6">
          <p className="text-gray-600 font-body">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'Angebot' : 'Angebote'} gefunden
            {searchTerm && ` für "${searchTerm}"`}
            {activeFilter !== 'all' && ` in der Kategorie "${getTypeText(activeFilter)}"`}
          </p>
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Spiel anbieten Card - nur für eingeloggte Benutzer */}
          {user ? (
            <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
              <DialogTrigger asChild>
                <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-dashed border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100 cursor-pointer">
                  <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-teal-700 mb-2 font-handwritten">
                      Spiel anbieten
                    </h3>
                    <p className="text-teal-600 font-body">
                      Biete deine eigenen Spiele zum Verleihen, Tauschen oder Verkaufen an!
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-handwritten text-2xl text-center">
                    Spiel anbieten
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleOfferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 font-body">
                      Spiel aus deiner Bibliothek wählen:
                    </label>
                    <Select value={selectedGame} onValueChange={setSelectedGame}>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Spiel auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {libraryGames.map((game) => (
                          <SelectItem key={game.id} value={game.id.toString()} className="font-body">
                            {game.title} ({game.condition})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 font-body">
                      Angebotstyp:
                    </label>
                    <Select value={offerType} onValueChange={setOfferType}>
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder="Typ auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lend" className="font-body">Verleihen</SelectItem>
                        <SelectItem value="trade" className="font-body">Tauschen</SelectItem>
                        <SelectItem value="sell" className="font-body">Verkaufen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(offerType === "lend" || offerType === "sell") && (
                    <div>
                      <label className="block text-sm font-medium mb-2 font-body">
                        {offerType === "lend" ? "Preis pro Woche:" : "Verkaufspreis:"}
                      </label>
                      <Input
                        type="text"
                        placeholder={offerType === "lend" ? "z.B. 5€/Woche" : "z.B. 25€"}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="font-body"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 font-body">
                      Beschreibung (optional):
                    </label>
                    <Textarea
                      placeholder="Zusätzliche Informationen zum Spiel..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="font-body"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOfferDialogOpen(false)}
                      className="flex-1 font-handwritten"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                    >
                      Anbieten
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            // Login/Register Card für nicht eingeloggte Benutzer
            <Card className="transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-dashed border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-700 mb-2 font-handwritten">
                  Mitmachen!
                </h3>
                <p className="text-purple-600 font-body mb-4">
                  Registriere dich, um eigene Spiele anzubieten!
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full bg-purple-400 hover:bg-purple-500 text-white font-handwritten">
                    <Link href="/register">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrieren
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-purple-400 text-purple-600 hover:bg-purple-400 hover:text-white font-handwritten">
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Anmelden
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic marketplace items */}
          {filteredOffers.map((item, index) => (
            <Card 
              key={item.id} 
              className={`transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-all hover:shadow-xl border-2 border-gray-200 hover:border-teal-300 font-body cursor-pointer`}
              onClick={() => handleOfferClick(item)}
            >
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Badge className={`absolute top-2 right-2 ${getTypeColor(item.type)} text-white font-body`}>
                    {getTypeText(item.type)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs font-body">{item.condition}</Badge>
                    <span className="text-sm font-bold text-green-600 font-body">{item.price}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 font-body">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{item.location} • {item.distance}</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten mt-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (user) {
                        handleInquiry(item)
                      } else {
                        window.location.href = '/login'
                      }
                    }}
                  >
                    {user ? 'Anfragen' : 'Anmelden zum Anfragen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results message */}
        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2 font-handwritten">
              Keine Angebote gefunden
            </h3>
            <p className="text-gray-500 font-body">
              {searchTerm || activeFilter !== 'all' 
                ? 'Versuche andere Suchbegriffe oder Filter.' 
                : 'Sei der Erste und biete ein Spiel an!'}
            </p>
          </div>
        )}

        {/* Load More */}
        {filteredOffers.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white px-8 py-3 transform rotate-1 hover:rotate-0 transition-all font-handwritten">
              Mehr Spiele laden
            </Button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-2xl text-center">
              Spiel-Details
            </DialogTitle>
          </DialogHeader>
          {selectedDetailOffer && (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <img
                  src={selectedDetailOffer.image || "/placeholder.svg"}
                  alt={selectedDetailOffer.title}
                  className="w-24 h-32 rounded-lg shadow-sm flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold font-handwritten mb-1">
                    {selectedDetailOffer.title}
                  </h3>
                  <p className="text-gray-600 font-body mb-2">{selectedDetailOffer.publisher}</p>
                  <Badge className={`${getTypeColor(selectedDetailOffer.type)} text-white font-body mb-2`}>
                    {getTypeText(selectedDetailOffer.type)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium font-body">Zustand:</span>
                  <Badge variant="outline" className="ml-2 text-xs font-body">
                    {selectedDetailOffer.condition}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium font-body">Preis:</span>
                  <span className="ml-2 font-bold text-green-600 font-body">
                    {selectedDetailOffer.price}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium font-body">Standort:</span>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-body">{selectedDetailOffer.location} • {selectedDetailOffer.distance}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium font-body">Anbieter:</span>
                  <span className="ml-2 font-body">{selectedDetailOffer.owner}</span>
                </div>
                <div>
                  <span className="font-medium font-body">Bewertung:</span>
                  <div className="flex items-center ml-2">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-body">{selectedDetailOffer.rating}</span>
                  </div>
                </div>
              </div>
              
              {selectedDetailOffer.description && (
                <div>
                  <span className="font-medium font-body">Beschreibung:</span>
                  <p className="text-sm text-gray-600 font-body mt-1 bg-gray-50 p-3 rounded">
                    {selectedDetailOffer.description}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="flex-1 font-handwritten"
                >
                  Schließen
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    if (user) {
                      handleInquiry(selectedDetailOffer)
                    } else {
                      window.location.href = '/login'
                    }
                  }}
                  className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                >
                  {user ? 'Anfragen' : 'Anmelden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Anfrage Dialog */}
      <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-xl text-center">
              Anfrage senden
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={selectedOffer.image || "/placeholder.svg"}
                  alt={selectedOffer.title}
                  className="w-12 h-16 rounded shadow-sm"
                />
                <div>
                  <h4 className="font-bold font-handwritten">{selectedOffer.title}</h4>
                  <p className="text-sm text-gray-600 font-body">
                    {getTypeText(selectedOffer.type)} • {selectedOffer.price}
                  </p>
                  <p className="text-sm text-gray-600 font-body">von {selectedOffer.owner}</p>
                </div>
              </div>
              
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 font-body">
                    Deine Nachricht:
                  </label>
                  <Textarea
                    placeholder="Hallo! Ich interessiere mich für dein Spiel..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="font-body"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInquiryDialogOpen(false)}
                    className="flex-1 font-handwritten"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                  >
                    Anfrage senden
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceLoading />}>
      <MarketplaceContent />
    </Suspense>
  )
}
