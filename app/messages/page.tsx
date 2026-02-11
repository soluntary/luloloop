"use client"

import { getUserAvatar } from "@/lib/avatar"
import { useEffect, useState, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  message: string
  created_at: string
  read: boolean
  from_user?: { id: string; name: string; avatar: string; username: string }
  to_user?: { id: string; name: string; avatar: string; username: string }
}

interface Conversation {
  odtnerId: string
  partnerName: string
  partnerAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sending, setSending] = useState(false)
  const [initialConversationSet, setInitialConversationSet] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      console.log("[v0] loadMessages called, user:", user?.id)
      if (!user) {
        console.log("[v0] No user, setting messagesLoading to false")
        setMessagesLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching messages from Supabase...")
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select(`
            *,
            from_user:from_user_id(id, name, avatar, username),
            to_user:to_user_id(id, name, avatar, username)
          `)
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        console.log("[v0] Messages query result:", { messagesData, error })

        if (error) {
          console.error("[v0] Error fetching messages:", error)
        }

        if (messagesData) {
          setMessages(messagesData)

          // Build conversations
          const convMap = new Map<string, Conversation>()
          messagesData.forEach((msg) => {
            const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id
            const partner = msg.from_user_id === user.id ? msg.to_user : msg.from_user

            if (!convMap.has(partnerId)) {
              convMap.set(partnerId, {
                odtnerId: partnerId,
                partnerName: partner?.username || "Unbekannt", // Changed to use username instead of name
                partnerAvatar: partner?.avatar || "",
                lastMessage: msg.message,
                lastMessageTime: msg.created_at,
                unreadCount: 0,
              })
            }

            if (msg.to_user_id === user.id && !msg.read) {
              const conv = convMap.get(partnerId)!
              conv.unreadCount++
            }
          })

          setConversations(Array.from(convMap.values()))
        }
      } catch (error) {
        console.error("[v0] Error loading messages:", error)
      } finally {
        console.log("[v0] Setting messagesLoading to false")
        setMessagesLoading(false)
      }
    }

    console.log("[v0] useEffect triggered, authLoading:", authLoading)
    if (!authLoading) {
      loadMessages()
    }
  }, [user, authLoading])

  // Handle URL parameters to select specific conversation
  useEffect(() => {
    if (initialConversationSet) return
    if (messagesLoading) return
    if (!user) return
    
    const conversationId = searchParams.get("conversation")
    const userId = searchParams.get("user")
    const recipientId = searchParams.get("recipientId") // Support for group messages
    const context = searchParams.get("context") // Context info (e.g., group name)
    
    if (conversationId || userId || recipientId) {
      const targetUserId = conversationId || userId || recipientId
      
      // If conversations are loaded, check if we have one with this user
      const existingConversation = conversations.find(c => c.odtnerId === targetUserId)
      if (existingConversation) {
        setSelectedConversation(targetUserId)
        setInitialConversationSet(true)
        return
      }
      
      // If no existing conversation found, try to load user info and create new conversation
      if (targetUserId) {
        // Load user info for this target user to show in the conversation list
        const loadTargetUser = async () => {
          try {
            const { data: targetUser, error } = await supabase
              .from("users")
              .select("id, name, avatar, username")
              .eq("id", targetUserId)
              .single()
            
            if (targetUser && !error) {
              // Add a temporary conversation for this user if not exists
              const contextMessage = context 
                ? `Nachricht bezüglich: ${context}`
                : "Starte eine neue Unterhaltung..."
              
              setConversations(prev => {
                const existingConv = prev.find(c => c.odtnerId === targetUserId)
                if (existingConv) return prev
                return [{
                  odtnerId: targetUserId,
                  partnerName: targetUser.username || targetUser.name || "Unbekannt",
                  partnerAvatar: targetUser.avatar || "",
                  lastMessage: contextMessage,
                  lastMessageTime: new Date().toISOString(),
                  unreadCount: 0,
                }, ...prev]
              })
              setSelectedConversation(targetUserId)
              setInitialConversationSet(true)
              
              // Pre-fill message input with context if available
              if (context) {
                setNewMessage(`Hallo! Ich schreibe dir bezüglich "${context}". `)
              }
            } else {
              // Even if user not found, mark as set to prevent infinite loop
              setInitialConversationSet(true)
            }
          } catch (err) {
            console.error("[v0] Error loading target user:", err)
            setInitialConversationSet(true)
          }
        }
        loadTargetUser()
      }
    } else {
      // No URL parameters, mark as set
      setInitialConversationSet(true)
    }
  }, [conversations, searchParams, initialConversationSet, messagesLoading, supabase, user])

  useEffect(() => {
    if (messagesContainerRef.current && selectedConversation) {
      // Scroll instantly without animation
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [
    selectedConversation,
    messages.filter(
      (msg) =>
        (msg.from_user_id === selectedConversation && msg.to_user_id === user?.id) ||
        (msg.to_user_id === selectedConversation && msg.from_user_id === user?.id),
    ).length,
  ])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return
    setSending(true)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          from_user_id: user.id,
          to_user_id: selectedConversation,
          message: newMessage.trim(),
          read: false,
        })
        .select(`
          *,
          from_user:from_user_id(id, name, avatar, username),
          to_user:to_user_id(id, name, avatar, username)
        `)
        .single()

      if (!error && data) {
        setMessages((prev) => [data, ...prev])
        setNewMessage("")
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }, 0)
      } else if (error) {
        toast({
          title: "Fehler",
          description: "Nachricht konnte nicht gesendet werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const conversationMessages = messages
    .filter(
      (msg) =>
        (msg.from_user_id === selectedConversation && msg.to_user_id === user?.id) ||
        (msg.to_user_id === selectedConversation && msg.from_user_id === user?.id),
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Show loading while auth is checking
  if (authLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Nachrichten werden geladen...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show login required if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-teal-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2 font-handwritten">Anmeldung erforderlich</h2>
              <p className="text-gray-600 mb-6">Bitte melde dich an, um deine Nachrichten zu sehen.</p>
              <Button
                onClick={() => router.push("/login")}
                className="bg-teal-500 hover:bg-teal-600 text-white font-handwritten"
              >
                Zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten flex items-center justify-center gap-4">
            Nachrichten
          </h1>
          <p className="text-gray-600 transform rotate-1 font-body text-base">Deine Unterhaltungen im Überblick!</p>
        </div>

        <Card className="h-[600px] border-2 border-teal-200 overflow-hidden">
          <div className="flex h-full">
            {/* Conversation List */}
            <div
              className={`w-full md:w-1/3 border-r border-teal-100 flex flex-col ${selectedConversation ? "hidden md:flex" : ""}`}
            >
              <div className="p-4 border-b border-teal-100 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-teal-200"
                  />
                </div>
              </div>
              {/* Scrollbar for Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Keine Unterhaltungen vorhanden</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.odtnerId}
                      className={`p-4 border-b border-teal-50 cursor-pointer hover:bg-teal-50 transition-colors ${
                        selectedConversation === conv.odtnerId ? "bg-teal-100" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv.odtnerId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-teal-300 flex-shrink-0">
                          <AvatarImage src={conv.partnerAvatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-teal-100 text-teal-700 font-handwritten">
                            {conv.partnerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate text-xs">{conv.partnerName}</span>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-teal-500 text-white flex-shrink-0">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-gray-500 truncate text-xs">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area with correct width */}
            <div
              className={`flex-1 flex flex-col min-w-0 overflow-hidden ${!selectedConversation ? "hidden md:flex" : ""}`}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-teal-100 flex items-center gap-3 bg-teal-50 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden flex-shrink-0"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="border-2 border-teal-300 flex-shrink-0">
                      <AvatarImage
                        src={
                          conversations.find((c) => c.odtnerId === selectedConversation)?.partnerAvatar ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                         || "/placeholder.svg"}
                      />
                      <AvatarFallback className="bg-teal-100 text-teal-700 font-handwritten">
                        {conversations
                          .find((c) => c.odtnerId === selectedConversation)
                          ?.partnerName.charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium font-handwritten text-sm truncate">
                      {conversations.find((c) => c.odtnerId === selectedConversation)?.partnerName}
                    </span>
                  </div>

                  {/* Messages with Scrollbar */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {conversationMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>Noch keine Nachrichten. Starte die Unterhaltung!</p>
                        </div>
                      ) : (
                        conversationMessages.map((msg) => {
                          const isOwnMessage = msg.from_user_id === user.id
                          const messageUser = isOwnMessage ? msg.from_user : msg.from_user
                          const partnerConv = conversations.find((c) => c.odtnerId === selectedConversation)

                          return (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              {!isOwnMessage && (
                                <Avatar className="w-8 h-8 border-2 border-teal-300 flex-shrink-0">
                                  <AvatarImage src={partnerConv?.partnerAvatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-teal-100 text-teal-700 font-handwritten text-xs">
                                    {partnerConv?.partnerName?.charAt(0).toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div
                                className={`max-w-[70%] rounded-2xl p-3 ${
                                  isOwnMessage
                                    ? "bg-teal-500 text-white rounded-br-sm"
                                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                                }`}
                              >
                                <p className="break-words text-xs">{msg.message}</p>
                                <p className={`text-xs mt-1 ${isOwnMessage ? "text-teal-100" : "text-gray-500"}`}>
                                  {format(new Date(msg.created_at), "HH:mm", { locale: de })}
                                </p>
                              </div>

                              {isOwnMessage && (
                                <Avatar className="w-8 h-8 border-2 border-teal-300 flex-shrink-0">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-teal-100 text-teal-700 font-handwritten text-xs">
                                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-teal-100 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="border-teal-200 focus:border-teal-400"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-teal-500 hover:bg-teal-600 flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center px-4">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-teal-200" />
                    <h3 className="font-handwritten text-teal-700 mb-2 text-sm">Wähle eine Unterhaltung</h3>
                    <p className="text-gray-500 text-sm">Klicke links auf eine Unterhaltung, um sie zu öffnen</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
