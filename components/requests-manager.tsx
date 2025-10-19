"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Inbox, Send, BookOpen, Repeat, ShoppingCart, Clock, Check, X, MessageCircle } from "lucide-react"
import { useRequests } from "@/contexts/requests-context"
import { useAuth } from "@/contexts/auth-context"
import { useAvatar } from "@/contexts/avatar-context"

interface RequestsManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function RequestsManager({ isOpen, onClose }: RequestsManagerProps) {
  const { user } = useAuth()
  const { getAvatar } = useAvatar()
  const {
    shelfAccessRequests,
    gameInteractionRequests,
    respondToShelfAccessRequest,
    respondToGameInteractionRequest,
    loading,
  } = useRequests()

  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  // Filter requests
  const incomingShelfRequests = shelfAccessRequests.filter(
    (req) => req.owner_id === user?.id && req.status === "pending",
  )
  const outgoingShelfRequests = shelfAccessRequests.filter((req) => req.requester_id === user?.id)

  const incomingGameRequests = gameInteractionRequests.filter(
    (req) => req.owner_id === user?.id && req.status === "pending",
  )
  const outgoingGameRequests = gameInteractionRequests.filter((req) => req.requester_id === user?.id)

  const handleShelfResponse = async (requestId: string, status: "approved" | "denied") => {
    setRespondingTo(requestId)
    try {
      await respondToShelfAccessRequest(requestId, status)
    } catch (error) {
      console.error("Error responding to shelf request:", error)
    } finally {
      setRespondingTo(null)
    }
  }

  const handleGameResponse = async (requestId: string, status: "approved" | "denied") => {
    setRespondingTo(requestId)
    try {
      await respondToGameInteractionRequest(requestId, status)
    } catch (error) {
      console.error("Error responding to game request:", error)
    } finally {
      setRespondingTo(null)
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "trade":
        return <Repeat className="h-4 w-4" />
      case "buy":
        return <ShoppingCart className="h-4 w-4" />
      case "rent":
        return <Clock className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case "trade":
        return "Tausch"
      case "buy":
        return "Kauf"
      case "rent":
        return "Ausleihe"
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Ausstehend</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Genehmigt</Badge>
      case "denied":
        return <Badge variant="destructive">Abgelehnt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Inbox className="h-5 w-5 mr-2" />
            Anfragen verwalten
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Eingehend ({incomingShelfRequests.length + incomingGameRequests.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Ausgehend ({outgoingShelfRequests.length + outgoingGameRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            <div className="space-y-4">
              {/* Shelf Access Requests */}
              {incomingShelfRequests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Spielregal-Zugang ({incomingShelfRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {incomingShelfRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={getAvatar(request.requester?.id || "", request.requester?.name)}
                                alt={request.requester?.name}
                              />
                              <AvatarFallback className="bg-teal-100 text-teal-700">
                                {request.requester?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{request.requester?.name}</p>
                              <p className="text-sm text-gray-600">möchte dein Spielregal ansehen</p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1 italic">"{request.message}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(request.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleShelfResponse(request.id, "approved")}
                              disabled={respondingTo === request.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShelfResponse(request.id, "denied")}
                              disabled={respondingTo === request.id}
                              className="bg-transparent"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Interaction Requests */}
              {incomingGameRequests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Spiel-Anfragen ({incomingGameRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {incomingGameRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={getAvatar(request.requester?.id || "", request.requester?.name)}
                                alt={request.requester?.name}
                              />
                              <AvatarFallback className="bg-teal-100 text-teal-700">
                                {request.requester?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-gray-900">{request.requester?.name}</p>
                                <div className="flex items-center text-sm text-gray-600">
                                  {getRequestTypeIcon(request.request_type)}
                                  <span className="ml-1">{getRequestTypeText(request.request_type)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                möchte "{request.game?.title}" {getRequestTypeText(request.request_type).toLowerCase()}
                              </p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1 italic">"{request.message}"</p>
                              )}
                              {request.rental_duration_days && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Ausleihdauer: {request.rental_duration_days} Tage
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(request.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleGameResponse(request.id, "approved")}
                              disabled={respondingTo === request.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGameResponse(request.id, "denied")}
                              disabled={respondingTo === request.id}
                              className="bg-transparent"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {incomingShelfRequests.length === 0 && incomingGameRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine eingehenden Anfragen</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            <div className="space-y-4">
              {/* Outgoing Shelf Requests */}
              {outgoingShelfRequests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Spielregal-Anfragen ({outgoingShelfRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {outgoingShelfRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={getAvatar(request.owner?.id || "", request.owner?.name)}
                                alt={request.owner?.name}
                              />
                              <AvatarFallback className="bg-teal-100 text-teal-700">
                                {request.owner?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{request.owner?.name}</p>
                              <p className="text-sm text-gray-600">Spielregal-Zugang angefragt</p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1 italic">"{request.message}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(request.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">{getStatusBadge(request.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing Game Requests */}
              {outgoingGameRequests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Spiel-Anfragen ({outgoingGameRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {outgoingGameRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={getAvatar(request.owner?.id || "", request.owner?.name)}
                                alt={request.owner?.name}
                              />
                              <AvatarFallback className="bg-teal-100 text-teal-700">
                                {request.owner?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-gray-900">{request.owner?.name}</p>
                                <div className="flex items-center text-sm text-gray-600">
                                  {getRequestTypeIcon(request.request_type)}
                                  <span className="ml-1">{getRequestTypeText(request.request_type)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                "{request.game?.title}" {getRequestTypeText(request.request_type).toLowerCase()}{" "}
                                angefragt
                              </p>
                              {request.message && (
                                <p className="text-sm text-gray-500 mt-1 italic">"{request.message}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{formatDate(request.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">{getStatusBadge(request.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outgoingShelfRequests.length === 0 && outgoingGameRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine ausgehenden Anfragen</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
