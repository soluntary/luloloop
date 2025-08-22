"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CalendarDays,
  Globe,
  Instagram,
  Twitter,
  MessageCircle,
  UserPlus,
  BookOpen,
  Lock,
  Eye,
  Send,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useFriends } from "@/contexts/friends-context"
import { useAuth } from "@/contexts/auth-context"
import { useRequests } from "@/contexts/requests-context"
import { GameShelfViewer } from "./game-shelf-viewer"

interface UserProfile {
  id: string
  name: string
  email?: string
  bio?: string
  avatar?: string
  website?: string
  instagram?: string
  twitter?: string
  created_at: string
  settings?: {
    showEmail?: boolean
    showBio?: boolean
    showSocialMedia?: boolean
    privacy?: {
      libraryVisibility?: "public" | "friends" | "private"
    }
  }
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const [shelfRequestStatus, setShelfRequestStatus] = useState<string | null>(null)
  const [showShelfViewer, setShowShelfViewer] = useState(false)
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

  const [friendshipStatus, setFriendshipStatus] = useState<"friends" | "pending" | "received" | "none">("none")

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

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile(userId)
    }
  }, [userId, isOpen])

  const fetchUserProfile = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, bio, avatar, website, instagram, twitter, created_at, settings")
        .eq("id", id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!profile && !loading) return null

  return (
    <>
      <Dialog open={isOpen && !showShelfViewer} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
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
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-lg">
                    {profile.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Mitglied seit {formatMemberSince(profile.created_at)}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && profile.settings?.showBio !== false && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Über mich</h4>
                  <p className="text-gray-600 text-sm">{profile.bio}</p>
                </div>
              )}

              {!isCurrentUser && currentUser && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Spielregal
                    </h4>
                    <div className="flex items-center text-xs text-gray-500">
                      {libraryVisibility === "public" && <Eye className="h-3 w-3 mr-1" />}
                      {libraryVisibility === "private" && <Lock className="h-3 w-3 mr-1" />}
                      {libraryVisibility === "friends" && <UserPlus className="h-3 w-3 mr-1" />}
                      {libraryVisibility === "public"
                        ? "Öffentlich"
                        : libraryVisibility === "friends"
                          ? "Nur Freunde"
                          : "Privat"}
                    </div>
                  </div>

                  {canViewUserShelf ? (
                    <Button onClick={handleViewShelf} className="w-full bg-teal-600 hover:bg-teal-700" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Spielregal ansehen
                    </Button>
                  ) : shelfRequestStatus ? (
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-700">{shelfRequestStatus}</span>
                    </div>
                  ) : shelfAccessStatus === "pending" ? (
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-700">Zugang angefragt</span>
                    </div>
                  ) : shelfAccessStatus === "denied" ? (
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                      <span className="text-sm font-medium text-red-700">Zugang verweigert</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleShelfAccessRequest}
                      variant="outline"
                      className="w-full bg-transparent"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Spielregal-Zugang anfragen
                    </Button>
                  )}
                </div>
              )}

              {/* Email */}
              {profile.email && profile.settings?.showEmail === true && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kontakt</h4>
                  <p className="text-gray-600 text-sm">{profile.email}</p>
                </div>
              )}

              {/* Social Media */}
              {profile.settings?.showSocialMedia !== false && (
                <div className="space-y-2">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-700"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-700"
                    >
                      <Instagram className="h-4 w-4 mr-2" />@{profile.instagram}
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-700"
                    >
                      <Twitter className="h-4 w-4 mr-2" />@{profile.twitter}
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!isCurrentUser && currentUser && (
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      // TODO: Open message dialog
                      console.log("Open message dialog for user:", profile.id)
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nachricht
                  </Button>

                  {optimisticStatus ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-700">{optimisticStatus}</span>
                    </div>
                  ) : friendshipStatus === "none" ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                      onClick={handleSendFriendRequest}
                      disabled={friendsLoading}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Freundschaft anfragen
                    </Button>
                  ) : friendshipStatus === "pending" ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-700">Freundschaft angefragt</span>
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
          userName={profile.name}
          isOpen={showShelfViewer}
          onClose={() => setShowShelfViewer(false)}
          onBack={() => setShowShelfViewer(false)}
        />
      )}
    </>
  )
}

// function GameShelfViewer({
//   userId,
//   userName,
//   isOpen,
//   onClose,
//   onBack,
// }: {
//   userId: string
//   userName: string
//   isOpen: boolean
//   onClose: () => void
//   onBack: () => void
// }) {
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center">
//             <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
//               ←
//             </Button>
//             <BookOpen className="h-5 w-5 mr-2" />
//             {userName}s Spielregal
//           </DialogTitle>
//         </DialogHeader>
//         <div className="text-center py-8 text-gray-500">Spielregal-Viewer wird implementiert...</div>
//       </DialogContent>
//     </Dialog>
//   )
// }
