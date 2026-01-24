"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { 
  Search, 
  Users, 
  Calendar, 
  Store, 
  MessageSquare, 
  Gamepad2, 
  Home,
  User,
  Settings,
  BookOpen,
  Trophy,
  MapPin
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SearchResult {
  id: string
  type: "user" | "game" | "event" | "group" | "offer" | "forum"
  title: string
  subtitle?: string
  image?: string
  url: string
}

// Quick navigation links
const quickLinks = [
  { title: "Startseite", url: "/", icon: Home },
  { title: "Marktplatz", url: "/marketplace", icon: Store },
  { title: "Events", url: "/ludo-events", icon: Calendar },
  { title: "Spielgruppen", url: "/ludo-gruppen", icon: Users },
  { title: "Forum", url: "/ludo-forum", icon: MessageSquare },
  { title: "Mitglieder", url: "/ludo-mitglieder", icon: User },
  { title: "Spielarena", url: "/spielarena", icon: Trophy },
  { title: "Meine Bibliothek", url: "/library", icon: BookOpen },
  { title: "Mein Profil", url: "/profile", icon: Settings },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search function with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    const searchResults: SearchResult[] = []

    try {
      // Search users
      const { data: users } = await supabase
        .from("users")
        .select("id, username, name, avatar")
        .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(5)

      if (users) {
        searchResults.push(...users.map(u => ({
          id: u.id,
          type: "user" as const,
          title: u.username || u.name || "Unbekannt",
          subtitle: u.name && u.username ? u.name : undefined,
          image: u.avatar,
          url: `/ludo-mitglieder?user=${u.id}`,
        })))
      }

      // Search games
      const { data: games } = await supabase
        .from("games")
        .select("id, title, image")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (games) {
        searchResults.push(...games.map(g => ({
          id: g.id,
          type: "game" as const,
          title: g.title,
          image: g.image,
          url: `/library?game=${g.id}`,
        })))
      }

      // Search events
      const { data: events } = await supabase
        .from("ludo_events")
        .select("id, title, location, event_date")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (events) {
        searchResults.push(...events.map(e => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          subtitle: e.location,
          url: `/ludo-events?event=${e.id}`,
        })))
      }

      // Search groups
      const { data: groups } = await supabase
        .from("communities")
        .select("id, name, description")
        .ilike("name", `%${searchQuery}%`)
        .limit(5)

      if (groups) {
        searchResults.push(...groups.map(g => ({
          id: g.id,
          type: "group" as const,
          title: g.name,
          subtitle: g.description?.substring(0, 50),
          url: `/ludo-gruppen?group=${g.id}`,
        })))
      }

      // Search marketplace offers
      const { data: offers } = await supabase
        .from("marketplace_offers")
        .select("id, title, type, price")
        .ilike("title", `%${searchQuery}%`)
        .eq("active", true)
        .limit(5)

      if (offers) {
        searchResults.push(...offers.map(o => ({
          id: o.id,
          type: "offer" as const,
          title: o.title,
          subtitle: o.type === "sell" ? `${o.price} CHF` : o.type === "lend" ? "Vermieten" : "Tauschen",
          url: `/marketplace?view=${o.id}`,
        })))
      }

      // Search forum posts
      const { data: posts } = await supabase
        .from("ludo_forum_posts")
        .select("id, title")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (posts) {
        searchResults.push(...posts.map(p => ({
          id: p.id,
          type: "forum" as const,
          title: p.title,
          url: `/ludo-forum/${p.id}`,
        })))
      }

      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery("")
    router.push(url)
  }

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "user": return <User className="w-4 h-4" />
      case "game": return <Gamepad2 className="w-4 h-4" />
      case "event": return <Calendar className="w-4 h-4" />
      case "group": return <Users className="w-4 h-4" />
      case "offer": return <Store className="w-4 h-4" />
      case "forum": return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "user": return "Benutzer"
      case "game": return "Spiele"
      case "event": return "Events"
      case "group": return "Spielgruppen"
      case "offer": return "Angebote"
      case "forum": return "Forum"
    }
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Suchen...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Globale Suche"
        description="Suche nach Spielen, Benutzern, Events und mehr"
      >
        <CommandInput 
          placeholder="Suche nach Spielen, Benutzern, Events..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Suche...
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <>
              <CommandGroup heading="Schnellnavigation">
                {quickLinks.map((link) => (
                  <CommandItem
                    key={link.url}
                    value={link.title}
                    onSelect={() => handleSelect(link.url)}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          )}

          {!isLoading && Object.entries(groupedResults).map(([type, items], index) => (
            <div key={type}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={getTypeLabel(type as SearchResult["type"])}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.subtitle || ""}`}
                    onSelect={() => handleSelect(result.url)}
                  >
                    {result.image ? (
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src={result.image || "/placeholder.svg"} alt={result.title} />
                        <AvatarFallback>{result.title[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="mr-2">{getIcon(result.type)}</span>
                    )}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
