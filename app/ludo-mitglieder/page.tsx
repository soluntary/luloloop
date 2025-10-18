"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, UserPlus, UserCheck, UserX, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useFriends } from "@/contexts/friends-context"
import { useMessages } from "@/contexts/messages-context"
import { useAvatar } from "@/contexts/avatar-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import Link from "next/link"
import { LogIn } from "lucide-react"
import { MessageComposerModal } from "@/components/message-composer-modal"

interface LudoMember {
  id: string
  username: string
  name: string
  avatar: string
  bio: string
  created_at: string
}

export default function LudoMitgliederPage() {
  const { user } = useAuth()
  const {
    friends,
    sentRequests,
    pendingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    loading: friendsLoading,
    getFriendshipStatus,
  } = useFriends()
  const { sendMessage } = useMessages()
  const { getAvatar } = useAvatar()

  const [ludoMembers, setLudoMembers] = useState<LudoMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [requestStates, setRequestStates] = useState<Record<string, string>>({})

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar?: string
    context: { title: string; image?: string; type: "group" | "event" | "member" }
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadLudoMembers()
  }, [])

  const loadLudoMembers = async () => {
    try {
      console.log("[v0] Loading Ludo members, user object:", user)
      console.log("[v0] User ID:", user?.id)
      console.log("[v0] User ID type:", typeof user?.id)

      let query = supabase
        .from("users")
        .select(`
          id,
          username,
          name,
          avatar,
          bio,
          created_at
        `)
        .order("created_at", { ascending: false })

      if (user && user.id && user.id.trim() !== "") {
        console.log("[v0] Excluding current user:", user.id)
        query = query.neq("id", user.id)
      } else {
        console.log("[v0] No authenticated user or invalid user ID, showing all members")
      }

      const { data, error } = await query

      if (error) throw error

      console.log("[v0] Loaded members:", data?.length || 0)
      setLudoMembers(data || [])
    } catch (error) {
      console.error("Error loading Ludo members:", error)
      toast.error("Fehler beim Laden der Ludo-Mitglieder")
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (memberId: string) => {
    console.log("[v0] MEMBERS: Button clicked for member:", memberId)
    setRequestStates((prev) => ({ ...prev, [memberId]: "sending" }))

    try {
      console.log("[v0] MEMBERS: Calling sendFriendRequest for:", memberId)
      const result = await sendFriendRequest(memberId)
      console.log("[v0] MEMBERS: sendFriendRequest result:", result)

      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      if (result?.alreadyExists) {
        toast.success("Freundschaftsanfrage bereits gesendet!")
      } else {
        toast.success("Freundschaftsanfrage gesendet!")
      }
    } catch (error) {
      console.error("[v0] MEMBERS: Error in handleSendFriendRequest:", error)
      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      if (error instanceof Error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error("Fehler beim Senden der Freundschaftsanfrage")
      }
    }
  }

  const handleAcceptFriendRequest = async (memberId: string) => {
    console.log("[v0] MEMBERS: Accept button clicked for member:", memberId)
    setRequestStates((prev) => ({ ...prev, [memberId]: "accepting" }))

    try {
      const request = pendingRequests?.find((req) => req.from_user_id === memberId)
      console.log("[v0] MEMBERS: Found request for accept:", request)

      if (!request) {
        throw new Error("Keine ausstehende Freundschaftsanfrage gefunden")
      }

      console.log("[v0] MEMBERS: Calling acceptFriendRequest for:", request.id)
      await acceptFriendRequest(request.id)

      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      toast.success("Freundschaftsanfrage angenommen!")
    } catch (error) {
      console.error("[v0] MEMBERS: Error in handleAcceptFriendRequest:", error)
      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      if (error instanceof Error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error("Fehler beim Annehmen der Freundschaftsanfrage")
      }
    }
  }

  const handleDeclineFriendRequest = async (memberId: string) => {
    console.log("[v0] MEMBERS: Decline button clicked for member:", memberId)
    setRequestStates((prev) => ({ ...prev, [memberId]: "declining" }))

    try {
      const request = pendingRequests?.find((req) => req.from_user_id === memberId)
      console.log("[v0] MEMBERS: Found request for decline:", request)

      if (!request) {
        throw new Error("Keine ausstehende Freundschaftsanfrage gefunden")
      }

      console.log("[v0] MEMBERS: Calling declineFriendRequest for:", request.id)
      await declineFriendRequest(request.id)

      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      toast.success("Freundschaftsanfrage abgelehnt")
    } catch (error) {
      console.error("[v0] MEMBERS: Error in handleDeclineFriendRequest:", error)
      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      if (error instanceof Error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error("Fehler beim Ablehnen der Freundschaftsanfrage")
      }
    }
  }

  const handleSendMessage = async (member: LudoMember) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    setMessageRecipient({
      id: member.id,
      name: member.username || member.name,
      avatar: getAvatar(member.id, member.name),
      context: {
        title: member.username || member.name,
        image: getAvatar(member.id, member.name) || "/placeholder.svg",
        type: "member",
      },
    })
    setIsMessageModalOpen(true)
  }

  const getFilteredMembers = () => {
    let filtered = ludoMembers

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.bio?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    console.log("[v0] Active filter:", activeFilter)
    console.log("[v0] Total members before filtering:", filtered.length)

    switch (activeFilter) {
      case "sent":
        filtered = filtered.filter((member) => {
          const status = getFriendshipStatus(member.id)
          console.log("[v0] Member", member.username, "status:", status)
          return status === "pending"
        })
        console.log("[v0] Members after sent filter:", filtered.length)
        break
      case "received":
        filtered = filtered.filter((member) => getFriendshipStatus(member.id) === "received")
        break
      case "friends":
        filtered = filtered.filter((member) => getFriendshipStatus(member.id) === "friends")
        break
      default:
        break
    }

    return filtered
  }

  const filteredMembers = getFilteredMembers()

  const renderFriendButton = (member: LudoMember) => {
    const status = getFriendshipStatus(member.id)
    const localState = requestStates[member.id]

    console.log(`[v0] MEMBERS: Rendering button for ${member.username || member.name} (${member.id}):`, {
      status,
      localState,
      sentRequestsCount: sentRequests?.length || 0,
      hasSentRequest: sentRequests?.some((r) => r.to_user_id === member.id),
      userAuthenticated: !!user?.id,
      friendsCount: friends?.length || 0,
      friendsLoading,
      isFriend: friends?.some((friend) => friend.id === member.id),
      friendsList: friends?.map((f) => ({ id: f.id, name: f.name })) || [],
    })

    if (status === "friends") {
      console.log(`[v0] MEMBERS: Showing "befreundet" badge for ${member.username || member.name}`)
    }

    if (!user?.id || friendsLoading) {
      return (
        <Button size="sm" disabled className="px-3 py-1 h-7 text-xs">
          Lade...
        </Button>
      )
    }

    if (localState === "sending") {
      return (
        <Button size="sm" disabled className="px-3 py-1 h-7 text-xs">
          Sende...
        </Button>
      )
    }

    if (localState === "accepting") {
      return (
        <Button size="sm" disabled className="px-3 py-1 h-7 text-xs">
          Annehme...
        </Button>
      )
    }

    if (localState === "declining") {
      return (
        <Button size="sm" disabled className="px-3 py-1 h-7 text-xs">
          Lehne ab...
        </Button>
      )
    }

    switch (status) {
      case "friends":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <UserCheck className="h-3 w-3 mr-1" />
            befreundet
          </Badge>
        )
      case "pending":
        return (
          <Button size="sm" disabled className="bg-yellow-100 text-yellow-700 px-3 py-1 h-7 text-xs cursor-not-allowed">
            <UserPlus className="h-3 w-3 mr-1" />
            Freundschaft angefragt
          </Button>
        )
      case "received":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => handleAcceptFriendRequest(member.id)}
              className="bg-green-500 hover:bg-green-600 text-white flex-1"
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Annehmen
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeclineFriendRequest(member.id)}
              className="flex-1"
            >
              <UserX className="h-3 w-3 mr-1" />
              Ablehnen
            </Button>
          </div>
        )
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleSendFriendRequest(member.id)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-3 py-1 h-7 text-xs"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Freundschaft anfragen
          </Button>
        )
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
        <Navigation currentPage="ludo-mitglieder" />

        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Mitglieder</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Entdecke andere Brettspiel-Enthusiasten, knüpfe neue Freundschaften und erweitere dein Spielernetzwerk!
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg text-center max-w-md mx-auto">
            <UserPlus className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Anmeldung erforderlich</h3>
            <p className="text-gray-600 mb-6">
              Um die Mitglieder zu sehen und Freundschaftsanfragen zu senden, musst du dich anmelden.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild className="bg-teal-500 hover:bg-teal-600">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Anmelden
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrieren
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-mitglieder" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Mitglieder</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Entdecke andere Ludo-Enthusiasten, knüpfe neue Freundschaften und erweitere dein Spielernetzwerk!
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Mitglieder durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 border-gray-200 focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-start">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className={activeFilter === "all" ? "bg-gradient-to-r from-teal-500 to-cyan-500" : ""}
              >
                Alle Mitglieder
              </Button>
              <Button
                variant={activeFilter === "sent" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("sent")}
                className={activeFilter === "sent" ? "bg-gradient-to-r from-teal-500 to-cyan-500" : ""}
              >
                Gesendete Anfragen ({sentRequests?.length || 0})
              </Button>
              <Button
                variant={activeFilter === "received" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("received")}
                className={activeFilter === "received" ? "bg-gradient-to-r from-teal-500 to-cyan-500" : ""}
              >
                Eingegangene Anfragen ({pendingRequests?.length || 0})
              </Button>
              <Button
                variant={activeFilter === "friends" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("friends")}
                className={activeFilter === "friends" ? "bg-gradient-to-r from-teal-500 to-cyan-500" : ""}
              >
                Meine Freunde ({friends?.length || 0})
              </Button>
            </div>
          </div>
        </div>

        {user && pendingRequests && pendingRequests.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-500" />
              Eingegangene Freundschaftsanfragen ({pendingRequests.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((request) => {
                const member = ludoMembers.find((m) => m.id === request.from_user_id)
                if (!member) return null

                return (
                  <Card key={request.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatar(member.id, member.name) || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                            {member.username?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{member.name || member.username}</h3>
                          <p className="text-sm text-gray-600">möchte dein Freund werden</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(member.id)}
                          className="bg-green-500 hover:bg-green-600 text-white flex-1"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Annehmen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineFriendRequest(member.id)}
                          className="flex-1"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Ablehnen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? "Lade Ludo-Mitglieder..." : `${filteredMembers.length} Mitglieder gefunden`}
            {searchTerm && ` für "${searchTerm}"`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading || friendsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine Mitglieder gefunden</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Versuche einen anderen Suchbegriff"
                  : activeFilter === "friends"
                    ? "Du hast noch keine Freunde. Sende Freundschaftsanfragen an andere Mitglieder!"
                    : activeFilter === "sent"
                      ? "Du hast noch keine Freundschaftsanfragen gesendet"
                      : activeFilter === "received"
                        ? "Du hast keine eingegangenen Freundschaftsanfragen"
                        : "Keine öffentlichen Mitglieder verfügbar"}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getAvatar(member.id, member.name) || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                        {member.username?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <UserLink
                        userId={member.id}
                        className="font-handwritten text-lg text-gray-800 hover:text-teal-600 transition-colors"
                      >
                        {member.name || member.username}
                      </UserLink>
                      {member.name && member.username && <p className="text-sm text-gray-500">@{member.username}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.bio && <p className="text-sm text-gray-600 line-clamp-2">{member.bio}</p>}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">{renderFriendButton(member)}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2 py-1 h-7 min-w-[32px] bg-transparent"
                        onClick={() => handleSendMessage(member)}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <MessageComposerModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false)
          setMessageRecipient(null)
        }}
        recipientId={messageRecipient?.id || ""}
        recipientName={messageRecipient?.name || ""}
        recipientAvatar={messageRecipient?.avatar ? getAvatar(messageRecipient.id, messageRecipient.name) : undefined}
        context={messageRecipient?.context || { title: "", type: "member" }}
      />
    </div>
  )
}
