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
      console.error("[v0] Failed to initialize Supabase client in AvatarProvider:", error)
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

  const getAvatar = useCallback((userId: string, fallbackEmail?: string) => {
    // Use ref to avoid re-renders while still getting current cache
    const cachedAvatar = avatarCacheRef.current.get(userId)
    if (cachedAvatar) return cachedAvatar

    // Generate fallback avatar
    const seed = fallbackEmail || userId
    return `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(seed)}`
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
  }, [supabase])

  const value = useMemo(() => ({
    avatarCache,
    updateAvatar,
    getAvatar,
    preloadAvatars,
  }), [avatarCache, updateAvatar, getAvatar, preloadAvatars])

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error("useAvatar must be used within an AvatarProvider")
  }
  return context
}
