"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { mutate } from "swr"

interface ProfileSyncContextType {
  syncProfile: (userId: string, changes: any) => void
  invalidateUserData: (userId: string) => void
  subscribeToUserUpdates: (userId: string, callback: (user: any) => void) => () => void
}

const ProfileSyncContext = createContext<ProfileSyncContextType | undefined>(undefined)

export function ProfileSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [userSubscriptions, setUserSubscriptions] = useState<Map<string, Set<(user: any) => void>>>(new Map())

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error(" Failed to initialize Supabase client:", error)
    }
  }, [])

  useEffect(() => {
    if (!user || !supabase) return

    // sync Setting up profile synchronization...")

    // Subscribe to all user profile changes
    const subscription = supabase
      .channel("profile-sync")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
        },
        (payload) => {
          // sync Profile update received:", payload)
          const updatedUser = payload.new as any

          // Invalidate SWR cache for this user
          mutate(`user-${updatedUser.id}`)
          mutate(`profile-${updatedUser.id}`)
          mutate(`avatar-${updatedUser.id}`)

          // Notify all subscribed components
          const callbacks = userSubscriptions.get(updatedUser.id)
          if (callbacks) {
            callbacks.forEach((callback) => callback(updatedUser))
          }

          // Update global caches
          if (typeof window !== "undefined") {
            // Broadcast to other tabs/windows
            window.postMessage(
              {
                type: "PROFILE_UPDATED",
                userId: updatedUser.id,
                user: updatedUser,
              },
              window.location.origin,
            )
          }
        },
      )
      .subscribe()

    // Listen for cross-tab updates
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === "PROFILE_UPDATED") {
        const { userId, user: updatedUser } = event.data

        // Invalidate caches
        mutate(`user-${userId}`)
        mutate(`profile-${userId}`)
        mutate(`avatar-${userId}`)

        // Notify subscribed components
        const callbacks = userSubscriptions.get(userId)
        if (callbacks) {
          callbacks.forEach((callback) => callback(updatedUser))
        }
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("message", handleMessage)
    }
  }, [user, supabase, userSubscriptions])

  const syncProfile = useCallback(
    (userId: string, changes: any) => {
      // sync Syncing profile changes for user:", userId, changes)

      // Invalidate all related SWR keys
      mutate(`user-${userId}`)
      mutate(`profile-${userId}`)
      mutate(`avatar-${userId}`)
      mutate(`username-${userId}`)
      mutate(`bio-${userId}`)

      // Invalidate list caches that might contain this user
      mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("friends") ||
            key.includes("users") ||
            key.includes("participants") ||
            key.includes("members") ||
            key.includes("reviews") ||
            key.includes("questions") ||
            key.includes("events") ||
            key.includes("messages")),
      )

      // Notify subscribed components
      const callbacks = userSubscriptions.get(userId)
      if (callbacks) {
        callbacks.forEach((callback) => callback(changes))
      }
    },
    [userSubscriptions],
  )

  const invalidateUserData = useCallback((userId: string) => {
    // sync Invalidating all data for user:", userId)

    // Comprehensive cache invalidation
    mutate(`user-${userId}`)
    mutate(`profile-${userId}`)
    mutate(`avatar-${userId}`)
    mutate(`username-${userId}`)
    mutate(`bio-${userId}`)
    mutate(`settings-${userId}`)

    // Invalidate any cache key that might contain this user's data
    mutate((key) => {
      if (typeof key !== "string") return false
      return (
        key.includes(userId) ||
        key.includes("friends") ||
        key.includes("users") ||
        key.includes("participants") ||
        key.includes("members") ||
        key.includes("reviews") ||
        key.includes("questions") ||
        key.includes("events") ||
        key.includes("messages") ||
        key.includes("notifications")
      )
    })
  }, [])

  const subscribeToUserUpdates = useCallback((userId: string, callback: (user: any) => void) => {
    // sync Subscribing to updates for user:", userId)

    setUserSubscriptions((prev) => {
      const newMap = new Map(prev)
      const callbacks = newMap.get(userId) || new Set()
      callbacks.add(callback)
      newMap.set(userId, callbacks)
      return newMap
    })

    // Return unsubscribe function
    return () => {
      setUserSubscriptions((prev) => {
        const newMap = new Map(prev)
        const callbacks = newMap.get(userId)
        if (callbacks) {
          callbacks.delete(callback)
          if (callbacks.size === 0) {
            newMap.delete(userId)
          } else {
            newMap.set(userId, callbacks)
          }
        }
        return newMap
      })
    }
  }, [])

  const value = {
    syncProfile,
    invalidateUserData,
    subscribeToUserUpdates,
  }

  return <ProfileSyncContext.Provider value={value}>{children}</ProfileSyncContext.Provider>
}

export function useProfileSync() {
  const context = useContext(ProfileSyncContext)
  if (context === undefined) {
    throw new Error("useProfileSync must be used within a ProfileSyncProvider")
  }
  return context
}
