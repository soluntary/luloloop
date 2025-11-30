"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaChartBar } from "react-icons/fa"
import { PollCard } from "@/components/poll-card"
import { CreatePollDialog } from "@/components/create-poll-dialog"
import { getCommunityPollsAction, type Poll } from "@/app/actions/community-polls"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface GroupPollsDialogProps {
  isOpen: boolean
  onClose: () => void
  group: any // LudoGroup
}

export function GroupPollsDialog({ isOpen, onClose, group }: GroupPollsDialogProps) {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (isOpen && group?.id) {
      loadPolls(group.id)
    }
  }, [isOpen, group?.id])

  const loadPolls = async (groupId: string) => {
    setLoading(true)
    try {
      const result = await getCommunityPollsAction(groupId)
      if (result.error) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setPolls(result.data || [])
    } catch (error) {
      console.error("Error loading polls:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Abstimmungen",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!group) return null

  const activePolls = polls.filter((poll) => {
    const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
    return poll.is_active && !isExpired
  })

  const completedPolls = polls.filter((poll) => {
    const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
    return !poll.is_active || isExpired
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <FaChartBar className="h-6 w-6 text-teal-600" />
                  Abstimmungen
                </DialogTitle>
                <DialogDescription>{group.name} - Abstimmungen und Umfragen</DialogDescription>
              </div>
              {user && group.creator_id === user.id && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  <FaChartBar className="h-4 w-4 mr-2" />
                  Neue Abstimmung
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="active" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Laufende Abstimmungen {activePolls.length > 0 ? `(${activePolls.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Abgeschlossene Abstimmungen {completedPolls.length > 0 ? `(${completedPolls.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Lade Abstimmungen...</p>
                </div>
              ) : activePolls.length === 0 ? (
                <div className="text-center py-12">
                  <FaChartBar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine laufenden Abstimmungen</h3>
                  <p className="text-gray-500 mb-4">
                    {user && group.creator_id === user.id
                      ? "Erstelle die erste Abstimmung für diese Spielgruppe!"
                      : "Diese Spielgruppe hat derzeit keine laufenden Abstimmungen."}
                  </p>
                  {user && group.creator_id === user.id && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    >
                      <FaChartBar className="h-4 w-4 mr-2" />
                      Erste Abstimmung erstellen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activePolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      currentUserId={user?.id || ""}
                      isCreator={group.creator_id === user?.id}
                      onPollUpdated={() => loadPolls(group.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Lade Abstimmungen...</p>
                </div>
              ) : completedPolls.length === 0 ? (
                <div className="text-center py-12">
                  <FaChartBar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine abgeschlossenen Abstimmungen</h3>
                  <p className="text-gray-500">Abgeschlossene oder abgelaufene Abstimmungen werden hier angezeigt.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      currentUserId={user?.id || ""}
                      isCreator={group.creator_id === user?.id}
                      onPollUpdated={() => loadPolls(group.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreatePollDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        communityId={group.id}
        communityName={group.name}
        onPollCreated={() => {
          loadPolls(group.id)
        }}
      />
    </>
  )
}
