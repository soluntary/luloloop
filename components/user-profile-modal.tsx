"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Globe, Send, Dices, Gamepad2 } from "lucide-react"
import { IoLibrary } from "react-icons/io5"
import { FaInstagram, FaUserPlus, FaLock, FaEye, FaUserTag } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { FiMessageCircle } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"
import { useFriends } from "@/contexts/friends-context"
import { useAuth } from "@/contexts/auth-context"
import { useRequests } from "@/contexts/requests-context"
import { useUserData, useUserDisplayName } from "@/hooks/use-user-data"
import { useAvatar } from "@/contexts/avatar-context"
import { GameShelfViewer } from "./game-shelf-viewer"
import { useMessages } from "@/contexts/messages-context"
import { MessageComposerModal } from "./message-composer-modal"

interface UserProfile {
  id: string
  name: string
  username?: string
  email?: string
  bio?: string
  avatar?: string
  website?: string
  instagram?: string
  twitter?: string
  favoriteGames?: string // Added favoriteGames field
  created_at: string
  settings?: {
    showEmail?: boolean
    showBio?: boolean
    showSocialMedia?: boolean
    privacy?: {
      libraryVisibility?: "public" | "friends" | "private"
      showFavoriteGames?: boolean // Added showFavoriteGames setting
    }
  }
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { user: profile, isLoading: loading } = useUserData(userId)
  const displayName = useUserDisplayName(userId)
  const { getAvatar } = useAvatar()
  // Use the user's actual avatar if available, otherwise fall back to generated avatar
  const avatarUrl = profile?.avatar || getAvatar(userId || "", profile?.email)

  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const [shelfRequestStatus, setShelfRequestStatus] = useState<string | null>(null)
  const [showShelfViewer, setShowShelfViewer] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendshipStatus,
    loading: friendsLoading,
    sentRequests,
  } = useFriends()
  const { user: currentUser } = useAuth()
  const { sendShelfAccessRequest, getShelfAccessStatus, canViewShelf } = useRequests()
  const { sendMessage } = useMessages()

  const [friendshipStatus, setFriendshipStatus] = useState<"friends" | "pending" | "received" | "none">("none")
  const [userGames, setUserGames] = useState<any[]>([]) // Added state for user games
  const [gamesCount, setGamesCount] = useState(0) // Added state for games count

  const supabase = createClient()

  useEffect(() => {
    if (profile && isOpen) {
      const canView = canViewShelf(profile.id, profile.settings)

      if (canView) {
        const fetchGames = async () => {
          const { data, count, error } = await supabase
            .from("games")
            .select("*", { count: "exact" })
            .eq("user_id", profile.id)
            .limit(4)

          if (!error) {
            if (data) setUserGames(data)
            if (count !== null) setGamesCount(count)
          }
        }
        fetchGames()
      } else {
        setUserGames([])
        setGamesCount(0)
      }
    }
  }, [profile, isOpen, canViewShelf])

  useEffect(() => {
    if (profile) {
      const status = getFriendshipStatus(profile.id)
      console.log("[v0] Friendship status for user", profile.id, ":", status)
      console.log("[v0] Sent requests count:", sentRequests.length)
      console.log(
        "[v0] Sent requests to this user:",
        sentRequests.filter((req) => req.to_user_id === profile.id),
      )
      setFriendshipStatus(status)
      if (optimisticStatus && status !== "none") {
        setOptimisticStatus(null)
      }
    }
  }, [profile, getFriendshipStatus, sentRequests, optimisticStatus])

  const handleSendFriendRequest = async () => {
    if (!profile || !currentUser) return
    try {
      console.log("[v0] Attempting to send friend request to:", profile.id)
      setOptimisticStatus("Wird angefragt")
      await sendFriendRequest(profile.id)
      console.log("[v0] Friend request sent successfully")
      setOptimisticStatus("Freundschaft angefragt")
    } catch (error) {
      console.error("Error sending friend request:", error)
      setOptimisticStatus(null)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!profile || !currentUser) return
    try {
      setOptimisticStatus("Wird angenommen")
      await acceptFriendRequest(profile.id)
      setOptimisticStatus("befreundet")
    } catch (error) {
      console.error("Error accepting friend request:", error)
      setOptimisticStatus(null)
    }
  }

  const handleDeclineFriendRequest = async () => {
    if (!profile || !currentUser) return
    try {
      setOptimisticStatus("Wird abgelehnt...")
      await declineFriendRequest(profile.id)
      setOptimisticStatus("Freundschaftsanfrage abgelehnt")
    } catch (error) {
      console.error("Error declining friend request:", error)
      setOptimisticStatus(null)
    }
  }

  const handleShelfAccessRequest = async () => {
    if (!profile || !currentUser) return
    try {
      setShelfRequestStatus("Wird angefragt...")
      await sendShelfAccessRequest(profile.id, "Ich würde gerne dein Spielregal ansehen.")
      setShelfRequestStatus("Spielregal-Zugang angefragt")
    } catch (error) {
      console.error("Error sending shelf access request:", error)
      setShelfRequestStatus(null)
    }
  }

  const handleViewShelf = () => {
    if (!profile) return
    setShowShelfViewer(true)
  }

  const handleSendMessage = async () => {
    if (!profile || !currentUser) return
    setIsMessageModalOpen(true)
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
    })
  }

  const isCurrentUser = currentUser?.id === profile?.id

  const shelfAccessStatus = profile ? getShelfAccessStatus(profile.id) : "none"
  const canViewUserShelf = profile ? canViewShelf(profile.id, profile.settings) : false
  const libraryVisibility = profile?.settings?.privacy?.libraryVisibility || "private"
  const showFavoriteGames = profile?.settings?.privacy?.showFavoriteGames !== false // Check privacy setting

  if (!profile && !loading) return null

  return (
    <>
      <Dialog open={isOpen && !showShelfViewer && !isMessageModalOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          {" "}
          {/* Reduced max-width for better profile look */}
          <DialogHeader>
            <DialogTitle>Benutzerprofil</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center text-center space-y-3">
                {" "}
                {/* Centered layout */}
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  {" "}
                  {/* Larger avatar */}
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-3xl">
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">{displayName}</h3>
                  <div className="flex items-center justify-center text-gray-500 mt-1 text-xs">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Mitglied seit {formatMemberSince(profile.created_at)}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && profile.settings?.showBio !== false && (
                <div className="text-center px-4">
                  <p className="text-gray-600 text-xs">"{profile.bio}"</p>
                </div>
              )}

              {profile.favoriteGames && showFavoriteGames && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Gamepad2 className="h-4 w-4 mr-2 text-teal-600" />
                    Lieblingsspiele
                  </h4>
                  <p className="text-sm text-gray-700">{profile.favoriteGames}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-gray-900 flex items-center font-semibold">
                    <IoLibrary className="h-4 w-4 mr-2" />
                    Spieleregal
                    {canViewUserShelf && gamesCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {gamesCount} Spiele
                      </Badge>
                    )}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500">
                    {libraryVisibility === "public" && <FaEye className="h-3 w-3 mr-1" />}
                    {libraryVisibility === "private" && <FaLock className="h-3 w-3 mr-1" />}
                    {libraryVisibility === "friends" && <FaUserPlus className="h-3 w-3 mr-1" />}
                    {libraryVisibility === "public"
                      ? "Öffentlich"
                      : libraryVisibility === "friends"
                        ? "Nur Freunde"
                        : "Privat"}
                  </div>
                </div>

                {canViewUserShelf ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {userGames.map((game) => (
                        <div key={game.id} className="flex flex-col">
                          <div className="aspect-square rounded-md overflow-hidden bg-gray-100 relative group border border-gray-200">
                            {game.image ? (
                              <img
                                src={game.image || "/placeholder.svg"}
                                alt={game.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Dices className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 mt-1 truncate text-center" title={game.title}>
                            {game.title}
                          </p>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 4 - userGames.length) }).map((_, i) => (
                        <div key={`placeholder-${i}`} className="flex flex-col">
                          <div className="aspect-square rounded-md overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <Dices className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="text-xs text-transparent mt-1">-</p>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleViewShelf} className="w-full bg-teal-600 hover:bg-teal-700" size="sm">
                      <IoLibrary className="h-4 w-4 mr-2" />
                      Komplettes Spieleregal ansehen
                    </Button>
                  </div>
                ) : shelfRequestStatus ? (
                  <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-orange-700">{shelfRequestStatus}</span>
                  </div>
                ) : shelfAccessStatus === "pending" ? (
                  <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="font-medium text-orange-700 text-xs">Zugang angefragt</span>
                  </div>
                ) : shelfAccessStatus === "denied" ? (
                  <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-xs font-medium text-red-700">Zugang verweigert</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleShelfAccessRequest}
                    variant="outline"
                    className="w-full bg-transparent"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Ludothek-Zugang anfragen
                  </Button>
                )}
              </div>

              {/* Email */}
              {profile.email && profile.settings?.showEmail === true && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kontakt</h4>
                  <p className="text-gray-600 text-xs">{profile.email}</p>
                </div>
              )}
              {/* Social Media */}
              {profile.settings?.showSocialMedia !== false &&
                (profile.website || profile.instagram || profile.twitter) && ( // Only show container if links exist
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                      <FaUserTag className="h-4 w-4 mr-2" />
                      Soziale Netzwerke
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {profile.website && (
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} // Ensure valid URL
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors text-xs"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      )}
                      {profile.instagram && (
                        <a
                          href={`https://instagram.com/${profile.instagram.replace("@", "")}`} // Handle @ prefix
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors text-xs"
                        >
                          <FaInstagram className="h-4 w-4 mr-2" />
                          Instagram
                        </a>
                      )}
                      {profile.twitter && (
                        <a
                          href={`https://twitter.com/${profile.twitter.replace("@", "")}`} // Handle @ prefix
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-colors text-xs"
                        >
                          <FaXTwitter className="h-4 w-4 mr-2" />
                          Twitter/X
                        </a>
                      )}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              {!isCurrentUser && currentUser && (
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs bg-transparent"
                    onClick={handleSendMessage}
                  >
                    <FiMessageCircle className="h-4 w-4 mr-2" />
                    Nachricht
                  </Button>

                  {optimisticStatus ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-orange-700">{optimisticStatus}</span>
                    </div>
                  ) : friendshipStatus === "none" ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                      onClick={handleSendFriendRequest}
                      disabled={friendsLoading}
                    >
                      <FaUserPlus className="h-4 w-4 mr-2" />
                      Freundschaft anfragen
                    </Button>
                  ) : friendshipStatus === "pending" ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-orange-700">Freundschaft angefragt</span>
                    </div>
                  ) : friendshipStatus === "received" ? (
                    <div className="flex-1 flex space-x-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                        onClick={handleAcceptFriendRequest}
                        disabled={friendsLoading}
                      >
                        Annehmen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={handleDeclineFriendRequest}
                        disabled={friendsLoading}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  ) : friendshipStatus === "friends" ? (
                    <Badge variant="default" className="flex-1 justify-center bg-green-100 text-green-800">
                      Befreundet
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Benutzerprofil nicht gefunden</div>
          )}
        </DialogContent>
      </Dialog>

      {showShelfViewer && profile && (
        <GameShelfViewer
          userId={profile.id}
          userName={displayName}
          isOpen={showShelfViewer}
          onClose={() => setShowShelfViewer(false)}
          onBack={() => setShowShelfViewer(false)}
        />
      )}

      {profile && (
        <MessageComposerModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          recipientId={profile.id}
          recipientName={displayName}
          recipientAvatar={avatarUrl || "/placeholder.svg"}
          context={{
            title: displayName,
            image: avatarUrl || "/placeholder.svg",
            type: "member",
          }}
        />
      )}
    </>
  )
}
