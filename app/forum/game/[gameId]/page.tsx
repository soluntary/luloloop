"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameReviewForm } from "@/components/game-review-form"
import { GameReviewsList } from "@/components/game-reviews-list"
import { GameQuestionForm } from "@/components/game-question-form"
import { GameQuestionsList } from "@/components/game-questions-list"
import { ArrowLeft, Star, Users, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Game {
  id: string
  title: string
  publisher: string
  description: string
  image: string
  players: string
  duration: string
  age: string
  category: string
}

export default function GameForumPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshReviews, setRefreshReviews] = useState(0)
  const [refreshQuestions, setRefreshQuestions] = useState(0)

  useEffect(() => {
    loadGame()
  }, [gameId])

  const loadGame = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

      if (error) throw error
      setGame(data)
    } catch (error) {
      console.error("Error loading game:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmitted = () => {
    setRefreshReviews((prev) => prev + 1)
  }

  const handleQuestionSubmitted = () => {
    setRefreshQuestions((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Spiel wird geladen...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="forum" />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Spiel nicht gefunden</h3>
              <p className="text-muted-foreground mb-4">Das angeforderte Spiel konnte nicht gefunden werden.</p>
              <Button asChild>
                <Link href="/forum">Zurück zum Forum</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="forum" />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/forum" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Forum
          </Link>
        </Button>

        {/* Game Header */}
        <Card className="bg-card border mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 bg-muted rounded-lg overflow-hidden">
                <img
                  src={game.image || "/placeholder.svg?height=200&width=200"}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{game.title}</h1>
                    <p className="text-muted-foreground mb-2">von {game.publisher}</p>
                    <p className="text-foreground leading-relaxed">{game.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {game.players} Spieler
                  </Badge>
                  <Badge variant="outline">{game.duration} Min</Badge>
                  <Badge variant="outline">Ab {game.age} Jahren</Badge>
                  <Badge variant="outline">{game.category}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forum Tabs */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Bewertungen
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Fragen & Tipps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GameReviewForm gameId={game.id} gameTitle={game.title} onReviewSubmitted={handleReviewSubmitted} />
              </div>
              <div className="lg:col-span-2">
                <GameReviewsList gameId={game.id} gameTitle={game.title} key={refreshReviews} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GameQuestionForm
                  gameId={game.id}
                  gameTitle={game.title}
                  onQuestionSubmitted={handleQuestionSubmitted}
                />
              </div>
              <div className="lg:col-span-2">
                <GameQuestionsList gameId={game.id} gameTitle={game.title} key={refreshQuestions} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
