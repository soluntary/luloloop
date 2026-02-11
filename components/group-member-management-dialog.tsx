"use client"

import { getUserAvatar } from "@/lib/avatar"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FaUsers, FaComment, FaTimes } from "react-icons/fa"
import { UserLink } from "@/components/user-link"
import { fetchGroupMembersAction } from "@/app/actions/fetch-group-members"
import { removeGroupMemberAction } from "@/app/actions/remove-group-member"
import { toast } from "@/hooks/use-toast" // Assuming this hook exists, otherwise use sonner
import { useAuth } from "@/contexts/auth-context"

interface GroupMember {
  id: string
  user_id: string
  community_id: string
  role: "admin" | "member"
  joined_at: string
  users: {
    id: string
    username: string
    avatar?: string
  }
}

interface GroupMemberManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  group: any // Using any for now to avoid complex type imports, but ideally LudoGroup
  onBroadcastMessage?: (group: any) => void
}

export function GroupMemberManagementDialog({
  isOpen,
  onClose,
  group,
  onBroadcastMessage,
}: GroupMemberManagementDialogProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && group?.id) {
      loadMembers(group.id)
    }
  }, [isOpen, group?.id])

  const loadMembers = async (groupId: string) => {
    setLoading(true)
    try {
      const result = await fetchGroupMembersAction(groupId)
      if (result.error) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setMembers(result.data || [])
    } catch (error) {
      console.error("Error loading members:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Mitglieder",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Möchtest du ${username} wirklich aus der Gruppe entfernen?`)) {
      return
    }

    try {
      const result = await removeGroupMemberAction(memberId, group.id)
      if (result.error) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Erfolg",
        description: `${username} wurde aus der Gruppe entfernt`,
      })
      loadMembers(group.id)
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Entfernen des Mitglieds",
        variant: "destructive",
      })
    }
  }

  if (!group) return null

  const canManage =
    user && (group.creator_id === user.id || members.some((m) => m.user_id === user.id && m.role === "admin"))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl text-gray-800">Mitglieder verwalten</DialogTitle>
          <DialogDescription>{group.name} - Verwalte die Mitglieder dieser Spielgruppe</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Lade Mitglieder...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <FaUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Mitglieder gefunden</h3>
              <p className="text-gray-500">Diese Spielgruppe hat noch keine Mitglieder.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">
                  {members.length} Mitglied{members.length !== 1 ? "er" : ""}
                </h4>
                {user && group.creator_id === user.id && onBroadcastMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBroadcastMessage(group)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-handwritten"
                  >
                    <FaComment className="h-4 w-4 mr-2" />
                    Nachricht an alle senden
                  </Button>
                )}
              </div>

              {members.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getUserAvatar(member.users?.id || member.user_id, member.users?.avatar)} />
                        <AvatarFallback>{member.users?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <UserLink
                            userId={member.users?.id || ""}
                            className="text-gray-800 hover:text-teal-600 transition-colors"
                          >
                            <p className="font-medium cursor-pointer hover:text-teal-600 transition-colors text-xs">
                              {member.users?.username}
                            </p>
                          </UserLink>
                          {member.role === "admin" && (
                            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs px-2 py-0.5">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Beigetreten am{" "}
                          {new Date(member.joined_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {canManage && member.user_id !== user?.id && group.creator_id !== member.user_id && (
                      <div className="flex gap-2">
                        {(group.creator_id === user?.id || member.role !== "admin") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveMember(member.id, member.users?.username || "Unbekannt")
                            }}
                            className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                          >
                            <FaTimes className="h-3 w-3 mr-1" />
                            Entfernen
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
