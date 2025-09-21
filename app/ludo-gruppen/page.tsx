"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MessageComposerModal } from "@/components/message-composer-modal"
import {
  Search,
  Plus,
  Users,
  MapPin,
  UserPlus,
  MessageCircle,
  Clock,
  CheckCircle,
  Settings,
  X,
  Check,
  Upload,
  UserCog,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { useMessages } from "@/contexts/messages-context"
import { LeaderboardAd, MediumRectangleAd, SkyscraperAd } from "@/components/advertising/ad-placements"

interface LudoGroup {
  id: string
  name: string
  description: string
  location: string
  image: string
  creator_id: string
  max_members: number | null
  member_count: number
  type: string
  approval_mode: "automatic" | "manual"
  created_at: string
  users: {
    id: string
    username: string
    avatar: string
  }
}

interface JoinRequest {
  id: string
  community_id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  users?: {
    id: string
    username: string
    avatar: string
  }
  communities?: {
    name: string
  }
}

export default function LudoGruppenPage() {
  const { user } = useAuth()
  const { sendMessage } = useMessages()
  const [ludoGroups, setLudoGroups] = useState<LudoGroup[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [creatorJoinRequests, setCreatorJoinRequests] = useState<JoinRequest[]>([])
  const [isManageRequestsDialogOpen, setIsManageRequestsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("all")
  const [availableSpotsFilter, setAvailableSpotsFilter] = useState("all")
  const [approvalModeFilter, setApprovalModeFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<LudoGroup | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar?: string
    context: { title: string; image?: string; type: "group" | "event" | "member" }
  } | null>(null)
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    location: "",
    max_members: null,
    type: "casual",
    approval_mode: "automatic" as "automatic" | "manual",
  })

  const supabase = createClient()

  useEffect(() => {
    loadLudoGroups()
    if (user) {
      loadJoinRequests()
      loadCreatorJoinRequests()
    }
  }, [user])

  const loadJoinRequests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("community_join_requests").select("*").eq("user_id", user.id)

      if (error) throw error
      setJoinRequests(data || [])
    } catch (error) {
      console.error("Error loading join requests:", error)
    }
  }

  const loadLudoGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          users:creator_id(id, username, avatar)
        `)
        .eq("type", "casual")
        .order("created_at", { ascending: false })

      if (error) throw error

      const groupsWithCounts =
        data?.map((group) => ({
          ...group,
          member_count: 1, // Creator is automatically a member
        })) || []

      setLudoGroups(groupsWithCounts)
    } catch (error) {
      console.error("Error loading Ludo groups:", error)
      toast.error("Fehler beim Laden der Spielgruppen")
    } finally {
      setLoading(false)
    }
  }

  const createLudoGroup = async () => {
    if (!user || !newGroup.name.trim()) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus")
      return
    }

    setIsUploading(true)

    try {
      let imageUrl = ""

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("community-images")
          .upload(fileName, imageFile)

        if (uploadError) {
          console.error("Image upload error:", uploadError)
          toast.error("Fehler beim Hochladen des Bildes")
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("community-images").getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: newGroup.name,
            description: newGroup.description,
            location: newGroup.location,
            max_members: newGroup.max_members,
            type: "casual",
            creator_id: user.id,
            approval_mode: newGroup.approval_mode,
            image: imageUrl,
          },
        ])
        .select()
        .single()

      if (error) throw error

      await supabase.from("community_members").insert([
        {
          community_id: data.id,
          user_id: user.id,
          role: "admin",
        },
      ])

      toast.success("Spielgruppen erfolgreich erstellt!")
      setIsCreateDialogOpen(false)
      setNewGroup({
        name: "",
        description: "",
        location: "",
        max_members: null,
        type: "casual",
        approval_mode: "automatic",
      })
      setImageFile(null)
      setImagePreview(null)
      loadLudoGroups()
    } catch (error) {
      console.error("Error creating Ludo group:", error)
      toast.error("Fehler beim Erstellen der Spielgruppe")
    } finally {
      setIsUploading(false)
    }
  }

  const joinLudoGroup = async (group: LudoGroup) => {
    if (!user) return

    try {
      if (group.approval_mode === "automatic") {
        const { error } = await supabase.from("community_members").insert([
          {
            community_id: group.id,
            user_id: user.id,
            role: "member",
          },
        ])

        if (error) throw error
        toast.success("Erfolgreich der Spielgruppe beigetreten!")
        loadLudoGroups()
      } else {
        const { error } = await supabase.from("community_join_requests").insert([
          {
            community_id: group.id,
            user_id: user.id,
            status: "pending",
          },
        ])

        if (error) throw error
        toast.success("Beitrittsanfrage gesendet! Der Spielgruppenersteller wird deine Anfrage prüfen.")
        loadJoinRequests()
      }
    } catch (error) {
      console.error("Error joining/requesting Ludo group:", error)
      toast.error("Fehler beim Beitreten der Spielgruppe")
    }
  }

  const loadCreatorJoinRequests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("community_join_requests")
        .select(`
          *,
          users:user_id(id, username, avatar),
          communities:community_id(name)
        `)
        .eq("status", "pending")
        .in(
          "community_id",
          ludoGroups.filter((group) => group.creator_id === user.id).map((group) => group.id),
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setCreatorJoinRequests(data || [])
    } catch (error) {
      console.error("Error loading creator join requests:", error)
    }
  }

  const handleJoinRequest = async (requestId: string, action: "approve" | "reject") => {
    try {
      const { error } = await supabase
        .from("community_join_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      toast.success(action === "approve" ? "Beitrittsanfrage genehmigt!" : "Beitrittsanfrage abgelehnt!")

      loadCreatorJoinRequests()
      loadLudoGroups()
    } catch (error) {
      console.error("Error handling join request:", error)
      toast.error("Fehler beim Bearbeiten der Anfrage")
    }
  }

  const getPendingRequestsCount = () => {
    return creatorJoinRequests.filter((request) => request.status === "pending").length
  }

  const getJoinRequestStatus = (groupId: string) => {
    return joinRequests.find((request) => request.community_id === groupId)
  }

  const getJoinButtonProps = (group: LudoGroup) => {
    if (!user) {
      return { text: "Beitreten", disabled: false, variant: "default" as const }
    }

    if (group.creator_id === user?.id) {
      return { text: "Deine Spielgruppe", disabled: true, variant: "secondary" as const }
    }

    if (group.max_members !== null && group.member_count >= group.max_members) {
      return { text: "Voll", disabled: true, variant: "secondary" as const }
    }

    const joinRequest = getJoinRequestStatus(group.id)

    if (joinRequest) {
      switch (joinRequest.status) {
        case "pending":
          return { text: "Anfrage gesendet", disabled: true, variant: "outline" as const, icon: Clock }
        case "approved":
          return { text: "Genehmigt", disabled: true, variant: "default" as const, icon: CheckCircle }
        case "rejected":
          return { text: "Abgelehnt", disabled: true, variant: "destructive" as const }
      }
    }

    if (group.approval_mode === "manual") {
      return { text: "Anfrage senden", disabled: false, variant: "default" as const }
    }

    return { text: "Beitreten", disabled: false, variant: "default" as const }
  }

  const showGroupDetails = (group: LudoGroup) => {
    setSelectedGroup(group)
    setIsDetailsDialogOpen(true)
  }

  const getFilteredGroups = () => {
    let filtered = ludoGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.location?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (availableSpotsFilter !== "all") {
      filtered = filtered.filter((group) => {
        if (group.max_members === null) return true // Unlimited always has spots
        const availableSpots = group.max_members - group.member_count
        return availableSpots > 0
      })
    }

    if (approvalModeFilter !== "all") {
      filtered = filtered.filter((group) => group.approval_mode === approvalModeFilter)
    }

    if (sortBy !== "all") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          case "members":
            return b.member_count - a.member_count
          default:
            return 0
        }
      })
    }

    return filtered
  }

  const filteredGroups = getFilteredGroups()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Bild ist zu groß. Maximale Größe: 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Bitte wählen Sie eine Bilddatei aus")
        return
      }

      setImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendGroupMessage = async (group: LudoGroup) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    setMessageRecipient({
      id: group.creator_id,
      name: group.users?.username || "Unbekannt",
      avatar: group.users?.avatar,
      context: {
        title: group.name,
        image: group.image,
        type: "group",
      },
    })
    setIsMessageModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-gruppen" />

      <div className="container mx-auto px-4 py-8">

        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Spielgruppen</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Finde deine perfekte Spielgruppe oder gründe deine eigene! Verbinde dich mit anderen Spiel-Enthusiasten und
            schliesse neue Freundschaften!
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Spielgruppen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 border-gray-200 focus:border-teal-500"
              />
            </div>

            <div className="flex gap-2">
              {user && ludoGroups.some((group) => group.creator_id === user.id) && (
                <Dialog open={isManageRequestsDialogOpen} onOpenChange={setIsManageRequestsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative bg-white/80 border-gray-200 hover:bg-white"
                      onClick={loadCreatorJoinRequests}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Anfragen verwalten
                      {getPendingRequestsCount() > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                          {getPendingRequestsCount()}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-handwritten text-2xl text-gray-800">
                        Beitrittsanfragen verwalten
                      </DialogTitle>
                      <DialogDescription>Verwalte die Beitrittsanfragen für deine Spielgruppen</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {creatorJoinRequests.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine ausstehenden Anfragen</h3>
                          <p className="text-gray-500">
                            Alle Beitrittsanfragen für deine Spielgruppen wurden bearbeitet.
                          </p>
                        </div>
                      ) : (
                        creatorJoinRequests.map((request) => (
                          <Card key={request.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={request.users?.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{request.users?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-800">{request.users?.username}</p>
                                  <p className="text-sm text-gray-600">
                                    möchte "{request.communities?.name}" beitreten
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(request.created_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleJoinRequest(request.id, "approve")}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Genehmigen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleJoinRequest(request.id, "reject")}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten">
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Spielgruppe erstellen
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-handwritten text-2xl text-gray-800">
                      Neue Spielgruppe erstellen
                    </DialogTitle>
                    <DialogDescription>
                      Erstelle deine eigene Spielgruppe und lade andere Spieler ein.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image">Bild (optional)</Label>
                      <div className="mt-2">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Vorschau"
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 bg-white/80"
                              onClick={() => {
                                setImageFile(null)
                                setImagePreview(null)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                <span className="font-semibold">Klicken zum Hochladen</span> oder Datei hierher ziehen
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG bis zu 5MB</p>
                            </div>
                            <input
                              id="image-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Spielgruppenname *</Label>
                      <Input
                        id="name"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        placeholder="z.B. CATAN-Freunde Zürich"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <RichTextEditor
                        value={newGroup.description}
                        onChange={(value) => setNewGroup({ ...newGroup, description: value })}
                        placeholder="Beschreibe deine Spielgruppe..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Standort</Label>
                      <Input
                        id="location"
                        value={newGroup.location}
                        onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
                        placeholder="Location, Ort oder Adresse"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_members">Maximale Mitglieder</Label>
                      <Input
                        id="max_members"
                        type="number"
                        min="2"
                        value={newGroup.max_members || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setNewGroup({
                            ...newGroup,
                            max_members: value === "" ? null : Number.parseInt(value) || 2,
                          })
                        }}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leer lassen für unbegrenzte Mitgliederzahl</p>
                    </div>
                    <div>
                      <Label htmlFor="approval_mode">Beitrittsverfahren</Label>
                      <Select
                        value={newGroup.approval_mode}
                        onValueChange={(value: "automatic" | "manual") =>
                          setNewGroup({ ...newGroup, approval_mode: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Automatisch beitreten</SelectItem>
                          <SelectItem value="manual">Manuelle Genehmigung erforderlich</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {newGroup.approval_mode === "automatic"
                          ? "Nutzer können direkt der Spielgruppe beitreten"
                          : "Beitrittsanfragen müssen von dir genehmigt werden"}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => setIsCreateDialogOpen(false)}
                        variant="outline"
                        className="flex-1 font-handwritten"
                      >
                        Abbrechen
                      </Button>
                      <Button
                        onClick={createLudoGroup}
                        disabled={isUploading}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
                      >
                        {isUploading ? "Erstelle..." : "Erstellen"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Sortieren nach</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="newest" className="text-xs">
                      Neueste
                    </SelectItem>
                    <SelectItem value="members" className="text-xs">
                      Mitglieder
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Verfügbarkeit</Label>
                <Select value={availableSpotsFilter} onValueChange={setAvailableSpotsFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle Spielgruppen
                    </SelectItem>
                    <SelectItem value="available" className="text-xs">
                      Freie Plätze
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Beitrittsverfahren</Label>
                <Select value={approvalModeFilter} onValueChange={setApprovalModeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="automatic" className="text-xs">
                      Sofortiger Beitritt
                    </SelectItem>
                    <SelectItem value="manual" className="text-xs">
                      Beitritt nach Genehmigung
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSortBy("all")
                    setAvailableSpotsFilter("all")
                    setApprovalModeFilter("all")
                  }}
                  className="h-8 text-xs border-2 border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white font-handwritten bg-transparent"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredGroups.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Keine Spielgruppen gefunden</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? "Versuche einen anderen Suchbegriff"
                      : "Sei der Erste und erstelle eine neue Spielgruppe!"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Spielgruppe erstellen
                    </Button>
                  )}
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const buttonProps = getJoinButtonProps(group)
                  const IconComponent = buttonProps.icon

                  return (
                    <Card
                      key={group.id}
                      onClick={() => showGroupDetails(group)}
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden"
                    >
                      {group.image && (
                        <div className="relative h-32 w-full overflow-hidden">
                          <img
                            src={group.image || "/placeholder.svg"}
                            alt={group.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="font-handwritten text-lg text-gray-800 mb-1 group-hover:text-teal-600 transition-colors">
                              {group.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"></div>
                          </div>
                          {group.approval_mode === "manual" && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Genehmigung erforderlich
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.description && <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>}

                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-4 w-4 text-teal-600" />
                            <span>
                              {group.max_members === null
                                ? `${group.member_count} Mitglieder (unbegrenzt)`
                                : `${group.member_count} Mitglieder (${group.max_members - group.member_count} Plätze frei)`}
                            </span>
                          </div>
                          {group.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-teal-600" />
                              <span className="truncate">{group.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <UserCog className="h-4 w-4 text-teal-600" />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={group.users?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {group.users?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div onClick={(e) => e.stopPropagation()}>
                              <UserLink
                                userId={group.users?.id || ""}
                                className="text-gray-600 hover:text-teal-600 transition-colors"
                              >
                                <p className="text-sm hover:text-teal-600 cursor-pointer transition-colors">
                                  {group.users?.username}
                                </p>
                              </UserLink>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 mt-auto">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!user) {
                                window.location.href = "/login"
                                return
                              }
                              joinLudoGroup(group)
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:to-gray-400 font-handwritten"
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {buttonProps.text}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-3 bg-transparent font-handwritten"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendGroupMessage(group)
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          <div className="hidden lg:block w-40">
            <div className="sticky top-8">
              <SkyscraperAd />
            </div>
          </div>
        </div>

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-gray-800">{selectedGroup?.name}</DialogTitle>
              <DialogDescription>Spielgruppe Details und Informationen</DialogDescription>
            </DialogHeader>

            {selectedGroup && (
              <div className="space-y-6">
                {selectedGroup.image && (
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={selectedGroup.image || "/placeholder.svg"}
                      alt={selectedGroup.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Erstellt von</span>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={selectedGroup.users?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedGroup.users?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <UserLink userId={selectedGroup.users?.id || ""} username={selectedGroup.users?.username || ""}>
                        <p className="text-sm hover:text-teal-600 cursor-pointer transition-colors">
                          {selectedGroup.users?.username}
                        </p>
                      </UserLink>
                    </div>
                  </div>
                </div>

                {selectedGroup.description && (
                  <div>
                    <h4 className="text-gray-800 mb-2 font-semibold">Beschreibung</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{selectedGroup.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-teal-600" />
                    <span className="text-gray-600">
                      {selectedGroup.max_members === null
                        ? `${selectedGroup.member_count} Mitglieder (unbegrenzt)`
                        : `${selectedGroup.member_count} Mitglieder (${selectedGroup.max_members - selectedGroup.member_count} Plätze frei)`}
                    </span>
                  </div>
                  {selectedGroup.location && (
                    <div className="col-span-2 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <span className="text-gray-600">{selectedGroup.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {selectedGroup.approval_mode === "automatic" ? "Automatisch" : "Genehmigung erforderlich"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {(() => {
                    const buttonProps = getJoinButtonProps(selectedGroup)
                    const IconComponent = buttonProps.icon

                    return (
                      <Button
                        onClick={() => {
                          if (!user) {
                            window.location.href = "/login"
                            return
                          }
                          joinLudoGroup(selectedGroup)
                          setIsDetailsDialogOpen(false)
                        }}
                        disabled={buttonProps.disabled}
                        variant={buttonProps.variant}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 font-handwritten"
                      >
                        {IconComponent ? (
                          <IconComponent className="h-4 w-4 mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {buttonProps.text}
                      </Button>
                    )
                  })()}
                  <Button
                    variant="outline"
                    className="px-4 bg-transparent font-handwritten"
                    onClick={() => {
                      if (!user) {
                        window.location.href = "/login"
                        return
                      }
                      if (selectedGroup) {
                        handleSendGroupMessage(selectedGroup)
                        setIsDetailsDialogOpen(false)
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nachricht
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <MessageComposerModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false)
            setMessageRecipient(null)
          }}
          recipientId={messageRecipient?.id || ""}
          recipientName={messageRecipient?.name || ""}
          recipientAvatar={messageRecipient?.avatar}
          context={messageRecipient?.context || { title: "", type: "group" }}
        />
      </div>
    </div>
  )
}
