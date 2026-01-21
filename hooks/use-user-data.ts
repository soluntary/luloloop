"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useProfileSync } from "@/contexts/profile-sync-context"
import { useEffect, useRef } from "react"

const supabase = createClient()

const fetchUser = async (userId: string) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export function useUserData(userId: string | null) {
  const { subscribeToUserUpdates } = useProfileSync()
  const subscribedRef = useRef(false)

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

  // Subscribe to real-time updates for this user - only once per userId
  useEffect(() => {
    if (!userId || subscribedRef.current) return

    subscribedRef.current = true
    const unsubscribe = subscribeToUserUpdates(userId, (updatedUser) => {
      mutate(updatedUser, false) // Update without revalidation
    })

    return () => {
      subscribedRef.current = false
      unsubscribe?.()
    }
  }, [userId, subscribeToUserUpdates, mutate])

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

  if (!userId) {
    return "Unbekannter Nutzer"
  }

  if (isLoading) {
    return "Lädt..."
  }

  if (!user) {
    return "Unbekannter Nutzer"
  }

  return user.name || user.username || "Unbekannter Nutzer"
}
