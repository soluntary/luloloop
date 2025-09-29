"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { requireAuth } from "@/lib/auth-utils"

interface GameReviewFormProps {
  gameId: string
  gameTitle: string
  onReviewSubmitted?: () => void
}

export function GameReviewForm({ gameId, gameTitle, onReviewSubmitted }: GameReviewFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requireAuth(user, "eine Bewertung zu schreiben")) {
      return
    }

    if (rating === 0) {
      toast.error("Bitte wähle eine Bewertung aus")
      return
    }

    if (content.trim().length < 10) {
      toast.error("Die Bewertung muss mindestens 10 Zeichen lang sein")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Get the review category ID
      const { data: categoryData } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("name", "Spielbewertungen")
        .single()

      if (!categoryData) {
        throw new Error("Bewertungskategorie nicht gefunden")
      }

      // Create the forum post
      const { error } = await supabase.from("forum_posts").insert({
        title: `Bewertung: ${gameTitle}`,
        content: content.trim(),
        category_id: categoryData.id,
        author_id: user.id,
        post_type: "review",
        game_id: gameId,
        rating: rating,
      })

      if (error) throw error

      toast.success("Bewertung erfolgreich erstellt!")
      setRating(0)
      setContent("")
      onReviewSubmitted?.()
    } catch (error) {
      console.error("Error creating review:", error)
      toast.error("Fehler beim Erstellen der Bewertung")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle>Bewertung schreiben</CardTitle>
        <CardDescription>Teile deine Erfahrung mit {gameTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Bewertung</Label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1
                return (
                  <button
                    key={index}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform"
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(starValue)}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        starValue <= (hoveredRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                )
              })}
              {rating > 0 && <span className="ml-2 text-sm text-muted-foreground">{rating} von 5 Sternen</span>}
            </div>
          </div>

          <div>
            <Label htmlFor="review-content" className="text-sm font-medium mb-2 block">
              Deine Bewertung
            </Label>
            <Textarea
              id="review-content"
              placeholder="Beschreibe deine Erfahrung mit diesem Spiel..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen erforderlich</p>
              <p className="text-xs text-muted-foreground">{content.length}/1000</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || content.trim().length < 10}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              "Bewertung veröffentlichen"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
