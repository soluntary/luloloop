"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface NewForumPostFormProps {
  onPostCreated?: () => void
}

export function NewForumPostForm({ onPostCreated }: NewForumPostFormProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

  const titleMaxLength = 100
  const contentMaxLength = 2000
  const contentMinLength = 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()

      const postData = {
        title: formData.title,
        content: formData.content,
        post_type: "discussion",
        category_id: null, // No category needed for general discussions
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

      // Reset form
      setFormData({
        title: "",
        content: "",
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
        <Button className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0 hover:scale-105 hover:rotate-1 transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Beitrag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 -m-6 mb-6 p-6 rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-1">Neue Diskussion erstellen</DialogTitle>
              <DialogDescription className="text-white/90">Teile deine Gedanken mit der Community</DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title" className="text-base font-semibold text-gray-700">
                Titel
              </Label>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  formData.title.length > titleMaxLength
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
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
              className="h-12 text-base border-2 border-gray-200 focus:border-teal-400 rounded-lg transition-colors"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content" className="text-base font-semibold text-gray-700">
                Inhalt
              </Label>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  formData.content.length < contentMinLength
                    ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                    : formData.content.length > contentMaxLength
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-green-50 text-green-600 border-green-200"
                }`}
              >
                {formData.content.length}/{contentMaxLength}{" "}
                {formData.content.length < contentMinLength && `(min. ${contentMinLength})`}
              </span>
            </div>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value.slice(0, contentMaxLength) })}
              placeholder="Beschreibe dein Anliegen oder stelle deine Frage..."
              required
              rows={8}
              className="text-base border-2 border-gray-200 focus:border-teal-400 rounded-lg resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6 h-11 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || formData.content.length < contentMinLength}
              className="px-6 h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewForumPostForm
