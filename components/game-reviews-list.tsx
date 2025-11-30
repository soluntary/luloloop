"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, ThumbsUp, MessageSquare, Clock, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { UserLink } from "@/components/user-link" // Added UserLink import

interface GameReview {
  id: string
  title: string
  content: string
  rating: number
  views_count: number
  likes_count: number
  replies_count: number
  created_at: string
  author: {
    id: string
    username: string
    avatar?: string
  }
}

interface GameReviewsListProps {
  gameId?: string
  gameTitle?: string
  limit?: number
}

export function GameReviewsList({ gameId, gameTitle, limit }: GameReviewsListProps) {
  const [reviews, setReviews] = useState<GameReview[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("newest")
  const [filterRating, setFilterRating] = useState("all")

  useEffect(() => {
    loadReviews()
  }, [gameId, sortBy, filterRating])

  const loadReviews = async () => {
    try {
      const supabase = createClient()

      let query = supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          content,
          rating,
          views_count,
          likes_count,
          replies_count,
          created_at,
          users:author_id(id, username, avatar)
        `)
        .eq("post_type", "review")

      // Filter by game if gameId is provided
      if (gameId) {
        query = query.eq("game_id", gameId)
      }

      // Filter by rating if specified
      if (filterRating !== "all") {
        query = query.eq("rating", Number.parseInt(filterRating))
      }

      // Sort reviews
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "highest_rated":
          query = query.order("rating", { ascending: false })
          break
        case "lowest_rated":
          query = query.order("rating", { ascending: true })
          break
        case "most_liked":
          query = query.order("likes_count", { ascending: false })
          break
      }

      // Apply limit if specified
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedReviews =
        data?.map((review) => ({
          ...review,
          author: review.users,
        })) || []

      setReviews(formattedReviews)
    } catch (error) {
      console.error("Error loading reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  if (loading) {
    return (
      <Card className="bg-card border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Bewertungen werden geladen...</div>
        </CardContent>
      </Card>
    )
  }

  const averageRating = getAverageRating()
  const ratingDistribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              Bewertungsübersicht
              {gameTitle && <span className="text-muted-foreground">für {gameTitle}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{averageRating}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(Number.parseFloat(averageRating))
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {reviews.length} Bewertung{reviews.length !== 1 ? "en" : ""}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${reviews.length > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {ratingDistribution[rating as keyof typeof ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Sorting */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Alle Bewertungen ({reviews.length})</h3>

          <div className="flex gap-2">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Sterne</SelectItem>
                <SelectItem value="5">5 Sterne</SelectItem>
                <SelectItem value="4">4 Sterne</SelectItem>
                <SelectItem value="3">3 Sterne</SelectItem>
                <SelectItem value="2">2 Sterne</SelectItem>
                <SelectItem value="1">1 Stern</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Neueste</SelectItem>
                <SelectItem value="oldest">Älteste</SelectItem>
                <SelectItem value="highest_rated">Beste Bewertung</SelectItem>
                <SelectItem value="lowest_rated">Schlechteste</SelectItem>
                <SelectItem value="most_liked">Beliebteste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="bg-card border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Noch keine Bewertungen</h3>
            <p className="text-muted-foreground text-center">
              {gameTitle ? `Sei der Erste und bewerte ${gameTitle}!` : "Noch keine Bewertungen vorhanden."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-card border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.author?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{review.author?.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.rating}/5
                      </Badge>
                    </div>

                    <p className="text-foreground mb-3 leading-relaxed">{review.content}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span>von</span>
                          <UserLink
                            userId={review.author?.id || ""}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {review.author?.username || "Unbekannt"}
                          </UserLink>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(review.created_at).toLocaleDateString("de-DE")}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {review.likes_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {review.replies_count}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
