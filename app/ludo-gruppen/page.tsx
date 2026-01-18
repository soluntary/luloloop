"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FaPlus,
  FaMapMarkerAlt,
  FaUsers,
  FaUserPlus,
  FaComment,
  FaClock,
  FaCheckCircle,
  FaUserCog,
  FaTimes,
  FaUserMinus,
  FaImage,
  FaUserTimes,
  FaBullhorn, // Added for broadcast
  FaPoll, // Replaced FaVote with FaPoll (valid icon)
  FaTimesCircle, // Added for poll closing
  FaInfoCircle, // Added for poll information
  FaTrash, // Added for poll deletion
} from "react-icons/fa"
import { MdOutlineManageSearch } from "react-icons/md"
import { GiRollingDices } from "react-icons/gi"
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
import { SimpleLocationSearch } from "@/components/simple-location-search"
import { useLocationSearch } from "@/contexts/location-search-context"
import { DistanceBadge } from "@/components/distance-badge"
import { LocationMap } from "@/components/location-map"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { Poll } from "@/app/actions/community-polls"
import { convertMarkdownToHtml } from "@/lib/utils"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useSearchParams, useRouter } from "next/navigation" // Added useRouter
import { Plus } from "lucide-react" // Added for polls
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs" // Added for tabs
import { motion } from "framer-motion" // Added for animations
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel" // Added for carousel

import { UserProfileModal } from "@/components/user-profile-modal"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Settings, Edit, UserPlus, Trash2, MessageCircle } from "lucide-react"
import { createPollWithOptions } from "@/app/actions/create-poll"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface LudoGroup {
  id: string
  name: string
  description: string
  location: string
  image: string
  images?: string[] // Added for multiple images
  creator_id: string
  max_members: number | null
  member_count: number
  type: "casual" | "competitive" // Added type for potential future use
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
  role: "member" | "admin" // Added role type
  joined_at: string
  users: {
    // Corrected from 'users' to 'user' to match the update
    id: string
    username: string
    avatar: string
  }
}

export default function LudoGruppenPage() {
  const searchParams = useSearchParams()
  const router = useRouter() // Initialize useRouter
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
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    location: "",
    max_members: null as number | null,
    type: "casual" as "casual" | "competitive",
    approval_mode: "automatic" as "automatic" | "manual",
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Use controlled Accordion with value and onValueChange instead of defaultValue
  const [openAccordionSections, setOpenAccordionSections] = useState<string[]>(["grundinformationen"])

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("all")
  const [groupTypeFilter, setGroupTypeFilter] = useState("all") // Added for filter by type
  const [availableSpotsFilter, setAvailableSpotsFilter] = useState("all")
  const [approvalModeFilter, setApprovalModeFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<LudoGroup | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  // Removed imageFile and imagePreview as they are replaced by imageFiles and imagePreviews
  const [isUploading, setIsUploading] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    name: string
    avatar?: string
    context: { title: string; image?: string; type: "group" | "event" | "member" }
  } | null>(null)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false) // Moved up
  const [selectedGroupForBroadcast, setSelectedGroupForBroadcast] = useState<LudoGroup | null>(null) // Moved up
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteGroup, setInviteGroup] = useState<LudoGroup | null>(null)
  const [newPoll, setNewPoll] = useState({
    question: "",
    description: "",
    options: ["", ""],
    allow_multiple_votes: false,
    expires_at: "",
  })

  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const { searchByAddress, searchCommunitiesNearby } = useLocationSearch() // Ensure searchCommunitiesNearby is destructured

  const [isCreatePollDialogOpen, setIsCreatePollDialogOpen] = useState(false) // Moved up
  const [selectedGroupForPolls, setSelectedGroupForPolls] = useState<LudoGroup | null>(null) // Corrected state variable name, moved up
  const [isPollsDialogOpen, setIsPollsDialogOpen] = useState(false)
  const [groupPolls, setGroupPolls] = useState<Poll[]>([])
  const [loadingPolls, setLoadingPolls] = useState(false)

  // State for the new dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false)
  const [showPollDialog, setShowPollDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null) // Used for new dialogs
  const [friends, setFriends] = useState<any[]>([]) // For invite dialog
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]) // For invite dialog
  // broadcastMessage is already defined
  const [pollQuestion, setPollQuestion] = useState("") // For poll dialog
  const [pollOptions, setPollOptions] = useState(["", ""]) // For poll dialog
  const [allowMultiple, setAllowMultiple] = useState(false) // New state for allow_multiple_votes
  const [members, setMembers] = useState<any[]>([]) // For members dialog
  const [communityPolls, setCommunityPolls] = useState<any[]>([]) // For poll dialog

  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const [hasProcessedURLParams, setHasProcessedURLParams] = useState(false)

  const [activePollTab, setActivePollTab] = useState<"active" | "completed" | "create">("active")
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({})

  const supabase = createClient()

  useEffect(() => {
    loadLudoGroups()
    if (user) {
      loadJoinRequests()
      loadCreatorJoinRequests()
      loadUserMemberships()
    }
  }, [user])

  // Kept the original useEffect for URL parameter processing
  useEffect(() => {
    const viewId = searchParams.get("view")
    const shouldShowMembers = searchParams.get("members") === "true"
    const shouldShowBroadcast = searchParams.get("broadcast") === "true"
    const shouldShowInvite = searchParams.get("invite") === "true"
    const shouldShowCreatePoll = searchParams.get("createPoll") === "true"
    const shouldShowPolls = searchParams.get("polls") === "true"

    console.log("[v0] URL params:", {
      viewId,
      shouldShowMembers,
      shouldShowBroadcast,
      shouldShowInvite,
      shouldShowCreatePoll,
      shouldShowPolls,
    })

    if (viewId && ludoGroups.length > 0 && !hasProcessedURLParams) {
      const group = ludoGroups.find((g) => g.id === viewId)
      if (group) {
        console.log("[v0] Found group from URL param:", group.name)
        setSelectedGroup(group)
        setIsDetailsDialogOpen(true)
        setHasProcessedURLParams(true) // Mark as processed

        // Open specific management dialogs based on URL params
        if (shouldShowMembers) {
          console.log("[v0] Opening member management dialog from URL param")
          showMemberManagement(group) // Corrected: Directly call showMemberManagement
        } else if (shouldShowBroadcast) {
          console.log("[v0] Opening broadcast dialog from URL param")
          setSelectedGroupForBroadcast(group)
          setIsBroadcastModalOpen(true)
        } else if (shouldShowInvite) {
          console.log("[v0] Opening invite dialog from URL param")
          setInviteGroup(group)
          setIsInviteDialogOpen(true)
        } else if (shouldShowCreatePoll) {
          console.log("[v0] Opening create poll dialog from URL param")
          setSelectedGroupForPolls(group)
          setIsCreatePollDialogOpen(true)
        } else if (shouldShowPolls) {
          console.log("[v0] Opening polls dialog from URL param")
          setSelectedGroupForPolls(group)
          setIsPollsDialogOpen(true)
          // loadGroupPolls(group.id) // REMOVED
        }
      }
    }

    if (!viewId && hasProcessedURLParams) {
      setHasProcessedURLParams(false)
    }

    // Handle edit mode
    const editId = searchParams.get("edit")
    if (editId && ludoGroups.length > 0) {
      const group = ludoGroups.find((g) => g.id === editId)
      if (group && user && group.creator_id === user.id) {
        console.log("[v0] Opening edit dialog from URL param for group:", group.name)
        // TODO: Implement edit dialog/form
        setIsCreateDialogOpen(true)
        setNewGroup({
          name: group.name,
          description: group.description || "",
          location: group.location || "",
          max_members: group.max_members,
          type: group.type || "casual",
          approval_mode: group.approval_mode || "automatic",
        })
      }
    }
  }, [searchParams, ludoGroups, user, hasProcessedURLParams]) // Added hasProcessedURLParams to dependency array

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

  const showMemberManagement = (group: LudoGroup) => {
    setSelectedGroupForMembers(group)
    setIsMemberManagementDialogOpen(true)
    loadGroupMembers(group.id)
  }

  const handleBroadcastMessage = (group: LudoGroup) => {
    setSelectedGroupForBroadcast(group)
    setIsBroadcastModalOpen(true)
  }

  const sendBroadcastMessage = async () => {
    if (!user || !selectedGroupForBroadcast || !broadcastMessage.trim()) return

    try {
      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", selectedGroupForBroadcast.id)
        .neq("user_id", user.id)

      if (membersError) throw membersError

      // Send notification to each member
      for (const member of members || []) {
        await supabase.from("notifications").insert({
          user_id: member.user_id,
          type: "community_broadcast",
          title: `Nachricht von ${selectedGroupForBroadcast.name}`,
          message: broadcastMessage,
          data: {
            community_id: selectedGroupForBroadcast.id,
            community_name: selectedGroupForBroadcast.name,
          },
        })
      }

      toast.success("Nachricht wurde an alle Mitglieder gesendet")
      setIsBroadcastModalOpen(false)
      setBroadcastMessage("")
    } catch (error) {
      console.error("Error sending broadcast:", error)
      toast.error("Fehler beim Senden der Nachricht")
    }
  }

  // Replaced by createPollWithOptions action
  // const createPoll = async () => {
  //   if (!user || !selectedGroupForPolls) return

  //   if (!newPoll.question.trim() || newPoll.options.filter((o) => o.trim()).length < 2) {
  //     toast.error("Bitte fülle die Frage und mindestens 2 Optionen aus")
  //     return
  //   }

  //   try {
  //     console.log("[v0] Creating poll with data:", {
  //       question: newPoll.question,
  //       options: newPoll.options.filter((o) => o.trim()),
  //       community_id: selectedGroupForPolls.id,
  //     })

  //     // Create poll
  //     const { data: pollData, error: pollError } = await supabase
  //       .from("community_polls")
  //       .insert({
  //         community_id: selectedGroupForPolls.id,
  //         creator_id: user.id,
  //         question: newPoll.question,
  //         description: newPoll.description,
  //         allow_multiple_votes: newPoll.allow_multiple_votes,
  //         expires_at: newPoll.expires_at || null,
  //         is_active: true,
  //       })
  //       .select()
  //       .single()

  //     if (pollError) throw pollError

  //     console.log("[v0] Poll created:", pollData.id)

  //     // Create poll options
  //     const options = newPoll.options
  //       .filter((o) => o.trim())
  //       .map((option) => ({
  //         poll_id: pollData.id,
  //         option_text: option,
  //         votes_count: 0,
  //       }))

  //     console.log("[v0] Inserting options:", options)

  //     const { error: optionsError } = await supabase.from("community_poll_options").insert(options)

  //     if (optionsError) {
  //       console.error("[v0] Error inserting options:", optionsError)
  //       throw optionsError
  //     }

  //     console.log("[v0] Options inserted successfully")

  //     toast.success("Abstimmung erfolgreich erstellt!")
  //     setIsCreatePollDialogOpen(false)
  //     setNewPoll({
  //       question: "",
  //       description: "",
  //       options: ["", ""],
  //       allow_multiple_votes: false,
  //       expires_at: "",
  //     })

  //     if (selectedGroupForPolls) {
  //       loadCommunityPolls(selectedGroupForPolls.id)
  //     }
  //   } catch (error) {
  //     console.error("[v0] Error creating poll:", error)
  //     toast.error("Fehler beim Erstellen der Abstimmung")
  //   }
  // }

  const createLudoGroup = async () => {
    if (!user || !newGroup.name.trim()) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus")
      return
    }

    setIsUploading(true)

    try {
      const imageUrls: string[] = []

      // Upload all images
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("community-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Image upload error:", uploadError)
          toast.error(`Fehler beim Hochladen von ${file.name}`)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("community-images").getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // Use first image as main image, store all in images array
      const mainImage = imageUrls[0] || ""

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
            image: mainImage,
            images: imageUrls, // Store all images
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

      const userName = user.user_metadata?.name || user.user_metadata?.preferred_username || "Ein Mitglied"

      await supabase.from("notifications").insert({
        user_id: data.creator_id,
        type: "group_created",
        title: "Neue Spielgruppe erstellt",
        message: `Deine Spielgruppe "${data.name}" wurde erfolgreich erstellt!`,
        data: {
          group_id: data.id,
          group_name: data.name,
        },
        read: false,
        created_at: new Date().toISOString(),
      })

      toast.success("Viel Spass! Deine Spielgruppe wurde erstellt!")
      setIsCreateDialogOpen(false)
      setNewGroup({
        name: "",
        description: "",
        location: "",
        max_members: null,
        type: "casual",
        approval_mode: "automatic",
      })
      // Clear all uploaded images
      setImageFiles([])
      setImagePreviews([])
      loadLudoGroups()
    } catch (error) {
      console.error("Error creating Ludo group:", error)
      toast.error("Fehler beim Erstellen der Spielgruppe")
    } finally {
      setIsUploading(false)
    }
  }

  // Renaming joinLudoGroup to handleJoinGroup
  const handleJoinGroup = async (group: LudoGroup) => {
    if (!user) return

    console.log("[v0] Beitreten button clicked - user:", !!user, "group:", group.id)
    console.log("[v0] handleJoinGroup called - user:", !!user, "group:", group.id)
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
        const userName = userData?.username || userData?.name || "Ein Mitglied"

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
        const userName = userData?.username || userData?.name || "Ein Mitglied"

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

        loadJoinRequests()
      }
    } catch (error) {
      console.error("[v0] Error joining/requesting Ludo group:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      toast.error("Fehler beim Beitreten der Spielgruppe")
    }
  }

  // Renaming leaveLudoGroup to leaveGroup
  const leaveGroup = async (group: LudoGroup) => {
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
      const userName = userData?.username || userData?.name || "Ein Mitglied"

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
          const userName = requestDetails.users.username || requestDetails.users.name || "Ein Mitglied"
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
          const userName = requestDetails.users.username || requestDetails.users.name || "Ein Mitglied"
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
    if (group.creator_id === user.id) return true

    // Check if user is an admin of this group
    const userMembership = groupMembers.find((m) => m.user_id === user.id)
    return userMembership?.role === "admin"
  }

  const isAdminOrCreator = (group: LudoGroup) => {
    if (!user) return false
    return group.creator_id === user.id || canManageMembers(group)
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

  // Renaming getJoinButtonProps to getGroupJoinButtonProps
  const getGroupJoinButtonProps = (group: LudoGroup) => {
    console.log("[v0] getGroupJoinButtonProps called for group:", group.id)
    console.log("[v0] User:", !!user, "User ID:", user?.id)
    console.log("[v0] User memberships:", userMemberships)
    console.log("[v0] Is user member of this group:", userMemberships.includes(group.id))

    if (!user) {
      return { text: "Beitreten", disabled: false, variant: "default" as const }
    }

    if (group.creator_id === user?.id) {
      return { text: "Deine Spielgruppe", disabled: true, variant: "secondary" as const, icon: FaUserCog }
    }

    if (userMemberships.includes(group.id)) {
      console.log("[v0] User is member - showing 'Verlassen' button")
      return { text: "Verlassen", disabled: false, variant: "outline" as const, action: "leave", icon: FaUserMinus }
    }

    if (group.max_members !== null && group.member_count >= group.max_members) {
      return { text: "Voll", disabled: true, variant: "secondary" as const }
    }

    const joinRequest = getJoinRequestStatus(group.id)

    if (joinRequest) {
      switch (joinRequest.status) {
        case "pending":
          return { text: "Warte auf Genehmigung", disabled: true, variant: "outline" as const, icon: FaClock }
        case "approved":
          return { text: "Genehmigt", disabled: true, variant: "default" as const, icon: FaCheckCircle }
        case "rejected":
          return { text: "Abgelehnt", disabled: true, variant: "destructive" as const, icon: FaUserTimes }
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
          {group.member_count} Mitglieder (<span className="text-xs text-green-600 font-medium">unbegrenzt</span>)
        </>
      )
    }

    const freeSpots = group.max_members - group.member_count
    if (freeSpots > 0) {
      return (
        <>
          {group.member_count} Mitglieder (
          <span className="text-xs text-green-600 font-medium">{freeSpots} Plätze frei</span>)
        </>
      )
    } else {
      return (
        <>
          {group.member_count} Mitglieder (<span className="text-xs text-red-600 font-medium">Voll</span>)
        </>
      )
    }
  }

  const showGroupDetails = (group: LudoGroup) => {
    setSelectedGroup(group)
    setIsDetailsDialogOpen(true)
    // Update URL to include 'view' parameter
    router.push(`/ludo-gruppen?view=${group.id}`, { scroll: false })
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

    if (groupTypeFilter !== "all") {
      filtered = filtered.filter((group) => group.type === groupTypeFilter)
    }

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
    const files = event.target.files
    if (!files) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß. Maximale Größe: 5MB`)
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} ist keine Bilddatei`)
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === newFiles.length) {
          setImageFiles((prev) => [...prev, ...newFiles])
          setImagePreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
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

  // New functions for invite, broadcast, poll, and member management dialogs
  const loadFriends = async () => {
    if (!user) return
    console.log("[v0] Loading friends for invite...")

    try {
      // Get friends where current user is either user_id or friend_id with status 'active'
      const { data: friendships1, error: error1 } = await supabase
        .from("friends")
        .select(`
          friend_id,
          users!friends_friend_id_fkey (
            id,
            username,
            name,
            avatar
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      const { data: friendships2, error: error2 } = await supabase
        .from("friends")
        .select(`
          user_id,
          users!friends_user_id_fkey (
            id,
            username,
            name,
            avatar
          )
        `)
        .eq("friend_id", user.id)
        .eq("status", "active")

      if (error1 || error2) {
        console.error("[v0] Error loading friends:", error1 || error2)
        toast.error("Fehler beim Laden der Freunde")
        return
      }

      const friends1 = friendships1?.map((f) => f.users).filter(Boolean) || []
      const friends2 = friendships2?.map((f) => f.users).filter(Boolean) || []

      const allFriendsMap = new Map()
      friends1.forEach((friend) => {
        if (friend.id) allFriendsMap.set(friend.id, friend)
      })
      friends2.forEach((friend) => {
        if (friend.id) allFriendsMap.set(friend.id, friend)
      })
      const allFriends = Array.from(allFriendsMap.values())

      console.log("[v0] Loaded friends for invite:", allFriends.length)
      setFriends(allFriends)
    } catch (err) {
      console.error("[v0] Unexpected error loading friends:", err)
      toast.error("Fehler beim Laden der Freunde")
    }
  }

  const handleInviteFriends = async () => {
    if (!selectedCommunity || selectedFriends.length === 0) {
      toast.error("Bitte wählen Sie mindestens einen Freund aus")
      return
    }

    console.log("[v0] Inviting friends:", selectedFriends, "to community:", selectedCommunity.id)

    try {
      for (const friendId of selectedFriends) {
        const { error } = await supabase.from("community_invitations").insert({
          community_id: selectedCommunity.id,
          invited_user_id: friendId,
          invited_by_user_id: user?.id,
        })

        if (error) {
          console.error("[v0] Error inviting friend:", error)
        }
      }

      toast.success(`${selectedFriends.length} Freunde eingeladen`)
      setShowInviteDialog(false)
      setSelectedFriends([])
    } catch (error) {
      console.error("[v0] Error inviting friends:", error)
      toast.error("Fehler beim Einladen")
    }
  }

  const handleBroadcast = async () => {
    if (!selectedCommunity || !broadcastMessage.trim()) {
      toast.error("Bitte geben Sie eine Nachricht ein")
      return
    }

    console.log("[v0] Sending broadcast to community:", selectedCommunity.id)

    try {
      const { data: membersList } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", selectedCommunity.id)

      if (membersList) {
        for (const member of membersList) {
          if (member.user_id !== user?.id) {
            await supabase.from("notifications").insert({
              user_id: member.user_id,
              title: `Nachricht von ${selectedCommunity.name}`,
              message: broadcastMessage,
              type: "community_broadcast",
              reference_id: selectedCommunity.id,
            })
          }
        }

        toast.success("Nachricht an alle Mitglieder gesendet")
        setShowBroadcastDialog(false)
        setBroadcastMessage("")
      }
    } catch (error) {
      console.error("[v0] Error sending broadcast:", error)
      toast.error("Fehler beim Senden")
    }
  }

  const handleCreatePoll = async () => {
    if (!selectedCommunity || !pollQuestion.trim()) {
      toast.error("Bitte geben Sie eine Frage ein")
      return
    }

    const validOptions = pollOptions.filter((o) => o.trim())
    if (validOptions.length < 2) {
      toast.error("Bitte geben Sie mindestens 2 Optionen ein")
      return
    }

    console.log("[v0] CLIENT: Calling server action to create poll")
    console.log("[v0] CLIENT: Community ID:", selectedCommunity.id)
    console.log("[v0] CLIENT: Question:", pollQuestion)
    console.log("[v0] CLIENT: Options:", validOptions)
    console.log("[v0] CLIENT: Allow multiple:", allowMultiple)

    try {
      const result = await createPollWithOptions({
        communityId: selectedCommunity.id,
        question: pollQuestion,
        allowMultipleChoices: allowMultiple,
        options: validOptions,
        userId: user.id,
      })

      console.log("[v0] CLIENT: Server action result:", result)

      toast.success("Abstimmung erstellt")
      setShowPollDialog(false)
      setPollQuestion("")
      setPollOptions(["", ""])
      setAllowMultiple(false)

      // Reload polls
      await loadCommunityPolls(selectedCommunity.id)
    } catch (error) {
      console.error("[v0] CLIENT: Error creating poll:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen der Abstimmung")
    }
  }

  const loadCommunityPolls = async (communityId: string) => {
    console.log("[v0] Loading polls for community:", communityId)

    const { data, error } = await supabase
      .from("community_polls")
      .select(`
        *,
        creator:users!community_polls_creator_id_fkey(id, username, name),
        options:community_poll_options(*),
        votes:community_poll_votes(*)
      `)
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading polls:", error)
      return
    }

    console.log("[v0] Loaded polls:", data?.length || 0)
    data?.forEach((poll, index) => {
      console.log(`[v0] Poll ${index + 1}:`, {
        id: poll.id,
        question: poll.question,
        hasOptions: !!poll.options,
        optionsCount: poll.options?.length || 0,
        optionsRaw: poll.options,
      })
    })

    setCommunityPolls(data || [])

    // Load user's votes
    if (user) {
      const votes: Record<string, string[]> = {}
      data?.forEach((poll) => {
        const userPollVotes = poll.votes?.filter((v: any) => v.user_id === user.id).map((v: any) => v.option_id) || []
        if (userPollVotes.length > 0) {
          votes[poll.id] = userPollVotes
        }
      })
      setUserVotes(votes)
    }
  }

  const loadMembers = async (communityId: string) => {
    console.log("[v0] Loading members for community:", communityId)

    const { data, error } = await supabase
      .from("community_members")
      .select(`
        *,
        user:users!community_members_user_id_fkey(id, username, name, avatar)
      `)
      .eq("community_id", communityId)

    if (error) {
      console.error("[v0] Error loading members:", error)
      return
    }

    console.log("[v0] Loaded members:", data?.length || 0)
    setMembers(data || [])
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedCommunity) return

    console.log("[v0] Removing member:", memberId)

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", selectedCommunity.id)
        .eq("user_id", memberId)

      if (error) throw error

      toast.success("Mitglied entfernt")
      loadMembers(selectedCommunity.id)
    } catch (error) {
      console.error("[v0] Error removing member:", error)
      toast.error("Fehler beim Entfernen")
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast.error("Bitte melde dich an um abzustimmen")
      return
    }

    console.log("[v0] Voting on poll:", pollId, "option:", optionId)

    try {
      const poll = communityPolls.find((p) => p.id === pollId)
      const hasVoted = userVotes[pollId]?.includes(optionId)

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from("community_poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("option_id", optionId)
          .eq("user_id", user.id)

        if (error) throw error

        toast.success("Stimme entfernt")
      } else {
        // Check if multiple votes allowed
        if (!poll?.allow_multiple_votes && userVotes[pollId]?.length > 0) {
          // Remove existing vote first
          await supabase.from("community_poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.id)
        }

        // Add vote
        const { error } = await supabase.from("community_poll_votes").insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        })

        if (error) throw error

        toast.success("Stimme abgegeben")
      }

      // Reload polls
      if (selectedCommunity) {
        loadCommunityPolls(selectedCommunity.id)
      }
    } catch (error) {
      console.error("[v0] Error voting:", error)
      toast.error("Fehler beim Abstimmen")
    }
  }

  // Function to handle group deletion
  const handleDeleteGroup = async (groupId: string) => {
    if (!user || !selectedGroup || selectedGroup.id !== groupId) return

    toast(
      <div className="flex flex-col">
        <p className="text-sm font-medium mb-1">Bist du sicher?</p>
        <p className="text-xs text-gray-500 mb-3">
          Das Löschen der Gruppe "{selectedGroup.name}" kann nicht rückå³ngig gemacht werden.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            try {
              const { error } = await supabase.from("communities").delete().eq("id", groupId)
              if (error) throw error

              toast.success("Gruppe erfolgreich gelöscht!")
              setIsDetailsDialogOpen(false)
              loadLudoGroups() // Reload the list of groups
            } catch (err) {
              console.error("Error deleting group:", err)
              toast.error("Fehler beim Löschen der Gruppe")
            }
          }}
          className="h-8 text-xs w-full"
        >
          Gruppe löschen
        </Button>
      </div>,
      {
        action: {
          label: "Abbrechen",
          onClick: () => {},
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      <Navigation currentPage="ludo-gruppen" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-handwritten text-3xl sm:text-4xl md:text-5xl text-gray-800 mb-4">Spielgruppen</h1>
          {user && (
<Button
                  onClick={() => {
                    setOpenAccordionSections(["grundinformationen"])
                    setIsCreateDialogOpen(true)
                  }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Spielgruppe erstellen
            </Button>
          )}
          {!user && console.log("[v0] Create button not shown - user not logged in")}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-100 shadow-sm mb-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MdOutlineManageSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Spielgruppen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-white/80 border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-xs"
                />
              </div>
            </div>

            <SimpleLocationSearch onLocationSearch={handleLocationSearch} onNearbySearch={handleNearbySearch} />
            {/* </CHANGE> */}

            {showLocationResults && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-800 font-medium">
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
                  className="text-gray-600 border-gray-200 hover:bg-gray-100 h-7 text-xs"
                >
                  Alle Spielgruppen zeigen
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Sortieren nach</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
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
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Kapazität</Label>
                <Select value={availableSpotsFilter} onValueChange={setAvailableSpotsFilter}>
                  <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="available" className="text-xs">
                      Freie Plätze
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Beitrittsmodus</Label>
                <Select value={approvalModeFilter} onValueChange={setApprovalModeFilter}>
                  <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="automatic" className="text-xs">
                      Offener Beitritt
                    </SelectItem>
                    <SelectItem value="manual" className="text-xs">
                      Beitritt erst nach Genehmigung
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block font-medium">Typ</Label>
                <Select value={groupTypeFilter} onValueChange={setGroupTypeFilter}>
                  <SelectTrigger className="h-9 bg-white/80 border-gray-200 focus:border-teal-400 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Alle
                    </SelectItem>
                    <SelectItem value="casual" className="text-xs">
                      Casual
                    </SelectItem>
                    <SelectItem value="competitive" className="text-xs">
                      Competitive
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
                    setGroupTypeFilter("all")
                    setAvailableSpotsFilter("all")
                    setApprovalModeFilter("all")
                    setShowLocationResults(false)
                    setLocationSearchResults([])
                  }}
                  className="h-9 w-full border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-xs"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
            {/* </CHANGE> */}
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <FaUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-2 text-base">Keine Spielgruppen gefunden</h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    {searchTerm
                      ? "Versuche einen anderen Suchbegriff"
                      : "Sei der Erste und erstelle eine neue Spielgruppe!"}
                  </p>
                  {!searchTerm && (
<Button
                          onClick={() => {
                            setOpenAccordionSections(["grundinformationen"])
                            setIsCreateDialogOpen(true)
                          }}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
                        >
                          <FaPlus className="h-4 w-4 mr-2" />
                          Erste Spielgruppe erstellen
                        </Button>
                  )}
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const buttonProps = getGroupJoinButtonProps(group)
                  const IconComponent = buttonProps.icon

                  return (
                    <Card
                      key={group.id}
                      onClick={() => showGroupDetails(group)}
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 cursor-pointer overflow-hidden relative flex flex-col h-full"
                    >
                      {/* Updated image container with aspect ratio and gradient */}
                      <div className="relative aspect-[16/9] overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        {group.approval_mode === "manual" && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 backdrop-blur-sm text-xs font-medium text-amber-800 rounded-full border border-amber-200 shadow-sm">
                              <FaClock className="h-3 w-3" />
                              <span>Genehmigung erforderlich</span>
                            </div>
                          </div>
                        )}

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
                          <GiRollingDices className="w-12 h-12 text-teal-400" />
                        )}
                      </div>

                      <CardHeader className="pb-2 px-4 mt-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-handwritten font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors text-xs truncate">
                              {group.name}
                            </h3>
                          </div>
                          {group.distance !== undefined && <DistanceBadge distance={group.distance} className="ml-2" />}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2 flex-1 flex flex-col px-4 pb-4">
                        {group.description && (
                          // Added font-normal to paragraph
                          <p
                            className="text-xs text-gray-600 line-clamp-2 font-normal mb-2"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(group.description) }}
                          />
                        )}

                        <div className="space-y-1.5 border-t border-gray-100 pt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <FaUsers className="h-3.5 w-3.5 text-teal-600" />
                            <span>{formatMemberCount(group)}</span>
                          </div>
                          {group.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FaMapMarkerAlt className="h-3.5 w-3.5 text-teal-600" />
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                              >
                                {group.location}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FaUserCog className="h-3.5 w-3.5 text-teal-600" />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={group.users?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-[10px]">
                                {group.users?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div onClick={(e) => e.stopPropagation()}>
                              <UserLink
                                userId={group.users?.id || ""}
                                className="text-gray-600 hover:text-teal-600 transition-colors"
                              >
                                <p className="text-xs hover:text-teal-600 cursor-pointer transition-colors">
                                  {group.users?.username}
                                </p>
                              </UserLink>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!user) {
                                toast.info("Bitte melde dich an, um einer Spielgruppe beizutreten")
                                window.location.href = "/login"
                                return
                              }
                              const buttonProps = getGroupJoinButtonProps(group)
                              if (buttonProps.action === "leave") {
                                leaveGroup(group)
                              } else {
                                handleJoinGroup(group)
                              }
                            }}
                            disabled={buttonProps.disabled}
                            variant={buttonProps.variant}
                            className={`flex-1 font-handwritten ${
                              buttonProps.action === "leave"
                                ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-red-500"
                                : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:from-gray-400 disabled:from-gray-400"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent className="h-4 w-4 mr-2" />
                            ) : (
                              <FaUserPlus className="h-4 w-4 mr-2" />
                            )}
                            {buttonProps.text}
                          </Button>

                          {(!user || (user && group.creator_id !== user.id)) && (
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
                              <FaComment className="h-4 w-4" />
                            </Button>
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

        {/* Dialog for creating a new group */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl font-semibold text-gray-900">Neue Spielgruppe erstellen</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Erstelle eine Gruppe und verbinde dich mit anderen Spiel-Enthusiasten
              </DialogDescription>
            </DialogHeader>

            <Accordion
              type="multiple"
              value={openAccordionSections}
              onValueChange={setOpenAccordionSections}
              className="space-y-4"
            >
              {/* Section 1: Grundinformationen */}
              <AccordionItem value="grundinformationen" className="border border-gray-200 rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold flex-shrink-0 w-8 h-8">
                      1
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Grundinformationen</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="group-name" className="text-sm font-medium text-gray-700">
                          Name der Spielgruppe <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-gray-500 text-xs">{newGroup.name.length}/60</span>
                      </div>
                      <Input
                        id="group-name"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        placeholder="z.B. CATAN-Freunde Zürich"
                        className="h-11 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        maxLength={60}
                      />
                    </div>

                    <div>
                      <Label htmlFor="group-description" className="text-sm font-medium text-gray-700 mb-2 block">
                        Beschreibung
                      </Label>
                      <RichTextEditor
                        value={newGroup.description}
                        onChange={(value) => setNewGroup({ ...newGroup, description: value })}
                        placeholder="Beschreibe deine Spielgruppe..."
                        maxLength={5000}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-members" className="text-sm font-medium text-gray-700 mb-2 block">
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
                        className="h-11 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>

                    {/* Image upload section */}
                    <div>
                      <Label htmlFor="group-image" className="text-sm font-medium text-gray-700 mb-3 block">
                        Bilder
                      </Label>

                      {imagePreviews.length === 0 ? (
                        <div
                          onClick={() => document.getElementById("group-image")?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 bg-gray-50"
                        >
                          <FaImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-xs font-medium text-gray-700 mb-1">Klicken zum Hochladen</p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG oder WebP (max. 5MB pro Bild, bis zu 5 Bilder)
                          </p>
                          <Input
                            id="group-image"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                                <img
                                  src={preview || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg z-10"
                                >
                                  <FaTimes className="h-3 w-3" />
                                </button>
                                {index === 0 && (
                                  <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10">
                                    Hauptbild
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {imagePreviews.length < 5 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("group-image")?.click()}
                              className="w-full text-xs"
                            >
                              <FaPlus className="h-3 w-3 mr-2" />
                              Weitere Bilder hinzufügen ({imagePreviews.length}/5)
                            </Button>
                          )}
                          <Input
                            id="group-image"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="group-location" className="text-sm font-medium text-gray-700 mb-2 block">
                        Standort
                      </Label>
                      <AddressAutocomplete
                        label=""
                        placeholder="Location, Adresse, PLZ oder Ort eingeben..."
                        value={newGroup.location}
                        onChange={(value) => setNewGroup({ ...newGroup, location: value })}
                        className="h-11 text-xs border-gray-300 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Beitrittsmodus */}
              <AccordionItem
                value="beitrittsmodus"
                className="border border-gray-200 rounded-lg overflow-hidden [&]:last:border-b"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50 [&[data-state=closed]]:rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold flex-shrink-0 w-8 h-8">
                      2
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Beitrittsmodus</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <div className="pb-6 pt-2 space-y-4">
                    <div>
                      <Label htmlFor="approval-mode" className="text-sm font-medium text-gray-700 mb-2 block">
                        Wie sollen neue Mitglieder beitreten können?
                      </Label>
                      <Select
                        value={newGroup.approval_mode}
                        onValueChange={(value: "automatic" | "manual") =>
                          setNewGroup({ ...newGroup, approval_mode: value })
                        }
                      >
                        <SelectTrigger className="h-11 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Offener Beitritt</SelectItem>
                          <SelectItem value="manual">Beitritt erst nach Genehmigung</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                      {newGroup.approval_mode === "automatic" ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <FaCheckCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 mb-1">Offener Beitritt</p>
                              <p className="text-xs text-gray-600">Jeder ist willkommen, der Spielgruppe beizutreten</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <FaClock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 mb-1">Beitritt erst nach Genehmigung</p>
                              <p className="text-xs text-gray-600">
                                Du erhältst eine Benachrichtigung für jede Beitrittsanfrage und kannst entscheiden, wer
                                Mitglied wird.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-6">
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
                  // Clear all uploaded images
                  setImageFiles([])
                  setImagePreviews([])
                }}
                className="flex-1 h-11 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium bg-transparent"
              >
                Abbrechen
              </Button>
              <Button
                onClick={createLudoGroup}
                disabled={!newGroup.name.trim() || isUploading}
                className="flex-1 h-11 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm disabled:bg-gray-400"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Wird erstellt...
                  </div>
                ) : (
                  <>
                    <FaPlus className="h-5 w-5 mr-2" />
                    Spielgruppe erstellen
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              // First clear the dialog state
              setIsDetailsDialogOpen(false)
              setSelectedGroup(null)
              // Don't reset hasProcessedURLParams here - let useEffect handle it when URL changes
              // Update URL to remove parameters
              router.push("/ludo-gruppen", { scroll: false })
            } else {
              setIsDetailsDialogOpen(true)
            }
            // </CHANGE>
          }}
        >
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex justify-end mb-3">
                {selectedGroup && selectedGroup.creator_id === user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 px-3 bg-transparent">
                        <Settings className="h-4 w-4 mr-2" />
                        Verwalten
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/ludo-gruppen?edit=${selectedGroup.id}`) // Updated to include edit param
                          setIsDetailsDialogOpen(false)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Gruppe bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCommunity(selectedGroup)
                          loadMembers(selectedGroup.id)
                          setShowMembersDialog(true)
                          // Update URL to include 'members' parameter
                          router.push(`/ludo-gruppen?view=${selectedGroup.id}&members=true`, { scroll: false })
                        }}
                      >
                        <FaUsers className="h-4 w-4 mr-2" />
                        Teilnehmer verwalten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCommunity(selectedGroup)
                          loadFriends()
                          setShowInviteDialog(true)
                          // Update URL to include 'invite' parameter
                          router.push(`/ludo-gruppen?view=${selectedGroup.id}&invite=true`, { scroll: false })
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Freunde einladen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCommunity(selectedGroup)
                          loadCommunityPolls(selectedGroup.id)
                          setShowPollDialog(true)
                          // Update URL to include 'polls' parameter
                          router.push(`/ludo-gruppen?view=${selectedGroup.id}&polls=true`, { scroll: false })
                        }}
                      >
                        <FaPoll className="h-4 w-4 mr-2" />
                        Abstimmungen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Gruppe löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <DialogTitle className="font-handwritten text-lg text-gray-800">{selectedGroup?.name}</DialogTitle>
              <DialogDescription>Spielgruppe Details und Informationen</DialogDescription>
            </DialogHeader>
            {/* </CHANGE> */}

            {selectedGroup && (
              <div className="space-y-6">
                {/* Added image carousel for multiple group images in detail view */}
                <div className="w-full h-48 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
                  {selectedGroup.images && selectedGroup.images.length > 1 ? (
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {selectedGroup.images.map((image: string, index: number) => (
                          <CarouselItem key={index}>
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`${selectedGroup.name} - Bild ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  ) : selectedGroup.image ? (
                    <img
                      src={selectedGroup.image || "/placeholder.svg"}
                      alt={selectedGroup.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <GiRollingDices className="w-16 h-16 text-teal-400" />
                  )}
                </div>
                {/* ... existing code ... */}
                {/* </CHANGE> */}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-medium">Erstellt von</span>
                    <Avatar className="h-5 w-5 bg-gray-50">
                      <AvatarImage src={selectedGroup.users?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-50 text-xs">
                        {selectedGroup.users?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <UserLink
                      userId={selectedGroup.users?.id || ""}
                      className="text-gray-800 hover:text-teal-600 transition-colors"
                    >
                      <span className="font-medium hover:text-teal-600 cursor-pointer transition-colors text-gray-600 text-xs">
                        {selectedGroup.users?.username}
                      </span>
                    </UserLink>
                  </div>
                </div>

                {selectedGroup.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Beschreibung</h4>
                    <p
                      className="text-gray-600 text-xs"
                      dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(selectedGroup.description) }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <FaUsers className="h-4 w-4 text-teal-600" />
                    <span className="text-gray-600 text-xs">{formatMemberCount(selectedGroup)}</span>
                  </div>
                  {selectedGroup.location && (
                    <div className="col-span-2 flex items-center gap-2 text-xs">
                      <FaMapMarkerAlt className="h-4 w-4 text-teal-600" />
                      <span className="text-gray-600">{selectedGroup.location}</span>
                    </div>
                  )}
                </div>

                <div>
                  {selectedGroup.location ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <LocationMap location={selectedGroup.location} className="h-64 w-full rounded-lg" />
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        Kein Standort angegeben. Diese Spielgruppe hat keinen Standort hinterlegt.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border-t pt-4 mt-6">
                  <div className="flex gap-3">
                    {(() => {
                      const buttonProps = getGroupJoinButtonProps(selectedGroup)
                      const IconComponent = buttonProps.icon
                      return (
                        <Button
                          variant={buttonProps.variant}
                          disabled={buttonProps.disabled}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (buttonProps.action === "leave") {
                              leaveGroup(selectedGroup)
                            } else {
                              handleJoinGroup(selectedGroup)
                            }
                          }}
                          className="flex-1 px-3 h-9 bg-transparent font-handwritten text-sm shadow-sm"
                        >
                          {IconComponent ? (
                            <IconComponent className="h-4 w-4 mr-2" />
                          ) : (
                            <FaUserPlus className="h-4 w-4 mr-2" />
                          )}
                          {buttonProps.text}
                        </Button>
                      )
                    })()}

                    <ShareButton
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/ludo-gruppen/${selectedGroup.id}`}
                      title={selectedGroup.name}
                      description={selectedGroup.description || "Schau dir diese Spielgruppe an!"}
                      className="px-3 h-9 bg-transparent font-handwritten text-sm"
                    />

                    {(!user || (user && selectedGroup.creator_id !== user.id)) && (
                      <Button
                        variant="outline"
                        className="px-3 h-9 bg-transparent font-handwritten text-sm"
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
                {/* </CHANGE> */}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invite Friends Dialog */}
        <Dialog
          open={showInviteDialog}
          onOpenChange={(open) => {
            setShowInviteDialog(open)
            if (open) {
              console.log("[v0] Opening invite dialog, loading friends...")
              loadFriends()
              // Update URL to include 'invite' parameter if it was not already set
              if (selectedCommunity && !searchParams.get("invite")) {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}&invite=true`, { scroll: false })
              }
            } else {
              // Reset URL when dialog closes
              if (selectedCommunity && searchParams.get("invite") === "true") {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg"
                >
                  <FaUserPlus className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Freunde einladen</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    zu "{selectedCommunity?.name}"
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3">
              <div className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <p className="text-xs font-semibold text-teal-700">
                  {friends.length} {friends.length === 1 ? "Freund" : "Freunde"} verfügbar
                </p>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                {friends.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FaUserPlus className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Keine Freunde zum Einladen</p>
                    <p className="text-xs text-gray-500">Füge Freunde hinzu</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm ${
                        selectedFriends.includes(friend.id)
                          ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => {
                        if (selectedFriends.includes(friend.id)) {
                          setSelectedFriends(selectedFriends.filter((id) => id !== friend.id))
                        } else {
                          setSelectedFriends([...selectedFriends, friend.id])
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        id={`friend-${friend.id}`}
                        className="h-4 w-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs">
                          {friend.name?.[0] || friend.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{friend.username}</p>
                        {/* </CHANGE> */}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter className="pt-3 border-t gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInviteDialog(false)
                  setSelectedFriends([])
                  // Reset URL if invite parameter is present
                  if (selectedCommunity && searchParams.get("invite") === "true") {
                    router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
                  }
                }}
                className="flex-1 h-8 text-xs"
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleInviteFriends}
                disabled={selectedFriends.length === 0}
                className="flex-1 h-8 text-xs bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
              >
                <FaUserPlus className="mr-1.5 h-3 w-3" />
                {selectedFriends.length > 0 ? `${selectedFriends.length} einladen` : "Einladen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Broadcast Dialog */}
        <Dialog
          open={showBroadcastDialog}
          onOpenChange={(open) => {
            setShowBroadcastDialog(open)
            if (open) {
              // Update URL if broadcast parameter is not present
              if (selectedCommunity && !searchParams.get("broadcast")) {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}&broadcast=true`, { scroll: false })
              }
            } else {
              // Reset URL if broadcast parameter is present
              if (selectedCommunity && searchParams.get("broadcast") === "true") {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <FaBullhorn className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Nachricht an alle Mitglieder
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3">
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700">
                  <span className="font-medium">Alle Mitglieder werden benachrichtigt</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="broadcast-message" className="text-xs font-bold text-gray-700">
                  Nachricht
                </Label>
                <Textarea
                  id="broadcast-message"
                  placeholder="Schreibe deine Nachricht..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={5}
                  className="text-xs min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">{broadcastMessage.length}/500</p>
              </div>
            </div>
            <DialogFooter className="pt-3 border-t gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastDialog(false)
                  setBroadcastMessage("")
                  // Reset URL if broadcast parameter is present
                  if (selectedCommunity && searchParams.get("broadcast") === "true") {
                    router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
                  }
                }}
                className="flex-1 h-8 text-xs"
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleBroadcast}
                disabled={!broadcastMessage.trim()}
                className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
              >
                <FaBullhorn className="mr-1.5 h-3 w-3" />
                Senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Poll Dialog */}
        <Dialog
          open={showPollDialog}
          onOpenChange={(open) => {
            setShowPollDialog(open)
            if (open && selectedCommunity) {
              console.log("[v0] Opening poll dialog, loading polls...")
              loadCommunityPolls(selectedCommunity.id)
              // Update URL if createPoll parameter is not present
              if (!searchParams.get("createPoll")) {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}&polls=true`, { scroll: false })
              }
            } else if (!open) {
              // Reset URL if polls parameter is present
              if (searchParams.get("polls") === "true") {
                router.push(`/ludo-gruppen?view=${selectedCommunity?.id}`, { scroll: false })
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg"
                >
                  <FaPoll className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Abstimmungen</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-0">
                    {selectedCommunity?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs
              value={activePollTab}
              onValueChange={(v) => setActivePollTab(v as "active" | "completed" | "create")}
              className="flex-1 flex flex-col"
            >
              <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3 bg-gray-100/80 p-0.5 rounded-lg">
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-xs font-medium py-1.5"
                >
                  Laufend
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-xs font-medium py-1.5"
                >
                  Abgeschlossen
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-xs font-medium py-1.5"
                >
                  Neue Abstimmung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto mt-3">
                {communityPolls.filter(
                  (poll) => poll.is_active && (!poll.expires_at || new Date(poll.expires_at) > new Date()),
                ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FaPoll className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Keine laufenden Abstimmungen</p>
                    <p className="text-xs text-gray-500 mt-0.5">Erstelle die erste Abstimmung</p>
                  </div>
                ) : (
                  communityPolls
                    .filter((poll) => poll.is_active && (!poll.expires_at || new Date(poll.expires_at) > new Date()))
                    .map((poll) => {
                      const totalVotes = poll.votes?.length || 0
                      const userHasVoted = userVotes[poll.id]?.length > 0
                      const isCreator = poll.creator_id === user?.id

                      return (
                        <Card key={poll.id} className="border-2 hover:border-teal-200 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900 leading-tight">{poll.question}</h4>
                                <div className="flex flex-col gap-1 mt-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>
                                      {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"}
                                    </span>
                                  </div>
                                  {poll.expires_at && (
                                    <div className="text-xs text-orange-600 font-medium">
                                      Läuft ab am:{" "}
                                      {new Date(poll.expires_at).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {userHasVoted && (
                                  <Badge variant="default" className="bg-teal-500 text-white text-xs px-1.5 h-5">
                                    <FaCheckCircle className="h-3 w-3 mr-1" />
                                    Abgestimmt
                                  </Badge>
                                )}
                                {isCreator && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        const { error } = await supabase
                                          .from("community_polls")
                                          .update({ is_active: false })
                                          .eq("id", poll.id)

                                        if (error) throw error

                                        toast.success("Abstimmung wurde abgeschlossen")
                                        if (selectedCommunity) loadCommunityPolls(selectedCommunity.id)
                                      } catch (error) {
                                        console.error("[v0] Error closing poll:", error)
                                        toast.error("Fehler beim Abschließen der Abstimmung")
                                      }
                                    }}
                                    className="text-red-600 hover:bg-red-50 border-red-300 px-2 h-7 text-xs"
                                  >
                                    <FaTimesCircle className="h-3 w-3 mr-1" />
                                    Schließen
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-1.5 pt-0">
                            {poll.options?.map((option: any) => {
                              const optionVotes = poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
                              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
                              const userVoted = userVotes[poll.id]?.includes(option.id)

                              return (
                                <button
                                  key={option.id}
                                  onClick={() => handleVote(poll.id, option.id)}
                                  className={`w-full group relative rounded-lg border-2 transition-all duration-150 overflow-hidden ${
                                    userVoted
                                      ? "border-teal-500 bg-teal-50"
                                      : "border-gray-200 bg-white hover:border-teal-300"
                                  }`}
                                >
                                  <div
                                    className={`absolute inset-0 transition-all duration-300 ${
                                      userVoted ? "bg-teal-100" : "bg-gray-50"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />

                                  <div className="relative flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      {userVoted && (
                                        <FaCheckCircle className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                                      )}
                                      <span
                                        className={`text-xs font-medium text-left ${
                                          userVoted ? "text-teal-900" : "text-gray-700"
                                        }`}
                                      >
                                        {option.option_text}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs font-semibold ${
                                          userVoted ? "text-teal-700" : "text-gray-600"
                                        }`}
                                      >
                                        {percentage.toFixed(0)}%
                                      </span>
                                      <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                                        {optionVotes} {optionVotes === 1 ? "Stimme" : "Stimmen"}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                            {poll.allow_multiple_votes && (
                              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                <FaInfoCircle className="h-3 w-3" />
                                Mehrfachauswahl möglich
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                )}
              </TabsContent>

              <TabsContent value="completed" className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto mt-3">
                {communityPolls.filter(
                  (poll) => !poll.is_active || (poll.expires_at && new Date(poll.expires_at) <= new Date()),
                ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FaPoll className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Keine abgeschlossenen Abstimmungen</p>
                    <p className="text-xs text-gray-500 mt-0.5">Abgeschlossene Abstimmungen erscheinen hier</p>
                  </div>
                ) : (
                  communityPolls
                    .filter((poll) => !poll.is_active || (poll.expires_at && new Date(poll.expires_at) <= new Date()))
                    .map((poll) => {
                      const totalVotes = poll.votes?.length || 0
                      const isCreator = poll.creator_id === user?.id

                      return (
                        <Card key={poll.id} className="border-2 border-gray-200">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900 leading-tight">{poll.question}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                                  <span>
                                    {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"}
                                  </span>
                                  <Badge variant="secondary" className="bg-gray-200 text-gray-700 text-xs px-1.5 h-5">
                                    Abgeschlossen
                                  </Badge>
                                </div>
                              </div>
                              {isCreator && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from("community_polls")
                                        .delete()
                                        .eq("id", poll.id)

                                      if (error) throw error

                                      toast.success("Abstimmung wurde gelöscht")
                                      if (selectedCommunity) loadCommunityPolls(selectedCommunity.id)
                                    } catch (error) {
                                      console.error("[v0] Error deleting poll:", error)
                                      toast.error("Fehler beim Löschen der Abstimmung")
                                    }
                                  }}
                                  className="text-red-600 hover:bg-red-50 border-red-300 px-2 h-7 text-xs"
                                >
                                  <FaTrash className="h-3 w-3" />
                                </Button>
                              )}
                              {/* </CHANGE> */}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-1.5 pt-0">
                            {poll.options?.map((option: any) => {
                              const optionVotes = poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
                              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
                              const maxVotes = Math.max(
                                ...poll.options.map(
                                  (o: any) => poll.votes?.filter((v: any) => v.option_id === o.id).length || 0,
                                ),
                              )
                              const isWinner = optionVotes === maxVotes && optionVotes > 0

                              return (
                                <div
                                  key={option.id}
                                  className="relative rounded-lg border-2 border-gray-200 bg-white overflow-hidden"
                                >
                                  <div
                                    className="absolute inset-0 transition-all duration-300 bg-gray-100"
                                    style={{ width: `${percentage}%` }}
                                  />

                                  <div className="relative flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      {isWinner && (
                                        <FaCheckCircle className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                                      )}
                                      <span className="text-xs font-medium text-gray-700">{option.option_text}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-gray-600">
                                        {percentage.toFixed(0)}%
                                      </span>
                                      <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                                        {optionVotes} {optionVotes === 1 ? "Stimme" : "Stimmen"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>
                      )
                    })
                )}
              </TabsContent>

              <TabsContent value="create" className="px-4 pb-4 space-y-4 flex-1 overflow-y-auto mt-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="poll-question" className="text-sm font-semibold text-gray-900">
                        Frage <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-gray-500">{pollQuestion.length}/120</span>
                    </div>
                    <Input
                      id="poll-question"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="z.B. Welches Spiel wollen wir diese Woche spielen?"
                      maxLength={120}
                      className="h-10 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                      Antwortoptionen <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-1.5">
                      {pollOptions.map((option, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <div className="flex items-center justify-center w-6 h-10 text-xs font-medium text-gray-500">
                            {idx + 1}.
                          </div>
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions]
                              newOptions[idx] = e.target.value
                              setPollOptions(newOptions)
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 h-10 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newOptions = pollOptions.filter((_, i) => i !== idx)
                                setPollOptions(newOptions)
                              }}
                              className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <FaTimes className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="mt-2 w-full h-10 border-dashed border-2 border-gray-300 text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Option hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="allow-multiple-votes"
                      checked={allowMultiple} // Use the new state variable
                      onCheckedChange={(checked) => setAllowMultiple(checked as boolean)} // Update the new state variable
                      className="h-4 w-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <Label htmlFor="allow-multiple-votes" className="text-xs font-bold text-gray-900 cursor-pointer">
                      Mehrere Antworten erlauben
                    </Label>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="poll-expires-at" className="text-xs font-bold text-gray-900">
                      Läuft ab am:
                    </Label>
                    <Input
                      type="datetime-local"
                      id="poll-expires-at"
                      value={newPoll.expires_at}
                      onChange={(e) => setNewPoll({ ...newPoll, expires_at: e.target.value })}
                      className="h-10 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500 w-full"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActivePollTab("active")
                      setPollQuestion("")
                      setPollOptions(["", ""])
                      setAllowMultiple(false) // Reset the new state variable
                      setNewPoll({ ...newPoll, allow_multiple_votes: false, expires_at: "" })
                      // Reset URL if createPoll parameter is present
                      if (selectedCommunity && searchParams.get("createPoll") === "true") {
                        router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
                      }
                    }}
                    className="flex-1 h-9 text-xs"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreatePoll}
                    disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                    className="flex-1 h-9 text-xs"
                  >
                    Abstimmung erstellen
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Members Management Dialog */}
        <Dialog
          open={showMembersDialog}
          onOpenChange={(open) => {
            setShowMembersDialog(open)
            if (open) {
              // Update URL if members parameter is not present
              if (selectedCommunity && !searchParams.get("members")) {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}&members=true`, { scroll: false })
              }
            } else {
              // Reset URL if members parameter is present
              if (selectedCommunity && searchParams.get("members") === "true") {
                router.push(`/ludo-gruppen?view=${selectedCommunity.id}`, { scroll: false })
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-xl max-h-[75vh] overflow-y-auto">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg"
                >
                  <FaUsers className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Teilnehmer verwalten</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-0">
                    {selectedCommunity?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-4 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowBroadcastDialog(true) // Open broadcast dialog
                  setShowMembersDialog(false) // Close members dialog
                }}
                className="w-full h-9 text-xs border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 font-medium"
              >
                <FaBullhorn className="h-3.5 w-3.5 mr-1.5" />
                Nachricht an alle Mitglieder senden
              </Button>
            </div>

            <div className="space-y-2 px-4 pb-4 max-h-[55vh] overflow-y-auto">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <FaUsers className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Keine Mitglieder in dieser Gruppe</p>
                  <p className="text-xs text-gray-500 mt-0.5">Warte auf neue Beitrittsanfragen</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-lg shadow-sm bg-white hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs">
                          {member.user?.name?.[0] || member.user?.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {/* Updated member display to show Admin for creator and joined date with bullet separator */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => {
                            setProfileModalUserId(member.user_id)
                            setIsProfileModalOpen(true)
                          }}
                          className="font-medium text-gray-800 text-xs hover:text-teal-600 hover:underline transition-colors text-left"
                        >
                          {member.user?.username}
                        </button>
                        <span className="text-[10px] text-gray-500">
                          {member.user_id === selectedCommunity?.creator_id ? (
                            "Admin"
                          ) : (
                            <>
                              Mitglied • Beigetreten am{" "}
                              {new Date(member.joined_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </>
                          )}
                        </span>
                      </div>
                      {/* </CHANGE> */}
                    </div>
                    {member.user_id !== user?.id && member.user_id !== selectedCommunity?.creator_id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="h-8 px-3 group relative hover:bg-red-600 active:scale-95 transition-all duration-150"
                      >
                        <FaUserMinus className="h-4 w-4 text-white" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <UserProfileModal
          userId={profileModalUserId}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false)
            setProfileModalUserId(null)
          }}
        />
        {/* </CHANGE> */}
      </div>
    </div>
  )
}
