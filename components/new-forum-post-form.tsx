"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MessageSquarePlus, Type, FileText, Tag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface NewForumPostFormProps {
  onPostCreated?: () => void
}

const CATEGORIES = [
  { id: "spielempfehlungen", name: "Spielempfehlungen", color: "bg-blue-100 text-blue-700" },
  { id: "spielregeln", name: "Spielregeln", color: "bg-green-100 text-green-700" },
  { id: "strategien-tipps", name: "Strategien & Tipps", color: "bg-purple-100 text-purple-700" },
  { id: "sonstiges", name: "Sonstiges", color: "bg-gray-100 text-gray-700" },
]

export function NewForumPostForm({ onPostCreated }: NewForumPostFormProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    content: "",
    checkedSimilar: false,
  })

  const titleMaxLength = 100
  const contentMaxLength = 2000

  const isFormValid = formData.category && formData.title.trim().length > 0 && formData.checkedSimilar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isFormValid) return

    setLoading(true)
    try {
      const supabase = createClient()

      const postData = {
        title: formData.title,
        content: formData.content,
        post_type: "discussion",
        category_id: formData.category, // Store category as string ID
        author_id: user.id,
        game_id: null,
        rating: null,
        views_count: 0,
        likes_count: 0,
        replies_count: 0,
      }

      const { error } = await supabase.from("forum_posts").insert([postData])

      if (error) {
        console.error("Error creating post:", error)
        alert("Fehler beim Erstellen des Beitrags. Bitte versuche es erneut.")
        return
      }

      setFormData({
        category: "",
        title: "",
        content: "",
        checkedSimilar: false,
      })

      setOpen(false)
      onPostCreated?.()
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0 hover:scale-105 transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Neue Diskussion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-semibold text-gray-900">Neue Diskussion erstellen</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Teile deine Gedanken und Fragen mit der Community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-teal-500" />
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Kategorie <span className="text-red-500">*</span>
              </Label>
            </div>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-teal-400 focus:ring-teal-400 rounded-lg">
                <SelectValue placeholder="Wähle eine Kategorie..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.category && (
              <p className="text-xs text-gray-500">Bitte wähle eine passende Kategorie für deine Diskussion.</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-teal-500" />
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Titel der Diskussion <span className="text-red-500">*</span>
                </Label>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  formData.title.length > titleMaxLength
                    ? "bg-red-50 text-red-600"
                    : formData.title.length > 0
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-500"
                }`}
              >
                {formData.title.length}/{titleMaxLength}
              </span>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, titleMaxLength) })}
              placeholder="Gib deiner Diskussion einen aussagekräftigen Titel..."
              required
              className="h-11 border-gray-200 focus:border-teal-400 focus:ring-teal-400 rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-500" />
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Beschreibung
                </Label>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  formData.content.length > contentMaxLength
                    ? "bg-red-50 text-red-600"
                    : formData.content.length > 0
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-500"
                }`}
              >
                {formData.content.length}/{contentMaxLength}
              </span>
            </div>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value.slice(0, contentMaxLength) })}
              placeholder="Beschreibe dein Anliegen oder stelle deine Frage (optional)..."
              rows={6}
              className="border-gray-200 focus:border-teal-400 focus:ring-teal-400 rounded-lg resize-none"
            />
            <p className="text-xs text-gray-500">
              Tipp: Je detaillierter deine Beschreibung, desto bessere Antworten erhältst du.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="checkedSimilar"
                checked={formData.checkedSimilar}
                onCheckedChange={(checked) => setFormData({ ...formData, checkedSimilar: checked as boolean })}
                className="mt-0.5 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
              />
              <div className="flex-1">
                <Label htmlFor="checkedSimilar" className="text-sm font-medium text-amber-800 cursor-pointer">
                  Ich habe geprüft, ob es bereits eine ähnliche Diskussion gibt. <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-amber-700 mt-1">
                  Bitte nutze die Suchfunktion, um Duplikate zu vermeiden und bestehenden Diskussionen beizutreten.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6 h-10 border-gray-200 hover:bg-gray-50"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-6 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewForumPostForm
