"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageSquare, Clock, Heart, Database, ArrowUpDown, Reply, Send, ThumbsUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import NewForumPostForm from "@/components/new-forum-post-form" // Import the NewForumPostForm component
import { useAvatar } from "@/contexts/avatar-context"
import { UserLink } from "@/components/user-link" // Added UserLink import

interface ForumPost {
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
  replies?: ForumReply[]
}

interface ForumReply {
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

interface UserProfile {
  id: string
  username: string
  avatar?: string
  created_at: string
  bio?: string
}

function ForumLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Forum wird geladen...
        </h2>
        <p className="text-xl text-gray-600 text-center font-body transform rotate-1">
          Wir sammeln die besten Diskussionen für dich!
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )
}

export default function ForumPage() {
  const { user } = useAuth()
  const { getAvatar } = useAvatar()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadForumData()
    if (user) {
      loadUserLikes()
    }
  }, [user])

  const loadForumData = async () => {
    try {
      const supabase = createClient()

      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          users:author_id(id, username, avatar)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (postsError) {
        console.error("Error loading posts:", postsError)
        setError("Fehler beim Laden der Beiträge.")
        return
      }

      if (postsData) {
        const postsWithCounts = await Promise.all(
          postsData.map(async (post) => {
            const { count: likesCount } = await supabase
              .from("forum_post_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id)

            const { count: repliesCount } = await supabase
              .from("forum_replies")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id)

            return {
              ...post,
              author: post.users,
              likes_count: likesCount || 0,
              replies_count: repliesCount || 0,
              views_count: post.views_count || 0,
            }
          }),
        )

        setPosts(postsWithCounts)
      }
    } catch (error) {
      console.error("Error loading forum data:", error)
      setError("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setLoading(false)
    }
  }

  const refreshForumData = () => {
    loadForumData()
  }

  const loadReplies = async (postId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          id,
          content,
          created_at,
          users:author_id(id, username, avatar)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error

      const repliesWithCounts = await Promise.all(
        (data || []).map(async (reply) => {
          const { count: likesCount } = await supabase
            .from("forum_reply_likes")
            .select("*", { count: "exact", head: true })
            .eq("reply_id", reply.id)

          return {
            ...reply,
            author: reply.users,
            likes_count: likesCount || 0,
          }
        }),
      )

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies: repliesWithCounts } : p)))
    } catch (error) {
      console.error("Error loading replies:", error)
    }
  }

  const handleExpandPost = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      loadReplies(postId)
    }
  }

  const handleSubmitReply = async (postId: string) => {
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
        post_id: postId,
        author_id: user.id,
      })

      if (error) throw error

      toast.success("Antwort erfolgreich gesendet!")
      setReplyContent("")

      loadReplies(postId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies_count: p.replies_count + 1 } : p)))
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast.error("Fehler beim Senden der Antwort")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const loadUserLikes = async () => {
    if (!user) return

    try {
      const supabase = createClient()

      const { data: likedPostsData } = await supabase.from("forum_post_likes").select("post_id").eq("user_id", user.id)

      const { data: likedRepliesData } = await supabase
        .from("forum_reply_likes")
        .select("reply_id")
        .eq("user_id", user.id)

      if (likedPostsData) {
        setLikedPosts(new Set(likedPostsData.map((like) => like.post_id)))
      }

      if (likedRepliesData) {
        setLikedReplies(new Set(likedRepliesData.map((like) => like.reply_id)))
      }
    } catch (error) {
      console.error("Error loading user likes:", error)
    }
  }

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um zu liken")
      return
    }

    try {
      const supabase = createClient()
      const isLiked = likedPosts.has(postId)

      if (isLiked) {
        await supabase.from("forum_post_likes").delete().eq("post_id", postId).eq("user_id", user.id)

        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })

        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p)))
      } else {
        await supabase.from("forum_post_likes").insert({ post_id: postId, user_id: user.id })

        setLikedPosts((prev) => new Set(prev).add(postId))

        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)))
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Fehler beim Liken des Beitrags")
    }
  }

  const handleLikeReply = async (replyId: string, postId: string) => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um zu liken")
      return
    }

    try {
      const supabase = createClient()
      const isLiked = likedReplies.has(replyId)

      if (isLiked) {
        await supabase.from("forum_reply_likes").delete().eq("reply_id", replyId).eq("user_id", user.id)

        setLikedReplies((prev) => {
          const newSet = new Set(prev)
          newSet.delete(replyId)
          return newSet
        })

        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  replies: p.replies?.map((r) => (r.id === replyId ? { ...r, likes_count: r.likes_count - 1 } : r)),
                }
              : p,
          ),
        )
      } else {
        await supabase.from("forum_reply_likes").insert({ reply_id: replyId, user_id: user.id })

        setLikedReplies((prev) => new Set(prev).add(replyId))

        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  replies: p.replies?.map((r) => (r.id === replyId ? { ...r, likes_count: r.likes_count + 1 } : r)),
                }
              : p,
          ),
        )
      }
    } catch (error) {
      console.error("Error liking reply:", error)
      toast.error("Fehler beim Liken der Antwort")
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "popularity":
        const scoreA = a.likes_count * 3 + a.views_count * 1 + a.replies_count * 2
        const scoreB = b.likes_count * 3 + b.views_count * 1 + b.replies_count * 2
        return scoreB - scoreA
      case "unanswered":
        if (a.replies_count === 0 && b.replies_count > 0) return -1
        if (a.replies_count > 0 && b.replies_count === 0) return 1
        if (a.replies_count === 0 && b.replies_count === 0) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (loading) {
    return <ForumLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 font-body">
      <Navigation currentPage="forum" />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start space-x-4">
              <Database className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-700 font-handwritten text-xl mb-2">
                  🚨 Datenbank-Setup erforderlich
                </h3>
                <p className="text-red-600 font-body mb-4">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Community Diskussionen
          </h1>
          <p className="text-xl text-gray-600 text-center font-body transform rotate-1">
            Stelle Fragen, teile deine Gedanken und diskutiere mit der Community!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {user && (
            <div className="mb-6">
              <div className="flex justify-end">
                <NewForumPostForm onPostCreated={refreshForumData} />
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Search Section */}
                <div className="flex-1">
                  <div className="relative flex-row">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Diskussionen durchsuchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-3 border-0 bg-gray-50/80 focus:bg-white rounded-xl text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Filter Section */}
                <div className="flex items-center gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 border-0 bg-gray-50/80 hover:bg-white rounded-xl py-3 focus:ring-2 focus:ring-teal-200 transition-all duration-200 flex items-center gap-2">
                      <span className="text-muted-foreground whitespace-nowrap">Sortieren nach:</span>
                      <span className="font-medium text-foreground">
                        {sortBy === "newest" && "Neueste"}
                        {sortBy === "popularity" && "Beliebheit"}
                        {sortBy === "unanswered" && "Unbeantwortet"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg">
                      <SelectItem value="newest" className="rounded-lg">
                        Neueste
                      </SelectItem>
                      <SelectItem value="popularity" className="rounded-lg">
                        Beliebheit
                      </SelectItem>
                      <SelectItem value="unanswered" className="rounded-lg">
                        Unbeantwortet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Summary */}
              {sortedPosts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>
                      {sortedPosts.length} {sortedPosts.length === 1 ? "Diskussion" : "Diskussionen"}
                      {searchQuery && ` für "${searchQuery}"`}
                      {sortBy === "newest" && " • Neueste zuerst"}
                      {sortBy === "popularity" && " • Nach Beliebheit sortiert"}
                      {sortBy === "unanswered" && " • Unbeantwortet zuerst"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {sortedPosts.length === 0 ? (
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-gray-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 transform rotate-12">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-handwritten text-gray-800 mb-2 transform -rotate-1">
                    Keine Diskussionen gefunden
                  </h3>
                  <p className="text-gray-600 text-center font-body transform rotate-1">
                    {searchQuery
                      ? "Versuche einen anderen Suchbegriff"
                      : sortBy === "unanswered"
                        ? "Alle Fragen wurden bereits beantwortet!"
                        : "Sei der Erste und starte eine Diskussion!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {sortedPosts.map((post) => {
                  const isExpanded = expandedPost === post.id

                  return (
                    <Card
                      key={post.id}
                      className="group hover:shadow-xl transition-all duration-300 border-2 border-teal-100 hover:border-teal-300 bg-white/80 backdrop-blur-sm hover:scale-[1.02]"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-handwritten text-lg text-gray-800 mb-2 hover:text-teal-600 cursor-pointer transition-colors">
                              {post.title}
                            </h3>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-2 font-body">{post.content}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-4 font-body">
                                <UserLink
                                  userId={post.author?.id || ""}
                                  className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
                                >
                                  von {post.author?.username || "Unbekannt"}
                                </UserLink>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs text-gray-500">
                                    {new Date(post.created_at).toLocaleDateString("de-DE")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleLikePost(post.id)}
                                  disabled={!user}
                                  className={`flex items-center gap-1 transition-all duration-200 transform hover:scale-110 ${
                                    likedPosts.has(post.id) ? "text-red-500" : "text-teal-600 hover:text-red-500"
                                  } ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <Heart className={`h-3 w-3 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                                  <span className="font-medium">{post.likes_count}</span>
                                </button>
                                <div className="flex items-center gap-1 text-orange-600">
                                  <MessageSquare className="h-3 w-3" />
                                  <span className="font-medium">{post.replies_count}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExpandPost(post.id)}
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-body"
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              {isExpanded ? "Antworten ausblenden" : "Antworten anzeigen"}
                            </Button>

                            {isExpanded && (
                              <div className="mt-4 space-y-4">
                                {post.replies && post.replies.length > 0 && (
                                  <div className="space-y-3 border-l-2 border-teal-200 pl-4">
                                    {post.replies.map((reply) => (
                                      <div key={reply.id} className="bg-teal-50/50 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                          <Avatar className="h-8 w-8 border border-teal-200">
                                            <AvatarImage
                                              src={getAvatar(reply.author?.id || "", reply.author?.username)}
                                            />
                                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                                              {reply.author?.username?.charAt(0).toUpperCase() || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <UserLink
                                                userId={reply.author?.id || ""}
                                                className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
                                              >
                                                {reply.author?.username || "Unbekannt"}
                                              </UserLink>
                                              <span className="text-xs text-gray-500 font-body">
                                                {new Date(reply.created_at).toLocaleDateString("de-DE")}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed font-body">
                                              {reply.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleLikeReply(reply.id, post.id)}
                                                disabled={!user}
                                                className={`h-6 px-2 text-xs transition-all duration-200 transform hover:scale-105 ${
                                                  likedReplies.has(reply.id)
                                                    ? "text-red-500 bg-red-50 border border-red-200"
                                                    : "text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border hover:border-red-200"
                                                } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                                              >
                                                <ThumbsUp
                                                  className={`h-3 w-3 mr-1 ${likedReplies.has(reply.id) ? "fill-current" : ""}`}
                                                />
                                                <span className="font-medium">{reply.likes_count}</span>
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {user && (
                                  <div className="border-t border-teal-200 pt-4">
                                    <div className="flex gap-3">
                                      <Avatar className="h-8 w-8 border border-teal-200">
                                        <AvatarImage src={getAvatar(user.id, user.email) || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                                          {user.username?.charAt(0).toUpperCase() || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 space-y-2">
                                        <Textarea
                                          placeholder="Schreibe eine Antwort..."
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          className="min-h-[80px] resize-none border-teal-200 focus:border-teal-400 font-body"
                                          maxLength={1000}
                                        />
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs text-gray-500 font-body">{replyContent.length}/1000</p>
                                          <Button
                                            size="sm"
                                            onClick={() => handleSubmitReply(post.id)}
                                            disabled={isSubmittingReply || replyContent.trim().length < 10}
                                            className="bg-teal-500 hover:bg-teal-600 text-white font-body"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
