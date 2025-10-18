"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageSquare, Heart, Eye, Pin, Lock, Reply } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import CreateForumReplyForm from "@/components/create-forum-reply-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ForumCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

interface ForumPost {
  id: string
  title: string
  content: string
  author_id: string
  category_id: string
  is_pinned: boolean
  is_locked: boolean
  views_count: number
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    username: string
    name: string
    avatar: string
  }
  category: ForumCategory
}

interface ForumReply {
  id: string
  content: string
  post_id: string
  parent_reply_id: string | null
  author_id: string
  likes_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    username: string
    name: string
    avatar: string
  }
}

export default function ForumThreadPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [userLikedPost, setUserLikedPost] = useState(false)
  const [userLikedReplies, setUserLikedReplies] = useState<Set<string>>(new Set())
  const [likingPost, setLikingPost] = useState(false)
  const [likingReplies, setLikingReplies] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const postId = params.postId as string

  useEffect(() => {
    if (postId) {
      loadThreadData()
      incrementViewCount()
    }
  }, [postId])

  const loadThreadData = async () => {
    try {
      console.log("[v0] Loading thread data for post:", postId)
      setLoading(true)

      // Load post with author and category info
      const { data: postData, error: postError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          author:users!forum_posts_author_id_fkey(id, username, name, avatar),
          category:forum_categories!forum_posts_category_id_fkey(*)
        `)
        .eq("id", postId)
        .single()

      if (postError) throw postError

      // Load replies with author info
      const { data: repliesData, error: repliesError } = await supabase
        .from("forum_replies")
        .select(`
          *,
          author:users!forum_replies_author_id_fkey(id, username, name, avatar)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (repliesError) throw repliesError

      setPost(postData)
      setReplies(repliesData || [])

      if (user) {
        await loadUserLikes(postData.id, repliesData || [])
      }

      console.log("[v0] Thread data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading thread data:", error)
      toast.error("Fehler beim Laden der Diskussion")
      router.push("/ludo-forum")
    } finally {
      setLoading(false)
    }
  }

  const loadUserLikes = async (postId: string, repliesData: ForumReply[]) => {
    try {
      // Check if user liked the post
      const { data: postLike } = await supabase
        .from("forum_post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user!.id)
        .single()

      setUserLikedPost(!!postLike)

      // Check which replies user liked
      if (repliesData.length > 0) {
        const { data: replyLikes } = await supabase
          .from("forum_reply_likes")
          .select("reply_id")
          .eq("user_id", user!.id)
          .in(
            "reply_id",
            repliesData.map((r) => r.id),
          )

        setUserLikedReplies(new Set(replyLikes?.map((like) => like.reply_id) || []))
      }
    } catch (error) {
      console.error("[v0] Error loading user likes:", error)
    }
  }

  const incrementViewCount = async () => {
    try {
      console.log("[v0] Incrementing view count for post:", postId)
      const { data: currentPost, error: fetchError } = await supabase
        .from("forum_posts")
        .select("views_count")
        .eq("id", postId)
        .single()

      if (fetchError) {
        console.error("[v0] Error fetching current view count:", fetchError)
        return
      }

      const { error } = await supabase
        .from("forum_posts")
        .update({ views_count: (currentPost.views_count || 0) + 1 })
        .eq("id", postId)

      if (error) {
        console.error("[v0] Error incrementing view count:", error)
      } else {
        console.log("[v0] View count incremented successfully")
      }
    } catch (error) {
      console.error("[v0] Error incrementing view count:", error)
    }
  }

  const handleLikePost = async () => {
    if (!user || !post || likingPost) return

    try {
      setLikingPost(true)
      console.log("[v0] Toggling like for post:", post.id)

      if (userLikedPost) {
        // Unlike the post
        const { error } = await supabase.from("forum_post_likes").delete().eq("post_id", post.id).eq("user_id", user.id)

        if (error) throw error

        setPost((prev) => (prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : null))
        setUserLikedPost(false)
        console.log("[v0] Post unliked successfully")
      } else {
        // Like the post
        const { error } = await supabase.from("forum_post_likes").insert({
          post_id: post.id,
          user_id: user.id,
        })

        if (error) throw error

        setPost((prev) => (prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null))
        setUserLikedPost(true)
        console.log("[v0] Post liked successfully")
      }
    } catch (error) {
      console.error("[v0] Error toggling post like:", error)
      toast.error("Fehler beim Liken des Posts")
    } finally {
      setLikingPost(false)
    }
  }

  const handleLikeReply = async (replyId: string) => {
    if (!user || likingReplies.has(replyId)) return

    try {
      setLikingReplies((prev) => new Set([...prev, replyId]))
      console.log("[v0] Toggling like for reply:", replyId)

      const isLiked = userLikedReplies.has(replyId)

      if (isLiked) {
        // Unlike the reply
        const { error } = await supabase
          .from("forum_reply_likes")
          .delete()
          .eq("reply_id", replyId)
          .eq("user_id", user.id)

        if (error) throw error

        setReplies((prev) =>
          prev.map((reply) =>
            reply.id === replyId ? { ...reply, likes_count: Math.max(0, reply.likes_count - 1) } : reply,
          ),
        )
        setUserLikedReplies((prev) => {
          const newSet = new Set(prev)
          newSet.delete(replyId)
          return newSet
        })
        console.log("[v0] Reply unliked successfully")
      } else {
        // Like the reply
        const { error } = await supabase.from("forum_reply_likes").insert({
          reply_id: replyId,
          user_id: user.id,
        })

        if (error) throw error

        setReplies((prev) =>
          prev.map((reply) => (reply.id === replyId ? { ...reply, likes_count: (reply.likes_count || 0) + 1 } : reply)),
        )
        setUserLikedReplies((prev) => new Set([...prev, replyId]))
        console.log("[v0] Reply liked successfully")
      }
    } catch (error) {
      console.error("[v0] Error toggling reply like:", error)
      toast.error("Fehler beim Liken der Antwort")
    } finally {
      setLikingReplies((prev) => {
        const newSet = new Set(prev)
        newSet.delete(replyId)
        return newSet
      })
    }
  }

  const handleReplyCreated = () => {
    toast.success("Antwort wurde erfolgreich erstellt!")
    loadThreadData()
    setShowReplyForm(false)
    setReplyingTo(null)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "vor wenigen Sekunden"
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min`
    if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std`
    if (diffInSeconds < 604800) return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getNestedReplies = (parentId: string | null = null): ForumReply[] => {
    return replies.filter((reply) => reply.parent_reply_id === parentId)
  }

  const renderReply = (reply: ForumReply, depth = 0) => {
    const childReplies = getNestedReplies(reply.id)
    const maxDepth = 3
    const isLiked = userLikedReplies.has(reply.id)
    const isLiking = likingReplies.has(reply.id)

    return (
      <div key={reply.id} className={`${depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}>
        <Card className="bg-white/60 backdrop-blur-sm border-0 mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-5 w-5">
                <AvatarImage src={reply.author?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{reply.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <UserLink userId={reply.author_id} className="font-medium hover:text-teal-600 transition-colors">
                    {reply.author?.username}
                  </UserLink>
                  <span>•</span>
                  <span>{formatTimeAgo(reply.created_at)}</span>
                </div>

                <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">{reply.content}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-6 px-2 text-xs ${isLiked ? "text-red-500" : "text-gray-500"} hover:text-red-500 transition-colors`}
                      onClick={() => handleLikeReply(reply.id)}
                      disabled={!user || isLiking}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${isLiked ? "fill-current" : ""}`} />
                      <span>{Math.max(0, reply.likes_count || 0)}</span>
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {depth < maxDepth && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          if (!user) {
                            toast.info("Bitte melde dich an, um zu antworten")
                            window.location.href = "/login"
                            return
                          }
                          setReplyingTo(reply.id)
                          setShowReplyForm(true)
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Antworten
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render child replies */}
        {childReplies.map((childReply) => renderReply(childReply, depth + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
        <Navigation currentPage="ludo-forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
        <Navigation currentPage="ludo-forum" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Diskussion nicht gefunden</h3>
            <Button onClick={() => router.push("/ludo-forum")} className="playful-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Forum
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const topLevelReplies = getNestedReplies(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-forum" />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/ludo-forum")} className="mb-6 hover:bg-white/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Forum
        </Button>

        {/* Original Post */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.is_pinned && <Pin className="h-4 w-4 text-orange-500" />}
                  {post.is_locked && <Lock className="h-4 w-4 text-gray-500" />}
                  <CardTitle className="font-handwritten text-2xl text-gray-800">{post.title}</CardTitle>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <UserLink userId={post.author_id} className="font-medium hover:text-teal-600 transition-colors">
                    {post.author?.username}
                  </UserLink>
                  <span>•</span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: post.category?.color, color: post.category?.color }}
                  >
                    {post.category?.name}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{post.content}</p>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.replies_count} Antworten</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 px-3 ${userLikedPost ? "text-red-500" : "text-gray-500"} hover:text-red-500 transition-colors`}
                  onClick={handleLikePost}
                  disabled={!user || likingPost}
                >
                  <Heart className={`h-4 w-4 mr-1 ${userLikedPost ? "fill-current" : ""}`} />
                  <span>{Math.max(0, post.likes_count || 0)} Likes</span>
                </Button>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views_count} Aufrufe</span>
                </div>
              </div>

              {!post.is_locked && (
                <Button
                  onClick={() => {
                    if (!user) {
                      toast.info("Bitte melde dich an, um zu antworten")
                      window.location.href = "/login"
                      return
                    }
                    setReplyingTo(null)
                    setShowReplyForm(true)
                  }}
                  className="playful-button"
                  size="sm"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Antworten
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {showReplyForm && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 mb-8">
            <CardContent className="p-6">
              <CreateForumReplyForm
                postId={postId}
                parentReplyId={replyingTo}
                onSuccess={handleReplyCreated}
                onCancel={() => {
                  setShowReplyForm(false)
                  setReplyingTo(null)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        {topLevelReplies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-handwritten text-xl text-gray-800 mb-4">
              {post.replies_count} {post.replies_count === 1 ? "Antwort" : "Antworten"}
            </h3>
            {topLevelReplies.map((reply) => renderReply(reply))}
          </div>
        )}

        {/* No Replies State */}
        {topLevelReplies.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Noch keine Antworten</h3>
            <p className="text-gray-500 mb-4">Sei der Erste und starte die Diskussion!</p>
            {!post.is_locked && (
              <Button
                onClick={() => {
                  if (!user) {
                    toast.info("Bitte melde dich an, um zu antworten")
                    window.location.href = "/login"
                    return
                  }
                  setReplyingTo(null)
                  setShowReplyForm(true)
                }}
                className="playful-button"
              >
                <Reply className="h-4 w-4 mr-2" />
                Erste Antwort schreiben
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
