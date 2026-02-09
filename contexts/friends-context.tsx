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
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client in FriendsProvider:", error)
    }
  }, [])

  const refreshFriends = useCallback(async (force = false) => {
    if (!user?.id || !supabase) {
      if (authLoading) return
      if (dataLoadedRef.current && lastUserIdRef.current) {
        setFriends([])
        setPendingRequests([])
        setSentRequests([])
        dataLoadedRef.current = false
        lastUserIdRef.current = null
      }
      return
    }

    if (!force && lastUserIdRef.current === user.id && dataLoadedRef.current) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [friendsResult, sentResult, receivedResult] = await Promise.all([
        supabase
          .from("friends")
          .select(`friend_id, status, created_at, users:friend_id (id, username, email, avatar)`)
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("friend_requests")
          .select(`id, from_user_id, to_user_id, message, status, created_at, users:to_user_id (id, username, email, avatar)`)
          .eq("from_user_id", user.id),
        supabase
          .from("friend_requests")
          .select(`id, from_user_id, to_user_id, message, status, created_at, users:from_user_id (id, username, email, avatar)`)
          .eq("to_user_id", user.id)
          .eq("status", "pending"),
      ])

      const friendsData = friendsResult.data
      const sentData = sentResult.data
      const receivedData = receivedResult.data

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
    } catch (err: any) {
      setError(err.message || "Failed to load friends data")
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.username, user?.name, supabase, authLoading])

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

    try {
      setError(null)

      const privacyCheck = await canSendFriendRequest(user.id, toUserId)
      if (!privacyCheck.allowed) {
        throw new Error(privacyCheck.reason || "Freundschaftsanfrage nicht erlaubt")
      }

      const { data: existingFriendship } = await supabase
        .from("friends")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("friend_id", toUserId)
        .maybeSingle()

      if (existingFriendship && existingFriendship.status === "active") {
        throw new Error("Ihr seid bereits befreundet!")
      }

      const { data: reverseFriendship } = await supabase
        .from("friends")
        .select("id, status")
        .eq("user_id", toUserId)
        .eq("friend_id", user.id)
        .maybeSingle()

      if (reverseFriendship && reverseFriendship.status === "active") {
        throw new Error("Ihr seid bereits befreundet!")
      }

      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id, status")
        .eq("from_user_id", user.id)
        .eq("to_user_id", toUserId)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          await refreshFriends(true)
          return { success: true, alreadyExists: true }
        }
        if (existingRequest.status === "accepted") {
          const { data: friendship } = await supabase
            .from("friends")
            .select("id")
            .eq("user_id", user.id)
            .eq("friend_id", toUserId)
            .maybeSingle()

          if (!friendship) {
            await supabase.from("friends").insert([
              { user_id: user.id, friend_id: toUserId, status: "active" },
              { user_id: toUserId, friend_id: user.id, status: "active" },
            ])
          }

          await refreshFriends(true)
          return { success: true, alreadyExists: true }
        }
        if (existingRequest.status === "declined") {
          await supabase.from("friend_requests").delete().eq("id", existingRequest.id)
        }
      }

      const { data: insertData, error: insertError } = await supabase
        .from("friend_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          message: message || null,
          status: "pending",
        })
        .select()

      if (insertError) {
        if (insertError.message?.includes("duplicate key")) {
          await refreshFriends(true)
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

      await refreshFriends(true)
      return { success: true, alreadyExists: false }
    } catch (err: any) {
      setError(err.message || "Failed to send friend request")
      throw err
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    try {
      setError(null)

      const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id, status")
        .eq("id", requestId)
        .single()

      if (requestError || !request) {
        throw new Error("Friend request not found")
      }

      if (request.status !== "pending") {
        throw new Error("Friend request is no longer available")
      }

      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) throw updateError

      const { error: friendshipError } = await supabase.from("friends").insert([
        { user_id: request.from_user_id, friend_id: request.to_user_id, status: "active" },
        { user_id: request.to_user_id, friend_id: request.from_user_id, status: "active" },
      ])

      if (friendshipError && !friendshipError.message?.includes("duplicate key")) {
        throw friendshipError
      }

      const accepterName = user.username || user.name || "Ein Nutzer"
      await createNotificationIfEnabled(
        request.from_user_id,
        "friend_accepted",
        "Freundschaftsanfrage angenommen",
        `${accepterName} hat deine Freundschaftsanfrage angenommen`,
        { friend_id: user.id, friend_name: accepterName },
      )

      await refreshFriends(true)
    } catch (err: any) {
      setError(err.message || "Failed to accept friend request")
      throw err
    }
  }

  const declineFriendRequest = async (requestId: string) => {
    if (!user?.id) return

    try {
      setError(null)

      const { data: request } = await supabase
        .from("friend_requests")
        .select("from_user_id, to_user_id")
        .eq("id", requestId)
        .single()

      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) throw error

      if (request) {
        const declinerName = user.username || user.name || "Ein Nutzer"
        await createNotificationIfEnabled(
          request.from_user_id,
          "friend_declined",
          "Freundschaftsanfrage abgelehnt",
          `${declinerName} hat deine Freundschaftsanfrage abgelehnt`,
          { declined_by_id: user.id, declined_by_name: declinerName },
        )
      }

      await refreshFriends(true)
    } catch (err: any) {
      setError(err.message || "Failed to decline friend request")
      throw err
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user?.id) return

    try {
      setError(null)

      const { error } = await supabase
        .from("friends")
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) throw error

      await refreshFriends(true)
    } catch (err: any) {
      setError(err.message || "Failed to remove friend")
      throw err
    }
  }

  const getFriendshipStatus = (userId: string): "friends" | "pending" | "received" | "none" => {
    if (!user?.id || userId === user.id) return "none"

    if (friends.some((friend) => friend.id === userId)) return "friends"
    if (sentRequests.find((r) => r.to_user_id === userId)) return "pending"
    if (pendingRequests.find((r) => r.from_user_id === userId)) return "received"

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
