"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, X, Upload, ImageIcon } from "lucide-react"
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
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
      newErrors.title = "Bitte gib einen Titel ein."
    }

    if (!type) {
      newErrors.type = "Bitte wähle aus, ob du kaufen, ausleihen oder tauschen möchtest."
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
    setImage(null)
    setImagePreview(null)
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
          <DialogTitle className="font-handwritten text-3xl text-orange-800 font-bold">
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

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Bild (optional)</Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Vorschau"
                    className="w-full h-32 object-cover rounded-xl border-2 border-orange-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white border-orange-200 text-orange-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center bg-white/50">
                  <ImageIcon className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-600 text-sm mb-3">
                    Lade ein Bild hoch oder wir verwenden automatisch ein Logo
                  </p>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg bg-transparent"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Bild auswählen
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
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
                  <div className="flex items-center gap-2">Kaufen</div>
                </SelectItem>
                <SelectItem value="rent" className="font-body text-base py-3 rounded-lg">
                  <div className="flex items-center gap-2">Ausleihen</div>
                </SelectItem>
                <SelectItem value="trade" className="font-body text-base py-3 rounded-lg">
                  <div className="flex items-center gap-2">Tauschen</div>
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
