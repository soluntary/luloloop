"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Star, ThumbsUp, ThumbsDown, Package, User } from "lucide-react"

interface RentalReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  offerId: string
  gameTitle: string
  gameImage?: string
  revieweeId: string
  revieweeName: string
  isOwnerReviewing: boolean // true = owner reviews renter, false = renter reviews owner
  onSuccess?: () => void
}

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Ausgezeichnet", description: "Wie neu, keine Abnutzung" },
  { value: "good", label: "Gut", description: "Minimale Gebrauchsspuren" },
  { value: "fair", label: "Akzeptabel", description: "Normale Abnutzung" },
  { value: "poor", label: "Beschädigt", description: "Sichtbare Schäden vorhanden" },
]

export function RentalReviewDialog({
  isOpen,
  onClose,
  bookingId,
  offerId,
  gameTitle,
  gameImage,
  revieweeId,
  revieweeName,
  isOwnerReviewing,
  onSuccess,
}: RentalReviewDialogProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [conditionRating, setConditionRating] = useState("")
  const [comment, setComment] = useState("")
  const [wouldRentAgain, setWouldRentAgain] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Du musst angemeldet sein")
      return
    }

    if (rating === 0) {
      toast.error("Bitte gib eine Sternebewertung ab")
      return
    }

    if (isOwnerReviewing && !conditionRating) {
      toast.error("Bitte bewerte den Zustand des Spiels")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const reviewData = {
        booking_id: bookingId,
        offer_id: offerId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
        review_type: isOwnerReviewing ? "owner_to_renter" : "renter_to_owner",
        condition_rating: isOwnerReviewing ? conditionRating : null,
        would_rent_again: wouldRentAgain,
      }

      const { error } = await supabase.from("rental_reviews").insert(reviewData)

      if (error) throw error

      // Update booking status to show review was submitted
      await supabase
        .from("rental_bookings")
        .update({
          [isOwnerReviewing ? "owner_reviewed" : "renter_reviewed"]: true,
        })
        .eq("id", bookingId)

      toast.success("Bewertung erfolgreich abgegeben!")
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Fehler beim Speichern der Bewertung")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoverRating(0)
    setConditionRating("")
    setComment("")
    setWouldRentAgain(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Bewertung abgeben
          </DialogTitle>
          <DialogDescription>
            {isOwnerReviewing
              ? `Bewerte den Mieter ${revieweeName} für "${gameTitle}"`
              : `Bewerte den Vermieter ${revieweeName} für "${gameTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game info */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
            <img
              src={gameImage || "/images/ludoloop-placeholder.png"}
              alt={gameTitle}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <p className="font-semibold text-slate-800">{gameTitle}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                {isOwnerReviewing ? (
                  <>
                    <User className="h-3 w-3" /> Mieter: {revieweeName}
                  </>
                ) : (
                  <>
                    <Package className="h-3 w-3" /> Vermieter: {revieweeName}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gesamtbewertung *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {rating === 1 && "Sehr schlecht"}
              {rating === 2 && "Schlecht"}
              {rating === 3 && "Okay"}
              {rating === 4 && "Gut"}
              {rating === 5 && "Ausgezeichnet"}
            </p>
          </div>

          {/* Condition rating (only for owner reviewing returned game) */}
          {isOwnerReviewing && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Zustand bei Rückgabe *</Label>
              <RadioGroup value={conditionRating} onValueChange={setConditionRating}>
                <div className="grid gap-2">
                  {CONDITION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        conditionRating === option.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Would rent again */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isOwnerReviewing ? "Würdest du wieder an diese Person vermieten?" : "Würdest du wieder von dieser Person mieten?"}
            </Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={wouldRentAgain === true ? "default" : "outline"}
                onClick={() => setWouldRentAgain(true)}
                className={wouldRentAgain === true ? "bg-green-500 hover:bg-green-600" : ""}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Ja
              </Button>
              <Button
                type="button"
                variant={wouldRentAgain === false ? "default" : "outline"}
                onClick={() => setWouldRentAgain(false)}
                className={wouldRentAgain === false ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Nein
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Kommentar (optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isOwnerReviewing
                  ? "Wie war die Kommunikation? Wurde das Spiel pünktlich zurückgegeben?"
                  : "Wie war die Kommunikation? War das Spiel wie beschrieben?"
              }
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-slate-400 text-right">{comment.length}/500</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || (isOwnerReviewing && !conditionRating)}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isSubmitting ? "Wird gespeichert..." : "Bewertung abgeben"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component to display reviews
interface RentalReviewsDisplayProps {
  offerId: string
  userId?: string
}

export function RentalReviewsDisplay({ offerId, userId }: RentalReviewsDisplayProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    const fetchReviews = async () => {
      try {
        const supabase = createClient()
        let query = supabase
          .from("rental_reviews")
          .select(`
            id,
            rating,
            comment,
            condition_rating,
            would_rent_again,
            review_type,
            created_at,
            reviewer:reviewer_id(id, username, avatar_url),
            reviewee:reviewee_id(id, username, avatar_url)
          `)
          .order("created_at", { ascending: false })

        if (offerId) {
          query = query.eq("offer_id", offerId)
        }
        if (userId) {
          query = query.eq("reviewee_id", userId)
        }

        const { data, error } = await query

        if (error) throw error
        setReviews(data || [])
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  })

  if (loading) {
    return <div className="animate-pulse h-20 bg-slate-100 rounded-lg" />
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        Noch keine Bewertungen vorhanden
      </div>
    )
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
              }`}
            />
          ))}
        </div>
        <span className="font-semibold">{averageRating.toFixed(1)}</span>
        <span className="text-slate-500 text-sm">({reviews.length} Bewertungen)</span>
      </div>

      {/* Individual reviews */}
      <div className="space-y-3">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="p-3 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={review.reviewer?.avatar_url || "/placeholder-user.jpg"}
                  alt={review.reviewer?.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-sm">{review.reviewer?.username}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
            {review.condition_rating && (
              <p className="text-xs text-slate-500 mt-2">
                Zustand bei Rückgabe:{" "}
                {CONDITION_OPTIONS.find((o) => o.value === review.condition_rating)?.label}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {new Date(review.created_at).toLocaleDateString("de-DE")}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
