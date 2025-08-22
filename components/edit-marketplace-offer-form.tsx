"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, X, Save } from "lucide-react"
import { useGames } from "@/contexts/games-context"

interface MarketplaceOffer {
  id: string
  title: string
  publisher?: string
  condition: string
  type: "lend" | "trade" | "sell"
  price: string
  location: string
  distance: string
  description?: string
  active: boolean
  min_rental_days?: number
  max_rental_days?: number
}

interface EditMarketplaceOfferFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  offer: MarketplaceOffer | null
}

export function EditMarketplaceOfferForm({ isOpen, onClose, onSuccess, offer }: EditMarketplaceOfferFormProps) {
  const { updateMarketplaceOffer } = useGames()
  const [formData, setFormData] = useState({
    title: "",
    publisher: "",
    condition: "",
    type: "" as "lend" | "trade" | "sell",
    price: "",
    location: "",
    distance: "",
    description: "",
    minRentalDays: "",
    maxRentalDays: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title,
        publisher: offer.publisher || "",
        condition: offer.condition,
        type: offer.type,
        price: offer.price,
        location: offer.location,
        distance: offer.distance,
        description: offer.description || "",
        minRentalDays: offer.min_rental_days?.toString() || "",
        maxRentalDays: offer.max_rental_days?.toString() || "",
      })
    }
  }, [offer])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = "Bitte gib einen Titel ein."
    }
    if (!formData.condition) {
      newErrors.condition = "Bitte wähle einen Zustand aus."
    }
    if (!formData.type) {
      newErrors.type = "Bitte wähle eine Angebotsart aus."
    }
    if (!formData.price.trim()) {
      newErrors.price = "Bitte gib einen Preis ein."
    }
    if (!formData.location.trim()) {
      newErrors.location = "Bitte gib einen Standort ein."
    }
    if (formData.type === "lend") {
      if (formData.minRentalDays && formData.maxRentalDays) {
        const minDays = Number.parseInt(formData.minRentalDays)
        const maxDays = Number.parseInt(formData.maxRentalDays)

        if (minDays < 1) {
          newErrors.minRentalDays = "Mindestausleihdauer muss mindestens 1 Tag sein."
        }
        if (maxDays < 1) {
          newErrors.maxRentalDays = "Maximalausleihdauer muss mindestens 1 Tag sein."
        }
        if (minDays > maxDays) {
          newErrors.maxRentalDays = "Maximalausleihdauer muss größer als Mindestausleihdauer sein."
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !offer) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateMarketplaceOffer(offer.id, {
        title: formData.title.trim(),
        publisher: formData.publisher.trim() || undefined,
        condition: formData.condition,
        type: formData.type,
        price: formData.price.trim(),
        location: formData.location.trim(),
        distance: formData.distance.trim(),
        description: formData.description.trim() || undefined,
        min_rental_days:
          formData.type === "lend" && formData.minRentalDays ? Number.parseInt(formData.minRentalDays) : null,
        max_rental_days:
          formData.type === "lend" && formData.maxRentalDays ? Number.parseInt(formData.maxRentalDays) : null,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating marketplace offer:", error)
      alert("Fehler beim Aktualisieren des Angebots. Bitte versuche es erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-orange-50 to-orange-50">
        <DialogHeader className="text-center pb-6 pt-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Edit className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="font-handwritten text-3xl text-orange-800 font-bold">Angebot bearbeiten</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-2">
          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Titel *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Catan Grundspiel"
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base"
              required
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Verlag</Label>
            <Input
              value={formData.publisher}
              onChange={(e) => setFormData((prev) => ({ ...prev, publisher: e.target.value }))}
              placeholder="z.B. Kosmos"
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-orange-800 font-semibold text-base">Zustand *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
              >
                <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12">
                  <SelectValue placeholder="Wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Neu">Neu</SelectItem>
                  <SelectItem value="Sehr gut">Sehr gut</SelectItem>
                  <SelectItem value="Gut">Gut</SelectItem>
                  <SelectItem value="Akzeptabel">Akzeptabel</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && <p className="text-red-500 text-sm">{errors.condition}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-body text-orange-800 font-semibold text-base">Art *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "lend" | "trade" | "sell") => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12">
                  <SelectValue placeholder="Wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lend">Verleihen</SelectItem>
                  <SelectItem value="trade">Tauschen</SelectItem>
                  <SelectItem value="sell">Verkaufen</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Preis *</Label>
            <Input
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="z.B. 25€ oder Kostenlos"
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base"
              required
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-orange-800 font-semibold text-base">Standort *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="z.B. Berlin"
                className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base"
                required
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-body text-orange-800 font-semibold text-base">Entfernung</Label>
              <Input
                value={formData.distance}
                onChange={(e) => setFormData((prev) => ({ ...prev, distance: e.target.value }))}
                placeholder="z.B. 5 km"
                className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base"
              />
            </div>
          </div>

          {formData.type === "lend" && (
            <div className="space-y-6">
              <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                <h4 className="font-handwritten text-lg text-teal-800 font-bold mb-3">📅 Ausleihdauer (optional)</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body text-teal-800 font-semibold text-sm">Mindestausleihdauer (Tage)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.minRentalDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minRentalDays: e.target.value }))}
                      placeholder="z.B. 3"
                      className="font-body border-2 border-teal-200 focus:border-teal-400 bg-white/90 rounded-xl h-10 text-sm"
                    />
                    {errors.minRentalDays && <p className="text-red-500 text-xs">{errors.minRentalDays}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-body text-teal-800 font-semibold text-sm">Maximalausleihdauer (Tage)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxRentalDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxRentalDays: e.target.value }))}
                      placeholder="z.B. 14"
                      className="font-body border-2 border-teal-200 focus:border-teal-400 bg-white/90 rounded-xl h-10 text-sm"
                    />
                    {errors.maxRentalDays && <p className="text-red-500 text-xs">{errors.maxRentalDays}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Zusätzliche Informationen..."
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl text-base resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-6 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 font-handwritten text-base h-12 border-2 border-orange-300 bg-white/80 text-orange-700 hover:bg-orange-50 rounded-xl"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-handwritten text-base h-12 rounded-xl"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
