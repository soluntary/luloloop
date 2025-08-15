"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, X, ShoppingCart, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = "Bitte gib einen Titel ein."
    }

    if (!type) {
      newErrors.type = "Bitte wähle aus, ob du kaufen oder ausleihen möchtest."
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
      const { error } = await supabase.from("search_ads").insert({
        title: title.trim(),
        description: description.trim() || null,
        type,
        user_id: user.id,
      })

      if (error) {
        console.error("Error creating search ad:", error)
        alert("Fehler beim Erstellen der Suchanzeige. Bitte versuche es erneut.")
        return
      }

      // Reset form
      setTitle("")
      setDescription("")
      setType("")
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
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-orange-50 to-orange-50">
        <DialogHeader className="text-center pb-6 pt-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Search className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="font-handwritten text-3xl text-orange-700 font-bold">
            Suchanzeige erstellen
          </DialogTitle>
          <p className="font-body text-orange-600/80 text-sm mt-2">Teile der Community mit, welches Spiel du suchst</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-2">
          {/* Title Field */}
          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base flex items-center gap-2">
              Titel der Suchanzeige *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Suche Catan Erweiterung"
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-md"
              required
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 font-body bg-red-50 p-2 rounded-lg border border-red-200">
                {errors.title}
              </p>
            )}
          </div>

          {/* Type Field */}
          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base flex items-center gap-2">
              Was möchtest du? *
            </Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-base shadow-sm transition-all duration-200 hover:shadow-md">
                <SelectValue placeholder="Wähle eine Option" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-orange-200 shadow-lg">
                <SelectItem value="buy" className="font-body text-base py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    Kaufen
                  </div>
                </SelectItem>
                <SelectItem value="rent" className="font-body text-base py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    Ausleihen
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1 font-body bg-red-50 p-2 rounded-lg border border-red-200">
                {errors.type}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe genauer, was du suchst..."
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl text-base shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-md resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-6 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 font-handwritten text-base h-12 border-2 border-orange-300 bg-white/80 text-orange-700 hover:bg-orange-50 hover:border-orange-400 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-handwritten text-base h-12 shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              <Search className="w-4 h-4 mr-2" />
              {isSubmitting ? "Erstelle..." : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
