"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { 
  Search, 
  Gamepad2, 
  Users, 
  Calendar, 
  ShoppingBag, 
  MessageSquare,
  User,
  Home,
  BookOpen,
  Store,
  Trophy
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SearchResult {
  id: string
  type: "game" | "user" | "group" | "event" | "offer" | "forum"
  title: string
  subtitle?: string
  image?: string
  url: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      // Escape closes the dialog
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchResults: SearchResult[] = []

    try {
      // Search games
      const { data: games } = await supabase
        .from("user_games")
        .select("id, title, image, publisher")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (games) {
        searchResults.push(...games.map(game => ({
          id: game.id,
          type: "game" as const,
          title: game.title,
          subtitle: game.publisher || "Spiel",
          image: game.image,
          url: `/library?game=${game.id}`
        })))
      }

      // Search users
      const { data: users } = await supabase
        .from("users")
        .select("id, username, name, avatar")
        .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(5)

      if (users) {
        searchResults.push(...users.map(user => ({
          id: user.id,
          type: "user" as const,
          title: user.username || user.name || "Benutzer",
          subtitle: user.name && user.username ? user.name : undefined,
          image: user.avatar,
          url: `/ludo-mitglieder?user=${user.id}`
        })))
      }

      // Search groups/communities
      const { data: groups } = await supabase
        .from("communities")
        .select("id, name, description, image")
        .ilike("name", `%${searchQuery}%`)
        .limit(5)

      if (groups) {
        searchResults.push(...groups.map(group => ({
          id: group.id,
          type: "group" as const,
          title: group.name,
          subtitle: "Spielgruppe",
          image: group.image,
          url: `/ludo-gruppen?group=${group.id}`
        })))
      }

      // Search events
      const { data: events } = await supabase
        .from("ludo_events")
        .select("id, title, location, event_date")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (events) {
        searchResults.push(...events.map(event => ({
          id: event.id,
          type: "event" as const,
          title: event.title,
          subtitle: event.location || "Event",
          url: `/ludo-events?event=${event.id}`
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
        searchResults.push(...offers.map(offer => ({
          id: offer.id,
          type: "offer" as const,
          title: offer.title,
          subtitle: offer.price ? `${offer.price}` : offer.type,
          url: `/marketplace?view=${offer.id}`
        })))
      }

      // Search forum posts
      const { data: posts } = await supabase
        .from("ludo_forum_posts")
        .select("id, title, category")
        .ilike("title", `%${searchQuery}%`)
        .limit(5)

      if (posts) {
        searchResults.push(...posts.map(post => ({
          id: post.id,
          type: "forum" as const,
          title: post.title,
          subtitle: post.category || "Forum",
          url: `/ludo-forum/${post.id}`
        })))
      }

      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
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

  const getIcon = (type: string) => {
    switch (type) {
      case "game": return <Gamepad2 className="w-4 h-4 text-orange-500" />
      case "user": return <User className="w-4 h-4 text-blue-500" />
      case "group": return <Users className="w-4 h-4 text-green-500" />
      case "event": return <Calendar className="w-4 h-4 text-purple-500" />
      case "offer": return <ShoppingBag className="w-4 h-4 text-amber-500" />
      case "forum": return <MessageSquare className="w-4 h-4 text-pink-500" />
      default: return <Search className="w-4 h-4" />
    }
  }

  // Quick links when no search query
  const quickLinks = [
    { title: "Startseite", icon: Home, url: "/" },
    { title: "Meine Bibliothek", icon: BookOpen, url: "/library" },
    { title: "Marktplatz", icon: Store, url: "/marketplace" },
    { title: "Spielgruppen", icon: Users, url: "/ludo-gruppen" },
    { title: "Events", icon: Calendar, url: "/ludo-events" },
    { title: "Forum", icon: MessageSquare, url: "/ludo-forum" },
    { title: "Spielarena", icon: Trophy, url: "/spielarena" },
  ]

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Suchen...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Spiele, Benutzer, Gruppen, Events suchen..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isSearching && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Suche läuft...
            </div>
          )}
          
          {!isSearching && query.length < 2 && (
            <>
              <CommandGroup heading="Schnellzugriff">
                {quickLinks.map((link) => (
                  <CommandItem
                    key={link.url}
                    onSelect={() => handleSelect(link.url)}
                    className="cursor-pointer"
                  >
                    <link.icon className="mr-2 h-4 w-4 text-orange-500" />
                    <span>{link.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          )}

          {!isSearching && results.length > 0 && (
            <>
              {/* Games */}
              {results.filter(r => r.type === "game").length > 0 && (
                <CommandGroup heading="Spiele">
                  {results.filter(r => r.type === "game").map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result.url)}
                      className="cursor-pointer"
                    >
                      {result.image ? (
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={result.image || "/placeholder.svg"} alt={result.title} />
                          <AvatarFallback>{getIcon(result.type)}</AvatarFallback>
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
              )}

              {/* Users */}
              {results.filter(r => r.type === "user").length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Benutzer">
                    {results.filter(r => r.type === "user").map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={result.image || ""} alt={result.title} />
                          <AvatarFallback>{result.title[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Groups */}
              {results.filter(r => r.type === "group").length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Spielgruppen">
                    {results.filter(r => r.type === "group").map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{getIcon(result.type)}</span>
                        <span>{result.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Events */}
              {results.filter(r => r.type === "event").length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Events">
                    {results.filter(r => r.type === "event").map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{getIcon(result.type)}</span>
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Offers */}
              {results.filter(r => r.type === "offer").length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Marktplatz">
                    {results.filter(r => r.type === "offer").map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{getIcon(result.type)}</span>
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Forum */}
              {results.filter(r => r.type === "forum").length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Forum">
                    {results.filter(r => r.type === "forum").map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{getIcon(result.type)}</span>
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
