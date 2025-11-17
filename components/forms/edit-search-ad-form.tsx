"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditSearchAdFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  searchAd: any
}

export function EditSearchAdForm({ isOpen, onClose, onSuccess, searchAd }: EditSearchAdFormProps) {
  const [loading, setLoading] = useState(false)
  const [isFlexibleRental, setIsFlexibleRental] = useState(searchAd?.rental_duration === "Flexibel")

  const getFormType = (dbType: string) => {
    const reverseMapping: { [key: string]: string } = {
      kaufen: "buy",
      mieten: "rent",
      tauschen: "trade",
    }
    return reverseMapping[dbType] || dbType
  }

  const [formData, setFormData] = useState({
    title: searchAd?.title || "",
    description: searchAd?.description || "",
    type: getFormType(searchAd?.type) || "buy",
    rental_duration: searchAd?.rental_duration === "Flexibel" ? "" : searchAd?.rental_duration || "",
    max_price: searchAd?.max_price || "",
    trade_game_title: searchAd?.trade_game_title || "",
  })

  useEffect(() => {
    if (searchAd) {
      const isFlexible = searchAd.rental_duration === "Flexibel"
      setIsFlexibleRental(isFlexible)
      setFormData({
        title: searchAd.title || "",
        description: searchAd.description || "",
        type: getFormType(searchAd.type) || "buy",
        rental_duration: isFlexible ? "" : searchAd.rental_duration || "",
        max_price: searchAd.max_price || "",
        trade_game_title: searchAd.trade_game_title || "",
      })
    }
  }, [searchAd])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchAd?.id) return

    setLoading(true)
    try {
      const typeMapping: { [key: string]: string } = {
        buy: "kaufen",
        rent: "mieten",
        trade: "tauschen",
      }

      const supabase = createClient()
      const finalRentalDuration =
        formData.type === "rent" ? (isFlexibleRental ? "Flexibel" : formData.rental_duration) : null

      const { error } = await supabase
        .from("search_ads")
        .update({
          title: formData.title,
          description: formData.description,
          type: typeMapping[formData.type] || formData.type,
          rental_duration: finalRentalDuration,
          max_price: formData.type === "buy" && formData.max_price ? Number.parseFloat(formData.max_price) : null,
          trade_game_title: formData.type === "trade" ? formData.trade_game_title : null,
        })
        .eq("id", searchAd.id)

      if (error) throw error

      toast.success("Suchanzeige erfolgreich aktualisiert")
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error updating search ad:", error)
      toast.error("Fehler beim Aktualisieren der Suchanzeige")
    } finally {
      setLoading(false)
    }
  }

  if (!searchAd) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suchanzeige bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="z.B. Suche CATAN Erweiterung"
            />
          </div>

          <div>
            <Label htmlFor="type">Suchart *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Kaufen</SelectItem>
                <SelectItem value="rent">Mieten</SelectItem>
                <SelectItem value="trade">Tauschen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "rent" && (
            <div className="space-y-3">
              <Label htmlFor="rental_duration">Mietdauer</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flexibleRental"
                  checked={isFlexibleRental}
                  onChange={(e) => {
                    setIsFlexibleRental(e.target.checked)
                    if (e.target.checked) {
                      setFormData({ ...formData, rental_duration: "" })
                    }
                  }}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <Label htmlFor="flexibleRental" className="text-sm font-normal cursor-pointer">
                  Flexibel
                </Label>
              </div>
              {!isFlexibleRental && (
                <Input
                  id="rental_duration"
                  value={formData.rental_duration}
                  onChange={(e) => setFormData({ ...formData, rental_duration: e.target.value })}
                  placeholder="z.B. 1 Woche, 3 Tage, 2 Wochen"
                />
              )}
            </div>
          )}

          {formData.type === "buy" && (
            <div>
              <Label htmlFor="max_price">Vorstellungspreis (CHF)</Label>
              <Input
                id="max_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_price}
                onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                placeholder="z.B. 50.00"
              />
            </div>
          )}

          {formData.type === "trade" && (
            <div>
              <Label htmlFor="trade_game_title">Tauschspiel</Label>
              <Input
                id="trade_game_title"
                value={formData.trade_game_title}
                onChange={(e) => setFormData({ ...formData, trade_game_title: e.target.value })}
                placeholder="z.B. Monopoly"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">max. 50 Zeichen</p>
            </div>
          )}

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Beschreibe, was du suchst..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
