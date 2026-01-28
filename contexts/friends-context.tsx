"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { createNotificationIfEnabled } from "@/app/actions/notification-helpers"
import { canSendFriendRequest } from "@/app/actions/privacy-helpers"

interface Friend {
  id: string
  name: string
  email: string
  avatar: string | null
  status: "active"
  addedAt: string
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
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  loading: boolean
  error: string | null
  sendFriendRequest: (toUserId: string, message?: string) => Promise<{ success: boolean; alreadyExists: boolean }>
  acceptFriendRequest: (requestId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  getFriendshipStatus: (userId: string) => "friends" | "pending" | "received" | "none"
  refreshFriends: () => Promise<void>
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dataLoadedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  const { user, loading: authLoading } = useAuth()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  
  // Lazy initialize supabase client
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const refreshFriends = useCallback(async () => {
    if (!user?.id) {
      if (authLoading) {
        return
      }
      if (dataLoadedRef.current && lastUserIdRef.current) {
        setFriends([])
        setPendingRequests([])
        setSentRequests([])
        dataLoadedRef.current = false
        lastUserIdRef.current = null
      }
      return
    }

    if (lastUserIdRef.current === user.id && dataLoadedRef.current) {
      return
    }

    const supabase = getSupabase()

    try {
      setLoading(true)
      setError(null)
      console.log("[v0] FRIENDS: Starting refresh for user:", user.id)

      console.log("[v0] FRIENDS: Loading friends...")
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(`
          friend_id,
          status,
          created_at,
          users:friend_id (
            id,
            username,
            email,
            avatar
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      console.log("[v0] FRIENDS: Friends result:", { friendsData, friendsError })

      console.log("[v0] FRIENDS: Loading sent requests...")
      const { data: sentData, error: sentError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          status,
          created_at,
          users:to_user_id (
            id,
            username,
            email,
            avatar
          )
        `)
        .eq("from_user_id", user.id)

      console.log("[v0] FRIENDS: Sent requests result:", { sentData, sentError })

      console.log("[v0] FRIENDS: Loading received requests...")
      const { data: receivedData, error: receivedError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          status,
          created_at,
          users:from_user_id (
            id,
            username,
            email,
            avatar
          )
        `)
        .eq("to_user_id", user.id)
        .eq("status", "pending")

      console.log("[v0] FRIENDS: Received requests result:", { receivedData, receivedError })

      const transformedFriends: Friend[] = (friendsData || []).map((f: any) => ({
        id: f.friend_id,
        name: f.users?.username || "Unknown User",
        email: f.users?.email || "",
        avatar: f.users?.avatar || null,
        status: "active" as const,
        addedAt: f.created_at,
      }))

      const pendingSentRequests = (sentData || []).filter((r: any) => r.status === "pending")
      const transformedSent: FriendRequest[] = pendingSentRequests.map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        from_user_name: user.username || user.name || "",
        to_user_name: r.users?.username || "Unknown User",
        message: r.message,
        status: r.status,
        created_at: r.created_at,
      }))

      const transformedReceived: FriendRequest[] = (receivedData || []).map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        from_user_name: r.users?.username || "Unknown User",
        to_user_name: user.username || user.name || "",
        message: r.message,
        status: r.status,
        created_at: r.created_at,
      }))

      setFriends(transformedFriends)
      setSentRequests(transformedSent)
      setPendingRequests(transformedReceived)

      dataLoadedRef.current = true
      lastUserIdRef.current = user.id

      console.log("[v0] FRIENDS: Data loaded successfully:", {
        friends: transformedFriends.length,
        sent: transformedSent.length,
        received: transformedReceived.length,
      })
    } catch (err: any) {
      console.error("[v0] FRIENDS: Error refreshing data:", err)
      setError(err.message || "Failed to load friends data")
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.username, user?.name, getSupabase, authLoading])

  useEffect(() => {
    if (!authLoading) {
      refreshFriends()
    }
  }, [refreshFriends, authLoading])

  const sendFriendRequest = async (toUserId: string, message?: string) => {
    if (!user?.id) {
      throw new Error("Must be logged in to send friend requests")
    }

    if (user.id === toUserId) {
      throw new Error("Du kannst dir nicht selbst eine Freundschaftsanfrage senden!")
    }

    const supabase = getSupabase()

    try {
      setError(null)
      console.log("[v0] FRIENDS: Sending friend request from", user.id, "to", toUserId)

      const privacyCheck = await canSendFriendRequest(user.id, toUserId)
      if (!privacyCheck.allowed) {
        throw new Error(privacyCheck.reason || "Freundschaftsanfrage nicht erlaubt")
      }

      console.log("[v0] FRIENDS: Checking for existing friendship...")
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from("friends")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("friend_id", toUserId)
        .maybeSingle()

      console.log("[v0] FRIENDS: Existing friendship check result:", { existingFriendship, friendshipError })

      if (existingFriendship && existingFriendship.status === "active") {
        console.log("[v0] FRIENDS: Active friendship found, throwing error")
        throw new Error("Ihr seid bereits befreundet!")
      }

      console.log("[v0] FRIENDS: Checking for reverse friendship...")
      const { data: reverseFriendship, error: reverseError } = await supabase
        .from("friends")
        .select("id, status")
        .eq("user_id", toUserId)
        .eq("friend_id", user.id)
        .maybeSingle()

      console.log("[v0] FRIENDS: Reverse friendship check result:", { reverseFriendship, reverseError })

      if (reverseFriendship && reverseFriendship.status === "active") {
        console.log("[v0] FRIENDS: Reverse active friendship found, throwing error")
        throw new Error("Ihr seid bereits befreundet!")
      }

      console.log("[v0] FRIENDS: Checking for existing friend request...")
      const { data: existingRequest, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, status")
        .eq("from_user_id", user.id)
        .eq("to_user_id", toUserId)
        .maybeSingle()

      console.log("[v0] FRIENDS: Existing request check:", { existingRequest, requestError })

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          console.log("[v0] FRIENDS: Request already exists and is pending")
          await refreshFriends()
          return { success: true, alreadyExists: true }
        }
        if (existingRequest.status === "accepted") {
          console.log("[v0] FRIENDS: Request already accepted, checking if friendship exists...")

          const { data: friendship } = await supabase
            .from("friends")
            .select("id")
            .eq("user_id", user.id)
            .eq("friend_id", toUserId)
            .maybeSingle()

          if (!friendship) {
            console.log("[v0] FRIENDS: Creating missing friendship from accepted request...")
            await supabase.from("friends").insert([
              {
                user_id: user.id,
                friend_id: toUserId,
                status: "active",
              },
              {
                user_id: toUserId,
                friend_id: user.id,
                status: "active",
              },
            ])
          }

          console.log("[v0] FRIENDS: Request already accepted, friendship ensured")
          await refreshFriends()
          return { success: true, alreadyExists: true }
        }
        if (existingRequest.status === "declined") {
          console.log("[v0] FRIENDS: Previous request was declined, deleting and creating new one")
          await supabase.from("friend_requests").delete().eq("id", existingRequest.id)
        }
      }

      console.log("[v0] FRIENDS: Inserting new friend request...")
      const { data: insertData, error: insertError } = await supabase
        .from("friend_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          message: message || null,
          status: "pending",
        })
        .select()

      console.log("[v0] FRIENDS: Insert result:", { insertData, insertError })

      if (insertError) {
        console.error("[v0] FRIENDS: Insert error:", insertError)
        if (insertError.message?.includes("duplicate key")) {
          await refreshFriends()
          return { success: true, alreadyExists: true }
        }
        throw insertError
      }

      const senderName = user.username || user.name || "Ein Nutzer"
      await createNotificationIfEnabled(
        toUserId,
        "friend_request",
        "Neue Freundschaftsanfrage",
        `${senderName} hat dir eine Freundschaftsanfrage gesendet`,
        {
          from_user_id: user.id,
          from_user_name: senderName,
          request_id: insertData?.[0]?.id,
        },
      )

      console.log("[v0] FRIENDS: Friend request sent successfully")
      await refreshFriends()
      return { success: true, alreadyExists: false }
    } catch (err: any) {
      console.error("[v0] FRIENDS: Error sending friend request:", err)
      setError(err.message || "Failed to send friend request")
      throw err
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    const supabase = getSupabase()

    try {
      setError(null)
      console.log("[v0] FRIENDS: Accepting friend request:", requestId)

      const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id, status")
        .eq("id", requestId)
        .single()

      console.log("[v0] FRIENDS: Request data:", { request, requestError })

      if (requestError || !request) {
        throw new Error("Friend request not found")
      }

      if (request.status !== "pending") {
        throw new Error("Friend request is no longer available")
      }

      console.log("[v0] FRIENDS: Updating request status to accepted")
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      console.log("[v0] FRIENDS: Update result:", { updateError })

      if (updateError) {
        throw updateError
      }

      console.log("[v0] FRIENDS: Creating friendship entries...")
      const { error: friendshipError } = await supabase.from("friends").insert([
        {
          user_id: request.from_user_id,
          friend_id: request.to_user_id,
          status: "active",
        },
        {
          user_id: request.to_user_id,
          friend_id: request.from_user_id,
          status: "active",
        },
      ])

      console.log("[v0] FRIENDS: Friendship creation result:", { friendshipError })

      if (friendshipError) {
        if (friendshipError.message?.includes("duplicate key")) {
          console.log("[v0] FRIENDS: Friendship already exists, continuing...")
        } else {
          console.error("[v0] FRIENDS: Failed to create friendship:", friendshipError)
          throw friendshipError
        }
      }

      const accepterName = user.username || user.name || "Ein Nutzer"
      await createNotificationIfEnabled(
        request.from_user_id,
        "friend_accepted",
        "Freundschaftsanfrage angenommen",
        `${accepterName} hat deine Freundschaftsanfrage angenommen`,
        {
          friend_id: user.id,
          friend_name: accepterName,
        },
      )

      console.log("[v0] FRIENDS: Friend request accepted successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] FRIENDS: Error accepting friend request:", err)
      setError(err.message || "Failed to accept friend request")
      throw err
    }
  }

  const declineFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    const supabase = getSupabase()

    try {
      setError(null)
      console.log("[v0] FRIENDS: Declining friend request:", requestId)

      const { data: request } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id")
        .eq("id", requestId)
        .single()

      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      console.log("[v0] FRIENDS: Decline result:", { error })

      if (error) {
        throw error
      }

      if (request) {
        const declinerName = user.username || user.name || "Ein Nutzer"
        await createNotificationIfEnabled(
          request.from_user_id,
          "friend_declined",
          "Freundschaftsanfrage abgelehnt",
          `${declinerName} hat deine Freundschaftsanfrage abgelehnt`,
          {
            declined_by_id: user.id,
            declined_by_name: declinerName,
          },
        )
      }

      console.log("[v0] FRIENDS: Friend request declined successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] FRIENDS: Error declining friend request:", err)
      setError(err.message || "Failed to decline friend request")
      throw err
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user?.id) return

    const supabase = getSupabase()

    try {
      setError(null)
      console.log("[v0] FRIENDS: Removing friend:", friendId)

      const { error } = await supabase
        .from("friends")
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) {
        throw error
      }

      console.log("[v0] FRIENDS: Friend removed successfully")
      await refreshFriends()
    } catch (err: any) {
      console.error("[v0] FRIENDS: Error removing friend:", err)
      setError(err.message || "Failed to remove friend")
      throw err
    }
  }

  const getFriendshipStatus = (userId: string): "friends" | "pending" | "received" | "none" => {
    if (!user?.id || userId === user.id) {
      console.log(`[v0] FRIENDS: Status check for ${userId} - no user or same user, returning none`)
      return "none"
    }

    const isFriend = friends.some((friend) => friend.id === userId)
    const sentRequest = sentRequests.find((r) => r.to_user_id === userId)
    const receivedRequest = pendingRequests.find((r) => r.from_user_id === userId)

    console.log(`[v0] FRIENDS: Status check for ${userId}:`, {
      isFriend,
      hasSentRequest: !!sentRequest,
      hasReceivedRequest: !!receivedRequest,
      sentRequestsTotal: sentRequests.length,
      receivedRequestsTotal: pendingRequests.length,
      friendsData: friends.map((f) => ({ id: f.id, name: f.name })),
      sentRequestsData: sentRequests.map((r) => ({ id: r.id, to: r.to_user_id, status: r.status })),
      receivedRequestsData: pendingRequests.map((r) => ({ id: r.id, from: r.from_user_id, status: r.status })),
    })

    if (isFriend) {
      console.log(`[v0] FRIENDS: User ${userId} is a friend - returning "friends"`)
      return "friends"
    }

    if (sentRequest) {
      console.log(`[v0] FRIENDS: Found sent request to ${userId} - returning "pending"`)
      return "pending"
    }

    if (receivedRequest) {
      console.log(`[v0] FRIENDS: Found received request from ${userId} - returning "received"`)
      return "received"
    }

    console.log(`[v0] FRIENDS: No relationship found with ${userId} - returning "none"`)
    return "none"
  }

  return (
    <FriendsContext.Provider
      value={{
        friends,
        pendingRequests,
        sentRequests,
        loading,
        error,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
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
