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

interface EditMarketplaceOfferFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  offer: any
}

export function EditMarketplaceOfferForm({ isOpen, onClose, onSuccess, offer }: EditMarketplaceOfferFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    offer_type: offer?.offer_type || "sell",
    price: offer?.price || "",
    rental_price: offer?.rental_price || "",
    description: offer?.description || "",
    condition: offer?.condition || "good",
    available: offer?.available || true,
  })

  useEffect(() => {
    if (offer) {
      setFormData({
        offer_type: offer.offer_type || "sell",
        price: offer.price || "",
        rental_price: offer.rental_price || "",
        description: offer.description || "",
        condition: offer.condition || "good",
        available: offer.available ?? true,
      })
    }
  }, [offer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offer?.id) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("marketplace_offers")
        .update({
          offer_type: formData.offer_type,
          price: formData.price ? Number.parseFloat(formData.price) : null,
          rental_price: formData.rental_price ? Number.parseFloat(formData.rental_price) : null,
          description: formData.description,
          condition: formData.condition,
          available: formData.available,
        })
        .eq("id", offer.id)

      if (error) throw error

      toast.success("Angebot erfolgreich aktualisiert")
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error updating offer:", error)
      toast.error("Fehler beim Aktualisieren des Angebots")
    } finally {
      setLoading(false)
    }
  }

  if (!offer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Angebot bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="offer_type">Angebotstyp *</Label>
            <Select
              value={formData.offer_type}
              onValueChange={(value) => setFormData({ ...formData, offer_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">Verkaufen</SelectItem>
                <SelectItem value="lend">Verleihen</SelectItem>
                <SelectItem value="trade">Tauschen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.offer_type === "sell" && (
            <div>
              <Label htmlFor="price">Preis (CHF)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          {formData.offer_type === "lend" && (
            <div>
              <Label htmlFor="rental_price">Mietpreis pro Tag (CHF)</Label>
              <Input
                id="rental_price"
                type="number"
                step="0.01"
                value={formData.rental_price}
                onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <Label htmlFor="condition">Zustand *</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => setFormData({ ...formData, condition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="like_new">Wie neu</SelectItem>
                <SelectItem value="good">Gut</SelectItem>
                <SelectItem value="acceptable">Akzeptabel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Beschreibe dein Angebot..."
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
