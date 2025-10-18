"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendCommunityInvitations } from "@/app/actions/community-invitations"
import { useFriends } from "@/contexts/friends-context"
import { useAvatar } from "@/contexts/avatar-context"

interface Friend {
  id: string
  username: string
  avatar: string | null
  name: string | null
}

interface InviteFriendsToCommunityDialogProps {
  isOpen: boolean
  onClose: () => void
  communityId: string
  communityName: string
}

export function InviteFriendsToCommunityDialog({
  isOpen,
  onClose,
  communityId,
  communityName,
}: InviteFriendsToCommunityDialogProps) {
  const { friends: contextFriends, loading: friendsLoading } = useFriends()
  const { getAvatar } = useAvatar()
  const { toast } = useToast()

  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const friends: Friend[] = (contextFriends || []).map((friend) => ({
    id: friend.id,
    username: friend.username || "",
    avatar: friend.avatar,
    name: friend.name,
  }))

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] Invite dialog opened, friends count:", friends.length)
      console.log("[v0] Friends loading:", friendsLoading)
    }
  }, [isOpen, friends.length, friendsLoading])

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]))
  }

  const handleSendInvitations = async () => {
    if (selectedFriends.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wähle mindestens einen Freund aus",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const result = await sendCommunityInvitations(communityId, selectedFriends, message)

      if (result.error) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      const friendCount = selectedFriends.length
      const friendText = friendCount === 1 ? "Freund" : "Freunde"
      toast({
        title: "Einladung erfolgreich gesendet!",
        description: `${friendCount} ${friendText} ${friendCount === 1 ? "wurde" : "wurden"} zur Spielgruppe eingeladen. Deine Freunde werden über die Einladung benachrichtigt.`,
      })
      setSelectedFriends([])
      setMessage("")
      onClose()
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Versenden der Einladungen",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-2xl text-gray-800">Freunde einladen</DialogTitle>
          <DialogDescription>Lade deine Freunde zu "{communityName}" ein</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Freunde durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="invitation-message" className="text-sm font-medium text-gray-700 mb-2 block">
              Nachricht (optional)
            </Label>
            <textarea
              id="invitation-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Füge eine persönliche Nachricht hinzu..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              rows={3}
            />
          </div>

          {/* Friends List */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Freunde auswählen ({selectedFriends.length} ausgewählt)
            </Label>
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {friendsLoading ? (
                <div className="p-8 text-center text-gray-500">Lade Freunde...</div>
              ) : filteredFriends.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? "Keine Freunde gefunden" : "Du hast noch keine Freunde"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleFriend(friend.id)}
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriend(friend.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatar(friend.id, friend.name || friend.username) || "/placeholder.svg"} />
                        <AvatarFallback>{friend.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{friend.name || friend.username}</p>
                        <p className="text-sm text-gray-500">@{friend.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 font-handwritten bg-transparent">
              Abbrechen
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={selectedFriends.length === 0 || sending}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sende...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {selectedFriends.length} Freund{selectedFriends.length !== 1 ? "e" : ""} einladen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
