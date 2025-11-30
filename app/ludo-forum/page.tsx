"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Pin, Lock } from "lucide-react"
import { MdQuestionAnswer } from "react-icons/md"
import { FaEye, FaHeart } from "react-icons/fa"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import CreateForumPostForm from "@/components/create-forum-post-form"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import { ForumPostReactions } from "@/components/forum-post-reactions"

interface ForumPost {
  id: string
  title: string
  content: string
  author_id: string
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
}

export default function LudoForumPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    loadForumData()
  }, [])

  const loadForumData = async () => {
    try {
      setLoading(true)

      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select(`
          *,
          author:users!forum_posts_author_id_fkey(id, username, name, avatar)
        `)
        .order("created_at", { ascending: false })

      if (postsError) throw postsError

      setPosts(postsData || [])
    } catch (error) {
      console.error("Error loading forum data:", error)
      toast.error("Fehler beim Laden der Forum-Daten")
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    toast.success("Diskussion wurde erfolgreich erstellt!")
    loadForumData()
    setShowCreateDialog(false)
  }

  const getFilteredPosts = () => {
    let filtered = posts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        break
      case "popular":
        filtered.sort((a, b) => b.likes_count - a.likes_count)
        break
      case "unanswered":
        filtered.sort((a, b) => a.replies_count - b.replies_count)
        break
      case "replies":
        filtered.sort((a, b) => b.replies_count - a.replies_count)
        break
      case "views":
        filtered.sort((a, b) => b.views_count - a.views_count)
        break
    }

    // Pinned posts always come first
    const pinnedPosts = filtered.filter((post) => post.is_pinned)
    const regularPosts = filtered.filter((post) => !post.is_pinned)

    return [...pinnedPosts, ...regularPosts]
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

  const filteredPosts = getFilteredPosts()

  const handlePostClick = (postId: string) => {
    router.push(`/ludo-forum/${postId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-forum" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Forum</h1>
          <div className="mt-6">
            {user && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten">
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Diskussion
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 -m-6 mb-6 z-10">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
                        Neue Diskussion erstellen
                      </DialogTitle>
                      <p className="text-xs text-gray-600">Starte eine neue Diskussion in der Community</p>
                    </DialogHeader>
                  </div>
                  <CreateForumPostForm onSuccess={handlePostCreated} onCancel={() => setShowCreateDialog(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Diskussionen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/80 border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 h-9 text-xs"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sortieren nach:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortBy === "recent" ? "default" : "outline"}
                  onClick={() => setSortBy("recent")}
                  className={`h-9 text-xs px-3 ${sortBy === "recent" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Neueste
                </Button>
                <Button
                  variant={sortBy === "unanswered" ? "default" : "outline"}
                  onClick={() => setSortBy("unanswered")}
                  className={`h-9 text-xs px-3 ${sortBy === "unanswered" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Unbeantwortet
                </Button>
                <Button
                  variant={sortBy === "popular" ? "default" : "outline"}
                  onClick={() => setSortBy("popular")}
                  className={`h-9 text-xs px-3 ${sortBy === "popular" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Meist gelikt
                </Button>
                <Button
                  variant={sortBy === "replies" ? "default" : "outline"}
                  onClick={() => setSortBy("replies")}
                  className={`h-9 text-xs px-3 ${sortBy === "replies" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Meist beantwortet
                </Button>
                <Button
                  variant={sortBy === "views" ? "default" : "outline"}
                  onClick={() => setSortBy("views")}
                  className={`h-9 text-xs px-3 ${sortBy === "views" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Meist gesehen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            {loading ? "Lade Diskussionen..." : `${filteredPosts.length} Diskussionen gefunden`}
            {searchTerm && ` für "${searchTerm}"`}
          </p>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <MdQuestionAnswer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Keine Diskussionen gefunden</h3>
                  <p className="text-gray-500 text-xs mb-4">
                    {searchTerm
                      ? "Versuche einen anderen Suchbegriff"
                      : "Sei der Erste und starte eine neue Diskussion!"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateDialog(true)} className="playful-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Diskussion starten
                    </Button>
                  )}
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {post.is_pinned && <Pin className="h-4 w-4 text-orange-500" />}
                                {post.is_locked && <Lock className="h-4 w-4 text-gray-500" />}
                                <h3 className="font-handwritten text-gray-800 group-hover:text-teal-600 transition-colors line-clamp-1 text-xs">
                                  {post.title}
                                </h3>
                              </div>

                              <div className="text-gray-600 text-xs line-clamp-2 mb-p3 my-2.5">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs text-gray-500">
                                      {post.author?.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <UserLink
                                      userId={post.author_id}
                                      className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
                                    >
                                      {post.author?.username}
                                    </UserLink>
                                  </div>
                                  <span>•</span>
                                  <span className="text-gray-500 text-xs">{formatTimeAgo(post.created_at)}</span>
                                </div>
                              </div>

                              <p className="text-gray-500 text-xs line-clamp-2 mb-p3 my-2.5">{post.content}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <MdQuestionAnswer className="h-4 w-4" />
                                <span>{post.replies_count}</span>
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <FaHeart className="h-4 w-4" />
                                <span>{post.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <FaEye className="h-4 w-4" />
                                <span>{post.views_count}</span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent hover:bg-teal-50 hover:border-teal-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!user) {
                                  toast.info("Bitte melde dich an, um zu antworten")
                                  window.location.href = "/login"
                                  return
                                }
                                handlePostClick(post.id)
                              }}
                            >
                              Antworten
                            </Button>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <ForumPostReactions postId={post.id} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="hidden lg:block w-40">
            <div className="sticky top-8">
              <SkyscraperAd />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
