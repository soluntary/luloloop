"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageComposerModal } from "@/components/message-composer-modal"
import { BroadcastMessageModal } from "@/components/broadcast-message-modal"
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
  UserCog,
  Dices,
  ImageIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Navigation from "@/components/navigation"
import UserLink from "@/components/user-link"
import { useMessages } from "@/contexts/messages-context"
import { SkyscraperAd } from "@/components/advertising/ad-placements"
import { leaveGroupAction } from "@/app/actions/leave-group"
import { fetchGroupMembersAction } from "@/app/actions/fetch-group-members"
import { handleJoinRequestAction } from "@/app/actions/handle-join-request"
import { removeGroupMemberAction } from "@/app/actions/remove-group-member"
import { loadUserMembershipsAction } from "@/app/actions/load-user-memberships"
import { ShareButton } from "@/components/share-button"
import { InviteFriendsToCommunityDialog } from "@/components/invite-friends-to-community-dialog"
import { SimpleLocationSearch } from "@/components/simple-location-search"
import { useLocationSearch } from "@/contexts/location-search-context"
import { DistanceBadge } from "@/components/distance-badge"
import { LocationMap } from "@/components/location-map"
import { ExpandableText } from "@/components/expandable-text"
import { AddressAutocomplete } from "@/components/address-autocomplete"

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
    name?: string // Added for notification
  }
  // Add distance property for location search
  distance?: number
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

interface GroupMember {
  id: string
  user_id: string
  community_id: string
  role: string
  joined_at: string
  users: {
    id: string
    username: string
    avatar: string
  }
}

export default function LudoGruppenPage() {
  const { user } = useAuth()
  const { sendMessage } = useMessages()
  const [ludoGroups, setLudoGroups] = useState<LudoGroup[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [creatorJoinRequests, setCreatorJoinRequests] = useState<JoinRequest[]>([])
  const [userMemberships, setUserMemberships] = useState<string[]>([])
  const [isManageRequestsDialogOpen, setIsManageRequestsDialogOpen] = useState(false)
  const [isMemberManagementDialogOpen, setIsMemberManagementDialogOpen] = useState(false)
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<LudoGroup | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
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
  // const [locationPLZ, setLocationPLZ] = useState("")
  // const [locationOrt, setLocationOrt] = useState("")
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [selectedGroupForBroadcast, setSelectedGroupForBroadcast] = useState<LudoGroup | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteGroup, setInviteGroup] = useState<LudoGroup | null>(null)

  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const { searchByAddress, searchCommunitiesNearby } = useLocationSearch() // Ensure searchCommunitiesNearby is destructured

  const supabase = createClient()

  useEffect(() => {
    loadLudoGroups()
    if (user) {
      loadJoinRequests()
      loadCreatorJoinRequests() // Load creator join requests on component mount
      loadUserMemberships()
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
          users:creator_id(id, username, avatar, name),
          community_members(count)
        `)
        .eq("type", "casual")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Map the data and include actual member counts
      const groupsWithCounts =
        data?.map((group) => ({
          ...group,
          member_count: group.community_members?.[0]?.count || 0,
        })) || []
      // </CHANGE>

      setLudoGroups(groupsWithCounts)
    } catch (error) {
      console.error("Error loading Ludo groups:", error)
      toast.error("Fehler beim Laden der Spielgruppen")
    } finally {
      setLoading(false)
    }
  }

  const loadUserMemberships = async () => {
    if (!user) return

    console.log("[v0] Loading user memberships for user:", user.id)

    try {
      const result = await loadUserMembershipsAction()

      if (result.error) {
        console.error("[v0] Error loading user memberships:", result.error)
        return
      }

      console.log("[v0] User is member of communities:", result.data)
      setUserMemberships(result.data)
    } catch (error) {
      console.error("[v0] Error loading user memberships:", error)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    setLoadingMembers(true)
    try {
      console.log("[v0] Loading group members for group:", groupId)

      const result = await fetchGroupMembersAction(groupId)

      if (result.error) {
        console.error("[v0] Error loading group members:", result.error)
        throw new Error(result.error)
      }

      console.log("[v0] Successfully loaded group members:", result.data?.length)
      setGroupMembers(result.data || [])
    } catch (error) {
      console.error("Error loading group members:", error)
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setLoadingMembers(false)
    }
  }

  const removeMemberFromGroup = async (memberId: string, memberUsername: string) => {
    if (!user || !selectedGroupForMembers) return

    console.log("[v0] Remove member button clicked - memberId:", memberId, "memberUsername:", memberUsername)

    try {
      console.log("[v0] Calling removeGroupMemberAction...")
      const result = await removeGroupMemberAction(memberId, selectedGroupForMembers.id)

      console.log("[v0] removeGroupMemberAction result:", result)

      if (result.error) {
        console.error("[v0] Error removing member:", result.error)
        toast.error(result.error)
        return
      }

      console.log("[v0] Successfully removed member")
      toast.success(`${result.memberUsername || memberUsername} wurde aus der Spielgruppe entfernt`)
      loadGroupMembers(selectedGroupForMembers.id)
      loadLudoGroups() // Refresh group counts
    } catch (error) {
      console.error("[v0] Error removing member:", error)
      toast.error("Fehler beim Entfernen des Mitglieds")
    }
  }

  const changeMemberRole = async (memberId: string, newRole: string, memberUsername: string) => {
    if (!user || !selectedGroupForMembers) return

    try {
      const { error } = await supabase.from("community_members").update({ role: newRole }).eq("id", memberId)

      if (error) throw error

      toast.success(`${memberUsername} ist jetzt ${newRole === "admin" ? "Organisator" : "Mitglied"}`)
      loadGroupMembers(selectedGroupForMembers.id)
    } catch (error) {
      console.error("Error changing member role:", error)
      toast.error("Fehler beim Ändern der Rolle")
    }
  }

  const showMemberManagement = (group: LudoGroup) => {
    setSelectedGroupForMembers(group)
    setIsMemberManagementDialogOpen(true)
    loadGroupMembers(group.id)
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

    console.log("[v0] Beitreten button clicked - user:", !!user, "group:", group.id)
    console.log("[v0] joinLudoGroup called - user:", !!user, "group:", group.id)
    console.log("[v0] User authenticated, proceeding with group join")
    console.log("[v0] Group approval mode:", group.approval_mode)

    try {
      if (group.approval_mode === "automatic") {
        console.log("[v0] Automatic join mode - checking existing membership")

        if (userMemberships.includes(group.id)) {
          console.log("[v0] User is already a member (from local state)")
          toast.error("Du bist bereits Mitglied dieser Spielgruppe")
          return
        }

        console.log("[v0] Inserting new member into community_members")
        const { error: insertError } = await supabase.from("community_members").insert([
          {
            community_id: group.id,
            user_id: user.id,
            role: "member",
          },
        ])

        console.log("[v0] Insert result:", { insertError })

        if (insertError) {
          if (insertError.code === "23505") {
            console.log("[v0] User is already a member (duplicate key)")
            toast.success("Du bist bereits Mitglied dieser Spielgruppe!")
            // Update local state to reflect membership
            setUserMemberships((prev) => [...prev, group.id])
            return
          }
          console.error("[v0] Insert error details:", insertError)
          throw insertError
        }

        console.log("[v0] Successfully joined group")
        toast.success("Erfolgreich der Spielgruppe beigetreten!")
        setUserMemberships((prev) => [...prev, group.id])

        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
        const userName = userData?.name || userData?.username || "Ein Mitglied"

        await supabase.from("notifications").insert({
          user_id: group.creator_id,
          type: "group_join",
          title: "Neues Mitglied",
          message: `${userName} ist deiner Spielgruppe "${group.name}" beigetreten`,
          data: {
            group_id: group.id,
            group_name: group.name,
            member_id: user.id,
            member_name: userName,
          },
          read: false,
          created_at: new Date().toISOString(),
        })
        // </CHANGE>

        loadLudoGroups()
      } else {
        console.log("[v0] Manual approval mode - checking existing request")

        const { data: existingRequest, error: requestCheckError } = await supabase
          .from("community_join_requests")
          .select("id")
          .eq("community_id", group.id)
          .eq("user_id", user.id)
          .single()

        console.log("[v0] Existing request check result:", { existingRequest, requestCheckError })

        if (existingRequest) {
          console.log("[v0] User already has a join request")
          toast.error("Du hast bereits eine Beitrittsanfrage für diese Spielgruppe gestellt")
          return
        }

        console.log("[v0] Creating new join request")
        const { error: requestError } = await supabase.from("community_join_requests").insert([
          {
            community_id: group.id,
            user_id: user.id,
            status: "pending",
          },
        ])

        console.log("[v0] Join request result:", { requestError })

        if (requestError) {
          console.error("[v0] Join request error details:", requestError)
          throw requestError
        }

        console.log("[v0] Successfully created join request")
        toast.success("Beitrittsanfrage gesendet! Der Spielgruppenersteller wird deine Anfrage prüfen.")

        const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
        const userName = userData?.name || userData?.username || "Ein Mitglied"

        await supabase.from("notifications").insert({
          user_id: group.creator_id,
          type: "group_join_request",
          title: "Neue Beitrittsanfrage",
          message: `${userName} möchte deiner Spielgruppe "${group.name}" beitreten`,
          data: {
            group_id: group.id,
            group_name: group.name,
            requester_id: user.id,
            requester_name: userName,
          },
          read: false,
          created_at: new Date().toISOString(),
        })
        // </CHANGE>

        loadJoinRequests()
      }
    } catch (error) {
      console.error("[v0] Error joining/requesting Ludo group:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      toast.error("Fehler beim Beitreten der Spielgruppe")
    }
  }

  const leaveLudoGroup = async (group: LudoGroup) => {
    if (!user) {
      console.log("[v0] No authenticated user - redirecting to login")
      toast.info("Bitte melde dich an, um eine Spielgruppe zu verlassen")
      window.location.href = "/login"
      return
    }

    console.log("[v0] Attempting to leave group:", group.id, "for user:", user.id)

    try {
      const result = await leaveGroupAction(group.id)

      if (result.error) {
        console.error("[v0] Error leaving group:", result.error)
        throw new Error(result.error)
      }

      console.log("[v0] Successfully left group")
      toast.success("Du hast die Spielgruppe verlassen")
      setUserMemberships((prev) => prev.filter((id) => id !== group.id))

      const { data: userData } = await supabase.from("users").select("username, name").eq("id", user.id).single()
      const userName = userData?.name || userData?.username || "Ein Mitglied"

      await supabase.from("notifications").insert({
        user_id: group.creator_id,
        type: "group_leave",
        title: "Mitglied hat Gruppe verlassen",
        message: `${userName} hat deine Spielgruppe "${group.name}" verlassen`,
        data: {
          group_id: group.id,
          group_name: group.name,
          member_id: user.id,
          member_name: userName,
        },
        read: false,
        created_at: new Date().toISOString(),
      })
      // </CHANGE>

      loadLudoGroups()
    } catch (error) {
      console.error("Error leaving group:", error)
      toast.error("Fehler beim Verlassen der Spielgruppe")
    }
  }

  const loadCreatorJoinRequests = async () => {
    if (!user) return

    try {
      const { data: userGroups, error: groupsError } = await supabase
        .from("communities")
        .select("id")
        .eq("creator_id", user.id)
        .eq("type", "casual")

      if (groupsError) throw groupsError

      const groupIds = userGroups?.map((group) => group.id) || []

      if (groupIds.length === 0) {
        setCreatorJoinRequests([])
        return
      }

      const { data, error } = await supabase
        .from("community_join_requests")
        .select(`
          *,
          users:user_id(id, username, avatar),
          communities:community_id(name)
        `)
        .eq("status", "pending")
        .in("community_id", groupIds)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCreatorJoinRequests(data || [])
    } catch (error) {
      console.error("Error loading creator join requests:", error)
    }
  }

  const handleJoinRequest = async (requestId: string, action: "approve" | "reject") => {
    try {
      const result = await handleJoinRequestAction(requestId, action)

      if (result.error) {
        console.error("Error handling join request:", result.error)
        toast.error("Fehler beim Bearbeiten der Anfrage")
        return
      }

      if (action === "approve") {
        toast.success("Beitrittsanfrage genehmigt! Der Benutzer ist jetzt Mitglied der Spielgruppe.")
        // Fetch details of the approved user and group to send notification
        const { data: requestDetails } = await supabase
          .from("community_join_requests")
          .select(`
          users:user_id(id, username, name),
          communities:community_id(name)
        `)
          .eq("id", requestId)
          .single()

        if (requestDetails && requestDetails.users && requestDetails.communities) {
          const userName = requestDetails.users.name || requestDetails.users.username || "Ein Mitglied"
          const groupName = requestDetails.communities.name || "unbekannte Gruppe"

          await supabase.from("notifications").insert({
            user_id: requestDetails.users.id,
            type: "group_join_approved",
            title: "Beitritt genehmigt",
            message: `Deine Beitrittsanfrage für die Spielgruppe "${groupName}" wurde genehmigt!`,
            data: {
              group_id: result.communityId, // result.communityId is now available from handleJoinRequestAction
              group_name: groupName,
              member_id: requestDetails.users.id,
              member_name: userName,
            },
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      } else {
        toast.success("Beitrittsanfrage abgelehnt.")
        // Fetch details of the rejected user and group to send notification
        const { data: requestDetails } = await supabase
          .from("community_join_requests")
          .select(`
          users:user_id(id, username, name),
          communities:community_id(name)
        `)
          .eq("id", requestId)
          .single()

        if (requestDetails && requestDetails.users && requestDetails.communities) {
          const userName = requestDetails.users.name || requestDetails.users.username || "Ein Mitglied"
          const groupName = requestDetails.communities.name || "unbekannte Gruppe"

          await supabase.from("notifications").insert({
            user_id: requestDetails.users.id,
            type: "group_join_rejected",
            title: "Beitritt abgelehnt",
            message: `Deine Beitrittsanfrage für die Spielgruppe "${groupName}" wurde abgelehnt.`,
            data: {
              group_id: result.communityId,
              group_name: groupName,
              member_id: requestDetails.users.id,
              member_name: userName,
            },
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      }

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

  const canManageMembers = (group: LudoGroup) => {
    if (!user) return false

    return group.creator_id === user.id
  }

  const handleLocationSearch = async (address: string, radius: number) => {
    try {
      console.log("[v0] Location search for communities:", address)

      // Split the search address into parts (PLZ, city, street, etc.)
      const searchParts = address
        .toLowerCase()
        .split(/[,\s]+/)
        .filter((part) => part.length > 0)
      console.log("[v0] Search parts:", searchParts)

      // Filter groups where location contains any of the search parts
      const results = ludoGroups.filter((group) => {
        if (!group.location) return false
        const locationLower = group.location.toLowerCase()
        // Check if location contains any of the search parts
        return searchParts.some((part) => locationLower.includes(part))
      })

      console.log("[v0] Found communities:", results.length)

      setLocationSearchResults(results)
      setShowLocationResults(true)

      if (results.length === 0) {
        toast.info("Keine Spielgruppen an diesem Standort gefunden")
      } else {
        toast.success(`${results.length} Spielgruppe${results.length !== 1 ? "n" : ""} gefunden`)
      }
    } catch (error) {
      console.error("[v0] Location search error:", error)
      toast.error("Fehler bei der Standortsuche")
      setLocationSearchResults([])
      setShowLocationResults(false)
    }
  }

  const handleNearbySearch = async () => {
    if (!navigator.geolocation) {
      toast.error("Dein Browser unterstützt keine Standortermittlung")
      return
    }

    toast.info("Ermittle deinen Standort...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          console.log("[v0] User location:", latitude, longitude)

          // Search for communities within 50km radius
          const results = await searchCommunitiesNearby(latitude, longitude, 50)

          console.log("[v0] Found nearby communities:", results.length)

          setLocationSearchResults(results)
          setShowLocationResults(true)

          if (results.length === 0) {
            toast.info("Keine Spielgruppen in deiner Nähe gefunden (50km Umkreis)")
          } else {
            toast.success(`${results.length} Spielgruppe${results.length !== 1 ? "n" : ""} in deiner Nähe gefunden`)
          }
        } catch (error) {
          console.error("[v0] Nearby search error:", error)
          toast.error("Fehler bei der Standortsuche")
          setLocationSearchResults([])
          setShowLocationResults(false)
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Standortzugriff wurde verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.")
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Standort konnte nicht ermittelt werden")
        } else if (error.code === error.TIMEOUT) {
          toast.error("Zeitüberschreitung bei der Standortermittlung")
        } else {
          toast.error("Fehler bei der Standortermittlung")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const getJoinButtonProps = (group: LudoGroup) => {
    console.log("[v0] getJoinButtonProps called for group:", group.id)
    console.log("[v0] User:", !!user, "User ID:", user?.id)
    console.log("[v0] User memberships:", userMemberships)
    console.log("[v0] Is user member of this group:", userMemberships.includes(group.id))

    if (!user) {
      return { text: "Beitreten", disabled: false, variant: "default" as const }
    }

    if (group.creator_id === user?.id) {
      return { text: "Deine Spielgruppe", disabled: true, variant: "secondary" as const }
    }

    if (userMemberships.includes(group.id)) {
      console.log("[v0] User is member - showing 'Verlassen' button")
      return { text: "Verlassen", disabled: false, variant: "outline" as const, action: "leave" }
    }

    if (group.max_members !== null && group.member_count >= group.max_members) {
      return { text: "Voll", disabled: true, variant: "secondary" as const }
    }

    const joinRequest = getJoinRequestStatus(group.id)

    if (joinRequest) {
      switch (joinRequest.status) {
        case "pending":
          return { text: "Warte auf Genehmigung", disabled: true, variant: "outline" as const, icon: Clock }
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

  const formatMemberCount = (group: LudoGroup) => {
    if (group.max_members === null) {
      return (
        <>
          {group.member_count} Mitglieder <span className="text-gray-500">(unbegrenzt)</span>
        </>
      )
    }

    const freeSpots = group.max_members - group.member_count
    if (freeSpots > 0) {
      return (
        <>
          {group.member_count} Mitglieder (<span className="text-green-600 font-medium">{freeSpots} Plätze frei</span>)
        </>
      )
    } else {
      return (
        <>
          {group.member_count} Mitglieder (<span className="text-red-600 font-medium">Voll</span>)
        </>
      )
    }
  }

  const showGroupDetails = (group: LudoGroup) => {
    setSelectedGroup(group)
    setIsDetailsDialogOpen(true)
  }

  const openInviteDialog = (group: LudoGroup, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setInviteGroup(group)
    setIsInviteDialogOpen(true)
  }

  const getFilteredGroups = () => {
    const sourceGroups = showLocationResults ? locationSearchResults : ludoGroups

    let filtered = sourceGroups.filter(
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

  const handleBroadcastMessage = (group: LudoGroup) => {
    console.log("[v0] handleBroadcastMessage called with group:", group.id, group.name)
    console.log("[v0] Setting selectedGroupForBroadcast and opening modal")
    setSelectedGroupForBroadcast(group)
    setIsBroadcastModalOpen(true)
    console.log("[v0] Modal state should now be open")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="ludo-gruppen" />

      <div className="container mx-auto px-4 py-8">
        {/* START CHANGE */}
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-gray-800 mb-4">Spielgruppen</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Finde deine perfekte Spielgruppe oder gründe deine eigene! Verbinde dich mit anderen Spiel-Enthusiasten und
            schliesse neue Freundschaften!
          </p>
          {user && (
            <Button
              onClick={() => {
                console.log("[v0] Spielgruppe erstellen button clicked")
                console.log("[v0] User:", user)
                console.log("[v0] Opening create dialog...")
                setIsCreateDialogOpen(true)
                console.log("[v0] isCreateDialogOpen state set to true")
              }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              <Plus className="h-4 w-4 mr-2" />
              Spielgruppe erstellen
            </Button>
          )}
          {!user && console.log("[v0] Create button not shown - user not logged in")}
        </div>
        {/* END CHANGE */}

        {/* Updated filter section with professional, unified design */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Spielgruppen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/80 border-gray-200 focus:border-teal-500 text-base"
                />
              </div>
            </div>

            {/* Location Search */}
            <div className="space-y-3">
              <SimpleLocationSearch onLocationSearch={handleLocationSearch} onNearbySearch={handleNearbySearch} />
            </div>

            {showLocationResults && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    Zeige Ergebnisse in der Nähe ({locationSearchResults.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Alle Spielgruppen zeigen
                </Button>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sortieren nach</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="newest">Neueste</SelectItem>
                      <SelectItem value="members">Mitglieder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Kapazität</Label>
                  <Select value={availableSpotsFilter} onValueChange={setAvailableSpotsFilter}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="available">Freie Plätze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Beitrittsverfahren</Label>
                  <Select value={approvalModeFilter} onValueChange={setApprovalModeFilter}>
                    <SelectTrigger className="h-12 bg-white/80 border-gray-200 focus:border-teal-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="automatic">Sofortiger Beitritt</SelectItem>
                      <SelectItem value="manual">Beitritt erst nach Genehmigung</SelectItem>
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
                      setShowLocationResults(false)
                      setLocationSearchResults([])
                    }}
                    className="h-12 w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                  >
                    Filter zurücksetzen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END CHANGE */}

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
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden relative flex flex-col h-full"
                    >
                      {group.approval_mode === "manual" && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-xs z-20 shadow-md border border-amber-200 font-medium"
                        >
                          Beitritt erst nach Genehmigung
                        </Badge>
                      )}

                      <div className="relative h-32 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
                        {group.image ? (
                          <>
                            <img
                              src={group.image || "/placeholder.svg"}
                              alt={group.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </>
                        ) : (
                          <Dices className="w-12 h-12 text-teal-400" />
                        )}
                      </div>

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="font-handwritten text-lg text-gray-800 mb-1 group-hover:text-teal-600 transition-colors">
                              {group.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"></div>
                          </div>
                          {group.distance !== undefined && <DistanceBadge distance={group.distance} className="ml-2" />}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        {group.description && <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>}

                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-4 w-4 text-teal-600" />
                            <span>{formatMemberCount(group)}</span>
                          </div>
                          {group.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-teal-600" />
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                              >
                                {group.location}
                              </a>
                              {/* </CHANGE> */}
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
                                toast.info("Bitte melde dich an, um einer Spielgruppe beizutreten")
                                window.location.href = "/login"
                                return
                              }
                              const buttonProps = getJoinButtonProps(group)
                              if (buttonProps.action === "leave") {
                                leaveLudoGroup(group)
                              } else {
                                joinLudoGroup(group)
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`flex-1 font-handwritten ${
                              buttonProps.action === "leave"
                                ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-red-500"
                                : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:to-gray-400"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {buttonProps.text}
                          </Button>

                          {(!user || group.creator_id !== user.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-3 bg-transparent font-handwritten"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!user) {
                                  toast.info("Bitte melde dich an, um Nachrichten zu senden")
                                  window.location.href = "/login"
                                  return
                                }
                                handleSendGroupMessage(group)
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {user && canManageMembers(group) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 bg-transparent font-handwritten"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showMemberManagement(group)
                                }}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 bg-transparent font-handwritten"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBroadcastMessage(group)
                                }}
                                title="Nachricht an alle Mitglieder senden"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

        {/* START CHANGE */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-3xl text-gray-800 mb-2">
                Neue Spielgruppe erstellen
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Erstelle eine neue Spielgruppe und lade andere Spieler ein
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Basic Information Section - Now includes all basic info */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Grundinformationen
                </h3>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="group-name" className="text-base font-semibold text-gray-900 mb-2 block">
                      Name der Spielgruppe *
                    </Label>
                    <Input
                      id="group-name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="z.B. CATAN-Freunde Zürich"
                      className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="group-description" className="text-base font-semibold text-gray-900 mb-2 block">
                      Beschreibung
                    </Label>
                    <textarea
                      id="group-description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Beschreibe deine Spielgruppe..."
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-base"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-members" className="text-base font-semibold text-gray-900 mb-2 block">
                      Maximale Mitgliederzahl
                    </Label>
                    <Input
                      id="max-members"
                      type="number"
                      value={newGroup.max_members || ""}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          max_members: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Leer lassen für unbegrenzt"
                      className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="group-image"
                      className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"
                    >
                      Gruppenbild (optional)
                    </Label>

                    {!imagePreview ? (
                      <div
                        onClick={() => document.getElementById("group-image")?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-all duration-200 bg-gray-50"
                      >
                        <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-base font-medium text-gray-700 mb-1">Klicken zum Hochladen</p>
                        <p className="text-sm text-gray-500">JPG, PNG oder WebP (max. 5MB)</p>
                        <Input
                          id="group-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border-2 border-teal-200">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-64 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="group-location" className="text-base font-semibold text-gray-900 mb-2 block">
                      Standort
                    </Label>
                    <AddressAutocomplete
                      label=""
                      placeholder="Location, Adresse, PLZ oder Ort eingeben..."
                      value={newGroup.location}
                      onChange={(value) => setNewGroup({ ...newGroup, location: value })}
                      className="h-12 text-base border-gray-300 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 border-2 border-orange-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Beitrittsverfahren
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="approval-mode" className="text-base font-semibold text-gray-900 mb-2 block">
                      Wie sollen neue Mitglieder beitreten können?
                    </Label>
                    <Select
                      value={newGroup.approval_mode}
                      onValueChange={(value: "automatic" | "manual") =>
                        setNewGroup({ ...newGroup, approval_mode: value })
                      }
                    >
                      <SelectTrigger className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Sofortiger Beitritt</SelectItem>
                        <SelectItem value="manual">Beitritt erst nach Genehmigung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
                    {newGroup.approval_mode === "automatic" ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Sofortiger Beitritt</p>
                            <p className="text-sm text-gray-600">
                              Interessenten können der Spielgruppe sofort beitreten, ohne auf eine Genehmigung warten zu
                              müssen.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Beitritt erst nach Genehmigung</p>
                            <p className="text-sm text-gray-600">
                              Du erhältst eine Benachrichtigung für jede Beitrittsanfrage und kannst entscheiden, wer
                              Mitglied wird.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
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
                  }}
                  className="flex-1 h-12 text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={createLudoGroup}
                  disabled={!newGroup.name.trim() || isUploading}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold shadow-lg"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Wird erstellt...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Spielgruppe erstellen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* END CHANGE */}

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              {user && selectedGroup && canManageMembers(selectedGroup) && (
                <div className="flex gap-2 justify-end mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openInviteDialog(selectedGroup, e)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Einladen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      showMemberManagement(selectedGroup)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Verwalten
                  </Button>
                </div>
              )}
              <DialogTitle className="font-handwritten text-2xl text-gray-800">{selectedGroup?.name}</DialogTitle>
              <DialogDescription>Spielgruppe Details und Informationen</DialogDescription>
            </DialogHeader>

            {selectedGroup && (
              <div className="space-y-6">
                <div className="w-full h-48 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
                  {selectedGroup.image ? (
                    <img
                      src={selectedGroup.image || "/placeholder.svg"}
                      alt={selectedGroup.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Dices className="w-16 h-16 text-teal-400" />
                  )}
                </div>

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
                    <ExpandableText text={selectedGroup.description} maxLength={300} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-teal-600" />
                    <span className="text-gray-600">{formatMemberCount(selectedGroup)}</span>
                  </div>
                  {selectedGroup.location && (
                    <div className="col-span-2 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <span className="text-gray-600">{selectedGroup.location}</span>
                      {/* </CHANGE> */}
                    </div>
                  )}
                </div>

                {/* START CHANGE */}
                <div>
                  {selectedGroup.location ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <LocationMap location={selectedGroup.location} className="h-64 w-full rounded-lg" />
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        Kein Standort angegeben. Diese Spielgruppe hat keinen Standort hinterlegt.
                      </p>
                    </div>
                  )}
                </div>
                {/* END CHANGE */}

                <div className="flex gap-3 pt-4">
                  {(() => {
                    const buttonProps = getJoinButtonProps(selectedGroup)
                    const IconComponent = buttonProps.icon

                    return (
                      <Button
                        onClick={() => {
                          if (!user) {
                            toast.info("Bitte melde dich an, um einer Spielgruppe beizutreten")
                            window.location.href = "/login"
                            return
                          }
                          const buttonProps = getJoinButtonProps(selectedGroup)
                          if (buttonProps.action === "leave") {
                            leaveLudoGroup(selectedGroup)
                          } else {
                            joinLudoGroup(selectedGroup)
                          }
                          setIsDetailsDialogOpen(false)
                        }}
                        disabled={buttonProps.disabled}
                        variant={buttonProps.variant}
                        className={`flex-1 font-handwritten ${
                          buttonProps.action === "leave"
                            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-red-500"
                            : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:to-gray-400"
                        }`}
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

                  <ShareButton
                    url={`${typeof window !== "undefined" ? window.location.origin : ""}/ludo-gruppen/${selectedGroup.id}`}
                    title={selectedGroup.name}
                    description={selectedGroup.description || "Schau dir diese Spielgruppe an!"}
                    variant="outline"
                    className="px-4 bg-transparent font-handwritten"
                  />

                  {(!user || (user && selectedGroup.creator_id !== user.id)) && (
                    <Button
                      variant="outline"
                      className="px-4 bg-transparent font-handwritten"
                      onClick={() => {
                        if (!user) {
                          toast.info("Bitte melde dich an, um Nachrichten zu senden")
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
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isMemberManagementDialogOpen} onOpenChange={setIsMemberManagementDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-gray-800">Mitglieder verwalten</DialogTitle>
              <DialogDescription>
                {selectedGroupForMembers?.name} - Verwalte die Mitglieder dieser Spielgruppe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Lade Mitglieder...</p>
                </div>
              ) : groupMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Mitglieder gefunden</h3>
                  <p className="text-gray-500">Diese Spielgruppe hat noch keine Mitglieder.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">
                      {groupMembers.length} Mitglied{groupMembers.length !== 1 ? "er" : ""}
                    </h4>
                    {user && selectedGroupForMembers && selectedGroupForMembers.creator_id === user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBroadcastMessage(selectedGroupForMembers)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-handwritten"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Nachricht an alle senden
                      </Button>
                    )}
                  </div>

                  {groupMembers.map((member) => (
                    <Card key={member.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.users?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{member.users?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <UserLink
                                userId={member.users?.id || ""}
                                className="text-gray-800 hover:text-teal-600 transition-colors"
                              >
                                <p className="font-medium cursor-pointer hover:text-teal-600 transition-colors">
                                  {member.users?.username}
                                </p>
                              </UserLink>
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

                        {/* Only show management options if current user is creator */}
                        {user &&
                          selectedGroupForMembers &&
                          selectedGroupForMembers.creator_id === user.id &&
                          member.user_id !== user.id &&
                          selectedGroupForMembers.creator_id !== member.user_id && (
                            <div className="flex gap-2">
                              {/* Role change button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  changeMemberRole(
                                    member.id,
                                    member.role === "admin" ? "member" : "admin",
                                    member.users?.username || "Unbekannt",
                                  )
                                }
                                className="text-xs"
                              >
                                {member.role === "admin" ? "Zu Mitglied" : "Zu Admin"}
                              </Button>

                              {/* Remove member button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log("[v0] Remove button clicked for member:", member.users?.username)
                                  removeMemberFromGroup(member.id, member.users?.username || "Unbekannt")
                                }}
                                className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Entfernen
                              </Button>
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

        <BroadcastMessageModal
          isOpen={isBroadcastModalOpen}
          onClose={() => {
            setIsBroadcastModalOpen(false)
            setSelectedGroupForBroadcast(null)
          }}
          groupId={selectedGroupForBroadcast?.id || ""}
          groupName={selectedGroupForBroadcast?.name || ""}
        />

        <InviteFriendsToCommunityDialog
          isOpen={isInviteDialogOpen}
          onClose={() => {
            setIsInviteDialogOpen(false)
            setInviteGroup(null)
          }}
          communityId={inviteGroup?.id || ""}
          communityName={inviteGroup?.name || ""}
        />
      </div>
    </div>
  )
}
