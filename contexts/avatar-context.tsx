"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react"
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
  const avatarCacheRef = useRef<Map<string, string>>(avatarCache)
  
  // Keep ref in sync with state
  useEffect(() => {
    avatarCacheRef.current = avatarCache
  }, [avatarCache])

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client in AvatarProvider:", error)
    }
  }, [])

  useEffect(() => {
    if (user?.id && user?.avatar) {
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

  const updateAvatar = useCallback((userId: string, avatarUrl: string) => {
    setAvatarCache((prev) => new Map(prev.set(userId, avatarUrl)))
  }, [])

  const getAvatar = useCallback((userId: string, fallbackNameOrAvatar?: string | null) => {
    // 1. Check if the second arg is already a full avatar URL (from DB)
    if (fallbackNameOrAvatar && (fallbackNameOrAvatar.startsWith("http") || fallbackNameOrAvatar.startsWith("/"))) {
      // Cache it so other callers also get it
      if (!avatarCacheRef.current.has(userId)) {
        avatarCacheRef.current.set(userId, fallbackNameOrAvatar)
      }
      return fallbackNameOrAvatar
    }

    // 2. Check the cache (populated from DB queries or preload)
    const cachedAvatar = avatarCacheRef.current.get(userId)
    if (cachedAvatar) return cachedAvatar

    // 3. Generate a stable DiceBear fallback using userId as seed (always consistent)
    return `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(userId)}`
  }, [])

  const preloadAvatars = useCallback(async (userIds: string[]) => {
    if (!supabase || userIds.length === 0) return

    try {
      const uncachedIds = userIds.filter((id) => !avatarCache.has(id))
      if (uncachedIds.length === 0) return

      const { data, error } = await supabase.from("users").select("id, avatar").in("id", uncachedIds)

      if (error) throw error

      if (data) {
        setAvatarCache((prev) => {
          const newCache = new Map(prev)
          data.forEach((u) => {
            const url = u.avatar || `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(u.id)}`
            newCache.set(u.id, url)
          })
          return newCache
        })
      }
    } catch (error) {
      console.error("Error preloading avatars:", error)
    }
  }, [supabase])

  const value = useMemo(() => ({
    avatarCache,
    updateAvatar,
    getAvatar,
    preloadAvatars,
  }), [avatarCache, updateAvatar, getAvatar, preloadAvatars])

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
}

const AVATAR_FALLBACK: AvatarContextType = {
  avatarCache: {},
  updateAvatar: async () => {},
  getAvatar: () => null,
  preloadAvatars: async () => {},
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    return AVATAR_FALLBACK
  }
  return context
}
