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
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SearchAd {
  id: string
  title: string
  description?: string
  type: "buy" | "rent"
  active: boolean
}

interface EditSearchAdFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  searchAd: SearchAd | null
}

export function EditSearchAdForm({ isOpen, onClose, onSuccess, searchAd }: EditSearchAdFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "" as "buy" | "rent",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const supabase = createClient()

  useEffect(() => {
    if (searchAd) {
      setFormData({
        title: searchAd.title,
        description: searchAd.description || "",
        type: searchAd.type,
      })
    }
  }, [searchAd])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = "Bitte gib einen Titel ein."
    }
    if (!formData.type) {
      newErrors.type = "Bitte wähle eine Option aus."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !searchAd) {
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("search_ads")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
        })
        .eq("id", searchAd.id)

      if (error) {
        console.error("Error updating search ad:", error)
        toast({ title: "Fehler", description: "Fehler beim Aktualisieren der Suchanzeige.", variant: "destructive" })
        return
      }

      toast({ title: "Suchanzeige aktualisiert", description: "Deine Änderungen wurden gespeichert." })
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating search ad:", error)
      toast({ title: "Fehler", description: "Fehler beim Aktualisieren der Suchanzeige.", variant: "destructive" })
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
          <DialogTitle className="font-handwritten text-base text-orange-800 font-bold">
            Suchanzeige bearbeiten
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-2">
          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-sm">Titel *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Suche Catan Erweiterung"
              className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12 text-sm"
              required
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-sm">Was möchtest du? *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "buy" | "rent") => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="font-body border-2 border-orange-200 focus:border-orange-400 bg-white/90 rounded-xl h-12">
                <SelectValue placeholder="Wähle eine Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Kaufen</SelectItem>
                <SelectItem value="rent">Ausleihen</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-body text-orange-800 font-semibold text-base">Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Beschreibe genauer, was du suchst..."
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
