"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import { FaCalendarAlt, FaUserCheck, FaUserPlus, FaSignInAlt } from "react-icons/fa"
import { MdPersonSearch } from "react-icons/md"
import { FaUserXmark } from "react-icons/fa6"
import { FiMessageCircle } from "react-icons/fi"
import { useAuth } from "@/contexts/auth-context"
import { useFriends } from "@/contexts/friends-context"
import { useMessages } from "@/contexts/messages-context"
import { useAvatar } from "@/contexts/avatar-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import Link from "next/link"
import { MessageComposerModal } from "@/components/message-composer-modal"
import { format } from "date-fns"
import { de } from "date-fns/locale"

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
  const [filterTab, setFilterTab] = useState("all")
  const [requestStates, setRequestStates] = useState<Record<string, string>>({})

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar?: string
    context: { title: string; image?: string; type: "group" | "event" | "member" }
  } | null>(null)

  const supabase = createClient()

  const formatMemberSince = (dateString: string) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MMMM yyyy", { locale: de })
    } catch (e) {
      return ""
    }
  }

  useEffect(() => {
    loadLudoMembers()
  }, [user?.id])

  const loadLudoMembers = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error

      // Put current user first in the list
      const members = data || []
      if (user?.id) {
        const selfIndex = members.findIndex((m) => m.id === user.id)
        if (selfIndex > 0) {
          const [self] = members.splice(selfIndex, 1)
          members.unshift(self)
        }
      }

      setLudoMembers(members)
    } catch (error) {
      console.error("Error loading Ludo members:", error)
      toast.error("Fehler beim Laden der Ludo-Mitglieder")
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (memberId: string) => {
    setRequestStates((prev) => ({ ...prev, [memberId]: "sending" }))

    try {
      const result = await sendFriendRequest(memberId)

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
    setRequestStates((prev) => ({ ...prev, [memberId]: "accepting" }))

    try {
      const request = pendingRequests?.find((req) => req.from_user_id === memberId)

      if (!request) {
        throw new Error("Keine ausstehende Freundschaftsanfrage gefunden")
      }

      await acceptFriendRequest(request.id)

      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      toast.success("Freundschaftsanfrage angenommen!")
    } catch (error) {
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
    setRequestStates((prev) => ({ ...prev, [memberId]: "declining" }))

    try {
      const request = pendingRequests?.find((req) => req.from_user_id === memberId)

      if (!request) {
        throw new Error("Keine ausstehende Freundschaftsanfrage gefunden")
      }

      await declineFriendRequest(request.id)

      setRequestStates((prev) => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })

      toast.success("Freundschaftsanfrage abgelehnt")
    } catch (error) {
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

    const avatarUrl = member.avatar || getAvatar(member.id, member.name)

    setMessageRecipient({
      id: member.id,
      name: member.username || member.name,
      avatar: avatarUrl,
      context: {
        title: member.username || member.name,
        image: avatarUrl || "/placeholder.svg",
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

    switch (filterTab) {
      case "sent":
        filtered = filtered.filter((member) => {
          if (member.id === user?.id) return false
          const status = getFriendshipStatus(member.id)
          return status === "pending"
        })
        break
      case "requests":
        filtered = filtered.filter((member) => {
          if (member.id === user?.id) return false
          return getFriendshipStatus(member.id) === "received"
        })
        break
      case "friends":
        filtered = filtered.filter((member) => {
          if (member.id === user?.id) return false
          return getFriendshipStatus(member.id) === "friends"
        })
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

    if (!user?.id || friendsLoading) {
      return (
        <Button size="sm" disabled className="w-full h-9 text-xs">
          Lade...
        </Button>
      )
    }

    if (localState === "sending") {
      return (
        <Button size="sm" disabled className="w-full h-9 text-xs">
          Sende...
        </Button>
      )
    }

    if (localState === "accepting") {
      return (
        <Button size="sm" disabled className="w-full h-9 text-xs">
          Annehme...
        </Button>
      )
    }

    if (localState === "declining") {
      return (
        <Button size="sm" disabled className="w-full h-9 text-xs">
          Lehne ab...
        </Button>
      )
    }

    switch (status) {
      case "friends":
        return (
          <Button variant="secondary" className="w-full bg-green-100 text-green-700 text-xs hover:bg-green-200 h-9">
            <FaUserCheck className="h-4 w-4 mr-2" />
            Befreundet
          </Button>
        )
      case "pending":
        return (
          <Button size="sm" disabled className="w-full bg-yellow-100 text-yellow-700 text-xs h-9 cursor-not-allowed">
            <FaUserPlus className="h-4 w-4 mr-2" />
            Angefragt
          </Button>
        )
      case "received":
        return (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              onClick={() => handleAcceptFriendRequest(member.id)}
              className="bg-green-500 hover:bg-green-600 text-xs text-white flex-1 h-9"
            >
              <FaUserCheck className="h-4 w-4 mr-1" />
              Annehmen
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeclineFriendRequest(member.id)}
              className="flex-1 h-9"
            >
              <FaUserXmark className="h-4 w-4 mr-1" />
              Ablehnen
            </Button>
          </div>
        )
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleSendFriendRequest(member.id)}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white h-9"
          >
            <FaUserPlus className="h-4 w-4 mr-2" />
            Vernetzen
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten flex items-center justify-center gap-4">
              Mitglieder
            </h1>
            <p className="text-gray-600 transform rotate-1 font-body text-base">
              Entdecke andere Brettspiel-Enthusiasten, knüpfe neue Freundschaften und erweitere dein Spielernetzwerk!
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg text-center max-w-md mx-auto">
            <FaSignInAlt className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h3 className="font-handwritten font-semibold text-gray-800 mb-2 text-base">Anmeldung erforderlich</h3>
            <p className="text-gray-600 mb-6 text-xs">
              Um die Mitglieder zu sehen und Freundschaftsanfragen zu senden, musst du dich anmelden.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                asChild
                variant="outline"
                className="border-2 border-teal-400 text-teal-800 hover:bg-teal-400 hover:text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all bg-white flex items-center space-x-2"
              >
                <Link href="/login">
                  <FaSignInAlt className="h-4 w-4 mr-2" />
                  Anmelden
                </Link>
              </Button>
              <Button
                asChild
                className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all flex items-center space-x-2"
              >
                <Link href="/register">
                  <FaUserPlus className="h-4 w-4 mr-2" />
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
    <div className="min-h-screen bg-gray-50/50">
      <Navigation currentPage="ludo-mitglieder" />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten flex items-center justify-center gap-4">
            Mitglieder
          </h1>
          <p className="text-gray-600 transform rotate-1 font-body text-base">
            Entdecke andere Brettspiel-Begeisterte, knüpfe neue Freundschaften und erweitere dein Spielernetzwerk!
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm mb-8">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <MdPersonSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Mitglieder suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-white/80 border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs w-full"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                variant={filterTab === "all" ? "default" : "outline"}
                onClick={() => setFilterTab("all")}
                className={`h-8 text-xs px-2 sm:px-3 ${filterTab === "all" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                Alle
              </Button>
              <Button
                variant={filterTab === "sent" ? "default" : "outline"}
                onClick={() => setFilterTab("sent")}
                className={`h-8 text-xs px-2 sm:px-3 ${filterTab === "sent" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                Gesendet
              </Button>
              <Button
                variant={filterTab === "requests" ? "default" : "outline"}
                onClick={() => setFilterTab("requests")}
                className={`h-8 text-xs px-2 sm:px-3 ${filterTab === "requests" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                Anfragen
              </Button>
              <Button
                variant={filterTab === "friends" ? "default" : "outline"}
                onClick={() => setFilterTab("friends")}
                className={`h-8 text-xs px-2 sm:px-3 ${filterTab === "friends" ? "bg-teal-500 hover:bg-teal-600 border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                Freunde
              </Button>
            </div>
          </div>
        </div>

        {user && pendingRequests && pendingRequests.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUserPlus className="h-5 w-5 text-teal-500" />
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
                          <AvatarImage src={member.avatar || getAvatar(member.id, member.name) || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                            {member.username?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{member.name || member.username}</h3>
                          <p className="text-xs text-gray-600">möchte dein Freund werden</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(member.id)}
                          className="bg-green-500 hover:bg-green-600 text-white flex-1"
                        >
                          <FaUserCheck className="h-3 w-3 mr-1" />
                          Annehmen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineFriendRequest(member.id)}
                          className="flex-1"
                        >
                          <FaUserXmark className="h-3 w-3 mr-1" />
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
          <p className="text-gray-600 text-sm">
            {loading ? "Lade Ludo-Mitglieder..." : `${filteredMembers.length} Mitglieder gefunden`}
            {searchTerm && ` für "${searchTerm}"`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {loading || friendsLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine Mitglieder gefunden</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? "Versuche einen anderen Suchbegriff."
                  : filterTab === "friends"
                    ? "Du hast noch keine Freunde. Sende Freundschaftsanfragen an andere Mitglieder!"
                    : "Keine Mitglieder entsprechen den aktuellen Filtern."}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isSelf = user?.id === member.id
              return (
                <Card
                  key={member.id}
                  className={`group hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col ${isSelf ? "border-teal-300 ring-1 ring-teal-200" : "border-gray-100"}`}
                >
                  <div className={`h-16 relative ${isSelf ? "bg-gradient-to-r from-teal-100 to-cyan-100" : "bg-gradient-to-r from-teal-50 to-cyan-50"}`}>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-sm">
                        <AvatarImage src={member.avatar || getAvatar(member.id, member.name) || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white text-lg">
                          {member.username?.[0]?.toUpperCase() || member.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <CardContent className="pt-10 pb-4 px-3 flex-1 flex flex-col items-center text-center">
                    {isSelf ? (
                      <Link
                        href="/profile"
                        className="font-handwritten text-teal-700 font-semibold text-xs hover:text-teal-600 transition-colors mb-1 truncate w-full"
                      >
                        Du
                      </Link>
                    ) : (
                      <UserLink
                        userId={member.id}
                        className="font-handwritten text-gray-800 text-xs hover:text-teal-600 transition-colors mb-1 truncate w-full"
                      >
                        {member.username || member.name}
                      </UserLink>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3">
                      <FaCalendarAlt className="h-3 w-3" />
                      <span>Aktiv seit {formatMemberSince(member.created_at)}</span>
                    </div>

                    {member.bio ? (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-4 min-h-[32px] text-left">{member.bio}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mb-4 min-h-[32px]">{isSelf ? "Bearbeite dein Profil" : "Keine Beschreibung"}</p>
                    )}

                    <div className="w-full mt-auto space-y-2 text-xs">
                      {isSelf ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
                        >
                          <Link href="/profile">Profil bearbeiten</Link>
                        </Button>
                      ) : (
                        <>
                          {renderFriendButton(member)}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs text-gray-600 hover:text-teal-600 hover:border-teal-200 bg-transparent"
                            onClick={() => handleSendMessage(member)}
                          >
                            <FiMessageCircle className="h-3 w-3 mr-2" />
                            Nachricht
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            }))
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
        recipientAvatar={messageRecipient?.avatar}
        context={messageRecipient?.context || { title: "", type: "member" }}
      />
    </div>
  )
}
