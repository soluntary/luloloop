"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, MessageSquare, Clock, ThumbsUp, Reply, Send, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface GameQuestion {
  id: string
  title: string
  content: string
  views_count: number
  likes_count: number
  replies_count: number
  created_at: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  replies?: QuestionReply[]
}

interface QuestionReply {
  id: string
  content: string
  likes_count: number
  created_at: string
  author: {
    id: string
    username: string
    avatar?: string
  }
}

interface GameQuestionsListProps {
  gameId?: string
  gameTitle?: string
  limit?: number
}

export function GameQuestionsList({ gameId, gameTitle, limit }: GameQuestionsListProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<GameQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("newest")
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [gameId, sortBy])

  const loadQuestions = async () => {
    try {
      const supabase = createClient()

      let query = supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          content,
          views_count,
          likes_count,
          replies_count,
          created_at,
          users:author_id(id, username, avatar)
        `)
        .eq("post_type", "question")

      // Filter by game if gameId is provided
      if (gameId) {
        query = query.eq("game_id", gameId)
      }

      // Sort questions
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "most_replies":
          query = query.order("replies_count", { ascending: false })
          break
        case "most_liked":
          query = query.order("likes_count", { ascending: false })
          break
        case "unanswered":
          query = query.eq("replies_count", 0).order("created_at", { ascending: false })
          break
      }

      // Apply limit if specified
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedQuestions =
        data?.map((question) => ({
          ...question,
          author: question.users,
        })) || []

      setQuestions(formattedQuestions)
    } catch (error) {
      console.error("Error loading questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReplies = async (questionId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          id,
          content,
          likes_count,
          created_at,
          users:author_id(id, username, avatar)
        `)
        .eq("post_id", questionId)
        .order("created_at", { ascending: true })

      if (error) throw error

      const formattedReplies =
        data?.map((reply) => ({
          ...reply,
          author: reply.users,
        })) || []

      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, replies: formattedReplies } : q)))
    } catch (error) {
      console.error("Error loading replies:", error)
    }
  }

  const handleExpandQuestion = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null)
    } else {
      setExpandedQuestion(questionId)
      loadReplies(questionId)
    }
  }

  const handleSubmitReply = async (questionId: string) => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um zu antworten")
      return
    }

    if (replyContent.trim().length < 10) {
      toast.error("Die Antwort muss mindestens 10 Zeichen lang sein")
      return
    }

    setIsSubmittingReply(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("forum_replies").insert({
        content: replyContent.trim(),
        post_id: questionId,
        author_id: user.id,
      })

      if (error) throw error

      toast.success("Antwort erfolgreich gesendet!")
      setReplyContent("")

      // Reload replies and update reply count
      loadReplies(questionId)
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, replies_count: q.replies_count + 1 } : q)))
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast.error("Fehler beim Senden der Antwort")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const getCategoryFromContent = (content: string) => {
    const match = content.match(/\*\*Kategorie:\*\* (.+?)\n/)
    return match ? match[1] : null
  }

  const getContentWithoutCategory = (content: string) => {
    return content.replace(/\*\*Kategorie:\*\* .+?\n\n/, "")
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Fragen werden geladen...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      {questions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {gameTitle ? `Fragen zu ${gameTitle}` : "Alle Fragen"} ({questions.length})
          </h3>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Neueste</SelectItem>
              <SelectItem value="oldest">Älteste</SelectItem>
              <SelectItem value="most_replies">Meiste Antworten</SelectItem>
              <SelectItem value="most_liked">Beliebteste</SelectItem>
              <SelectItem value="unanswered">Unbeantwortet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Noch keine Fragen</h3>
            <p className="text-muted-foreground text-center">
              {gameTitle ? `Sei der Erste und stelle eine Frage zu ${gameTitle}!` : "Noch keine Fragen vorhanden."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => {
            const category = getCategoryFromContent(question.content)
            const cleanContent = getContentWithoutCategory(question.content)
            const isExpanded = expandedQuestion === question.id

            return (
              <Card key={question.id} className="bg-card border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={question.author?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{question.author?.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Frage
                        </Badge>
                        {category && (
                          <Badge variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        )}
                        {question.replies_count === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Unbeantwortet
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-foreground mb-2 hover:text-primary cursor-pointer">
                        {question.title}
                      </h3>

                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{cleanContent}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <span>von {question.author?.username || "Unbekannt"}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(question.created_at).toLocaleDateString("de-DE")}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {question.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {question.replies_count}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpandQuestion(question.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {isExpanded ? "Antworten ausblenden" : "Antworten anzeigen"}
                      </Button>

                      {/* Replies Section */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {/* Existing Replies */}
                          {question.replies && question.replies.length > 0 && (
                            <div className="space-y-3 border-l-2 border-muted pl-4">
                              {question.replies.map((reply) => (
                                <div key={reply.id} className="bg-muted/50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={reply.author?.avatar || "/placeholder.svg"} />
                                      <AvatarFallback>
                                        {reply.author?.username?.charAt(0).toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">
                                          {reply.author?.username || "Unbekannt"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(reply.created_at).toLocaleDateString("de-DE")}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                          <ThumbsUp className="h-3 w-3 mr-1" />
                                          {reply.likes_count}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Form */}
                          {user && (
                            <div className="border-t pt-4">
                              <div className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                  <Textarea
                                    placeholder="Schreibe eine hilfreiche Antwort..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                    maxLength={1000}
                                  />
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">{replyContent.length}/1000</p>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitReply(question.id)}
                                      disabled={isSubmittingReply || replyContent.trim().length < 10}
                                    >
                                      <Send className="h-3 w-3 mr-2" />
                                      Antworten
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
