"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { User, MessageCircle, Send, Search } from "lucide-react"
import { Suspense, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"

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
  const { user } = useAuth()
  const { getUserMessages, markAsRead, getUnreadCount } = useMessages()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  if (!user) return null

  const userMessages = getUserMessages(user.name)

  const conversations = userMessages.reduce((acc: any, message: any) => {
    const conversationKey = message.fromUser
    if (!acc[conversationKey]) {
      acc[conversationKey] = []
    }
    acc[conversationKey].push(message)
    return acc
  }, {})

  // Sort conversations by latest message
  const sortedConversations = Object.entries(conversations).sort(([, messagesA]: any, [, messagesB]: any) => {
    const latestA = Math.max(...messagesA.map((m: any) => new Date(m.timestamp).getTime()))
    const latestB = Math.max(...messagesB.map((m: any) => new Date(m.timestamp).getTime()))
    return latestB - latestA
  })

  const filteredConversations = sortedConversations.filter(([userName]) =>
    userName.toLowerCase().includes(searchTerm.toLowerCase()),
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
      default:
        return "bg-gray-400"
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In a real app, this would send the message to the backend
      alert(`Nachricht gesendet an ${selectedConversation}: "${newMessage}"`)
      setNewMessage("")
    }
  }

  const selectedMessages = selectedConversation ? conversations[selectedConversation] || [] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="messages" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">Nachrichten</h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-body">Deine Unterhaltungen im Überblick!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="h-[600px] flex overflow-hidden border-2 border-teal-200 shadow-lg">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-white">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Unterhaltungen durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-body"
                  />
                </div>
              </div>

              <div className="overflow-y-auto h-full">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-body">Keine Unterhaltungen gefunden</p>
                  </div>
                ) : (
                  filteredConversations.map(([userName, messages]: any) => {
                    const latestMessage = messages[messages.length - 1]
                    const unreadCount = messages.filter((m: any) => !m.read).length
                    const isSelected = selectedConversation === userName

                    return (
                      <div
                        key={userName}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isSelected ? "bg-teal-50 border-l-4 border-l-teal-400" : ""
                        }`}
                        onClick={() => {
                          setSelectedConversation(userName)
                          // Mark messages as read when conversation is opened
                          messages.forEach((msg: any) => {
                            if (!msg.read) markAsRead(msg.id)
                          })
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-handwritten text-lg text-gray-800 truncate">{userName}</h3>
                              <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
                                )}
                                <span className="text-xs text-gray-500 font-body">
                                  {formatTime(latestMessage.timestamp)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={`${getOfferTypeColor(latestMessage.offerType)} text-white text-xs font-body`}
                              >
                                {getOfferTypeText(latestMessage.offerType)}
                              </Badge>
                              <span className="text-sm text-gray-600 font-body truncate">
                                {latestMessage.gameTitle}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 font-body truncate mt-1">{latestMessage.message}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-handwritten text-xl text-gray-800">{selectedConversation}</h2>
                        <p className="text-sm text-gray-600 font-body">
                          {selectedMessages.length} Nachricht{selectedMessages.length !== 1 ? "en" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedMessages.map((message: any, index: number) => (
                      <div key={message.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-lg p-3 shadow-sm border">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={`${getOfferTypeColor(message.offerType)} text-white text-xs font-body`}>
                                {getOfferTypeText(message.offerType)}
                              </Badge>
                              <span className="text-sm font-body text-gray-600">{message.gameTitle}</span>
                              <span className="text-xs text-gray-500 font-body ml-auto">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-gray-800 font-body">{message.message}</p>
                            {message.gameImage && (
                              <img
                                src={message.gameImage || "/placeholder.svg"}
                                alt={message.gameTitle}
                                className="w-16 h-20 rounded-lg shadow-sm mt-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 font-body"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-handwritten text-gray-600 mb-2">Wähle eine Unterhaltung</h3>
                    <p className="text-gray-500 font-body">Klicke auf eine Unterhaltung links, um zu chatten</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
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
