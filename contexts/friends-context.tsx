"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface Friend {
  id: string
  name: string
  email: string
  avatar: string | null
  status: "pending" | "accepted" | "blocked"
  addedAt: string
  lastSeen?: string
  gamesCount?: number
  rating?: number
}

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  from_user_name: string
  to_user_name: string
  message: string | null
  status: "pending" | "accepted" | "declined"
  created_at: string
}

interface FriendsContextType {
  friends: Friend[]
  friendRequests: FriendRequest[]
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  loading: boolean
  error: string | null
  sendFriendRequest: (toUserId: string, message?: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  getFriendByName: (name: string) => Friend | undefined
  getFriendshipStatus: (userId: string) => "friends" | "pending" | "received" | "none"
  refreshFriends: () => Promise<void>
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  const refreshFriends = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Refreshing friends data for user:", user.id)

      // Load friends
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(`
          id,
          friend_id,
          status,
          created_at,
          friend:friend_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted")

      if (friendsError) {
        console.error("[v0] Error loading friends:", friendsError)
        throw friendsError
      }

      // Load friend requests (received)
      const { data: receivedRequests, error: receivedError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          status,
          created_at,
          from_user:from_user_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .eq("to_user_id", user.id)
        .eq("status", "pending")

      if (receivedError) {
        console.error("[v0] Error loading received requests:", receivedError)
        throw receivedError
      }

      // Load friend requests (sent)
      const { data: sentRequestsData, error: sentError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          status,
          created_at,
          to_user:to_user_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .eq("from_user_id", user.id)
        .eq("status", "pending")

      if (sentError) {
        console.error("[v0] Error loading sent requests:", sentError)
        throw sentError
      }

      // Transform friends data
      const transformedFriends: Friend[] = (friendsData || []).map((friendship: any) => ({
        id: friendship.friend.id,
        name: friendship.friend.name,
        email: friendship.friend.email,
        avatar: friendship.friend.avatar,
        status: "accepted" as const,
        addedAt: friendship.created_at,
      }))

      // Transform received requests
      const transformedReceived: FriendRequest[] = (receivedRequests || []).map((req: any) => ({
        id: req.id,
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        from_user_name: req.from_user.name,
        to_user_name: user.name || "",
        message: req.message,
        status: req.status,
        created_at: req.created_at,
      }))

      // Transform sent requests
      const transformedSent: FriendRequest[] = (sentRequestsData || []).map((req: any) => ({
        id: req.id,
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        from_user_name: user.name || "",
        to_user_name: req.to_user.name,
        message: req.message,
        status: req.status,
        created_at: req.created_at,
      }))

      setFriends(transformedFriends)
      setPendingRequests(transformedReceived)
      setSentRequests(transformedSent)
      setFriendRequests([...transformedReceived, ...transformedSent])

      console.log("[v0] Friends data loaded:", {
        friends: transformedFriends.length,
        pendingRequests: transformedReceived.length,
        sentRequests: transformedSent.length,
      })
    } catch (err: any) {
      console.error("[v0] Error refreshing friends:", err)
      setError(err.message || "Failed to load friends data")
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    if (user?.id) {
      refreshFriends()
    } else {
      setFriends([])
      setFriendRequests([])
      setPendingRequests([])
      setSentRequests([])
    }
  }, [user?.id, refreshFriends])

  const sendFriendRequest = async (toUserId: string, message?: string) => {
    if (!user?.id) {
      throw new Error("Must be logged in to send friend requests")
    }

    try {
      setError(null)
      console.log("[v0] Sending friend request to:", toUserId)

      const { data: existingRequest, error: checkError } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user_id", user.id)
        .eq("to_user_id", toUserId)
        .eq("status", "pending")
        .maybeSingle() // Use maybeSingle instead of single to handle no results

      if (checkError) {
        console.error("[v0] Error checking existing request:", checkError)
        throw checkError
      }

      if (existingRequest) {
        console.log("[v0] Friend request already exists")
        throw new Error("Du hast bereits eine Freundschaftsanfrage an diesen Benutzer gesendet!")
      }

      // Insert new friend request
      const { error: insertError } = await supabase.from("friend_requests").insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        message: message || null,
        status: "pending",
      })

      if (insertError) {
        console.error("[v0] Error sending friend request:", insertError)
        if (
          insertError.code === "23505" &&
          insertError.message.includes("friend_requests_from_user_id_to_user_id_key")
        ) {
          throw new Error("Du hast bereits eine Freundschaftsanfrage an diesen Benutzer gesendet!")
        }
        throw insertError
      }

      console.log("[v0] Friend request sent successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] Error sending friend request:", err)
      setError(err.message || "Failed to send friend request")
      throw err
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    try {
      setError(null)
      console.log("[v0] Accepting friend request:", requestId)

      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id")
        .eq("id", requestId)
        .single()

      if (requestError || !request) {
        throw new Error("Friend request not found")
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) {
        console.error("[v0] Error updating friend request:", updateError)
        throw updateError
      }

      // Create friendship entries (bidirectional)
      const { error: friendshipError } = await supabase.from("friends").insert([
        {
          user_id: request.from_user_id,
          friend_id: request.to_user_id,
          status: "accepted",
        },
        {
          user_id: request.to_user_id,
          friend_id: request.from_user_id,
          status: "accepted",
        },
      ])

      if (friendshipError) {
        console.error("[v0] Error creating friendship:", friendshipError)
        throw friendshipError
      }

      console.log("[v0] Friend request accepted successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] Error accepting friend request:", err)
      setError(err.message || "Failed to accept friend request")
      throw err
    }
  }

  const declineFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    try {
      setError(null)
      console.log("[v0] Declining friend request:", requestId)

      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) {
        console.error("[v0] Error declining friend request:", error)
        throw error
      }

      console.log("[v0] Friend request declined successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] Error declining friend request:", err)
      setError(err.message || "Failed to decline friend request")
      throw err
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user?.id) return

    try {
      setError(null)
      console.log("[v0] Removing friend:", friendId)

      // Remove both friendship entries (bidirectional)
      const { error } = await supabase
        .from("friends")
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) {
        console.error("[v0] Error removing friend:", error)
        throw error
      }

      console.log("[v0] Friend removed successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] Error removing friend:", err)
      setError(err.message || "Failed to remove friend")
      throw err
    }
  }

  const getFriendByName = (name: string) => {
    return friends.find((friend) => friend.name === name)
  }

  const getFriendshipStatus = (userId: string): "friends" | "pending" | "received" | "none" => {
    // Check if already friends
    if (friends.some((friend) => friend.id === userId)) {
      return "friends"
    }

    // Check if we sent a request to this user
    if (sentRequests.some((request) => request.to_user_id === userId)) {
      return "pending"
    }

    // Check if we received a request from this user
    if (pendingRequests.some((request) => request.from_user_id === userId)) {
      return "received"
    }

    return "none"
  }

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        pendingRequests,
        sentRequests,
        loading,
        error,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        getFriendByName,
        getFriendshipStatus,
        refreshFriends,
      }}
    >
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendsContext)
  if (context === undefined) {
    throw new Error("useFriends must be used within a FriendsProvider")
  }
  return context
}
