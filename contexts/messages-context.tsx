"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

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
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { user } = useUser()

  // Load messages from database on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshMessages()
    } else {
      setMessages([])
      setIsLoaded(true)
    }
  }, [user])

  const refreshMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading messages:", error)
        setIsLoaded(true)
        return
      }

      setMessages(data || [])
      setIsLoaded(true)
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        console.error("JSON parsing error in messages - likely API rate limit or server error:", error.message)
        // Set a user-friendly error state instead of crashing
        setMessages([])
        setIsLoaded(true)
      } else {
        console.error("Error loading messages:", error)
        setMessages([])
        setIsLoaded(true)
      }
    }
  }

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

      // Add the new message to local state
      if (data) {
        setMessages((prev) => [data, ...prev])
      }
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        console.error("JSON parsing error when sending message - likely API rate limit:", error.message)
        throw new Error("Unable to send message due to server error. Please try again later.")
      } else {
        console.error("Error sending message:", error)
        throw error
      }
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId)
        .eq("to_user_id", user.id) // Only allow marking own messages as read

      if (error) {
        console.error("Error marking message as read:", error)
        return
      }

      // Update local state
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`) // Only allow deleting own messages

      if (error) {
        console.error("Error deleting message:", error)
        return
      }

      // Update local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
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
