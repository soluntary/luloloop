"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Globe, Instagram, Twitter, MessageCircle, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useFriends } from "@/contexts/friends-context"
import { useAuth } from "@/contexts/auth-context"

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
  const { sendFriendRequest, getFriendshipStatus, loading: friendsLoading, sentRequests } = useFriends()
  const { user: currentUser } = useAuth()

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
    }
  }, [profile, getFriendshipStatus, sentRequests])

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
      await sendFriendRequest(profile.id)
      console.log("[v0] Friend request sent successfully")
    } catch (error) {
      console.error("Error sending friend request:", error)
    }
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
    })
  }

  const isCurrentUser = currentUser?.id === profile?.id

  if (!profile && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

                {friendshipStatus === "none" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={handleSendFriendRequest}
                    disabled={friendsLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {friendsLoading ? "Wird gesendet..." : "Freundschaft anfragen"}
                  </Button>
                )}

                {friendshipStatus === "pending" && (
                  <Badge variant="secondary" className="flex-1 justify-center">
                    Anfrage gesendet
                  </Badge>
                )}

                {friendshipStatus === "friends" && (
                  <Badge variant="default" className="flex-1 justify-center bg-green-100 text-green-800">
                    Befreundet
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Benutzerprofil nicht gefunden</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
