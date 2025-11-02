"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send, Search, Trash2 } from "lucide-react"
import { Suspense, useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { useMessages } from "@/contexts/messages-context"
import { useAvatar } from "@/contexts/avatar-context"
import { toast } from "react-toastify"

function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Chat wird geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-body">Deine Unterhaltungen werden vorbereitet!</p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></div>
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
        partnerId: conversationPartnerId, // Store actual partner ID for messaging
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

    if (diffInHours < 1) {
      return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    }
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

  const getConversationTitle = (gameTitle: string, offerType: string) => {
    switch (offerType) {
      case "event_inquiry":
        return `Event • ${gameTitle}`
      case "group_inquiry":
        return `Spielgruppe • ${gameTitle}`
      default:
        // For marketplace messages: "Spielname • Verleihen/Verkaufen/etc."
        return `${gameTitle} • ${getOfferTypeText(offerType)}`
    }
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        console.log("[v0] Sending message to conversation:", selectedConversation)

        const conversationData = conversations[selectedConversation]
        const latestMessage = conversationData?.latestMessage

        if (!latestMessage) {
          console.error("[v0] No latest message found for conversation")
          return
        }

        await sendMessage({
          to_user_id: conversationData.partnerId,
          message: newMessage,
          game_id: latestMessage.game_id,
          game_title: latestMessage.game_title,
          game_image: latestMessage.game_image,
          offer_type: latestMessage.offer_type,
        })

        console.log("[v0] Message sent successfully")
        toast.success("Nachricht erfolgreich gesendet")
        setNewMessage("")

        await refreshMessages()
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        toast.error("Fehler beim Senden der Nachricht. Bitte versuche es erneut.")
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      await refreshMessages()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting message:", error)
      alert("Fehler beim Löschen der Nachricht.")
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
    } catch (error) {
      console.error("Error deleting conversation:", error)
      alert("Fehler beim Löschen der Unterhaltung.")
    }
  }

  const selectedMessages = selectedConversation
    ? (conversations[selectedConversation]?.messages || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="messages" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Nachrichten
          </h1>
          <p className="text-lg md:text-xl text-gray-600 transform rotate-1 font-body">
            Deine Unterhaltungen im Überblick!
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="h-[70vh] md:h-[600px] flex flex-col md:flex-row overflow-hidden border-2 border-teal-300 shadow-xl bg-white">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
              <div className="p-3 md:p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Unterhaltungen durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-body text-sm md:text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="overflow-y-auto h-48 md:h-full">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 md:p-8 text-center">
                    <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-body text-sm md:text-base">Keine Unterhaltungen gefunden</p>
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
                        className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer hover:bg-teal-50/50 transition-all duration-200 ${
                          isSelected ? "bg-teal-50 border-l-4 border-l-teal-400 shadow-sm" : ""
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversationKey)
                          messages.forEach((msg: any) => {
                            if (msg.to_user_id === user.id && !msg.read) markAsRead(msg.id)
                          })
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 border-2 border-teal-200 shadow-sm">
                            <AvatarImage src={partnerAvatar || "/placeholder.svg"} alt={data.partnerName} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-semibold">
                              {data.partnerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm md:text-base text-gray-800 truncate">
                                {data.partnerName}
                              </h3>
                              <div className="flex items-center space-x-1 md:space-x-2">
                                {unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">{unreadCount}</Badge>
                                )}
                                <span className="text-xs text-gray-500 font-body">
                                  {formatTime(latestMessage.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-xs text-gray-600 font-medium truncate">
                                {getConversationTitle(data.gameTitle, latestMessage.offer_type)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 font-body truncate">
                              {latestMessage.from_user_id === user.id
                                ? `Nachricht an ${data.partnerName}: ${latestMessage.message}`
                                : `Nachricht von ${data.partnerName}: ${latestMessage.message}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white min-h-0">
              {selectedConversation ? (
                <>
                  <div className="p-3 md:p-4 bg-white border-b-2 border-gray-200 flex-shrink-0 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
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
                              <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-teal-300 shadow-md">
                                <AvatarImage
                                  src={partnerAvatar || "/placeholder.svg"}
                                  alt={conversationData?.partnerName}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-semibold">
                                  {conversationData?.partnerName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h2 className="font-bold text-base md:text-lg text-gray-800">
                                  {conversationData?.partnerName}
                                </h2>
                                <p className="text-xs md:text-sm text-gray-600 font-body">
                                  {getConversationTitle(conversationData?.gameTitle, conversationData?.offerType)}
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ type: "conversation", id: selectedConversation! })}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
                    {selectedMessages.map((message: any, index: number) => {
                      const isFromCurrentUser = message.from_user_id === user.id
                      const messageUserData = isFromCurrentUser ? message.from_user : message.to_user
                      const messageAvatar = getAvatar(
                        isFromCurrentUser ? user.id : conversations[selectedConversation]?.partnerId,
                        messageUserData?.email || messageUserData?.username,
                      )

                      return (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-2 md:space-x-3 ${isFromCurrentUser ? "flex-row-reverse space-x-reverse" : ""} group`}
                        >
                          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-gray-200 shadow-sm flex-shrink-0">
                            <AvatarImage src={messageAvatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-semibold">
                              {(isFromCurrentUser ? user.username : conversations[selectedConversation]?.partnerName)
                                ?.charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 relative max-w-[85%] md:max-w-[70%]">
                            <div
                              className={`rounded-2xl p-3 md:p-4 shadow-md border-2 ${
                                isFromCurrentUser
                                  ? "bg-gray-100 text-gray-800 border-gray-300 ml-4 md:ml-8"
                                  : "bg-white text-gray-800 border-gray-200 mr-4 md:mr-8"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  {getConversationTitle(message.game_title, message.offer_type)}
                                </span>
                                <span className={`text-xs ${isFromCurrentUser ? "text-gray-500" : "text-gray-500"}`}>
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                              <p
                                className={`text-sm md:text-base break-words ${isFromCurrentUser ? "text-gray-800" : "text-gray-800"}`}
                              >
                                {message.message}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ type: "message", id: message.id })}
                              className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 w-6 h-6 p-0 ${
                                isFromCurrentUser ? "left-0" : "right-0"
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="p-3 md:p-4 bg-white border-t-2 border-gray-200 flex-shrink-0 shadow-lg">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Input
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 font-body text-sm md:text-base border-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-4 md:px-6 py-2 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">Wähle eine Unterhaltung</h3>
                    <p className="text-gray-500 font-body text-sm md:text-base">
                      Klicke auf eine Unterhaltung links, um zu chatten
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                {deleteConfirm.type === "message" ? "Nachricht löschen?" : "Unterhaltung löschen?"}
              </h3>
              <p className="text-gray-600 font-body mb-6 text-sm md:text-base">
                {deleteConfirm.type === "message"
                  ? "Diese Nachricht wird dauerhaft gelöscht und kann nicht wiederhergestellt werden."
                  : "Diese gesamte Unterhaltung wird dauerhaft gelöscht und kann nicht wiederhergestellt werden."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 font-semibold border-2"
                >
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
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold"
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
