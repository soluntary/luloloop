"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface AvatarContextType {
  avatarCache: Map<string, string>
  updateAvatar: (userId: string, avatarUrl: string) => void
  getAvatar: (userId: string, fallbackEmail?: string) => string
  preloadAvatars: (userIds: string[]) => Promise<void>
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarCache, setAvatarCache] = useState<Map<string, string>>(new Map())
  const { user } = useAuth()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("[v0] Failed to initialize Supabase client in AvatarProvider:", error)
    }
  }, [])

  useEffect(() => {
    if (user?.id && user?.avatar) {
      console.log("[v0] AvatarContext: Initializing cache with user avatar:", {
        userId: user.id,
        avatar: user.avatar,
      })
      setAvatarCache((prev) => {
        const newCache = new Map(prev)
        newCache.set(user.id, user.avatar!)
        return newCache
      })
    }
  }, [user?.id, user?.avatar])

  useEffect(() => {
    if (!user || !supabase) return

    const subscription = supabase
      .channel("avatar-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `avatar=not.is.null`,
        },
        (payload) => {
          console.log("[v0] Avatar update received:", payload)
          const { id, avatar } = payload.new as { id: string; avatar: string }
          if (avatar) {
            setAvatarCache((prev) => new Map(prev.set(id, avatar)))
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, supabase])

  const updateAvatar = (userId: string, avatarUrl: string) => {
    console.log("[v0] AvatarContext: Updating avatar in cache:", { userId, avatarUrl })
    setAvatarCache((prev) => new Map(prev.set(userId, avatarUrl)))
  }

  const getAvatar = (userId: string, fallbackEmail?: string) => {
    const cachedAvatar = avatarCache.get(userId)
    console.log("[v0] AvatarContext: Getting avatar:", {
      userId,
      cachedAvatar,
      cacheSize: avatarCache.size,
      cacheKeys: Array.from(avatarCache.keys()),
    })

    if (cachedAvatar) return cachedAvatar

    // Generate fallback avatar
    const seed = fallbackEmail || userId
    return `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(seed)}`
  }

  const preloadAvatars = async (userIds: string[]) => {
    if (!supabase || userIds.length === 0) return

    try {
      const uncachedIds = userIds.filter((id) => !avatarCache.has(id))
      if (uncachedIds.length === 0) return

      const { data, error } = await supabase.from("users").select("id, avatar").in("id", uncachedIds)

      if (error) throw error

      if (data) {
        setAvatarCache((prev) => {
          const newCache = new Map(prev)
          data.forEach((user) => {
            if (user.avatar) {
              newCache.set(user.id, user.avatar)
            }
          })
          return newCache
        })
      }
    } catch (error) {
      console.error("[v0] Error preloading avatars:", error)
    }
  }

  const value = {
    avatarCache,
    updateAvatar,
    getAvatar,
    preloadAvatars,
  }

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error("useAvatar must be used within an AvatarProvider")
  }
  return context
}
