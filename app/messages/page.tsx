"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send, Search, Trash2, ArrowLeft, MoreVertical, Check, CheckCheck } from "lucide-react"
import { RiChatSearchFill } from "react-icons/ri"
import { Suspense, useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { useMessages } from "@/contexts/messages-context"
import { useAvatar } from "@/contexts/avatar-context"
import { toast } from "react-toastify"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Nachrichten werden geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">Deine Unterhaltungen werden geholt!</p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )
}

function MessagesContent() {
  const { user } = useUser()
  const { getUserMessages, markAsRead, getUnreadCount, refreshMessages, sendMessage, deleteMessage } = useMessages()
  const { getAvatar } = useAvatar()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "message" | "conversation"; id: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation])

  useEffect(() => {
    if (user) {
      refreshMessages()
    }
  }, [user, refreshMessages])

  if (!user) return null

  const userMessages = getUserMessages()

  const conversations = userMessages.reduce((acc: any, message: any) => {
    const isFromCurrentUser = message.from_user_id === user.id
    const conversationPartnerId = isFromCurrentUser ? message.to_user_id : message.from_user_id

    const conversationKey = `${conversationPartnerId}-${message.game_id || "no-game"}-${message.offer_type}`

    if (!acc[conversationKey]) {
      const partnerUserData = isFromCurrentUser ? message.to_user : message.from_user
      const partnerName = partnerUserData?.username || partnerUserData?.name || "Unbekannter Benutzer"

      acc[conversationKey] = {
        messages: [],
        partnerName: partnerName,
        latestMessage: null,
        partnerId: conversationPartnerId,
        gameTitle: message.game_title,
        offerType: message.offer_type,
      }
    }
    acc[conversationKey].messages.push(message)

    if (
      !acc[conversationKey].latestMessage ||
      new Date(message.created_at) > new Date(acc[conversationKey].latestMessage.created_at)
    ) {
      acc[conversationKey].latestMessage = message
    }

    return acc
  }, {})

  const sortedConversations = Object.entries(conversations).sort(([, dataA]: any, [, dataB]: any) => {
    const latestA = dataA.latestMessage ? new Date(dataA.latestMessage.created_at).getTime() : 0
    const latestB = dataB.latestMessage ? new Date(dataB.latestMessage.created_at).getTime() : 0
    return latestB - latestA
  })

  const filteredConversations = sortedConversations.filter(
    ([conversationKey, data]: any) =>
      (data.gameTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (data.partnerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24

    if (diffInHours < 24) {
      return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("de-DE", { weekday: "short" })
    } else {
      return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
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
        return "Event"
      case "group_inquiry":
        return "Gruppe"
      default:
        return type
    }
  }

  const getConversationTitle = (gameTitle: string, offerType: string) => {
    switch (offerType) {
      case "event_inquiry":
        return gameTitle
      case "group_inquiry":
        return gameTitle
      default:
        return gameTitle
    }
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        const conversationData = conversations[selectedConversation]
        const latestMessage = conversationData?.latestMessage

        if (!latestMessage) return

        await sendMessage({
          to_user_id: conversationData.partnerId,
          message: newMessage,
          game_id: latestMessage.game_id,
          game_title: latestMessage.game_title,
          game_image: latestMessage.game_image,
          offer_type: latestMessage.offer_type,
        })

        setNewMessage("")
        await refreshMessages()
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      } catch (error) {
        toast.error("Fehler beim Senden der Nachricht")
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      await refreshMessages()
      setDeleteConfirm(null)
      toast.success("Nachricht gelöscht")
    } catch (error) {
      toast.error("Fehler beim Löschen der Nachricht")
    }
  }

  const handleDeleteConversation = async (partnerId: string) => {
    try {
      const conversationMessages = conversations[partnerId]?.messages || []
      for (const message of conversationMessages) {
        await deleteMessage(message.id)
      }
      await refreshMessages()
      setSelectedConversation(null)
      setDeleteConfirm(null)
      toast.success("Unterhaltung gelöscht")
    } catch (error) {
      toast.error("Fehler beim Löschen der Unterhaltung")
    }
  }

  const selectedMessages = selectedConversation
    ? (conversations[selectedConversation]?.messages || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    : []

  const totalUnread = Object.values(conversations).reduce((acc: number, data: any) => {
    return acc + data.messages.filter((m: any) => m.to_user_id === user.id && !m.read).length
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="messages" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-2">Nachrichten</h1>
          <p className="text-gray-600 font-normal text-base">Deine Unterhaltungen im Überblick!</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col md:flex-row overflow-hidden border border-gray-200 shadow-sm bg-white rounded-xl">
            <div
              className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}
            >
              {/* Search header */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <RiChatSearchFill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Unterhaltungen suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-0 rounded-lg"
                  />
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Keine Unterhaltungen</p>
                  </div>
                ) : (
                  filteredConversations.map(([conversationKey, data]: any) => {
                    const messages = data.messages
                    const latestMessage = data.latestMessage || messages[messages.length - 1]
                    const unreadCount = messages.filter((m: any) => m.to_user_id === user.id && !m.read).length
                    const isSelected = selectedConversation === conversationKey

                    const partnerUserData =
                      latestMessage.from_user_id === user.id ? latestMessage.to_user : latestMessage.from_user
                    const partnerAvatar = getAvatar(data.partnerId, partnerUserData?.email || partnerUserData?.username)

                    return (
                      <div
                        key={conversationKey}
                        className={`px-3 py-3 cursor-pointer transition-colors border-l-2 ${
                          isSelected ? "bg-teal-50 border-l-teal-500" : "border-l-transparent hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversationKey)
                          messages.forEach((msg: any) => {
                            if (msg.to_user_id === user.id && !msg.read) markAsRead(msg.id)
                          })
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          {/* First row: Avatar + Username + Time */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={partnerAvatar || "/placeholder.svg"} alt={data.partnerName} />
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px] font-medium">
                                {data.partnerName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <h3
                              className={`truncate text-xs font-normal ${unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                            >
                              {data.partnerName}
                            </h3>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                              {formatTime(latestMessage.created_at)}
                            </span>
                          </div>
                          {/* Second row: Game title and offer type */}
                          <p className="text-xs text-gray-500 truncate pl-8">
                            {getConversationTitle(data.gameTitle, latestMessage.offer_type)}
                            <span className="mx-1">•</span>
                            <span className="text-gray-500">{getOfferTypeText(latestMessage.offer_type)}</span>
                          </p>
                          {/* Third row: Last message + unread badge */}
                          <div className="flex items-center justify-between pl-8">
                            <p
                              className={`text-xs truncate pr-2 ${unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}
                            >
                              {latestMessage.from_user_id === user.id && <span className="text-gray-400">Du: </span>}
                              {latestMessage.message}
                            </p>
                            {unreadCount > 0 && (
                              <Badge className="bg-teal-500 text-white text-xs h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col min-h-0 ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Mobile back button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversation(null)}
                          className="md:hidden p-1 -ml-1"
                        >
                          <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>

                        {(() => {
                          const conversationData = conversations[selectedConversation]
                          const latestMessage = conversationData?.latestMessage
                          const partnerUserData =
                            latestMessage?.from_user_id === user.id ? latestMessage.to_user : latestMessage?.from_user
                          const partnerAvatar = getAvatar(
                            conversationData?.partnerId,
                            partnerUserData?.email || partnerUserData?.username,
                          )

                          return (
                            <>
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={partnerAvatar || "/placeholder.svg"}
                                  alt={conversationData?.partnerName}
                                />
                                <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                                  {conversationData?.partnerName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h2 className="font-semibold text-gray-900 text-sm">{conversationData?.partnerName}</h2>
                                <p className="text-xs text-gray-500">
                                  {getConversationTitle(conversationData?.gameTitle, conversationData?.offerType)}
                                  <span className="mx-1">•</span>
                                  {getOfferTypeText(conversationData?.offerType)}
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm({ type: "conversation", id: selectedConversation! })}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unterhaltung löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {selectedMessages.map((message: any, index: number) => {
                      const isFromCurrentUser = message.from_user_id === user.id
                      const showAvatar =
                        index === 0 || selectedMessages[index - 1]?.from_user_id !== message.from_user_id

                      const messageUserData = isFromCurrentUser ? message.from_user : message.to_user
                      const messageAvatar = getAvatar(
                        isFromCurrentUser ? user.id : conversations[selectedConversation]?.partnerId,
                        messageUserData?.email || messageUserData?.username,
                      )

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"} group`}
                        >
                          <div
                            className={`flex items-center space-x-2 max-w-[80%] ${isFromCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}
                          >
                            {showAvatar && !isFromCurrentUser ? (
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={messageAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                  {conversations[selectedConversation]?.partnerName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : !isFromCurrentUser ? (
                              <div className="w-7 flex-shrink-0" />
                            ) : null}

                            <div className="relative">
                              <div
                                className={`px-3 py-2 rounded-2xl ${
                                  isFromCurrentUser
                                    ? "bg-teal-500 text-white rounded-br-md"
                                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-xs">{message.message}</p>
                              </div>
                              <div
                                className={`flex items-center mt-1 space-x-1 ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                              >
                                <span className="text-xs text-gray-400">{formatMessageTime(message.created_at)}</span>
                                {isFromCurrentUser &&
                                  (message.read ? (
                                    <CheckCheck className="w-3 h-3 text-teal-500" />
                                  ) : (
                                    <Check className="w-3 h-3 text-gray-400" />
                                  ))}
                              </div>

                              {/* Delete button on hover */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: "message", id: message.id })}
                                className={`absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-red-50 ${
                                  isFromCurrentUser ? "-left-8" : "-right-8"
                                }`}
                              >
                                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input */}
                  <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        className="flex-1 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-0 rounded-full px-4"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white p-0 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Empty state
                <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-gray-500 font-bold text-base">Wähle eine Unterhaltung</h3>
                    <p className="text-gray-500 text-xs">Klicke links auf eine Unterhaltung, um sie zu öffnen</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="p-6 max-w-sm w-full shadow-xl border-0 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                {deleteConfirm.type === "message" ? "Nachricht löschen?" : "Unterhaltung löschen?"}
              </h3>
              <p className="text-gray-600 mb-5 text-xs">
                {deleteConfirm.type === "message"
                  ? "Diese Nachricht wird dauerhaft gelöscht."
                  : "Diese gesamte Unterhaltung wird dauerhaft gelöscht."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 h-9 text-sm">
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    if (deleteConfirm.type === "message") {
                      handleDeleteMessage(deleteConfirm.id)
                    } else {
                      handleDeleteConversation(deleteConfirm.id)
                    }
                  }}
                  className="flex-1 h-9 text-sm bg-red-500 hover:bg-red-600 text-white"
                >
                  Löschen
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<MessagesLoading />}>
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  )
}
