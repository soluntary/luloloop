"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { FaSearch, FaTimes, FaExclamationCircle, FaBook, FaDatabase, FaKeyboard } from "react-icons/fa"
import { IoLibrary } from "react-icons/io5"
import { useAuth } from "@/contexts/auth-context"
import { useGames } from "@/contexts/games-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { GameSearchDialog } from "@/components/game-search-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreateSearchAdFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editMode?: boolean
  editData?: {
    id: string
    title: string
    description: string
    type: string
    rental_duration?: string
    max_price?: number
    trade_game_title?: string
  } | null
}

export function CreateSearchAdForm({ isOpen, onClose, onSuccess, editMode = false, editData = null }: CreateSearchAdFormProps) {
  const { user } = useAuth()
  const { games } = useGames()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [rentalDuration, setRentalDuration] = useState("")
  const [isFlexibleRental, setIsFlexibleRental] = useState(false)
  const [maxPrice, setMaxPrice] = useState("")

  // Trade game selection state
  const [tradeGameTitle, setTradeGameTitle] = useState("")
  const [tradeGameSelectionMethod, setTradeGameSelectionMethod] = useState<"library" | "database" | "manual">("library")
  const [selectedTradeGame, setSelectedTradeGame] = useState<{ id?: string; title: string; image?: string } | null>(
    null,
  )
  const [isGameSearchOpen, setIsGameSearchOpen] = useState(false)

  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      
      // Populate form with edit data if in edit mode
      if (editMode && editData) {
        setTitle(editData.title || "")
        setDescription(editData.description || "")
        setType(editData.type || "")
        setRentalDuration(editData.rental_duration === "Flexibel" ? "" : (editData.rental_duration || ""))
        setIsFlexibleRental(editData.rental_duration === "Flexibel")
        setMaxPrice(editData.max_price?.toString() || "")
        if (editData.trade_game_title) {
          setTradeGameTitle(editData.trade_game_title)
          setTradeGameSelectionMethod("manual")
        }
      }
    }
  }, [isOpen, games, editMode, editData])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = "Bitte gib einen Spielnamen ein."
    }

    if (!type) {
      newErrors.type = "Bitte wähle aus, ob du kaufen, mieten oder tauschen möchtest."
    }

    if (type === "trade") {
      if (tradeGameSelectionMethod === "manual" && !tradeGameTitle.trim()) {
        newErrors.tradeGame = "Bitte gib den Namen des Tauschspiels ein."
      } else if (
        (tradeGameSelectionMethod === "library" || tradeGameSelectionMethod === "database") &&
        !selectedTradeGame
      ) {
        newErrors.tradeGame = "Bitte wähle ein Spiel aus."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      alert("Du musst angemeldet sein, um eine Suchanzeige zu erstellen.")
      return
    }

    setIsSubmitting(true)

    try {
      const finalRentalDuration = type === "rent" ? (isFlexibleRental ? "Flexibel" : rentalDuration) : null

      let finalTradeGameTitle = null
      if (type === "trade") {
        if (tradeGameSelectionMethod === "manual") {
          finalTradeGameTitle = tradeGameTitle.trim()
        } else {
          finalTradeGameTitle = selectedTradeGame?.title || null
        }
      }

      const adData = {
        title: title.trim(),
        description: description.trim() || null,
        type: type,
        rental_duration: finalRentalDuration,
        max_price: type === "buy" && maxPrice ? Number.parseFloat(maxPrice) : null,
        trade_game_title: finalTradeGameTitle,
        updated_at: new Date().toISOString(),
      }

      let error
      if (editMode && editData?.id) {
        // Update existing search ad
        const result = await supabase
          .from("search_ads")
          .update(adData)
          .eq("id", editData.id)
        error = result.error
      } else {
        // Create new search ad
        const result = await supabase.from("search_ads").insert({
          ...adData,
          user_id: user.id,
        })
        error = result.error
      }

      if (error) {
        console.error("Error saving search ad:", error)
        toast({
          title: "Fehler",
          description: `Fehler beim ${editMode ? "Aktualisieren" : "Erstellen"} der Suchanzeige: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      // Show success toast
      toast({
        title: editMode ? "Suchanzeige aktualisiert" : "Suchanzeige erstellt",
        description: editMode 
          ? "Deine Änderungen wurden erfolgreich gespeichert."
          : "Deine Suchanzeige wurde erfolgreich erstellt.",
      })

      setTitle("")
      setDescription("")
      setType("")
      setRentalDuration("")
      setIsFlexibleRental(false)
      setMaxPrice("")
      setTradeGameTitle("")
      setSelectedTradeGame(null)
      setTradeGameSelectionMethod("library")
      setImage(null)
      setImagePreview(null)
      setErrors({})

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating search ad:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen der Suchanzeige. Bitte versuche es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setType("")
    setRentalDuration("")
    setIsFlexibleRental(false)
    setMaxPrice("")
    setTradeGameTitle("")
    setSelectedTradeGame(null)
    setTradeGameSelectionMethod("library")
    setImage(null)
    setImagePreview(null)
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 -m-6 mb-6 z-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
              {editMode ? "Suchanzeige bearbeiten" : "Suchanzeige erstellen"}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {editMode ? "Bearbeite deine Suchanzeige" : "Teile der Community mit, welches Spiel du suchst"}
            </p>
          </DialogHeader>
        </div>

        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="space-y-6 p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Grundinformationen</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Name des gesuchtes Spiels <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-gray-500">{title.length}/60</span>
                    </div>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="z.B. Carcassonne, Catan (Grundspiel)"
                      className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                      required
                      maxLength={60}
                    />
                    {errors.title && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                        <FaExclamationCircle className="w-4 h-4" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Ich möchte das Spiel ...? <span className="text-red-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={setType} required>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200">
                        <SelectItem value="buy" className="rounded-md">
                          <div className="flex items-center gap-3 text-xs">
                            <span>Kaufen</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rent" className="rounded-md">
                          <div className="flex items-center gap-3 text-xs">
                            <span>Mieten</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="trade" className="rounded-md">
                          <div className="flex items-center gap-3 text-xs">
                            <span>Tauschen</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <div className="flex items-center space-x-2 text-red-600 text-xs mt-2 bg-red-50 p-2 rounded-lg">
                        <FaExclamationCircle className="w-4 h-4" />
                        <span>{errors.type}</span>
                      </div>
                    )}
                  </div>

                  {type === "rent" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Gewünschte Mietdauer</Label>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="flexibleRental"
                          checked={isFlexibleRental}
                          onChange={(e) => {
                            setIsFlexibleRental(e.target.checked)
                            if (e.target.checked) {
                              setRentalDuration("")
                            }
                          }}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <Label htmlFor="flexibleRental" className="text-sm text-gray-700 font-normal cursor-pointer">
                          Flexibel
                        </Label>
                      </div>

                      {!isFlexibleRental && (
                        <div>
                          <Input
                            value={rentalDuration}
                            onChange={(e) => setRentalDuration(e.target.value)}
                            placeholder="z.B. 1 Woche, 3 Tage, 2 Wochen"
                            className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">Gib die gewünschte Mietdauer ein</p>
                        </div>
                      )}
                    </div>
                  )}

                  {type === "buy" && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Preisvorstellung (CHF)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="z.B. 50.00"
                        className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Gib den maximalen Preis ein, den du bereit bist, zu zahlen
                      </p>
                    </div>
                  )}

                  {type === "trade" && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700 block">Tauschspiel</Label>

                      <Tabs
                        value={tradeGameSelectionMethod}
                        onValueChange={(v) => setTradeGameSelectionMethod(v as any)}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                          <TabsTrigger value="library" className="flex items-center gap-2">
                            <IoLibrary className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Aus Ludothek auswählen</span>
                          </TabsTrigger>
                          <TabsTrigger value="database" className="flex items-center gap-2">
                            <FaDatabase className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">In Datenbank suchen</span>
                          </TabsTrigger>
                          <TabsTrigger value="manual" className="flex items-center gap-2">
                            <FaKeyboard className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Manuell eingeben</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="library" className="space-y-4">
                          {games.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                              {games.map((game) => (
                                <div
                                  key={game.id}
                                  onClick={() =>
                                    setSelectedTradeGame({ id: game.id, title: game.title, image: game.image })
                                  }
                                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                    selectedTradeGame?.id === game.id
                                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                                      : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                    {game.image ? (
                                      <img
                                        src={game.image || "/placeholder.svg"}
                                        alt={game.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <FaBook className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-medium truncate text-xs">{game.title}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-6 border border-dashed rounded-lg text-gray-500 bg-gray-50">
                              <FaBook className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-sm font-medium mb-1">Keine Spiele in deiner Ludothek</p>
                              <p className="text-xs text-gray-600">
                                Füge zuerst Spiele zu deiner Ludothek hinzu, um sie hier auswählen zu können.
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="database" className="space-y-4">
                          <div className="flex flex-col gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => setIsGameSearchOpen(true)}
                              className="w-full justify-start text-xs text-left font-normal h-12"
                            >
                              <FaSearch className="w-4 h-4 mr-2" />
                              {selectedTradeGame
                                ? "Spiel in Datenbank suchen suchen..."
                                : "Spiel in Datenbank suchen..."}
                            </Button>

                            {selectedTradeGame && tradeGameSelectionMethod === "database" && (
                              <div className="flex items-center gap-3 p-3 rounded-lg border border-orange-500 bg-orange-50">
                                <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                  {selectedTradeGame.image ? (
                                    <img
                                      src={selectedTradeGame.image || "/placeholder.svg"}
                                      alt={selectedTradeGame.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <FaDatabase className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate text-xs">
                                    {selectedTradeGame.title}
                                  </p>
                                  <p className="text-xs text-orange-600">Ausgewählt aus Ludothek</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setSelectedTradeGame(null)}
                                  className="text-gray-500 hover:text-red-500"
                                >
                                  <FaTimes className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-4">
                          <Input
                            value={tradeGameTitle}
                            onChange={(e) => setTradeGameTitle(e.target.value)}
                            placeholder="z.B. Die Siedler von Catan"
                            maxLength={50}
                            className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                          />
                          <p className="text-xs text-gray-500">
                            Gib den Namen des Spiels manuell ein, falls du es nicht finden kannst.
                          </p>
                        </TabsContent>
                      </Tabs>

                      {errors.tradeGame && (
                        <div className="flex items-center space-x-2 text-red-600 text-xs mt-2 bg-red-50 p-2 rounded-lg">
                          <FaExclamationCircle className="w-4 h-4" />
                          <span>{errors.tradeGame}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <Label className="text-lg font-bold text-gray-900">Beschreibung</Label>
                </div>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Beschreibe genauer, was du suchst..."
                  className="border-2 border-gray-200 focus:border-gray-900 rounded-lg bg-white"
                  rows={4}
                  maxLength={5000}
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 -mb-2 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 font-medium transition-all duration-200 bg-transparent"
                  disabled={isSubmitting}
                >
                  <FaTimes className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-8 font-medium shadow-sm transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editMode ? "Wird gespeichert..." : "Wird erstellt..."}
                    </>
                  ) : (
                    <>
                      <FaSearch className="w-4 h-4 mr-2" />
                      {editMode ? "Änderungen speichern" : "Suchanzeige erstellen"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      <GameSearchDialog
        open={isGameSearchOpen}
        onOpenChange={(open) => setIsGameSearchOpen(open)}
        onGameSelect={(game) => {
          setSelectedTradeGame({
            id: game.id.toString(),
            title: game.name,
            image: game.image,
          })
          setIsGameSearchOpen(false)
        }}
      />
    </Dialog>
  )
}
