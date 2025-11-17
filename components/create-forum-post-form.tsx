"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send, X } from "lucide-react"
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
    console.log("[v0] Form submission started")

    if (!validateForm()) {
      console.log("[v0] Form validation failed")
      return
    }

    console.log("[v0] Form data being submitted:", formData)
    setIsSubmitting(true)
    try {
      const result = await createForumPost(formData)
      console.log("[v0] Server action result:", result)

      if (result.success) {
        console.log("[v0] Forum post created successfully")
        toast.success("Diskussion wurde erfolgreich erstellt!")
        onSuccess()
      } else {
        console.log("[v0] Forum post creation failed:", result.error)
        toast.error(result.error || "Fehler beim Erstellen der Diskussion")
      }
    } catch (error) {
      console.error("[v0] Error creating forum post:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="w-full border border-gray-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Titel *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Gib deiner Diskussion einen aussagekräftigen Titel..."
              className={`h-11 border-gray-300 focus:border-gray-900 ${errors.title ? "border-red-500" : ""}`}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.title}
              </p>
            )}
            <p className="text-xs text-gray-500">{formData.title.length}/200 Zeichen</p>
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Inhalt *
            </Label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Beschreibe dein Anliegen ausführlich. Je detaillierter, desto besser können andere dir helfen..."
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
            <Button type="submit" disabled={isSubmitting} className="flex-1 playful-button">
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
