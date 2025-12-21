"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useProfileSync } from "@/contexts/profile-sync-context"
import { useEffect } from "react"

const supabase = createClient()

const fetchUser = async (userId: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export function useUserData(userId: string | null) {
  const { subscribeToUserUpdates } = useProfileSync()

  const {
    data: user,
    error,
    mutate,
    isLoading,
  } = useSWR(userId ? `user-${userId}` : null, () => fetchUser(userId!), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
  })

  // Subscribe to real-time updates for this user
  useEffect(() => {
    if (!userId || !user) return

    const unsubscribe = subscribeToUserUpdates(userId, (updatedUser) => {
      console.log("[v0] Received user update via subscription:", updatedUser)
      mutate(updatedUser, false) // Update without revalidation
    })

    return unsubscribe
  }, [userId, user, subscribeToUserUpdates, mutate])

  return {
    user,
    error,
    isLoading,
    mutate,
  }
}

// Hook for getting user avatar with caching
export function useUserAvatar(userId: string | null, email?: string) {
  const { user } = useUserData(userId)

  if (!userId) return null

  if (user?.avatar) {
    return user.avatar
  }

  // Generate fallback avatar
  const seed = email || userId
  return `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(seed)}`
}

// Hook for getting user display name with caching
export function useUserDisplayName(userId: string | null) {
  const { user, isLoading } = useUserData(userId)

  console.log("[v0] useUserDisplayName - userId:", userId, "user:", user, "isLoading:", isLoading)

  if (!userId) {
    console.log("[v0] useUserDisplayName - no userId, returning Unbekannter Nutzer")
    return "Unbekannter Nutzer"
  }

  if (isLoading) {
    console.log("[v0] useUserDisplayName - loading, returning Lädt...")
    return "Lädt..."
  }

  if (!user) {
    console.log("[v0] useUserDisplayName - no user found, returning Unbekannter Nutzer")
    return "Unbekannter Nutzer"
  }

  const displayName = user.name || user.username || "Unbekannter Nutzer"
  console.log("[v0] useUserDisplayName - returning displayName:", displayName)
  return displayName
}
