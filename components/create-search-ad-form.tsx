"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface CreateSearchAdFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSearchAdForm({ isOpen, onClose, onSuccess }: CreateSearchAdFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [rentalDuration, setRentalDuration] = useState("")
  const [isFlexibleRental, setIsFlexibleRental] = useState(false)
  const [maxPrice, setMaxPrice] = useState("")
  const [tradeGameTitle, setTradeGameTitle] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const supabase = createClient()

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
      console.log("[v0] Creating search ad with type:", type)

      const finalRentalDuration = type === "rent" ? (isFlexibleRental ? "Flexibel" : rentalDuration) : null

      const { error } = await supabase.from("search_ads").insert({
        title: title.trim(),
        description: description.trim() || null,
        type: type, // Use English value directly: 'buy', 'rent', 'trade'
        rental_duration: finalRentalDuration,
        max_price: type === "buy" && maxPrice ? Number.parseFloat(maxPrice) : null,
        trade_game_title: type === "trade" ? tradeGameTitle.trim() : null,
        user_id: user.id,
      })

      if (error) {
        console.error("Error creating search ad:", error)
        alert(`Fehler beim Erstellen der Suchanzeige: ${error.message}`)
        return
      }

      // Reset form
      setTitle("")
      setDescription("")
      setType("")
      setRentalDuration("")
      setIsFlexibleRental(false)
      setMaxPrice("")
      setTradeGameTitle("")
      setImage(null)
      setImagePreview(null)
      setErrors({})

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating search ad:", error)
      alert("Fehler beim Erstellen der Suchanzeige. Bitte versuche es erneut.")
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
            <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">Suchanzeige erstellen</DialogTitle>
            <p className="text-sm text-gray-600">Teile der Community mit, welches Spiel du suchst</p>
          </DialogHeader>
        </div>

        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="space-y-6 p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Grundinformationen</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-700">Spielname *</Label>
                      <span className="text-xs text-gray-500">{title.length}/60</span>
                    </div>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="z.B. Carcassonne"
                      className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                      required
                      maxLength={60}
                    />
                    {errors.title && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block"> Ich möchte das Spiel ...? *</Label>
                    <Select value={type} onValueChange={setType} required>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-gray-200">
                        <SelectItem value="buy" className="rounded-md">
                          <div className="flex items-center gap-3">
                            <span>Kaufen</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rent" className="rounded-md">
                          <div className="flex items-center gap-3">
                            <span>Mieten</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="trade" className="rounded-md">
                          <div className="flex items-center gap-3">
                            <span>Tauschen</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.type}</span>
                      </div>
                    )}
                  </div>

                  {type === "rent" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Mietdauer</Label>

                      {/* Adding flexible checkbox option */}
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

                      {/* Only show input when not flexible */}
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
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Vorbehaltspreis (CHF)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="z.B. 50.00"
                        className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ein Vorbehaltspreis, auch Reservationspreis genannt, ist der maximale Preis, den du bereit bist zu zahlen</p>
                    </div>
                  )}

                  {type === "trade" && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Tauschspiel</Label>
                      <Input
                        value={tradeGameTitle}
                        onChange={(e) => setTradeGameTitle(e.target.value)}
                        placeholder="z.B. Die Siedler von Catan"
                        maxLength={50}
                        className="h-11 border-gray-300 focus:border-gray-900 rounded-lg bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Welches Spiel bietest du zum Tausch an? (max. 50 Zeichen)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4 text-base">
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

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 -mb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-6 font-medium transition-all duration-200 bg-transparent"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-8 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Suchanzeige erstellen
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
