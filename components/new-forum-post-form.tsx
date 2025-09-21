"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-pink-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-handwritten text-gray-800 transform -rotate-1">
            Neue Diskussion starten
          </DialogTitle>
          <DialogDescription className="font-body text-gray-600 transform rotate-1">
            Stelle eine Frage oder starte eine Diskussion mit der Community!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body text-gray-700 font-medium">
              Titel *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Worum geht es in deiner Diskussion?"
              required
              className="border-2 border-teal-200 focus:border-teal-400 rounded-xl font-body"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="font-body text-gray-700 font-medium">
              Deine Frage oder Diskussion *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Beschreibe deine Frage oder teile deine Gedanken mit..."
              required
              rows={6}
              className="border-2 border-teal-200 focus:border-teal-400 rounded-xl font-body resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-2 border-gray-200 hover:bg-gray-50 font-body"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.content}
              className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0 hover:scale-105 transition-all duration-300 font-body"
            >
              {loading ? "Wird erstellt..." : "Diskussion starten"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewForumPostForm
