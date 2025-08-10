"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MailOpen, Clock, User, MessageCircle, Trash2, Check } from 'lucide-react'
import { Suspense } from 'react'
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Nachrichten werden geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
          Dein Posteingang wird vorbereitet!
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
        </div>
      </div>
    </div>
  )
}

function MessagesContent() {
  const { user } = useAuth()
  const { getUserMessages, markAsRead, deleteMessage, getUnreadCount } = useMessages()
  const [replyMessage, setReplyMessage] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!user) return null

  const userMessages = getUserMessages(user.name)
  const unreadMessages = userMessages.filter(msg => !msg.read)
  const readMessages = userMessages.filter(msg => msg.read)
  const unreadCount = getUnreadCount(user.name)

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Gerade eben'
    } else if (diffInHours < 24) {
      return `vor ${Math.floor(diffInHours)} Stunden`
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      })
    }
  }

  const getOfferTypeText = (type: string) => {
    switch(type) {
      case 'lend': return 'Verleihen'
      case 'trade': return 'Tauschen'
      case 'sell': return 'Verkaufen'
      default: return type
    }
  }

  const getOfferTypeColor = (type: string) => {
    switch(type) {
      case 'lend': return 'bg-teal-400'
      case 'trade': return 'bg-orange-400'
      case 'sell': return 'bg-pink-400'
      default: return 'bg-gray-400'
    }
  }

  const handleDeleteMessage = (messageId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Möchtest du diese Nachricht wirklich löschen?')) {
      deleteMessage(messageId)
    }
  }

  const handleSendReply = (message: any) => {
    if (replyMessage.trim()) {
      // Mark message as read when replying
      markAsRead(message.id)
      // Here you would send the actual reply
      alert("Antwort gesendet! (Demo)")
      setReplyMessage("")
      setIsDialogOpen(false)
    }
  }

  const renderMessageCard = (message: any, index: number, isReadTab: boolean = false) => (
    <Card 
      key={message.id} 
      className={`transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-all relative ${
        !message.read ? 'border-2 border-purple-300 bg-purple-50' : 'border-2 border-gray-200 bg-gray-50'
      }`}
    >
      {/* Delete Button with Trash Icon */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 w-8 h-8 p-0 hover:bg-red-100 z-10"
        onClick={(e) => handleDeleteMessage(message.id, e)}
      >
        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
      </Button>

      <CardHeader className="pb-3 pr-12">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-handwritten flex items-center">
                {message.read ? (
                  <MailOpen className="w-4 h-4 mr-2 text-gray-500" />
                ) : (
                  <Mail className="w-4 h-4 mr-2 text-purple-600" />
                )}
                Anfrage von {message.fromUser}
                {message.read && (
                  <Badge className="ml-2 bg-green-500 text-white text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Beantwortet
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${getOfferTypeColor(message.offerType)} text-white text-xs font-body`}>
                  {getOfferTypeText(message.offerType)}
                </Badge>
                <span className="text-sm text-gray-600 font-body">
                  {message.gameTitle}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500 font-body">
              <Clock className="w-4 h-4 mr-1" />
              {formatDate(message.timestamp)}
            </div>
            {!message.read && (
              <Badge className="bg-red-500 text-white text-xs mt-1">
                Neu
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <img
            src={message.gameImage || "/placeholder.svg"}
            alt={message.gameTitle}
            className="w-16 h-20 rounded-lg shadow-md flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-gray-700 font-body bg-white p-3 rounded-lg border">
              "{message.message}"
            </p>
            <div className="mt-3 flex gap-2">
              {!message.read ? (
                <Dialog open={isDialogOpen && selectedMessage?.id === message.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-purple-400 hover:bg-purple-500 text-white font-handwritten"
                      onClick={() => {
                        setSelectedMessage(message)
                        setIsDialogOpen(true)
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Antworten
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-handwritten text-xl">
                        Antwort an {message.fromUser}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 font-body">
                          <strong>Ursprüngliche Anfrage:</strong>
                        </p>
                        <p className="text-sm font-body mt-1">"{message.message}"</p>
                      </div>
                      <Textarea
                        placeholder="Deine Antwort..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="font-body"
                        rows={4}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 font-handwritten"
                          onClick={() => {
                            setReplyMessage("")
                            setIsDialogOpen(false)
                          }}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          className="flex-1 bg-purple-400 hover:bg-purple-500 text-white font-handwritten"
                          onClick={() => handleSendReply(message)}
                          disabled={!replyMessage.trim()}
                        >
                          Senden
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="font-handwritten text-gray-500 cursor-not-allowed"
                  disabled
                >
                  <Check className="w-4 h-4 mr-1" />
                  Bereits beantwortet
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="font-handwritten"
              >
                Kontakt teilen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderEmptyState = (type: 'unread' | 'read') => (
    <Card className="transform rotate-1 border-2 border-gray-200">
      <CardContent className="p-12 text-center">
        {type === 'unread' ? (
          <>
            <Mail className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-600 mb-4 font-handwritten">
              Keine neuen Nachrichten
            </h3>
            <p className="text-gray-500 font-body">
              Alle deine Nachrichten sind bereits beantwortet!
            </p>
          </>
        ) : (
          <>
            <MailOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-600 mb-4 font-handwritten">
              Keine beantworteten Nachrichten
            </h3>
            <p className="text-gray-500 font-body">
              Beantwortete Nachrichten erscheinen hier.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="messages" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Dein Posteingang
          </h2>
          <p className="text-xl text-gray-600 transform rotate-1 font-body">
            Beantworte Anfragen zu deinen Spielen!
          </p>
        </div>

        {/* Messages Tabs */}
        <div className="max-w-4xl mx-auto">
          {userMessages.length === 0 ? (
            <Card className="transform rotate-1 border-2 border-gray-200">
              <CardContent className="p-12 text-center">
                <Mail className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4 font-handwritten">
                  Noch keine Nachrichten
                </h3>
                <p className="text-gray-500 font-body">
                  Sobald jemand Interesse an deinen Spielen zeigt, erscheinen die Anfragen hier!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="unread" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border-2 border-gray-200 transform -rotate-1">
                <TabsTrigger 
                  value="unread" 
                  className="font-handwritten text-lg data-[state=active]:bg-purple-400 data-[state=active]:text-white relative"
                >
                  Unbeantwortet
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs min-w-[20px] h-5">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="read" 
                  className="font-handwritten text-lg data-[state=active]:bg-purple-400 data-[state=active]:text-white"
                >
                  Beantwortet ({readMessages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread" className="space-y-4">
                {unreadMessages.length === 0 ? (
                  renderEmptyState('unread')
                ) : (
                  unreadMessages.map((message, index) => renderMessageCard(message, index, false))
                )}
              </TabsContent>

              <TabsContent value="read" className="space-y-4">
                {readMessages.length === 0 ? (
                  renderEmptyState('read')
                ) : (
                  readMessages.map((message, index) => renderMessageCard(message, index, true))
                )}
              </TabsContent>
            </Tabs>
          )}
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
