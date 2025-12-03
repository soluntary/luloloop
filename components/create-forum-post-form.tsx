"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send, X, MessageSquare, FileText } from "lucide-react"
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
    <Card className="w-full border border-gray-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-5 border border-rose-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-rose-600" />
              <Label htmlFor="title" className="text-sm font-medium text-rose-800">
                Titel der Diskussion *
              </Label>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Gib deiner Diskussion einen aussagekräftigen Titel (z.B. Empfehlenswerte kooperative)"
              className={`h-11 border-rose-200 focus:border-rose-500 focus:ring-rose-500 bg-white ${errors.title ? "border-red-500" : ""}`}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                <X className="h-3 w-3" />
                {errors.title}
              </p>
            )}
            <p className="text-xs text-rose-500 mt-2">{formData.title.length}/200 Zeichen</p>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-indigo-600" />
              <Label htmlFor="content" className="text-sm font-medium text-indigo-800">
                Beschreibung / Startbeitrag *
              </Label>
            </div>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Beschreibe dein Anliegen ausführlich. Je detaillierter, desto besser können andere dir helfen..."
              className={`border-indigo-200 focus:border-indigo-500 bg-white ${errors.content ? "border-red-500" : ""}`}
              maxLength={5000}
              rows={4}
            />
            {errors.content && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                <X className="h-3 w-3" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-gray-300 bg-transparent"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
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
