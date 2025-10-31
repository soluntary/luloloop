"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Upload, ImageIcon, AlertCircle } from "lucide-react"
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
      newErrors.title = "Bitte gib einen Titel ein."
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-orange-300 to-orange-300 text-white p-6 -m-6 mb-6 rounded-t-lg z-10">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Search className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-orange-800">Suchanzeige erstellen</DialogTitle>
            <p className="text-center text-orange-800 text-sm mt-2">Teile der Community mit, welches Spiel du suchst</p>
          </DialogHeader>
        </div>

        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="space-y-6 p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-3">Grundinformationen</h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Titel der Suchanzeige *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="z.B. Suche Catan Erweiterung"
                      className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors"
                      required
                    />
                    {errors.title && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Was möchtest du? *</Label>
                    <Select value={type} onValueChange={setType} required>
                      <SelectTrigger className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white hover:border-orange-300 transition-colors">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-orange-200">
                        <SelectItem value="buy" className="rounded-lg hover:bg-orange-50">
                          <div className="flex items-center gap-3">
                            <span>Kaufen</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rent" className="rounded-lg hover:bg-orange-50">
                          <div className="flex items-center gap-3">
                            <span>Mieten</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="trade" className="rounded-lg hover:bg-orange-50">
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
                </div>
              </div>

              <div className="bg-gradient-to-br from-white rounded-2xl p-6 border border-orange-200 shadow-sm">
                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">Bild (optional)</h3>

                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Vorschau"
                        className="w-full h-48 object-cover rounded-xl border-2 border-orange-200 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-3 right-3 bg-white/95 hover:bg-white border-2 border-red-300 text-red-600 hover:text-red-700 rounded-lg shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center bg-white/70 hover:border-orange-400 transition-all duration-300">
                      <ImageIcon className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                      <p className="text-orange-600 font-medium mb-4">Lade ein Bild hoch</p>
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white transition-all duration-200 rounded-xl px-6 py-2 font-medium bg-transparent"
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

              <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm">
                <Label className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-3">
                  Beschreibung (optional)
                </Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Beschreibe genauer, was du suchst..."
                  className="border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-2 -mb-2">
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
