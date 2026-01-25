"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Pin, Lock } from "lucide-react"
import { MdQuestionAnswer } from "react-icons/md"
import { FaEye, FaHeart } from "react-icons/fa"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import { ForumPostReactions } from "@/components/forum-post-reactions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "",
    duplicateChecked: false,
  })
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

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((post) => {
        const categoryMatch = post.content?.match(/^\[KATEGORIE:(.*?)\]/)
        const postCategory = categoryMatch ? categoryMatch[1] : null
        return postCategory === categoryFilter
      })
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
          <h1 className="font-handwritten text-3xl sm:text-4xl md:text-5xl text-gray-800 mb-4">Forum</h1>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} className="font-handwritten bg-teal-500 hover:bg-teal-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Neue Diskussion
            </Button>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm mb-8">
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
            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Kategorie:</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  variant={categoryFilter === "all" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("all")}
                  className={`h-8 text-xs px-2 sm:px-3 ${categoryFilter === "all" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Alle
                </Button>
                <Button
                  variant={categoryFilter === "spielempfehlungen" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("spielempfehlungen")}
                  className={`h-8 text-xs px-2 sm:px-3 ${categoryFilter === "spielempfehlungen" ? "bg-blue-500 hover:bg-blue-600 border-blue-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Spielempfehlungen</span>
                  <span className="sm:hidden">Empfehlungen</span>
                </Button>
                <Button
                  variant={categoryFilter === "spielregeln" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("spielregeln")}
                  className={`h-8 text-xs px-2 sm:px-3 ${categoryFilter === "spielregeln" ? "bg-purple-500 hover:bg-purple-600 border-purple-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Spielregeln
                </Button>
                <Button
                  variant={categoryFilter === "strategien" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("strategien")}
                  className={`h-8 text-xs px-2 sm:px-3 ${categoryFilter === "strategien" ? "bg-green-500 hover:bg-green-600 border-green-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Strategien & Tipps</span>
                  <span className="sm:hidden">Strategien</span>
                </Button>
                <Button
                  variant={categoryFilter === "sonstiges" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("sonstiges")}
                  className={`h-8 text-xs px-2 sm:px-3 ${categoryFilter === "sonstiges" ? "bg-gray-500 hover:bg-gray-600 border-gray-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Sonstiges
                </Button>
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sortieren nach:</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  variant={sortBy === "recent" ? "default" : "outline"}
                  onClick={() => setSortBy("recent")}
                  className={`h-8 text-xs px-2 sm:px-3 ${sortBy === "recent" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  Neueste
                </Button>
                <Button
                  variant={sortBy === "unanswered" ? "default" : "outline"}
                  onClick={() => setSortBy("unanswered")}
                  className={`h-8 text-xs px-2 sm:px-3 ${sortBy === "unanswered" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Unbeantwortet</span>
                  <span className="sm:hidden">Offen</span>
                </Button>
                <Button
                  variant={sortBy === "popular" ? "default" : "outline"}
                  onClick={() => setSortBy("popular")}
                  className={`h-8 text-xs px-2 sm:px-3 ${sortBy === "popular" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Meist gelikt</span>
                  <span className="sm:hidden">Beliebt</span>
                </Button>
                <Button
                  variant={sortBy === "replies" ? "default" : "outline"}
                  onClick={() => setSortBy("replies")}
                  className={`h-8 text-xs px-2 sm:px-3 ${sortBy === "replies" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Meist beantwortet</span>
                  <span className="sm:hidden">Antworten</span>
                </Button>
                <Button
                  variant={sortBy === "views" ? "default" : "outline"}
                  onClick={() => setSortBy("views")}
                  className={`h-8 text-xs px-2 sm:px-3 ${sortBy === "views" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <span className="hidden sm:inline">Meist gesehen</span>
                  <span className="sm:hidden">Views</span>
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
            {categoryFilter !== "all" && ` in Kategorie "${categoryFilter === "spielempfehlungen" ? "Spielempfehlungen" : categoryFilter === "spielregeln" ? "Spielregeln" : categoryFilter === "strategien" ? "Strategien & Tipps" : "Sonstiges"}"`}
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
                    <Button 
                      onClick={() => {
                        if (!user) {
                          window.location.href = "/login?redirect=/ludo-forum"
                          return
                        }
                        setShowCreateDialog(true)
                      }} 
                      className="playful-button"
                    >
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

                              {/* Kategorie Badge - extrahiert aus Content */}
                              {(() => {
                                const categoryMatch = post.content?.match(/^\[KATEGORIE:(.*?)\]/)
                                const category = categoryMatch ? categoryMatch[1] : null
                                if (!category) return null
                                
                                const badgeConfig: Record<string, { bg: string; text: string; label: string }> = {
                                  spielempfehlungen: { bg: "bg-blue-100", text: "text-blue-700", label: "Spielempfehlungen" },
                                  spielregeln: { bg: "bg-purple-100", text: "text-purple-700", label: "Spielregeln" },
                                  strategien: { bg: "bg-green-100", text: "text-green-700", label: "Strategien & Tipps" },
                                  sonstiges: { bg: "bg-gray-100", text: "text-gray-700", label: "Sonstiges" },
                                }
                                const config = badgeConfig[category]
                                if (!config) return null
                                
                                return (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${config.bg} ${config.text}`}>
                                    {config.label}
                                  </span>
                                )
                              })()}

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

                              <p className="text-gray-500 text-xs line-clamp-2 mb-p3 my-2.5">{post.content?.replace(/^\[KATEGORIE:.*?\]\n?/, "")}</p>
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

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <ForumPostReactions postId={post.id} />
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

        {/* Create Discussion Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl font-semibold text-gray-800">Neue Diskussion erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* Kategorie */}
              <div>
                <Label htmlFor="post-category" className="text-sm font-medium text-gray-700">
                  Kategorie <span className="text-red-500">*</span>
                </Label>
                <select
                  id="post-category"
                  value={newPost.category || ""}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full mt-1.5 p-2.5 border border-gray-200 rounded-lg bg-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs"
                >
                  <option value="">Kategorie auswählen...</option>
                  <option value="spielempfehlungen">Spielempfehlungen</option>
                  <option value="spielregeln">Spielregeln</option>
                  <option value="strategien">Strategien & Tipps</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>

              {/* Titel */}
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="post-title" className="text-sm font-medium text-gray-700">
                    Titel der Diskussion <span className="text-red-500">*</span>
                  </Label>
                  <span className={`text-xs ${newPost.title.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                    {newPost.title.length}/60
                  </span>
                </div>
                <Input
                  id="post-title"
                  value={newPost.title}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) {
                      setNewPost({ ...newPost, title: e.target.value })
                    }
                  }}
                  maxLength={60}
                  placeholder="Gib deiner Diskussion einen aussagekräftigen Titel..."
                  className="mt-1.5 border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {/* Beschreibung */}
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="post-content" className="text-sm font-medium text-gray-700">
                    Beschreibung
                  </Label>
                  <span className={`text-xs ${newPost.content.length > 5000 ? "text-red-500" : "text-gray-400"}`}>
                    {newPost.content.length}/5000
                  </span>
                </div>
                <textarea
                  id="post-content"
                  value={newPost.content}
                  onChange={(e) => {
                    if (e.target.value.length <= 5000) {
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                  }}
                  maxLength={5000}
                  className="w-full mt-1.5 h-40 p-3 border border-gray-200 rounded-lg resize-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs"
                  placeholder="Beschreibe dein Anliegen oder stelle deine Frage..."
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="duplicate-check"
                  checked={newPost.duplicateChecked || false}
                  onChange={(e) => setNewPost({ ...newPost, duplicateChecked: e.target.checked })}
                  className="mt-0.5 h-4 w-4 text-teal-500 border-gray-300 rounded focus:ring-teal-400"
                />
                <Label htmlFor="duplicate-check" className="text-sm text-gray-600 cursor-pointer">
                  Ich habe geprüft, ob es bereits eine ähnliche Diskussion gibt. <span className="text-red-500">*</span>
                </Label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setNewPost({ title: "", content: "", category: "", duplicateChecked: false })
                  }}
                  className="border-gray-200"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={async () => {
                    if (!user) {
                      toast.error("Du musst angemeldet sein")
                      return
                    }
                    if (!newPost.category) {
                      toast.error("Bitte wähle eine Kategorie aus")
                      return
                    }
                    if (!newPost.title.trim()) {
                      toast.error("Bitte gib einen Titel ein")
                      return
                    }
                    if (!newPost.duplicateChecked) {
                      toast.error("Bitte bestätige, dass du nach ähnlichen Diskussionen gesucht hast")
                      return
                    }

                    try {
                      // Kategorie als Prefix im Content speichern, da post_type einen CHECK constraint hat
                      const categoryPrefix = `[KATEGORIE:${newPost.category}]\n`
                      
                      const { data, error } = await supabase.from("forum_posts").insert({
                        title: newPost.title.trim(),
                        content: categoryPrefix + newPost.content.trim(),
                        author_id: user.id,
                        post_type: "discussion",
                      }).select()

                      if (error) {
                        console.error("[v0] Error creating post:", error.message, error.details, error.hint)
                        throw error
                      }

                      toast.success("Diskussion wurde erstellt!")
                      setNewPost({ title: "", content: "", category: "", duplicateChecked: false })
                      setShowCreateDialog(false)
                      loadForumData()
                    } catch (error) {
                      console.error("Error:", error)
                      toast.error("Fehler beim Erstellen der Diskussion")
                    }
                  }}
                  disabled={!newPost.category || !newPost.title.trim() || !newPost.duplicateChecked}
                  className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Erstellen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
