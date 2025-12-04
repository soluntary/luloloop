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
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Diskussionsdetails</h3>
            </div>

            <div className="space-y-4">
              {/* Title Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="text-xs font-medium text-gray-700">
                    Titel der Diskussion *
                  </Label>
                  <span className="text-xs text-gray-500">{formData.title.length}/200</span>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Gib deiner Diskussion einen aussagekräftigen Titel"
                  className={`h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500 ${errors.title ? "border-red-500" : ""}`}
                  maxLength={200}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Content Field */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-medium text-gray-700">
                  Beschreibung / Startbeitrag *
                </Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder="Beschreibe dein Anliegen ausführlich..."
                  className={`${errors.content ? "border-red-500" : ""}`}
                  maxLength={5000}
                  rows={4}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.content}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-11 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent font-medium"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Erstelle...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
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
