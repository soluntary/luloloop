"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, MessageSquare, Heart, Eye, Pin, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import CreateForumPostForm from "@/components/create-forum-post-form"
import { LeaderboardAd, MediumRectangleAd, SkyscraperAd } from "@/components/advertising/ad-placements"

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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stelle Fragen, teile deine Gedanken und diskutiere mit der Community!
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Diskussionen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-gray-200 focus:border-teal-500"
                />
              </div>

              <div className="flex justify-center md:justify-end">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="playful-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Neue Diskussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <CreateForumPostForm onSuccess={handlePostCreated} onCancel={() => setShowCreateDialog(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sortieren nach:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={sortBy === "recent" ? "default" : "outline"}
                  onClick={() => setSortBy("recent")}
                  className={sortBy === "recent" ? "bg-teal-600 hover:bg-teal-700" : "bg-white/80 hover:bg-teal-50"}
                >
                  Neueste
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === "unanswered" ? "default" : "outline"}
                  onClick={() => setSortBy("unanswered")}
                  className={sortBy === "unanswered" ? "bg-teal-600 hover:bg-teal-700" : "bg-white/80 hover:bg-teal-50"}
                >
                  Unbeantwortet
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === "popular" ? "default" : "outline"}
                  onClick={() => setSortBy("popular")}
                  className={sortBy === "popular" ? "bg-teal-600 hover:bg-teal-700" : "bg-white/80 hover:bg-teal-50"}
                >
                  Meist gelikt
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === "replies" ? "default" : "outline"}
                  onClick={() => setSortBy("replies")}
                  className={sortBy === "replies" ? "bg-teal-600 hover:bg-teal-700" : "bg-white/80 hover:bg-teal-50"}
                >
                  Meist beantwortet
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === "views" ? "default" : "outline"}
                  onClick={() => setSortBy("views")}
                  className={sortBy === "views" ? "bg-teal-600 hover:bg-teal-700" : "bg-white/80 hover:bg-teal-50"}
                >
                  Meist gesehen
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
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
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine Diskussionen gefunden</h3>
                  <p className="text-gray-500 mb-4">
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
                                <h3 className="font-handwritten text-lg text-gray-800 group-hover:text-teal-600 transition-colors line-clamp-1">
                                  {post.title}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {post.author?.username?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <UserLink
                                  userId={post.author_id}
                                  className="font-medium hover:text-teal-600 transition-colors"
                                >
                                  {post.author?.username}
                                </UserLink>
                                <span>•</span>
                                <span>{formatTimeAgo(post.created_at)}</span>
                              </div>

                              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.replies_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.views_count}</span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent hover:bg-teal-50 hover:border-teal-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePostClick(post.id)
                              }}
                            >
                              Antworten
                            </Button>
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
