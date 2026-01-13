"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { createForumPost } from "@/app/actions/forum-posts"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface CreateForumPostFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function CreateForumPostForm({ onSuccess, onCancel }: CreateForumPostFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Titel ist erforderlich"
    } else if (formData.title.length < 5) {
      newErrors.title = "Titel muss mindestens 5 Zeichen lang sein"
    } else if (formData.title.length > 200) {
      newErrors.title = "Titel darf maximal 200 Zeichen lang sein"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Inhalt ist erforderlich"
    } else if (formData.content.length < 10) {
      newErrors.content = "Inhalt muss mindestens 10 Zeichen lang sein"
    } else if (formData.content.length > 5000) {
      newErrors.content = "Inhalt darf maximal 5000 Zeichen lang sein"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createForumPost(formData)

      if (result.success) {
        toast.success("Diskussion wurde erfolgreich erstellt!")
        onSuccess()
      } else {
        toast.error(result.error || "Fehler beim Erstellen der Diskussion")
      }
    } catch (error) {
      console.error("Error creating forum post:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="w-full border-0 shadow-xl">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-t-xl p-8 border-b-4 border-teal-700">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Neue Diskussion</h3>
                <p className="text-sm text-teal-100">Teile dein Anliegen mit der Community</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-teal-50/30">
            {/* Title Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-800">
                  Titel der Diskussion <span className="text-red-500 text-base">*</span>
                </Label>
                <span className="text-xs font-medium text-teal-700 bg-teal-100 px-3 py-1.5 rounded-full border border-teal-200">
                  {formData.title.length}/200
                </span>
              </div>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="z.B. Welches Spiel eignet sich für 6 Personen?"
                className={`h-14 bg-white border-2 text-base ${errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"} transition-all shadow-sm`}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-sm font-medium text-red-700 flex items-center gap-2 bg-red-100 px-4 py-3 rounded-lg border border-red-200">
                  <X className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-sm font-semibold text-gray-800">
                  Beschreibung / Startbeitrag <span className="text-red-500 text-base">*</span>
                </Label>
                <span className="text-xs font-medium text-teal-700 bg-teal-100 px-3 py-1.5 rounded-full border border-teal-200">
                  {formData.content.length}/5000
                </span>
              </div>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange("content", value)}
                placeholder="Beschreibe dein Anliegen ausführlich und stelle spezifische Fragen..."
                className={`bg-white border-2 ${errors.content ? "border-red-500" : "border-gray-300"} shadow-sm`}
                maxLength={5000}
                rows={8}
              />
              {errors.content && (
                <p className="text-sm font-medium text-red-700 flex items-center gap-2 bg-red-100 px-4 py-3 rounded-lg border border-red-200">
                  <X className="h-4 w-4" />
                  {errors.content}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-gray-50 rounded-b-xl border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-14 border-2 border-gray-400 text-gray-700 hover:bg-gray-200 hover:border-gray-500 bg-white font-semibold text-base transition-all shadow-sm"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-14 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:via-teal-800 hover:to-cyan-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Erstelle...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Diskussion erstellen
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
