"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { withRateLimit, checkGlobalRateLimit } from "@/lib/supabase/rate-limit"
import { canSendMessage } from "@/app/actions/privacy-helpers"
import { notifyNewMessage } from "@/app/actions/notification-system"

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  game_title: string
  game_id: string | null
  offer_type: string
  message: string
  created_at: string
  read: boolean
  game_image: string
  delivery_preference?: string
  from_user?: { id: string; name: string; username: string }
  to_user?: { id: string; name: string; username: string }
}

interface MessagesContextType {
  messages: Message[]
  sendMessage: (message: {
    to_user_id: string
    message: string
    game_id: string | null
    game_title: string
    game_image: string
    offer_type: string
    delivery_preference?: string
  }) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  getUnreadCount: () => number
  getUserMessages: () => Message[]
  refreshMessages: () => Promise<void>
  getOfferTypeText: (type: string) => string
  getOfferTypeColor: (type: string) => string
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error("Failed to initialize Supabase client in MessagesProvider:", error)
    }
  }, [])

  const refreshMessages = useCallback(async () => {
    if (!user || !supabase) return

    if (checkGlobalRateLimit()) {
      // removed debug Messages: Skipping refresh due to rate limiting")
      setMessages([])
      setIsLoaded(true)
      return
    }

    try {
      const result = await new Promise((resolve) => {
        withRateLimit(
          async () => {
            try {
              const { data, error } = await supabase
                .from("messages")
                .select(`
                  *,
                  from_user:users!messages_from_user_id_fkey(id, name, username),
                  to_user:users!messages_to_user_id_fkey(id, name, username)
                `)
                .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                .order("created_at", { ascending: false })

              if (error) {
                console.error("Error loading messages:", error)
                return []
              }

              return data || []
            } catch (innerError) {
              const errorMessage = innerError instanceof Error ? innerError.message : String(innerError)
              if (
                innerError instanceof SyntaxError ||
                errorMessage.includes("JSON") ||
                errorMessage.includes("Too Many R") ||
                errorMessage.includes("Unexpected token") ||
                errorMessage.includes("rate limit") ||
                errorMessage.includes("429")
              ) {
                // removed debug Messages: JSON/Rate limit error caught, returning empty array")
                return []
              }
              throw innerError
            }
          },
          [], // Fallback to empty array when rate limited
        )
          .then(resolve)
          .catch(() => resolve([]))
      })

      setMessages(Array.isArray(result) ? result : [])
      setIsLoaded(true)
    } catch (error) {
      // removed debug Messages: Final error handler activated, using empty fallback")
      setMessages([])
      setIsLoaded(true)
    }
  }, [user, supabase])

  // Load messages from database on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshMessages()
    } else {
      setMessages([])
      setIsLoaded(true)
    }
  }, [user, refreshMessages])

  // Supabase Realtime subscription for live message updates
  useEffect(() => {
    if (!user || !supabase) return

    const channel = supabase
      .channel(`messages-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `to_user_id=eq.${user.id}`,
        },
        async (payload) => {
          // A new message was sent TO this user - fetch with joined user data
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              from_user:users!messages_from_user_id_fkey(id, name, username),
              to_user:users!messages_to_user_id_fkey(id, name, username)
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates (e.g. if the sender is this user and already added it optimistically)
              if (prev.some((msg) => msg.id === data.id)) return prev
              return [data, ...prev]
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `from_user_id=eq.${user.id}`,
        },
        async (payload) => {
          // A message sent BY this user (from another tab/device)
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              from_user:users!messages_from_user_id_fkey(id, name, username),
              to_user:users!messages_to_user_id_fkey(id, name, username)
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === data.id)) return prev
              return [data, ...prev]
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          // Message updated (e.g. marked as read)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Message deleted
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const sendMessage = async (messageData: {
    to_user_id: string
    message: string
    game_id: string | null
    game_title: string
    game_image: string
    offer_type: string
    delivery_preference?: string
  }) => {
    if (!user) throw new Error("User not authenticated")

    if (checkGlobalRateLimit()) {
      throw new Error("Service temporarily unavailable. Please try again in a moment.")
    }

    const privacyCheck = await canSendMessage(user.id, messageData.to_user_id)
    if (!privacyCheck.allowed) {
      throw new Error(privacyCheck.reason || "Nachricht nicht erlaubt")
    }

    try {
      const result = await new Promise((resolve, reject) => {
        withRateLimit(async () => {
          try {
            const { data, error } = await supabase
              .from("messages")
              .insert({
                from_user_id: user.id,
                to_user_id: messageData.to_user_id,
                message: messageData.message,
                game_id: messageData.game_id,
                game_title: messageData.game_title,
                game_image: messageData.game_image,
                offer_type: messageData.offer_type,
                read: false,
                delivery_preference: messageData.delivery_preference,
              })
              .select()
              .single()

            if (error) {
              console.error("Error sending message:", error)
              throw error
            }

            const { data: userData } = await supabase.from("users").select("username").eq("id", user.id).single()

            const senderName = userData?.username || "Ein Nutzer"

            const messagePreview =
              messageData.message.length > 50 ? messageData.message.substring(0, 50) + "..." : messageData.message

            await notifyNewMessage(messageData.to_user_id, senderName, messagePreview)

            return data
          } catch (innerError) {
            const errorMessage = innerError instanceof Error ? innerError.message : String(innerError)
            if (
              innerError instanceof SyntaxError ||
              errorMessage.includes("JSON") ||
              errorMessage.includes("Too Many R") ||
              errorMessage.includes("Unexpected token") ||
              errorMessage.includes("rate limit") ||
              errorMessage.includes("429")
            ) {
              // removed debug Messages: Send blocked due to rate limiting")
              throw new Error("Service temporarily unavailable. Please try again in a moment.")
            }
            throw innerError
          }
        })
          .then(resolve)
          .catch(reject)
      })

      // Add the new message to local state
      if (result) {
        setMessages((prev) => [result, ...prev])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("Service temporarily unavailable")) {
        throw error
      } else {
        console.error("Error sending message:", error)
        throw new Error("Failed to send message. Please try again.")
      }
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!user) return

    if (checkGlobalRateLimit()) {
      // removed debug Messages: Skipping mark as read due to rate limiting")
      return
    }

    try {
      await withRateLimit(async () => {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("id", messageId)
          .eq("to_user_id", user.id)

        if (error) {
          console.error("Error marking message as read:", error)
          return
        }

        // Update local state
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
      })
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user) return

    if (checkGlobalRateLimit()) {
      // removed debug Messages: Skipping delete due to rate limiting")
      return
    }

    try {
      await withRateLimit(async () => {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId)
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

        if (error) {
          console.error("Error deleting message:", error)
          return
        }

        // Update local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      })
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const getUnreadCount = () => {
    if (!user) return 0
    return messages.filter((msg) => msg.to_user_id === user.id && !msg.read).length
  }

  const getUserMessages = () => {
    if (!user) return []
    return messages
      .filter((msg) => msg.to_user_id === user.id || msg.from_user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const getOfferTypeText = (type: string) => {
    switch (type) {
      case "lend":
        return "Verleihen"
      case "trade":
        return "Tauschen"
      case "sell":
        return "Verkaufen"
      case "search_buy":
        return "Suche Kauf"
      case "search_rent":
        return "Suche Leihe"
      case "search_trade":
        return "Suche Tausch"
      case "event_inquiry":
        return "Event-Anfrage"
      case "group_inquiry":
        return "Gruppen-Anfrage"
      default:
        return type
    }
  }

  const getOfferTypeColor = (type: string) => {
    switch (type) {
      case "lend":
        return "bg-teal-400"
      case "trade":
        return "bg-orange-400"
      case "sell":
        return "bg-pink-400"
      case "search_buy":
      case "search_rent":
      case "search_trade":
        return "bg-purple-400"
      case "event_inquiry":
        return "bg-blue-400"
      case "group_inquiry":
        return "bg-green-400"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <MessagesContext.Provider
      value={{
        messages,
        sendMessage,
        markAsRead,
        deleteMessage,
        getUnreadCount,
        getUserMessages,
        refreshMessages,
        getOfferTypeText,
        getOfferTypeColor,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider")
  }
  return context
}
