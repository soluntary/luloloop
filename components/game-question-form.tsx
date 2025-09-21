"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, Loader2, Tag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { requireAuth } from "@/lib/auth-utils"

interface GameQuestionFormProps {
  gameId?: string
  gameTitle?: string
  onQuestionSubmitted?: () => void
}

const questionCategories = [
  { value: "strategy", label: "Strategie & Taktik" },
  { value: "rules", label: "Regelverständnis" },
  { value: "setup", label: "Spielaufbau" },
  { value: "variants", label: "Spielvarianten" },
  { value: "components", label: "Spielmaterial" },
  { value: "general", label: "Allgemeine Fragen" },
]

export function GameQuestionForm({ gameId, gameTitle, onQuestionSubmitted }: GameQuestionFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requireAuth(user, "eine Frage zu stellen")) {
      return
    }

    if (title.trim().length < 5) {
      toast.error("Der Titel muss mindestens 5 Zeichen lang sein")
      return
    }

    if (content.trim().length < 10) {
      toast.error("Die Frage muss mindestens 10 Zeichen lang sein")
      return
    }

    if (!category) {
      toast.error("Bitte wähle eine Kategorie aus")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Get the Q&A category ID
      const categoryResponse = await supabase
        .from("forum_categories")
        .select("id")
        .eq("name", "Spieltipps & Fragen")
        .single()

      const categoryData = categoryResponse.data

      if (!categoryData) {
        throw new Error("Q&A-Kategorie nicht gefunden")
      }

      // Create the forum post
      const { error } = await supabase.from("forum_posts").insert({
        title: title.trim(),
        content: `**Kategorie:** ${questionCategories.find((cat) => cat.value === category)?.label}\n\n${content.trim()}`,
        category_id: categoryData.id,
        author_id: user.id,
        post_type: "question",
        game_id: gameId || null,
      })

      if (error) throw error

      toast.success("Frage erfolgreich gestellt!")
      setTitle("")
      setContent("")
      setCategory("")
      onQuestionSubmitted?.()
    } catch (error) {
      console.error("Error creating question:", error)
      toast.error("Fehler beim Erstellen der Frage")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frage stellen
        </CardTitle>
        <CardDescription>
          {gameTitle ? `Stelle eine Frage zu ${gameTitle}` : "Stelle eine Frage zur Community"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question-title" className="text-sm font-medium mb-2 block">
              Titel der Frage
            </Label>
            <Input
              id="question-title"
              placeholder="z.B. Wie spiele ich optimal in der ersten Runde?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/200 Zeichen</p>
          </div>

          <div>
            <Label htmlFor="question-category" className="text-sm font-medium mb-2 block">
              Kategorie
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle eine Kategorie" />
              </SelectTrigger>
              <SelectContent>
                {questionCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="question-content" className="text-sm font-medium mb-2 block">
              Deine Frage
            </Label>
            <Textarea
              id="question-content"
              placeholder="Beschreibe deine Frage ausführlich..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen erforderlich</p>
              <p className="text-xs text-muted-foreground">{content.length}/2000</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || title.trim().length < 5 || content.trim().length < 10 || !category}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              "Frage stellen"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
