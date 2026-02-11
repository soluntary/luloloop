"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useAvatar } from "@/contexts/avatar-context"
import { getUserAvatar } from "@/lib/avatar"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { MapPin, Edit2, LogOut, Shield, Lock, Globe, X, Upload, RefreshCw, AlertTriangle, Users, Store, Check, Trash2, Pause, Play, Edit, BarChart3, Bell, Settings, Calendar, MinusCircle as InfoCircle, Trash, CalendarDays, CalendarDays as FaCalendarAlt, LucideUsersRound as LiaUsersSolid, CalendarHeart as FaMapMarkerAlt, ChevronLeft as FaChevronLeft, ChevronRight as FaChevronRight, CheckCircle, Star, Tag, ImageIcon, Search } from "lucide-react"
import { FaUserPlus as FaUserPlusIcon } from "react-icons/fa6" // Renamed FaUserPlus to FaUserPlusIcon
import { FaInstagram, FaXTwitter } from "react-icons/fa6"
import { IoSearchCircle } from "react-icons/io5"
import { PiUserCirclePlus } from "react-icons/pi"
import { PiUserCircleGear } from "react-icons/pi"
import { PiUserCircleCheck } from "react-icons/pi"
import { RxActivityLog } from "react-icons/rx"
import { CgProfile } from "react-icons/cg"
import { FaBell } from "react-icons/fa"
import { IoColorPaletteOutline } from "react-icons/io5"
import { getAddressSuggestions } from "@/lib/actions/geocoding"
import { syncUsernameAcrossTables } from "@/app/actions/profile-sync"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Mail } from "lucide-react"
import { MessageSquare } from "lucide-react"
import { Book } from "lucide-react"
import { FaExchangeAlt } from "react-icons/fa"
import { FaStar } from "react-icons/fa"
import { FaEnvelope } from "react-icons/fa"
import { FaComments } from "react-icons/fa"
import { FaBook } from "react-icons/fa"
import { FaChartBar } from "react-icons/fa"
import { getUserNotifications, markAllNotificationsAsRead, deleteNotification } from "@/app/actions/notifications"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FaUsers } from "react-icons/fa" // Import FaUsers
import { motion } from "framer-motion" // Import motion
import { Checkbox } from "@/components/ui/checkbox"
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa" // Added imports for new icons
import Link from "next/link" // Import Link
import { FaBullhorn, FaUserMinus } from "react-icons/fa6" // Imported new icons
import { CreateMarketplaceOfferForm } from "@/components/create-marketplace-offer-form"
import { CreateSearchAdForm } from "@/components/create-search-ad-form"

import { RichTextEditor } from "@/components/rich-text-editor"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { FaPlus, FaTimes, FaImage, FaUserFriends, FaPoll } from "react-icons/fa"
import { FileDown } from "lucide-react"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { AVATAR_STYLES, AVATAR_COLORS, DEFAULT_NOTIFICATION_PREFERENCES } from "./constants"
import type { ActivityData, ActivityItem } from "./constants"
import { generateParticipantsPDF, generateGroupMembersPDF } from "./pdf-utils"
import { NotificationsTab } from "@/components/profile/notifications-tab"
import { PrivacyTab } from "@/components/profile/privacy-tab"
import { SecurityTab } from "@/components/profile/security-tab"

// Constants, types, and PDF utils are now imported from separate files

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "trade_match":
    case "trade_match_accepted":
      return <FaExchangeAlt className="text-blue-500" />
    case "ai_recommendation":
      return <FaStar className="text-yellow-500" />
    case "new_message":
      return <FaEnvelope className="text-purple-500" />
    case "friend_request":
    case "friend_accepted":
      return <FaUserPlusIcon className="text-green-500" /> // Used FaUserPlusIcon
    case "forum_reply":
    case "comment_reply":
      return <FaComments className="text-teal-500" />
    case "game_shelf_request":
      return <FaBook className="text-orange-500" />
    case "poll_created":
      return <FaChartBar className="text-indigo-500" />
    default:
      return <Bell className="text-gray-500" />
  }
}

const formatNotificationTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Gerade eben"
  if (diffMins < 60) return `vor ${diffMins}m`
  if (diffHours < 24) return `vor ${diffHours}h`
  if (diffDays < 7) return `vor ${diffDays}d`
  return date.toLocaleDateString("de-DE")
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut, updateProfile, patchUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { updateAvatar } = useAvatar()
  const { toast } = useToast()
  const { confirm } = useConfirmDialog()

  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState("adventurer")
  const [avatarSeed, setAvatarSeed] = useState("")
  const [avatarBgColor, setAvatarBgColor] = useState("#4ECDC4")
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null)

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [addressSearching, setAddressSearching] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isEventManagementOpen, setIsEventManagementOpen] = useState(false)
  const [managementEvent, setManagementEvent] = useState<any>(null)
  const [eventParticipants, setEventParticipants] = useState<any[]>([])
  const [loadingEventParticipants, setLoadingEventParticipants] = useState(false)
  const [eventManagementTab, setEventManagementTab] = useState<"edit" | "dates" | "participants" | "invite" | "polls">("edit")
  const [eventInstances, setEventInstances] = useState<any[]>([])
  const [editingInstance, setEditingInstance] = useState<any>(null)
  const [isEditingInstance, setIsEditingInstance] = useState(false)

  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false)
  const [managementGroup, setManagementGroup] = useState<any>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false)
  const [groupManagementTab, setGroupManagementTab] = useState<"edit" | "members" | "invite" | "polls">("edit")

  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [eventImageFiles, setEventImageFiles] = useState<File[]>([])
  const [eventImagePreviews, setEventImagePreviews] = useState<string[]>([])
  const [groupImageFiles, setGroupImageFiles] = useState<File[]>([])
  const [groupImagePreviews, setGroupImagePreviews] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [communityPolls, setCommunityPolls] = useState<any[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({})
  const [activePollTab, setActivePollTab] = useState<"active" | "completed" | "create">("active")
  const [newPoll, setNewPoll] = useState({
    question: "",
    description: "",
    options: ["", ""],
    allow_multiple_votes: false,
    expires_at: "",
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null)

  // Membership Polls Dialog (for groups user is member of but not creator)
  const [isMembershipPollsOpen, setIsMembershipPollsOpen] = useState(false)
  const [membershipPollsCommunity, setMembershipPollsCommunity] = useState<any>(null)
  const [membershipPolls, setMembershipPolls] = useState<any[]>([])
  const [membershipUserVotes, setMembershipUserVotes] = useState<Record<string, string[]>>({})
  const [membershipPollTab, setMembershipPollTab] = useState<"active" | "completed">("active")

  // Offer Management Dialog
  const [isOfferManagementOpen, setIsOfferManagementOpen] = useState(false)
  const [managementOffer, setManagementOffer] = useState<any>(null)

  // Search Ad Management Dialog
  const [isSearchAdManagementOpen, setIsSearchAdManagementOpen] = useState(false)
  const [managementSearchAd, setManagementSearchAd] = useState<any>(null)

  const [myEvents, setMyEvents] = useState<any[]>([])
  const [eventsAsMember, setEventsAsMember] = useState<any[]>([])
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true) // Added for dashboard loading state

  const [currentMonthOffset, setCurrentMonthOffset] = useState(0)

  const [notificationPrefs, setNotificationPrefs] = useState({
    social: {
      friend_requests: 2,
      friend_accepts: 2,
      community_invitations: 2,
      community_events: 2,
      event_reminders: 2,
      forum_replies: 1,
      forum_mentions: 2,
    },
    events: {},
    marketplace: {
      matching_offers: 2,
      offer_responses: 2,
      price_changes: 1,
      expiring_offers: 2,
      new_releases: 1,
    },
    security: {
      login_attempts: 2,
      password_changes: 2,
      new_device_login: 2,
    },
  })
  const [loadingNotifPrefs, setLoadingNotifPrefs] = useState(false)

  const [activeTab, setActiveTab] = useState("profile")

  const [activityData, setActivityData] = useState<ActivityData>({
    createdEvents: [],
    eventParticipations: [],
    friendRequests: [],
    eventJoinRequests: [],
    memberCommunities: [],
    createdCommunities: [],
    marketplaceOffers: [],
    searchAds: [],
    communityMemberships: [],
  })
  const [loadingActivities, setLoadingActivities] = useState(true)

  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES)
  // NotificationPreferenceRow component moved inside ProfilePage to use its state and handlers directly.

  const userId = user?.id

  // useEffect removed
  // </CHANGE>

  // useEffect removed
  // </CHANGE>

  const handleToggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("marketplace_offers").update({ active: !currentStatus }).eq("id", offerId)
      if (error) throw error
      toast({
        title: "Erfolg",
        description: `Angebot ${!currentStatus ? "aktiviert" : "pausiert"}.`,
      })
      loadActivities()
    } catch (error) {
      console.error("Error toggling offer status:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Angebots.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (confirm("Sind Sie sicher, dass Sie dieses Angebot löschen möchten?")) {
      try {
        const { error } = await supabase.from("marketplace_offers").delete().eq("id", offerId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Angebot erfolgreich gelöscht.",
        })
        loadActivities()
      } catch (error) {
        console.error("Error deleting offer:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen des Angebots.",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("search_ads").update({ active: !currentStatus }).eq("id", adId)
      if (error) throw error
      toast({
        title: "Erfolg",
        description: `Suchanzeige ${!currentStatus ? "aktiviert" : "pausiert"}.`,
      })
      loadActivities()
    } catch (error) {
      console.error("Error toggling ad status:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren der Suchanzeige.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAd = async (adId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Suchanzeige löschen möchten?")) {
      try {
        const { error } = await supabase.from("search_ads").delete().eq("id", adId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Suchanzeige erfolgreich gelöscht.",
        })
        loadActivities()
      } catch (error) {
        console.error("Error deleting ad:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen der Suchanzeige.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Spielgruppe löschen möchten?")) {
      try {
        const { error } = await supabase.from("communities").delete().eq("id", communityId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Spielgruppe erfolgreich gelöscht.",
        })
        loadActivities()
      } catch (error) {
        console.error("Error deleting community:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen der Spielgruppe.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
      if (updateError) throw updateError
      toast({
        title: "Erfolg",
        description: "Freundschaftsanfrage angenommen.",
      })
      loadActivities()
    } catch (error) {
      console.error("Error accepting friend request:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Annehmen der Anfrage.",
        variant: "destructive",
      })
    }
  }

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)
      if (error) throw error
      toast({
        title: "Erfolg",
        description: "Freundschaftsanfrage abgelehnt.",
      })
      loadActivities()
    } catch (error) {
      console.error("Error rejecting friend request:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Ablehnen der Anfrage.",
        variant: "destructive",
      })
    }
  }

  // PDF Export Funktionen - delegated to pdf-utils.ts
  const generateEventParticipantsPDF = async (event: any) => {
    try {
      // Get participants for the event
      const { data: participants } = await supabase
        .from("ludo_event_participants")
        .select("*, profiles:users(*)")
        .eq("event_id", event.id)
      generateParticipantsPDF(event, participants || [])
      toast({ title: "PDF heruntergeladen", description: "Die Teilnehmerliste wurde als PDF gespeichert." })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({ title: "Fehler", description: "PDF konnte nicht erstellt werden", variant: "destructive" })
    }
  }

  const handleGenerateGroupMembersPDF = (community: any) => {
    try {
      generateGroupMembersPDF(community)
      toast({ title: "PDF heruntergeladen", description: "Die Mitgliederliste wurde als PDF gespeichert." })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({ title: "Fehler", description: "PDF konnte nicht erstellt werden", variant: "destructive" })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Sind Sie sicher, dass Sie dieses Event löschen möchten?")) {
      try {
        const { error } = await supabase.from("ludo_events").delete().eq("id", eventId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Event erfolgreich gelöscht.",
        })
        loadActivities() // Reload activities after deletion
      } catch (error) {
        console.error("Error deleting event:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen des Events.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLeaveCommunity = async (memberId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Spielgruppe verlassen möchten?")) {
      try {
        const { error } = await supabase.from("community_members").delete().eq("id", memberId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Spielgruppe erfolgreich verlassen.",
        })
        loadActivities() // Reload activities after leaving
      } catch (error) {
        console.error("Error leaving community:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Verlassen der Spielgruppe.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLeaveEvent = async (participationId: string) => {
    if (confirm("Sind Sie sicher, dass Sie dieses Event verlassen möchten?")) {
      try {
        const { error } = await supabase.from("ludo_event_participants").delete().eq("id", participationId)
        if (error) throw error
        toast({
          title: "Erfolg",
          description: "Event erfolgreich verlassen.",
        })
        loadActivities() // Reload activities after leaving
      } catch (error) {
        console.error("Error leaving event:", error)
        toast({
          title: "Fehler",
          description: "Fehler beim Verlassen des Events.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveParticipant = async (participantId: string, type: "event" | "group") => {
    if (!user) return

    try {
      const tableName = type === "event" ? "ludo_event_participants" : "community_members"
      const communityId = type === "event" ? managementEvent?.id : managementGroup?.id

      if (!communityId) return

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(type === "event" ? "user_id" : "user_id", participantId) // Corrected column name for groups
        .eq(type === "event" ? "event_id" : "community_id", communityId)

      if (error) throw error

      toast({ description: `${type === "event" ? "Teilnehmer" : "Mitglied"} wurde entfernt` })

      // Reload participants
      if (type === "event" && managementEvent) {
        loadEventParticipants(managementEvent.id)
      } else if (type === "group" && managementGroup) {
        loadGroupMembers(managementGroup.id)
      }
    } catch (error) {
      console.error(`[v0] Error removing ${type} participant:`, error)
      toast({
        description: `Fehler beim Entfernen des ${type === "event" ? "Teilnehmers" : "Mitglieds"}`,
        variant: "destructive",
      })
    }
  }

  const loadEventParticipants = async (eventId: string) => {
    setLoadingEventParticipants(true)
    try {
      const { data, error } = await supabase
        .from("ludo_event_participants")
        .select(`
          *,
          user:users!ludo_event_participants_user_id_fkey(id, username, avatar, name)
        `)
        .eq("event_id", eventId)

      if (error) throw error
      setEventParticipants(data || [])
    } catch (error) {
      console.error("[v0] Error loading participants:", error)
      toast({ title: "Fehler", description: "Fehler beim Laden der Teilnehmer", variant: "destructive" }) // Using toast from useToast hook
    } finally {
      setLoadingEventParticipants(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    setLoadingGroupMembers(true)
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(
          `
          id,
          user_id,
          community_id,
          role,
          joined_at,
          user:users!community_members_user_id_fkey (
            id,
            username,
            avatar
          )
        `,
        )
        .eq("community_id", groupId)
        .order("joined_at", { ascending: true })

      if (error) throw error

      const membersWithCreatorFlag = data.map((member: any) => {
        const isCreator = member.user_id === managementGroup?.creator_id
        return {
          ...member,
          isCreator,
        }
      })

      setGroupMembers(membersWithCreatorFlag || [])
    } catch (error) {
      console.error("[v0] Error loading group members:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Mitglieder",
        variant: "destructive",
      }) // Using toast from useToast hook
    } finally {
      setLoadingGroupMembers(false)
    }
  }

const loadEventInstances = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("ludo_event_instances")
        .select("*")
        .eq("event_id", eventId)
        .order("instance_date", { ascending: true })

      if (error) throw error
      setEventInstances(data || [])
    } catch (error) {
      console.error("Error loading event instances:", error)
      setEventInstances([])
    }
  }

  const handleUpdateInstance = async () => {
    if (!editingInstance) return

    try {
      const { error } = await supabase
        .from("ludo_event_instances")
        .update({
          instance_date: editingInstance.instance_date,
          start_time: editingInstance.start_time,
          end_time: editingInstance.end_time,
          max_participants: editingInstance.max_participants,
          notes: editingInstance.notes,
        })
        .eq("id", editingInstance.id)

      if (error) throw error

      toast({
        title: "Erfolg",
        description: "Termin wurde aktualisiert.",
      })

      setIsEditingInstance(false)
      setEditingInstance(null)
      if (managementEvent?.id) {
        loadEventInstances(managementEvent.id)
      }
    } catch (error) {
      console.error("Error updating instance:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Termins.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie diesen Termin löschen möchten?")) return

    try {
      const { error } = await supabase.from("ludo_event_instances").delete().eq("id", instanceId)

      if (error) throw error

      toast({
        title: "Erfolg",
        description: "Termin wurde gelöscht.",
      })

      if (managementEvent?.id) {
        loadEventInstances(managementEvent.id)
      }
    } catch (error) {
      console.error("Error deleting instance:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Termins.",
        variant: "destructive",
      })
    }
  }

  const openEventManagement = async (event: any) => {
  const eventWithCreatorId = {
  ...event,
  creator_id: event.creator_id || event.ludo_event?.creator_id,
  }
  
  setManagementEvent(eventWithCreatorId)
  setIsEventManagementOpen(true)
  setEventManagementTab("edit")
  
  // Load event instances
  loadEventInstances(event.id)

    // Load event data for editing
    setEditingEvent({
      title: event.title,
      description: event.description,
      location: event.location || "",
      max_participants: event.max_participants,
      first_instance_date: event.first_instance_date,
      start_time: event.start_time,
      end_time: event.end_time || "",
      frequency: event.frequency || "once",
      visibility: event.visibility || "public",
      selected_games: event.selected_games || [],
    })

    // Load existing images
    if (event.images && event.images.length > 0) {
      setEventImagePreviews(event.images)
    } else if (event.image_url) {
      setEventImagePreviews([event.image_url])
    }

    // Load participants
    await loadEventParticipants(eventWithCreatorId.id)

    await loadFriends()
    await loadCommunityPolls(eventWithCreatorId.id)
  }

  const openGroupManagement = async (group: any) => {
    const groupWithCreatorId = {
      ...group,
      creator_id: group.creator_id || group.community?.creator_id,
    }

    setManagementGroup(groupWithCreatorId)
    setIsGroupManagementOpen(true)
    setGroupManagementTab("edit")

    // Load group data for editing
    setEditingGroup({
      name: group.name,
      description: group.description,
      location: group.location,
      max_members: group.max_members,
      approval_mode: group.approval_mode || "automatic",
    })

    // Load existing images
    if (group.images && group.images.length > 0) {
      setGroupImagePreviews(group.images)
    } else if (group.image) {
      setGroupImagePreviews([group.image])
    }

    // Load members
    await loadGroupMembers(groupWithCreatorId.id)

    await loadFriends()
    await loadCommunityPolls(groupWithCreatorId.id)
  }

  // Offer Management Functions
  const openOfferManagement = (offer: any) => {
    setManagementOffer(offer)
    setIsOfferManagementOpen(true)
  }

  // Search Ad Management Functions
  const openSearchAdManagement = (ad: any) => {
    setManagementSearchAd(ad)
    setIsSearchAdManagementOpen(true)
  }

  const handleEventImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files || !user) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ description: `${file.name} ist zu groß. Maximale Größe: 5MB`, variant: "destructive" })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({ description: `${file.name} ist keine Bilddatei`, variant: "destructive" })
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === newFiles.length) {
            setEventImageFiles((prev) => [...prev, ...newFiles])
            setEventImagePreviews((prev) => [...prev, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleGroupImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files || !user) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ description: `${file.name} ist zu groß. Maximale Größe: 5MB`, variant: "destructive" })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({ description: `${file.name} ist keine Bilddatei`, variant: "destructive" })
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === newFiles.length) {
            setGroupImageFiles((prev) => [...prev, ...newFiles])
            setGroupImagePreviews((prev) => [...prev, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const updateEvent = async () => {
    if (!managementEvent || !editingEvent) return

    setIsUpdating(true)

    try {
      const imageUrls: string[] = []

      // Upload new images
      for (const file of eventImageFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Image upload error:", uploadError)
          toast({ description: `Fehler beim Hochladen von ${file.name}`, variant: "destructive" })
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-images").getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // Combine new images with existing ones
      const allImages = [...eventImagePreviews.filter((url) => url.startsWith("http")), ...imageUrls]
      const mainImage = allImages[0] || ""

      const { error } = await supabase
        .from("ludo_events") // Assuming the table name is ludo_events
        .update({
          title: editingEvent.title,
          description: editingEvent.description,
          location: editingEvent.location,
          first_instance_date: editingEvent.first_instance_date, // Changed from event_date
          start_time: editingEvent.start_time, // Changed from event_time
          end_time: editingEvent.end_time,
          frequency: editingEvent.frequency,
          max_participants: editingEvent.max_participants,
          selected_games: editingEvent.selected_games, // Assuming this is the correct key for games
          visibility: editingEvent.visibility, // Assuming this is the correct key for visibility
          image_url: mainImage, // Changed from image
          images: allImages,
        })
        .eq("id", managementEvent.id)

      if (error) throw error

      toast({ title: "Erfolg", description: "Änderungen wurden übernommen." })
      setIsEventManagementOpen(false)
      loadActivities() // Reload activities
    } catch (error) {
      console.error("Error updating event:", error)
      toast({ description: "Fehler beim Aktualisieren des Events", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateGroup = async () => {
    if (!managementGroup || !editingGroup) return

    setIsUpdating(true)

    try {
      const imageUrls: string[] = []

      // Upload new images
      for (const file of groupImageFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("community-images")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Image upload error:", uploadError)
          toast({ description: `Fehler beim Hochladen von ${file.name}`, variant: "destructive" })
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("community-images").getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      // Combine new images with existing ones
      const allImages = [...groupImagePreviews.filter((url) => url.startsWith("http")), ...imageUrls]
      const mainImage = allImages[0] || ""

      const { error } = await supabase
        .from("communities")
        .update({
          name: editingGroup.name,
          description: editingGroup.description,
          location: editingGroup.location,
          max_members: editingGroup.max_members,
          approval_mode: editingGroup.approval_mode,
          image: mainImage, // Changed from group.image to mainImage
          images: allImages,
        })
        .eq("id", managementGroup.id)

      if (error) throw error

      toast({ title: "Erfolg", description: "Änderungen wurden übernommen." })
      setIsGroupManagementOpen(false)
      loadActivities() // Reload activities
    } catch (error) {
      console.error("Error updating group:", error)
      toast({ description: "Fehler beim Aktualisieren der Spielgruppe", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

        if (error) throw error

        // If no profile row exists yet, use auth context data as profile
        const profileData = data
          ? {
              ...data,
              name: data.name || user.name || "",
              username: data.username || user.username || "",
            }
          : {
              id: user.id,
              email: user.email,
              name: user.name || "",
              username: user.username || "",
            }

        setProfile(profileData)
        setEditedProfile(profileData)
      } catch (error: any) {
        console.error("Error loading profile:", error?.message || error?.code || error)
        // Even on error, show user data from auth context
        if (user) {
          const fallbackProfile = {
            id: user.id,
            email: user.email,
            name: user.name || "",
            username: user.username || "",
          }
          setProfile(fallbackProfile)
          setEditedProfile(fallbackProfile)
        }
      } finally {
        setProfileLoading(false)
      }
    }

    if (!authLoading && user) {
      loadProfile()
    } else if (!authLoading) {
      setProfileLoading(false)
    }
  }, [user, authLoading, supabase])

  // Load activities and dashboard data on component mount
  useEffect(() => {
    if (user) {
      loadActivities()
      loadDashboardData() // Load data for the dashboard
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    setIsLoadingDashboard(true)
    try {
      // Fetch My Events with creator_id
      const { data: createdEvents } = await supabase
        .from("ludo_events")
        .select(
          "id, title, first_instance_date, start_time, location, max_participants, frequency, image_url, images, creator_id, ludo_event_instances(id, instance_date)",
        )
        .eq("creator_id", user.id)
        .order("first_instance_date", { ascending: true })

      setMyEvents(createdEvents || [])

      // Fetch Events I'm Participating In
      const { data: participatingEvents } = await supabase
        .from("ludo_event_participants")
        .select(
          `event:ludo_events(id, title, first_instance_date, start_time, location, max_participants, frequency, image_url, images, creator_id, ludo_event_instances(id, instance_date))`,
        )
        .eq("user_id", user.id)

      setEventsAsMember(participatingEvents?.map((p) => p.event).filter(Boolean) || [])

      // Fetch My Groups
      const { data: communities } = await supabase
        .from("community_members")
        .select(
          "community:communities(id, name, image, creator_id, type, location, active, max_members, approval_mode, created_at, images, community_members(id))",
        )
        .eq("user_id", user.id)

      setMyGroups(communities?.map((c) => c.community).filter(Boolean) || [])

      // Fetch Upcoming Events (for dashboard widget)
      const { data: upcomingEventsData } = await supabase.rpc("get_upcoming_events_for_user", { user_id: user.id })
      setUpcomingEvents(upcomingEventsData || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setAvatarUploading(true)
      const supabase = createClient()

      // Upload to API endpoint that handles Vercel Blob
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()

      // Update database
      const { error } = await supabase.from("users").update({ avatar: url }).eq("id", user.id)

      if (error) throw error

      setProfile({ ...profile, avatar: url })

      updateAvatar(user.id, url)

      await updateProfile({ avatar: url })

      // Dispatch event
      window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { userId: user.id, avatar: url } }))

      toast({
        title: "Erfolg",
        description: "Avatar wurde hochgeladen",
      })
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Fehler",
        description: error.message || "Avatar konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  const generateAvatarUrl = (style: string, seed: string, bgColor: string) => {
    const cleanBgColor = bgColor.replace("#", "")
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${cleanBgColor}`
  }

  const generateRandomAvatar = () => {
    const randomSeed = `${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newUrl = generateAvatarUrl(avatarStyle, randomSeed, avatarBgColor)
    setCurrentAvatarUrl(newUrl)
    setAvatarSeed(randomSeed)
  }

  // Removed debug logging related to avatar generation
  useEffect(() => {
    if (showAvatarCreator) {
      const seed = avatarSeed || `${Date.now()}`
      const url = generateAvatarUrl(avatarStyle, seed, avatarBgColor)
      setCurrentAvatarUrl(url)
      setGeneratedAvatar(url) // Also set generatedAvatar for saving
    }
  }, [avatarStyle, avatarBgColor, showAvatarCreator, avatarSeed])

  const handleAvatarSave = async () => {
    if (!user || !profile || !generatedAvatar) return // Ensure generatedAvatar is available

    try {
      const supabase = createClient()
      const { error } = await supabase.from("users").update({ avatar: generatedAvatar }).eq("id", user.id)

      if (error) throw error

      setProfile({ ...profile, avatar: generatedAvatar })

      updateAvatar(user.id, generatedAvatar)

      await updateProfile({ avatar: generatedAvatar })

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { userId: user.id, avatar: generatedAvatar } }))

      setShowAvatarCreator(false)
      toast({
        title: "Erfolg",
        description: "Avatar wurde gespeichert",
      })
    } catch (error: any) {
      console.error("Error saving avatar:", error)
      toast({
        title: "Fehler",
        description: "Avatar konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleAddressSearch = async (query: string) => {
    setEditedProfile({ ...editedProfile, address: query })

    // Clear previous timeout
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current)
    }

    if (query.length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    // Debounce the search
    addressTimeoutRef.current = setTimeout(async () => {
      setAddressSearching(true) // Set addressSearching state
      try {
        const suggestions = await getAddressSuggestions(query)
        setAddressSuggestions(suggestions)
        setShowAddressSuggestions(suggestions.length > 0)
      } catch (error) {
        console.error("Address search error:", error)
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
      } finally {
        setAddressSearching(false) // Reset addressSearching state
      }
    }, 300)
  }

  const handleSelectAddress = (address: string) => {
    setEditedProfile({ ...editedProfile, address })
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const usernameChanged = profile?.username !== editedProfile.username

      const { error } = await supabase
        .from("users")
        .update({
          name: editedProfile.name,
          username: editedProfile.username,
          bio: editedProfile.bio,
          address: editedProfile.address,
          birth_date: editedProfile.birth_date,
          phone: editedProfile.phone,
          twitter: editedProfile.twitter,
          instagram: editedProfile.instagram,
          website: editedProfile.website,
          favorite_games: editedProfile.favorite_games,
        })
        .eq("id", user.id)

      if (error) throw error

      // If username changed, sync across all tables (leaderboards, forum, etc.)
      if (usernameChanged && editedProfile.username) {
        await syncUsernameAcrossTables(user.id, editedProfile.username)
      }

      // Sync auth context state so navigation shows updated username/name immediately
      patchUser({
        name: editedProfile.name,
        username: editedProfile.username,
        bio: editedProfile.bio,
        website: editedProfile.website,
        twitter: editedProfile.twitter,
        instagram: editedProfile.instagram,
      })

      setProfile(editedProfile)
      setIsEditing(false)
      toast({
        title: "Erfolg",
        description: usernameChanged
          ? "Profil und Benutzername wurden überall aktualisiert."
          : "Profil erfolgreich gespeichert.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const loadFriends = async () => {
    if (!user) return

    try {
      const { data: friendships1, error: error1 } = await supabase
        .from("friends")
        .select(`
          friend_id,
          users:users!friends_friend_id_fkey (
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
          users:users!friends_user_id_fkey (
            id,
            username,
            name,
            avatar
          )
        `)
        .eq("friend_id", user.id)
        .eq("status", "active")

      if (error1 || error2) {
        console.error("Error loading friends:", error1 || error2)
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

      setFriends(allFriends)
    } catch (err) {
      console.error("Error loading friends:", err)
    }
  }

  const handleInviteFriends = async (communityId: string | undefined, communityType: "event" | "group") => {
    if (!communityId) {
      toast({ description: "Fehler: Community ID fehlt", variant: "destructive" })
      return
    }
    if (selectedFriends.length === 0) {
      toast({
        description: "Bitte wähle mindestens einen Freund aus",
        variant: "destructive",
      })
      return
    }

    try {
      for (const friendId of selectedFriends) {
        // Determine the correct table and relevant fields based on communityType
        const insertData = {
          invitee_id: friendId,
          inviter_id: user?.id,
        }

        if (communityType === "event") {
          await supabase.from("event_invitations").insert({ ...insertData, event_id: communityId })
        } else if (communityType === "group") {
          await supabase.from("community_invitations").insert({ ...insertData, community_id: communityId })
        }
      }

      toast({
        description: `${selectedFriends.length} Freunde eingeladen`,
      })
      setSelectedFriends([])
    } catch (error) {
      console.error("[v0] Error inviting friends:", error)
      toast({
        description: "Fehler beim Einladen",
        variant: "destructive",
      })
    }
  }

  const loadCommunityPolls = async (communityId: string) => {
    if (!user) return

    try {
      const { data: polls, error: pollsError } = await supabase
        .from("community_polls")
        .select(`
          *,
          options:community_poll_options(*),
          votes:community_poll_votes(*)
        `)
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })

      if (pollsError) throw pollsError

      setCommunityPolls(polls || [])

      // Load user votes
      const { data: votes, error: votesError } = await supabase
        .from("community_poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user.id)

      if (votesError) throw votesError

      const votesMap: Record<string, string[]> = {}
      votes?.forEach((vote) => {
        if (!votesMap[vote.poll_id]) {
          votesMap[vote.poll_id] = []
        }
        votesMap[vote.poll_id].push(vote.option_id)
      })

      setUserVotes(votesMap)
    } catch (error) {
      console.error("Error loading polls:", error)
    }
  }

  // Load polls for membership (groups user is member of but not creator)
  const loadMembershipPolls = async (communityId: string) => {
    if (!user) return

    try {
      const { data: polls, error: pollsError } = await supabase
        .from("community_polls")
        .select(`
          *,
          options:community_poll_options(*),
          votes:community_poll_votes(*)
        `)
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })

      if (pollsError) throw pollsError

      setMembershipPolls(polls || [])

      // Load user votes
      const { data: votes, error: votesError } = await supabase
        .from("community_poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user.id)

      if (votesError) throw votesError

      const votesMap: Record<string, string[]> = {}
      votes?.forEach((vote) => {
        if (!votesMap[vote.poll_id]) {
          votesMap[vote.poll_id] = []
        }
        votesMap[vote.poll_id].push(vote.option_id)
      })

      setMembershipUserVotes(votesMap)
    } catch (error) {
      console.error("Error loading membership polls:", error)
    }
  }

  // Handle vote for membership polls
  const handleMembershipVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast({ description: "Bitte melde dich an um abzustimmen", variant: "destructive" })
      return
    }

    try {
      const poll = membershipPolls.find((p) => p.id === pollId)

      const userHasVoted = membershipUserVotes[pollId] && membershipUserVotes[pollId].length > 0
      const userVotedForThisOption = membershipUserVotes[pollId]?.includes(optionId)

      if (userVotedForThisOption) {
        // Remove vote if already voted for this option
        const { error } = await supabase
          .from("community_poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("option_id", optionId)
          .eq("user_id", user.id)

        if (error) throw error

        toast({ description: "Stimme entfernt" })
      } else {
        // If not allowing multiple votes and user has already voted, remove previous vote
        if (!poll?.allow_multiple_votes && userHasVoted) {
          const { error: deleteError } = await supabase
            .from("community_poll_votes")
            .delete()
            .eq("poll_id", pollId)
            .eq("user_id", user.id)

          if (deleteError) throw deleteError
        }

        // Add new vote
        const { error: insertError } = await supabase.from("community_poll_votes").insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        })

        if (insertError) throw insertError

        toast({ description: "Stimme abgegeben" })
      }

      // Reload polls to reflect changes
      if (membershipPollsCommunity) {
        loadMembershipPolls(membershipPollsCommunity.id)
      }
    } catch (error: any) {
      console.error("[v0] Error voting:", error)
      toast({
        description: error.message || "Fehler beim Abstimmen",
        variant: "destructive",
      })
    }
  }

  // Open membership polls dialog
  const openMembershipPolls = async (community: any) => {
    setMembershipPollsCommunity(community)
    setIsMembershipPollsOpen(true)
    setMembershipPollTab("active")
    await loadMembershipPolls(community.id)
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      toast({ description: "Bitte melde dich an um abzustimmen", variant: "destructive" })
      return
    }

    try {
      const poll = communityPolls.find((p) => p.id === pollId)

      const userHasVoted = userVotes[pollId] && userVotes[pollId].length > 0
      const userVotedForThisOption = userVotes[pollId]?.includes(optionId)

      if (userVotedForThisOption) {
        // Remove vote if already voted for this option
        const { error } = await supabase
          .from("community_poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("option_id", optionId)
          .eq("user_id", user.id)

        if (error) throw error

        toast({ description: "Stimme entfernt" })
      } else {
        // If not allowing multiple votes and user has already voted, remove previous vote
        if (!poll?.allow_multiple_votes && userHasVoted) {
          const { error: deleteError } = await supabase
            .from("community_poll_votes")
            .delete()
            .eq("poll_id", pollId)
            .eq("user_id", user.id)

          if (deleteError) throw deleteError
        }

        // Add new vote
        const { error: insertError } = await supabase.from("community_poll_votes").insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        })

        if (insertError) throw insertError

        toast({ description: "Stimme abgegeben" })
      }

      // Reload polls to reflect changes
      if (managementEvent) {
        loadCommunityPolls(managementEvent.id)
      } else if (managementGroup) {
        loadCommunityPolls(managementGroup.id)
      }
    } catch (error: any) {
      console.error("[v0] Error voting:", error)
      toast({
        description: error.message || "Fehler beim Abstimmen",
        variant: "destructive",
      })
    }
  }

  const createPoll = async (communityId: string | undefined) => {
    if (!communityId) {
      toast({ description: "Fehler: Community ID fehlt", variant: "destructive" })
      return
    }
    if (!user) return

    if (!newPoll.question.trim() || newPoll.options.filter((o) => o.trim()).length < 2) {
      toast({ description: "Bitte fülle die Frage und mindestens 2 Optionen aus", variant: "destructive" })
      return
    }

    try {
      const { data: pollData, error: pollError } = await supabase
        .from("community_polls")
        .insert({
          community_id: communityId,
          creator_id: user.id,
          question: newPoll.question,
          description: newPoll.description,
          allow_multiple_votes: newPoll.allow_multiple_votes,
          expires_at: newPoll.expires_at || null,
          is_active: true,
        })
        .select()
        .single()

      if (pollError) throw pollError

      const options = newPoll.options
        .filter((o) => o.trim())
        .map((option) => ({
          poll_id: pollData.id,
          option_text: option,
          votes_count: 0,
        }))

      await supabase.from("community_poll_options").insert(options)

      toast({ description: "Abstimmung erfolgreich erstellt!" })
      setNewPoll({
        question: "",
        description: "",
        options: ["", ""],
        allow_multiple_votes: false,
        expires_at: "",
      })
      setActivePollTab("active")
      loadCommunityPolls(communityId)
    } catch (error) {
      console.error("Error creating poll:", error)
      toast({ description: "Fehler beim Erstellen der Abstimmung", variant: "destructive" })
    }
  }

  const loadActivities = async () => {
    if (!user) return
    setLoadingActivities(true)

    try {
      const supabase = createClient()

      const { data: createdEvents } = await supabase
        .from("ludo_events")
        .select(`
          id,
          title,
          first_instance_date,
          start_time,
          location,
          max_participants,
          visibility,
          created_at,
          frequency,
          selected_games,
          image_url,
          images,
          creator_id,
          ludo_event_instances(id, instance_date, start_time),
          ludo_event_participants(id)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      const { data: eventParticipations } = await supabase
        .from("ludo_event_participants")
        .select(`
          id,
          status,
          joined_at,
          user_id,
          event_id,
          event:ludo_events(id, title, first_instance_date, start_time, location, creator_id, selected_games, frequency, image_url, images, ludo_event_instances(id, instance_date))
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })

      // Load friend requests (sent and received)
      const { data: friendRequests } = await supabase
        .from("friend_requests")
        .select(`
          id,
          status,
          created_at,
          from_user_id,
          to_user_id,
          from_user:users!friend_requests_from_user_id_fkey(id, name, username, avatar),
          to_user:users!friend_requests_to_user_id_fkey(id, name, username, avatar)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      // Load event join requests sent by the user
      const { data: sentEventJoinRequests } = await supabase
        .from("ludo_event_join_requests")
        .select(`
          id,
          status,
          message,
          created_at,
          user_id,
          event:ludo_events(id, title, creator_id),
          user:users!ludo_event_join_requests_user_id_fkey(id, name, username, avatar)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      // Load event join requests for events user created (get events first, then requests)
      const { data: userCreatedEvents } = await supabase
        .from("ludo_events")
        .select("id")
        .eq("creator_id", user.id)

      const userEventIds = userCreatedEvents?.map(e => e.id) || []
      
      let receivedEventJoinRequests: typeof sentEventJoinRequests = []
      if (userEventIds.length > 0) {
        const { data } = await supabase
          .from("ludo_event_join_requests")
          .select(`
            id,
            status,
            message,
            created_at,
            user_id,
            event:ludo_events(id, title, creator_id),
            user:users!ludo_event_join_requests_user_id_fkey(id, name, username, avatar)
          `)
          .in("event_id", userEventIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
        receivedEventJoinRequests = data || []
      }

      // Combine and deduplicate event join requests
      const allEventJoinRequests = [...(sentEventJoinRequests || []), ...receivedEventJoinRequests]
      const eventJoinRequests = allEventJoinRequests.filter((request, index, self) =>
        index === self.findIndex(r => r.id === request.id)
      )

      const { data: memberCommunities } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          role,
          joined_at,
          community:communities(id, name, image, creator_id, type, location, active, max_members, approval_mode, created_at, images, community_members(id))
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })

      const { data: createdCommunities } = await supabase
        .from("communities")
        .select(`
          id,
          name,
          image,
          type,
          active,
          created_at,
          creator_id,
          max_members,
          location,
          approval_mode,
          images,
          community_members(id)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      // Load marketplace offers with all fields needed for editing
      const { data: marketplaceOffers } = await supabase
        .from("marketplace_offers")
        .select(`
          id,
          title,
          type,
          price,
          active,
          image,
          created_at,
          description,
          condition,
          location,
          pickup_available,
          shipping_available,
          pickup_address,
          daily_rate_1_day,
          daily_rate_2_to_6_days,
          daily_rate_7_to_30_days,
          daily_rate_over_30_days,
          deposit_amount,
          min_rental_days,
          max_rental_days,
          open_to_suggestions
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Load search ads with all fields needed for editing
      const { data: searchAds } = await supabase
        .from("search_ads")
        .select(`
          id,
          title,
          type,
          active,
          max_price,
          created_at,
          trade_game_title,
          rental_duration,
          description
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Filter out deleted events (where event is null) and mark past events
      const filteredEventParticipations = (eventParticipations || [])
        .filter((p) => p.event !== null) // Remove deleted events
        .map((p) => {
          // Check if event is in the past
          const eventDate = p.event?.first_instance_date
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const isPast = eventDate ? new Date(eventDate) < today : false
          return { ...p, isPast }
        })

      // Filter out deleted communities (where community is null)
      const filteredMemberCommunities = (memberCommunities || [])
        .filter((m) => m.community !== null && m.community?.creator_id !== user.id)

      setActivityData({
        createdEvents: createdEvents || [],
        eventParticipations: filteredEventParticipations,
        friendRequests: friendRequests || [],
        eventJoinRequests: eventJoinRequests || [],
        memberCommunities: filteredMemberCommunities,
        createdCommunities: createdCommunities || [],
        marketplaceOffers: marketplaceOffers || [],
        searchAds: searchAds || [],
        // Assigning communityMemberships for the new structure
        communityMemberships: memberCommunities?.filter((m) => m.community?.creator_id !== user.id) || [],
      })
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadNotificationPrefs = async () => {
    if (!userId) return

    const result = await getUserNotifications()
    if (result.success) {
      setNotifications(result.notifications || [])
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      toast({ title: "Erfolg", description: "Alle Benachrichtigungen als gelesen markiert" })
      loadNotificationPrefs()
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    const result = await deleteNotification(notificationId)
    if (result.success) {
      toast({ title: "Erfolg", description: "Benachrichtigung gelöscht" })
      loadNotificationPrefs()
    }
  }

  const handleNotificationPreferenceChange = (key: string, value: boolean) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: value }))
    // We need to save this to the backend here. For now, just updating local state.
    // In a real application, you would trigger a backend save operation here.
    // For example: await saveNotificationPreferenceToBackend(key, value);
    toast({ title: "Gespeichert", description: "Einstellung gespeichert" })
  }

  // NotificationPreferenceRow is now an extracted component in components/profile/notifications-tab.tsx

  const saveNotificationPref = async (category: string, key: string, value: number) => {
    if (!user) return
    try {
      let table = ""
      let dbKey = key

      if (category === "social") {
        table = "social_notification_preferences"
      } else if (category === "security") {
        table = "security_notification_preferences"
      } else if (category === "marketplace") {
        table = "marketing_notification_preferences"
        const keyMap: Record<string, string> = {
          matching_offers: "game_recommendations",
          offer_responses: "feedback_requests",
          price_changes: "trending_games",
          expiring_offers: "event_suggestions",
          new_releases: "new_game_releases",
        }
        dbKey = keyMap[key] || key
      } else {
        return
      }

      const numValue = Number(value)
      const clampedValue = Math.max(0, Math.min(2, numValue))

      const dbValue = category === "marketplace" ? Boolean(clampedValue) : clampedValue

      const { data: existing, error: selectError } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is expected for new records
        throw selectError
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from(table)
          .update({ [dbKey]: dbValue })
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // Insert new record with default values
        const { error } = await supabase.from(table).insert({ user_id: user.id, [dbKey]: dbValue })

        if (error) throw error
      }

      setNotificationPrefs((prev) => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [key]: clampedValue,
        },
      }))

      toast({
        title: "Gespeichert",
        description: "Benachrichtigungseinstellung aktualisiert.",
      })
    } catch (error: any) {
      console.error("Error saving notification preference:", error)
      toast({
        title: "Fehler",
        description: `Fehler beim Speichern: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword.length < 6) {
      setPasswordError("Das neue Passwort muss mindestens 6 Zeichen lang sein")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein")
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess("Passwort erfolgreich geändert!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast({
          title: "Erfolg",
          description: "Passwort erfolgreich geändert.",
        })
        setTimeout(() => {
          setShowPasswordDialog(false)
          setPasswordSuccess("")
        }, 2000)
      }
    } catch (error: any) {
      setPasswordError(error.message || "Fehler beim Ändern des Passworts")
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Ändern des Passworts.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "LÖSCHEN") {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createClient()

      // Delete user data from database
      await supabase.from("messages").delete().eq("sender_id", user?.id)
      await supabase.from("messages").delete().eq("receiver_id", user?.id)
      await supabase.from("friend_requests").delete().eq("from_user_id", user?.id)
      await supabase.from("friend_requests").delete().eq("to_user_id", user?.id)
      await supabase.from("users").delete().eq("id", user?.id)

      // Sign out
      await supabase.auth.signOut()

      router.push("/")
      toast({
        title: "Erfolg",
        description: "Konto erfolgreich gelöscht.",
      })
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Kontos: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUsernameClick = (userId: string) => {
    setProfileModalUserId(userId)
    setIsProfileModalOpen(true)
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-orange-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-orange-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">Bitte melde dich an, um dein Profil zu sehen.</p>
            <Button onClick={() => router.push("/login")} className="bg-teal-500 hover:bg-teal-600">
              Zur Anmeldung
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-orange-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6 border-2 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-teal-400">
                    <AvatarImage src={getUserAvatar(user.id, profile?.avatar || user.avatar)} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-handwritten">
                      {profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    <Button
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="rounded-full w-6 h-6 p-0 bg-teal-500 hover:bg-teal-600"
                      title="Bild hochladen"
                    >
                      {avatarUploading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => setShowAvatarCreator(true)}
                      className="rounded-full w-6 h-6 p-0 bg-purple-500 hover:bg-purple-600"
                      title="Avatar erstellen"
                    >
                      <IoColorPaletteOutline className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="font-bold text-gray-900 font-handwritten text-sm">
                    {profile?.name || profile?.username || user.name || "Benutzer"}
                  </h1>
                  <p className="text-gray-600 text-xs">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent text-xs px-2 py-1 h-7"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Abmelden
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Creator Dialog */}
          <Dialog
            open={showAvatarCreator}
            onOpenChange={(open) => {
              setShowAvatarCreator(open)
              if (!open) {
                setCurrentAvatarUrl(null)
                setGeneratedAvatar(null) // Reset generated avatar on close
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-handwritten text-teal-700 text-base">Avatar erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* Preview */}
                <div className="flex justify-center">
                  <div
                    className="w-24 h-24 rounded-full border-4 border-teal-400 overflow-hidden"
                    style={{ backgroundColor: avatarBgColor }}
                  >
                    <img
                      src={currentAvatarUrl || "/placeholder.svg"} // Fallback to placeholder if no URL
                      alt="Avatar Preview"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-handwritten text-xs">Stil auswählen</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {AVATAR_STYLES.map((style) => (
                      <Button
                        key={style.id}
                        variant={avatarStyle === style.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAvatarStyle(style.id)}
                        className={`text-[10px] h-7 px-2 ${avatarStyle === style.id ? "bg-teal-500 hover:bg-teal-600" : "hover:bg-teal-50"}`}
                      >
                        {style.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-1">
                  <Label className="font-handwritten text-xs">Hintergrundfarbe</Label>
                  <div className="flex flex-wrap gap-1">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAvatarBgColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${avatarBgColor === color ? "border-gray-900 scale-110" : "border-gray-300 hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={generateRandomAvatar}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Avatar generieren
                </Button>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAvatarCreator(false)
                    setCurrentAvatarUrl(null)
                    setGeneratedAvatar(null) // Reset generated avatar on close
                  }}
                  className="h-7 text-xs px-3"
                >
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  onClick={handleAvatarSave} // Use the updated handler
                  className="bg-teal-500 hover:bg-teal-600 h-7 text-xs px-3"
                >
                  Avatar speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Profile Tabs */}
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 bg-gray-50 h-auto p-1">
              <TabsTrigger value="profile" className="data-[state=active]:bg-teal-100 text-xs py-2">
                <CgProfile className="w-3 h-3 mr-1" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-teal-100 text-xs py-2">
                <RxActivityLog className="w-3 h-3 mr-1" />
                Aktivitäten
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-teal-100 text-xs py-2">
                <CalendarDays className="w-3 h-3 mr-1" />
                Kalender
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-teal-100 text-xs py-2"
                onClick={loadNotificationPrefs}
              >
                <FaBell className="w-3 h-3 mr-1" />
                Benachrichtigungen
              </TabsTrigger>
              <TabsTrigger value="privacy" className="data-[state=active]:bg-teal-100 text-xs py-2">
                <Shield className="w-3 h-3 mr-1" />
                Privatsphäre
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-teal-100 text-xs py-2">
                <Lock className="w-3 h-3 mr-1" />
                Sicherheit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-handwritten text-teal-700">Schnellzugriff-Dashboard</CardTitle>
                  <CardDescription>Deine wichtigsten Aktivitäten auf einen Blick</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-teal-200 bg-teal-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Meine Events</p>
                            <p className="text-2xl font-bold text-teal-600">{myEvents.length}</p>
                          </div>
                          <FaCalendarAlt className="w-8 h-8 text-teal-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-pink-200 bg-pink-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Meine Gruppen</p>
                            <p className="text-2xl font-bold text-pink-600">{myGroups.length}</p>
                          </div>
                          <LiaUsersSolid className="w-8 h-8 text-pink-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Ungelesene Benachrichtigungen</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {notifications.filter((n) => !n.is_read).length}
                            </p>
                          </div>
                          <FaBell className="w-8 h-8 text-orange-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Anfragen</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {activityData.friendRequests.length + activityData.eventJoinRequests.length}
                            </p>
                          </div>
                          <IoSearchCircle className="w-8 h-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 font-handwritten">
                      <FaCalendarAlt className="text-teal-500" />
                      Anstehende Events (nächste 7 Tage)
                    </h3>
                    <div className="space-y-2">
                      {[...myEvents, ...eventsAsMember]
                        .filter((event) => {
                          const eventDate = new Date(event.first_instance_date) // Changed from event_date
                          const today = new Date()
                          const nextWeek = new Date()
                          nextWeek.setDate(nextWeek.getDate() + 7)
                          return eventDate >= today && eventDate <= nextWeek
                        })
                        .sort(
                          (a, b) =>
                            new Date(a.first_instance_date).getTime() - new Date(b.first_instance_date).getTime(),
                        ) // Changed from event_date
                        .slice(0, 5)
                        .map((event) => (
                          <Card key={event.id} className="border-l-4 border-l-teal-400">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                                  <FaCalendarAlt className="text-teal-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{event.title}</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                      // Changed from event_date
                                      weekday: "short",
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    {event.start_time && ` • ${event.start_time}`}
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/ludo-events?view=${event.id}`}>Details</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      {[...myEvents, ...eventsAsMember].filter((event) => {
                        const eventDate = new Date(event.first_instance_date) // Changed from event_date
                        const today = new Date()
                        const nextWeek = new Date()
                        nextWeek.setDate(nextWeek.getDate() + 7)
                        return eventDate >= today && eventDate <= nextWeek
                      }).length === 0 && (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            <FaCalendarAlt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Keine anstehenden Events in den nächsten 7 Tagen</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 font-handwritten">
                      <RxActivityLog className="text-pink-500" />
                      Neueste Aktivitäten
                    </h3>
                    <div className="space-y-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <Card key={notification.id} className={!notification.is_read ? "bg-orange-50" : ""}>
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {notifications.length === 0 && (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            <RxActivityLog className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Keine neuen Aktivitäten</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Event-Kalender</CardTitle>
                  <p className="text-xs text-gray-500">Übersicht aller Events und Spielabende im Kalenderformat</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const today = new Date()
                      const viewDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1)
                      const currentMonth = viewDate.getMonth()
                      const currentYear = viewDate.getFullYear()
                      const firstDay = new Date(currentYear, currentMonth, 1)
                      const lastDay = new Date(currentYear, currentMonth + 1, 0)
                      const daysInMonth = lastDay.getDate()
                      const startingDayOfWeek = firstDay.getDay()

                      const allEvents = [...myEvents, ...eventsAsMember]
                      const eventsByDate: { [key: string]: typeof allEvents } = {}

                      allEvents.forEach((event) => {
                        const dateKey = new Date(event.first_instance_date).toISOString().split("T")[0] // Changed from event_date
                        if (!eventsByDate[dateKey]) {
                          eventsByDate[dateKey] = []
                        }
                        eventsByDate[dateKey].push(event)
                      })

                      return (
                        <>
                          {/* Month Navigation */}
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentMonthOffset(currentMonthOffset - 1)}
                            >
                              <FaChevronLeft className="w-4 h-4" />
                            </Button>

                            <h3 className="font-bold font-handwritten text-sm">
                              {viewDate.toLocaleDateString("de-DE", {
                                month: "long",
                                year: "numeric",
                              })}
                            </h3>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentMonthOffset(currentMonthOffset + 1)}
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Day Headers */}
                            {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((day) => (
                              <div key={day} className="text-center font-semibold text-xs text-gray-600 py-1">
                                {day}
                              </div>
                            ))}

                            {/* Empty cells for days before month starts */}
                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* Calendar days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1
                              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                              const dayEvents = eventsByDate[dateKey] || []
                              const isToday =
                                day === today.getDate() &&
                                currentMonth === today.getMonth() &&
                                currentYear === today.getFullYear()

                              return (
                                <div
                                  key={day}
                                  className={`aspect-square border rounded-md p-0.5 ${
                                    isToday ? "border-teal-500 bg-teal-50" : "border-gray-200"
                                  } ${dayEvents.length > 0 ? "bg-orange-50" : ""}`}
                                >
                                  <div className="text-[10px] font-semibold text-center mb-0.5">{day}</div>
                                  {dayEvents.length > 0 && (
                                    <div className="space-y-0.5">
                                      {dayEvents.slice(0, 1).map((event) => (
                                        <div
                                          key={event.id}
                                          className="text-[7px] bg-teal-500 text-white rounded px-0.5 py-0.5 truncate cursor-pointer hover:bg-teal-600"
                                          onClick={() => {
                                            window.location.href = `/ludo-events?view=${event.id}`
                                          }}
                                          title={event.title}
                                        >
                                          {event.title}
                                        </div>
                                      ))}
                                      {dayEvents.length > 1 && (
                                        <div className="text-[7px] text-gray-600 text-center">
                                          +{dayEvents.length - 1}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Event List below calendar */}
                          <div className="mt-6">
                            <h3 className="font-semibold mb-3 font-handwritten text-base">
                              Alle Events in diesem Monat
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {allEvents
                                .filter((event) => {
                                  const eventDate = new Date(event.first_instance_date) // Changed from event_date
                                  return (
                                    eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
                                  )
                                })
                                .sort(
                                  (a, b) =>
                                    new Date(a.first_instance_date).getTime() -
                                    new Date(b.first_instance_date).getTime(),
                                ) // Changed from event_date
                                .map((event) => (
                                  <Card key={event.id} className="border-l-4 border-l-teal-400">
                                    <CardContent className="p-3 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-teal-100 flex flex-col items-center justify-center">
                                          <p className="text-xs font-bold text-teal-600">
                                            {new Date(event.first_instance_date).getDate()}{" "}
                                            {/* Changed from event_date */}
                                          </p>
                                          <p className="text-[8px] text-teal-500">
                                            {new Date(event.first_instance_date) // Changed from event_date
                                              .toLocaleDateString("de-DE", { month: "short" })
                                              .toUpperCase()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-sm">{event.title}</p>
                                          <p className="text-xs text-gray-600">
                                            {new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                              // Changed from event_date
                                              weekday: "long",
                                              day: "2-digit",
                                              month: "long",
                                            })}
                                            {event.start_time && ` • ${event.start_time}`}
                                          </p>
                                          {event.location && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                              <FaMapMarkerAlt className="w-3 h-3" />
                                              {event.location}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Button size="sm" variant="outline" asChild>
                                        <Link href={`/ludo-events?view=${event.id}`}>Details</Link>
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                              {allEvents.filter((event) => {
                                const eventDate = new Date(event.first_instance_date) // Changed from event_date
                                return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
                              }).length === 0 && (
                                <Card>
                                  <CardContent className="p-6 text-center text-gray-500">
                                    <FaCalendarAlt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Keine Events in diesem Monat</p>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card className="border-2 border-teal-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-handwritten text-teal-700 text-base">Profilinformationen</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-teal-400 text-teal-600 hover:bg-teal-50 h-7 text-xs px-2"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="h-7 text-xs px-2"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Abbrechen
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-teal-500 hover:bg-teal-600 h-7 text-xs px-2"
                      >
                        {saving ? "..." : "Speichern"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">
                        Vollständige Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedProfile.name || ""}
                          onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                          className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                        />
                      ) : (
                        <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.name || "-"}</p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">
                        Benutzername
                      </Label>
                      {isEditing ? (
                        <div>
                          <Input
                            value={editedProfile.username || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                            className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            Dieser Name wird auf der Plattform angezeigt und ist für andere Nutzer sichtbar.
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.username || "-"}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">E-Mail</Label>
                      <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{user.email}</p>
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">
                        Geburtsdatum
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedProfile.birth_date || ""}
                          onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })}
                          className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                        />
                      ) : (
                        <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">
                          {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("de-DE") : "-"}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">
                        Telefonnummer
                      </Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={editedProfile.phone || ""}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                          placeholder="+41 76 123 4567"
                          className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                        />
                      ) : (
                        <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.phone || "-"}</p>
                      )}
                    </div>

                    {/* Address with autocomplete */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">Adresse</Label>
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            ref={addressInputRef}
                            value={editedProfile.address || ""}
                            onChange={(e) => handleAddressSearch(e.target.value)}
                            onFocus={() =>
                              editedProfile.address?.length >= 3 &&
                              addressSuggestions.length > 0 &&
                              setShowAddressSuggestions(true)
                            }
                            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                            placeholder="Straße, Hausnummer, PLZ, Ort eingeben"
                            className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                          />
                          {addressSearching && ( // Check for addressSearching state
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-500 border-t-transparent" />
                            </div>
                          )}
                          {showAddressSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={suggestion.place_id || index}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectAddress(suggestion.description)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-teal-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                                >
                                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{suggestion.description}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.address || "-"}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">Über mich</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedProfile.bio || ""}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        placeholder="Erzähle etwas über dich..."
                        className="border-teal-200 focus:border-teal-400 min-h-[60px] text-xs"
                      />
                    ) : (
                      <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.bio || "-"}</p>
                    )}
                  </div>

                  {/* Favorite Games */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 font-handwritten text-gray-700 text-xs">
                      Lieblingsspiele
                    </Label>
                    {isEditing ? (
                      <div>
                        <Textarea
                          value={editedProfile.favorite_games || ""}
                          onChange={(e) => setEditedProfile({ ...editedProfile, favorite_games: e.target.value })}
                          placeholder="z.B. Catan, Codenames, Azul..."
                          className="border-teal-200 focus:border-teal-400 min-h-[40px] text-xs"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Mehrere Spiele mit Kommas trennen</p>
                      </div>
                    ) : (
                      <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.favorite_games || "-"}</p>
                    )}
                  </div>

                  {/* Social Networks */}
                  <div className="pt-4">
                    <Label className="font-handwritten text-gray-700 mb-3 block text-xs">Soziale Netzwerke</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-gray-600 text-xs">
                          <FaXTwitter className="w-3 h-3" />
                          Twitter / X
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedProfile.twitter || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, twitter: e.target.value })}
                            placeholder="@username"
                            className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                          />
                        ) : (
                          <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.twitter || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-gray-600 text-xs">
                          <FaInstagram className="w-3 h-3" />
                          Instagram
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedProfile.instagram || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                            placeholder="@username"
                            className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                          />
                        ) : (
                          <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.instagram || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-gray-600 text-xs">
                          <Globe className="w-3 h-3" />
                          Webseite
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedProfile.website || ""}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            placeholder="https://..."
                            className="border-teal-200 focus:border-teal-400 h-8 text-xs"
                          />
                        ) : (
                          <p className="text-gray-700 p-2 bg-gray-50 rounded text-xs">{profile?.website || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Meine Aktivitäten</CardTitle>
                  <p className="text-xs text-gray-500">
                    Übersicht über Event-Teilnahmen, Anfragen, Spielgruppen und Spielemarkt-Angebote
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue={
                      activeTab === "activities" ? "events-member" : activeTab.split("-")[0] || "events-member"
                    }
                    className="w-full"
                  >
                    {/* Changed TabsList to grid with 4 columns for better layout */}
                    <TabsList className="grid grid-cols-4 w-full gap-1 bg-gray-50">
                      <TabsTrigger value="events-member" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <PiUserCircleCheck className="w-3 h-3 mr-1" />
                        Events (Teilnehmer)
                      </TabsTrigger>
                      <TabsTrigger value="my-events" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <PiUserCircleGear className="w-3 h-3 mr-1" />
                        Meine Events
                      </TabsTrigger>
                      <TabsTrigger value="groups-member" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <PiUserCircleCheck className="w-3 h-3 mr-1" />
                        Spielgruppe (Mitglied)
                      </TabsTrigger>
                      <TabsTrigger value="my-groups" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <PiUserCircleGear className="w-3 h-3 mr-1" />
                        Meine Spielgruppen
                      </TabsTrigger>
                      <TabsTrigger value="requests" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <PiUserCirclePlus className="w-3 h-3 mr-1" />
                        Anfragen
                      </TabsTrigger>
                      <TabsTrigger value="offers" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <Store className="w-3 h-3 mr-1" />
                        Angebote
                      </TabsTrigger>
                      <TabsTrigger value="search-ads" className="data-[state=active]:bg-teal-100 text-[10px] py-1.5">
                        <IoSearchCircle className="w-3 h-3 mr-1" />
                        Suchanzeigen
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[500px] pr-4 mt-10">
                      {/* Events (Mitglied) Tab */}
                      <TabsContent value="events-member" className="mt-0">
                        <div className="space-y-2">
                          {activityData.eventParticipations.length > 0 ? (
                            activityData.eventParticipations.map((participation) => {
                              const event = participation.event
                              const instances = event?.ludo_event_instances || []

                              const isInactive =
                                instances.length > 0
                                  ? instances.every((inst: any) => new Date(inst.instance_date) < new Date())
                                  : event?.first_instance_date && new Date(event.first_instance_date) < new Date() // Changed from event_date

                              const sortedInstances = [...instances].sort(
                                (a: any, b: any) =>
                                  new Date(a.instance_date).getTime() - new Date(b.instance_date).getTime(),
                              )

                              const games = event?.selected_games || []
                              let gameTitle = ""
                              if (games.length > 0) {
                                const firstGame = games[0]
                                if (typeof firstGame === "string") {
                                  try {
                                    const parsed = JSON.parse(firstGame)
                                    gameTitle = parsed.title || firstGame
                                  } catch {
                                    gameTitle = firstGame
                                  }
                                } else if (firstGame && typeof firstGame === "object" && "title" in firstGame) {
                                  gameTitle = firstGame.title
                                }
                              }

                              let datesDisplay = ""
                              if (sortedInstances.length > 0) {
                                const firstDates = sortedInstances.slice(0, 3).map((i: any) =>
                                  new Date(i.instance_date).toLocaleDateString("de-DE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }),
                                )
                                datesDisplay = firstDates.join(", ")
                                if (sortedInstances.length > 3) datesDisplay += " ..."
                              } else if (event?.first_instance_date) {
                                // Changed from event.event_date
                                datesDisplay = new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                  // Changed from event.event_date
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              }

                              return (
                                <div
                                  key={participation.id}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                    isInactive 
                                      ? "bg-gray-100 border-gray-200 opacity-60 cursor-default" 
                                      : "bg-blue-50 border-blue-100 cursor-pointer hover:bg-blue-100"
                                  }`}
                                  onClick={() => !isInactive && router.push(`/ludo-events?view=${participation.event_id}`)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${isInactive ? "text-gray-500" : "text-gray-900"}`}>
                                      {event?.title || "Unbekanntes Event"}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {datesDisplay} • {event?.location}
                                      {gameTitle && ` • ${gameTitle}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {!isInactive && (
                                      <Badge
                                        className={`text-[9px] h-4 mr-1 ${
                                          participation.status === "confirmed"
                                            ? "bg-green-100 text-green-700"
                                            : participation.status === "pending"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {participation.status === "confirmed"
                                          ? "Bestätigt"
                                          : participation.status === "pending"
                                            ? "Ausstehend"
                                            : participation.status}
                                      </Badge>
                                    )}
                                    {!isInactive && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleLeaveEvent(participation.id)
                                        }}
                                        title="Event verlassen"
                                      >
                                        <LogOut className="w-3 h-3 text-red-600" />
                                      </Button>
                                    )}
                                  </div>
                                  {isInactive && (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Abgelaufen
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">Du nimmst an keinem Events teil</p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Meine Events Tab */}
                      <TabsContent value="my-events" className="mt-0">
                        <div className="space-y-2">
                          {activityData.createdEvents.length > 0 ? (
                            activityData.createdEvents.map((event) => {
                              const instances = event?.ludo_event_instances || []

                              const isInactive =
                                instances.length > 0
                                  ? instances.every((inst: any) => new Date(inst.instance_date) < new Date())
                                  : event?.first_instance_date && new Date(event.first_instance_date) < new Date() // Changed from event_date

                              const sortedInstances = [...instances].sort(
                                (a: any, b: any) =>
                                  new Date(a.instance_date).getTime() - new Date(b.instance_date).getTime(),
                              )

                              const games = event.selected_games || []
                              let gameTitle = ""
                              if (games.length > 0) {
                                const firstGame = games[0]
                                if (typeof firstGame === "string") {
                                  try {
                                    const parsed = JSON.parse(firstGame)
                                    gameTitle = parsed.title || firstGame
                                  } catch {
                                    gameTitle = firstGame
                                  }
                                } else if (firstGame && typeof firstGame === "object" && "title" in firstGame) {
                                  gameTitle = firstGame.title
                                }
                              }

                              let datesDisplay = ""
                              if (sortedInstances.length > 0) {
                                const firstDates = sortedInstances.slice(0, 3).map((i: any) =>
                                  new Date(i.instance_date).toLocaleDateString("de-DE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }),
                                )
                                datesDisplay = firstDates.join(", ")
                                if (sortedInstances.length > 3) datesDisplay += " ..."
                              } else if (event.first_instance_date) {
                                // Changed from event.event_date
                                datesDisplay = new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                  // Changed from event.event_date
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              }

                              return (
                                <div
                                  key={event.id}
                                  className={`flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100 transition-colors ${
                                    isInactive ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-100"
                                  }`}
                                  onClick={(e) => {
                                    if (!isInactive) {
                                      router.push(`/ludo-events?view=${event.id}`)
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{event.title}</p>
                                    <p className="text-[10px] text-gray-500">
                                      {datesDisplay} • {event.location} • {gameTitle} •{" "}
                                      {event.ludo_event_participants?.length || 0}/{event.max_participants} Teilnehmer
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEventManagement(event)}
                                      className="h-7 text-xs px-2"
                                    >
                                      <Settings className="w-3 h-3 mr-1" />
                                      Event verwalten
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteEvent(event.id)
                                      }}
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    </Button>
                                  </div>
                                  {isInactive && (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Abgelaufen
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">Du hast noch keine Events erstellt</p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Spielgruppe (Mitglied) Tab */}
                      <TabsContent value="groups-member" className="mt-0">
                        <div className="space-y-2">
                          {activityData.communityMemberships.length > 0 ? (
                            activityData.communityMemberships.map((membership) => {
                              const community = membership.community
                              if (!community) return null

                              const isInactive = community.active === false

                              const memberCount = community.community_members?.length || 0
                              const joinedDate = new Date(membership.joined_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })

                              return (
                                <div
                                  key={membership.id}
                                  className="flex items-center justify-between p-2 bg-teal-50 rounded-lg border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors"
                                  onClick={() => router.push(`/ludo-gruppen?view=${community.id}`)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {community.image && (
                                      <img
                                        src={community.image || "/placeholder.svg"}
                                        alt={community.name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{community.name}</p>
                                      <p className="text-[10px] text-gray-500">
                                        Mitglied seit {joinedDate} • {community.location} • {memberCount} Mitglieder
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openMembershipPolls(community)
                                      }}
                                      title="Abstimmungen"
                                    >
                                      <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleLeaveCommunity(membership.id)
                                      }}
                                      title="Austreten"
                                    >
                                      <LogOut className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                  {isInactive && (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Inaktiv
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                              Du bist in keiner Spielgruppe Mitglied
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Meine Spielgruppen Tab */}
                      <TabsContent value="my-groups" className="mt-0">
                        <div className="space-y-2">
                          {activityData.createdCommunities.length > 0 ? (
                            activityData.createdCommunities.map((community) => {
                              const isInactive = community.active === false

                              const memberCount = community.community_members?.length || 0
                              const createdDate = new Date(community.created_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })

                              return (
                                <div
                                  key={community.id}
                                  className="flex items-center justify-between p-2 bg-teal-50 rounded-lg border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors"
                                  onClick={() => router.push(`/ludo-gruppen?view=${community.id}`)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {community.image && (
                                      <img
                                        src={community.image || "/placeholder.svg"}
                                        alt={community.name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{community.name}</p>
                                      <p className="text-[10px] text-gray-500">
                                        Erstellt am {createdDate} • {community.location} • {memberCount} Mitglieder
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openGroupManagement(community)}
                                      className="h-7 text-xs px-2"
                                    >
                                      <Settings className="w-3 h-3 mr-1" />
                                      Gruppe verwalten
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteCommunity(community.id)
                                      }}
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    </Button>
                                  </div>
                                  {isInactive && (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Inaktiv
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                              Du hast noch keine Spielgruppen erstellt
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Anfragen Tab */}
                      <TabsContent value="requests" className="mt-0">
                        <div className="space-y-3">
                          {/* Friend Requests */}
                          {activityData.friendRequests.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Freundschaftsanfragen</p>
                              {activityData.friendRequests.map((request) => {
                                const isReceived = request.to_user_id === user?.id
                                const otherUser = isReceived ? request.from_user : request.to_user

                                return (
                                  <div
                                    key={request.id}
                                    className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={getUserAvatar(otherUser?.id || "", otherUser?.avatar)} />
                                        <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{otherUser?.name}</p>
                                        <p className="text-[10px] text-gray-500">
                                          {isReceived ? "Möchte dein Freund sein" : "Anfrage gesendet"}
                                          <Badge
                                            className={`ml-1 h-4 px-1 text-[8px] ${
                                              request.status === "pending"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : request.status === "accepted"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {request.status === "pending"
                                              ? "Ausstehend"
                                              : request.status === "accepted"
                                                ? "Angenommen"
                                                : "Abgelehnt"}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                    {isReceived && request.status === "pending" && (
                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-[10px]"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAcceptFriendRequest(request.id)
                                          }}
                                          title="Annehmen"
                                        >
                                          <Check className="w-3 h-3 text-green-600 mr-1" />
                                          Annehmen
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRejectFriendRequest(request.id)
                                          }}
                                          title="Ablehnen"
                                        >
                                          <X className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Event Join Requests */}
                          {activityData.eventJoinRequests.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Teilnahmeanfragen</p>
                              {activityData.eventJoinRequests.map((request) => {
                                const isMyEvent = request.event?.creator_id === user?.id
                                return (
                                  <div
                                    key={request.id}
                                    className="flex items-center justify-between p-2 bg-purple-50/50 rounded-lg border border-purple-100/50"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {isMyEvent && (
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={getUserAvatar(request.user?.id || "", request.user?.avatar)} />
                                          <AvatarFallback className="text-[9px]">
                                            {request.user?.name?.charAt(0) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                          {isMyEvent
                                            ? `${request.user?.name || request.user?.username} möchte teilnehmen`
                                            : "Deine Anfrage"}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                          {isMyEvent ? request.event?.title : "Deine Anfrage"} •{" "}
                                          {new Date(request.created_at).toLocaleDateString("de-DE")}
                                        </p>
                                      </div>
                                    </div>
                                    {isMyEvent ? (
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Annehmen">
                                          <Check className="w-3 h-3 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Ablehnen">
                                          <X className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge className="text-[9px] h-4 bg-yellow-100 text-yellow-700">Ausstehend</Badge>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {activityData.friendRequests.length === 0 && activityData.eventJoinRequests.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Keine Anfragen vorhanden</p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Angebote Tab */}
                      <TabsContent value="offers" className="mt-0">
                        <div className="space-y-2">
                          {activityData.marketplaceOffers.length > 0 ? (
                            activityData.marketplaceOffers.map((offer) => {
                              const typeMap: { [key: string]: string } = {
                                sell: "Verkaufsangebot",
                                trade: "Tauschangebot",
                                lend: "Mietangebot",
                              }

                              const prefixMap: { [key: string]: string } = {
                                sell: "Verkaufe:",
                                trade: "Tausche:",
                                lend: "Vermiete:",
                              }

                              // Extract trade game from description for trade offers
                              // Updated trade offers to show "Offen für Vorschläge" or "gegen [game]"
                              let tradeGameInfo = ""
                              if (offer.type === "trade" && offer.description) {
                                // Check if "offen für vorschläge" is in description
                                if (
                                  offer.description.toLowerCase().includes("offen für vorschläge") ||
                                  offer.description.toLowerCase().includes("offen für alles") ||
                                  offer.description.toLowerCase().includes("alle angebote willkommen")
                                ) {
                                  tradeGameInfo = " (Offen für Vorschläge)"
                                } else {
                                  // Try to extract specific game
                                  const tradeMatch = offer.description.match(/gegen\s+(.+?)(?:[,.]|$)/i)
                                  if (tradeMatch) {
                                    tradeGameInfo = ` gegen ${tradeMatch[1].trim()}`
                                  }
                                }
                              }

                              return (
                                <div
                                  key={offer.id}
                                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer bg-orange-50/50 hover:bg-orange-100 transition-colors p-2 rounded-lg border border-orange-200"
                                  onClick={() => router.push(`/marketplace?view=${offer.id}`)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {offer.image && (
                                      <img
                                        src={offer.image || "/placeholder.svg"}
                                        alt={offer.title}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">
                                        {prefixMap[offer.type] || ""} {offer.title}
                                        {tradeGameInfo}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {typeMap[offer.type] || offer.type}
                                        {offer.price && ` • ${offer.price}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleOfferStatus(offer.id, offer.active)
                                      }}
                                      title={offer.active ? "Pausieren" : "Aktivieren"}
                                    >
                                      {offer.active ? (
                                        <Pause className="w-3 h-3 text-amber-600" />
                                      ) : (
                                        <Play className="w-3 h-3 text-green-600" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openOfferManagement(offer)
                                      }}
                                      title="Bearbeiten"
                                    >
                                      <Edit className="w-3 h-3 text-orange-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteOffer(offer.id)
                                      }}
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                  {offer.active ? (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-green-100 text-green-700">
                                      Aktiv
                                    </Badge>
                                  ) : (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Inaktiv
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                              Du hast noch keine Angebote erstellt
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Suchanzeigen Tab */}
                      <TabsContent value="search-ads" className="mt-0">
                        <div className="space-y-2">
                          {activityData.searchAds.length > 0 ? (
                            activityData.searchAds.map((ad) => {
                              const typeMap: { [key: string]: string } = {
                                buy: "Kaufgesuch",
                                trade: "Tauschgesuch",
                                rent: "Mietgesuch",
                              }

                              let tradeInfo = ""
                              if (ad.trade_game_title) {
                                tradeInfo = ` • Biete: ${ad.trade_game_title}`
                              }

                              let durationInfo = ""
                              if (ad.rental_duration) {
                                durationInfo = ` • Dauer: ${ad.rental_duration}`
                              }

                              return (
                                <div
                                  key={ad.id}
                                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer bg-purple-50/50 hover:bg-purple-100 transition-colors p-2 rounded-lg border border-purple-200"
                                  onClick={() => router.push(`/marketplace?viewAd=${ad.id}`)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{ad.title}</p>
                                    <p className="text-[10px] text-gray-500">
                                      {typeMap[ad.type] || ad.type}
                                      {ad.max_price && ` • bis ${ad.max_price}`}
                                      {tradeInfo}
                                      {durationInfo}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleAdStatus(ad.id, ad.active)
                                      }}
                                      title={ad.active ? "Pausieren" : "Aktivieren"}
                                    >
                                      {ad.active ? (
                                        <Pause className="w-3 h-3 text-amber-600" />
                                      ) : (
                                        <Play className="w-3 h-3 text-green-600" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openSearchAdManagement(ad)
                                      }}
                                      title="Bearbeiten"
                                    >
                                      <Edit className="w-3 h-3 text-amber-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteAd(ad.id)
                                      }}
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                  {ad.active ? (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-green-100 text-green-700">
                                      Aktiv
                                    </Badge>
                                  ) : (
                                    <Badge className="ml-1 h-4 px-1 text-[8px] bg-gray-100 text-gray-600">
                                      Inaktiv
                                    </Badge>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                              Du hast noch keine Suchanzeigen erstellt
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationsTab
                notificationPreferences={notificationPreferences}
                onPreferenceChange={handleNotificationPreferenceChange}
              />
            </TabsContent>

            <TabsContent value="privacy">
              <PrivacyTab />
            </TabsContent>

            <TabsContent value="security">
              <SecurityTab
                onChangePassword={() => setShowPasswordDialog(true)}
                onDeleteAccount={() => setShowDeleteDialog(true)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Event Management Dialog */}
      <Dialog open={isEventManagementOpen} onOpenChange={setIsEventManagementOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg"
              >
                <Settings className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Event verwalten</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">{managementEvent?.title}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={eventManagementTab} onValueChange={(v) => setEventManagementTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="edit" className="flex items-center gap-1 text-xs">
                <Edit className="h-3 w-3" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="dates" className="flex items-center gap-1 text-xs">
                <CalendarDays className="h-3 w-3" />
                Termine
              </TabsTrigger>
              <TabsTrigger value="participants" className="flex items-center gap-1 text-xs">
                <FaUsers className="h-3 w-3" />
                Teilnehmer
              </TabsTrigger>
              <TabsTrigger value="invite" className="flex items-center gap-1 text-xs">
                <FaUserPlusIcon className="h-3 w-3" />
                Einladen
              </TabsTrigger>
              <TabsTrigger value="polls" className="flex items-center gap-1 text-xs">
                <FaPoll className="h-3 w-3" />
                Abstimmungen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              {editingEvent && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="event-title" className="text-xs font-medium">
                      Event-Titel
                    </Label>
                    <Input
                      id="event-title"
                      value={editingEvent.title || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      placeholder="z.B. CATAN Spielabend"
                      className="h-11 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="event-description" className="text-xs font-medium">
                      Beschreibung
                    </Label>
                    <RichTextEditor
                      value={editingEvent.description || ""}
                      onChange={(value) => setEditingEvent({ ...editingEvent, description: value })}
                      placeholder="Beschreibe dein Event..."
                      maxLength={5000}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="event-date" className="text-xs font-medium">
                        Datum
                      </Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={editingEvent.first_instance_date || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, first_instance_date: e.target.value })}
                        className="h-11 text-xs"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="event-time" className="text-xs font-medium">
                        Uhrzeit
                      </Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={editingEvent.start_time || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                        className="h-11 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="event-location" className="text-xs font-medium">
                      Standort
                    </Label>
                    <AddressAutocomplete
                      label=""
                      placeholder="Location, Adresse, PLZ oder Ort eingeben..."
                      value={editingEvent.location || ""}
                      onChange={(value) => setEditingEvent({ ...editingEvent, location: value })}
                      className="h-11 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="max-participants" className="text-xs font-medium">
                      Max. Teilnehmer
                    </Label>
                    <Input
                      id="max-participants"
                      type="number"
                      value={editingEvent.max_participants || ""}
                      onChange={(e) =>
                        setEditingEvent({
                          ...editingEvent,
                          max_participants: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Leer lassen für unbegrenzt"
                      className="h-11 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Event-Bilder</Label>
                    {eventImagePreviews.length === 0 ? (
                      <div
                        onClick={() => document.getElementById("event-image-edit")?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                      >
                        <FaImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xs font-medium text-gray-700 mb-1">Klicken zum Hochladen</p>
                        <p className="text-xs text-gray-500">JPG, PNG oder WebP (max. 5MB pro Bild)</p>
                        <Input
                          id="event-image-edit"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleEventImageUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {eventImagePreviews.map((preview, index) => (
                            <div key={index} className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                              <img
                                src={preview || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEventImagePreviews((prev) => prev.filter((_, i) => i !== index))
                                  setEventImageFiles((prev) => prev.filter((_, i) => i !== index))
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <FaTimes className="h-3 w-3" />
                              </button>
                              {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                  Hauptbild
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {eventImagePreviews.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("event-image-edit")?.click()}
                            className="w-full text-xs"
                          >
                            <FaPlus className="h-3 w-3 mr-2" />
                            Weitere Bilder hinzufügen ({eventImagePreviews.length}/5)
                          </Button>
                        )}
                        <Input
                          id="event-image-edit"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleEventImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsEventManagementOpen(false)} className="flex-1">
                      Abbrechen
                    </Button>
                    <Button
                      onClick={updateEvent}
                      disabled={isUpdating}
                      className="flex-1 bg-teal-500 hover:bg-teal-600"
                    >
                      {isUpdating ? "Wird gespeichert..." : "Änderungen speichern"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Termine Tab */}
            <TabsContent value="dates" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Event-Termine</h3>
                  <span className="text-xs text-gray-500">{eventInstances.length} Termin(e)</span>
                </div>
                
                {eventInstances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Keine Termine vorhanden</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {eventInstances.map((instance) => (
                      <div
                        key={instance.id}
                        className={`p-3 rounded-lg border ${
                          new Date(instance.instance_date) < new Date() 
                            ? "bg-gray-50 border-gray-200 opacity-60" 
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        {editingInstance?.id === instance.id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Datum</Label>
                                <Input
                                  type="date"
                                  value={editingInstance.instance_date || ""}
                                  onChange={(e) => setEditingInstance({...editingInstance, instance_date: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Startzeit</Label>
                                <Input
                                  type="time"
                                  value={editingInstance.start_time || ""}
                                  onChange={(e) => setEditingInstance({...editingInstance, start_time: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Endzeit</Label>
                                <Input
                                  type="time"
                                  value={editingInstance.end_time || ""}
                                  onChange={(e) => setEditingInstance({...editingInstance, end_time: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Max. Teilnehmer</Label>
                                <Input
                                  type="number"
                                  value={editingInstance.max_participants || ""}
                                  onChange={(e) => setEditingInstance({...editingInstance, max_participants: e.target.value ? parseInt(e.target.value) : null})}
                                  placeholder="Unbegrenzt"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Notizen</Label>
                                <Input
                                  value={editingInstance.notes || ""}
                                  onChange={(e) => setEditingInstance({...editingInstance, notes: e.target.value})}
                                  placeholder="Optionale Notizen"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateInstance} className="flex-1 h-7 text-xs bg-teal-500 hover:bg-teal-600">
                                Speichern
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {setEditingInstance(null); setIsEditingInstance(false)}} className="flex-1 h-7 text-xs bg-transparent">
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                  {new Date(instance.instance_date).toLocaleDateString("de-DE", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                                {new Date(instance.instance_date) < new Date() && (
                                  <Badge className="text-[8px] h-4 bg-gray-200 text-gray-600">Vergangen</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {instance.start_time && `${instance.start_time.slice(0,5)}`}
                                {instance.end_time && ` - ${instance.end_time.slice(0,5)}`}
                                {instance.max_participants && ` • Max. ${instance.max_participants} Teilnehmer`}
                                {instance.notes && ` • ${instance.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingInstance(instance)
                                  setIsEditingInstance(true)
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDeleteInstance(instance.id)}
                                disabled={eventInstances.length <= 1}
                                title={eventInstances.length <= 1 ? "Mindestens ein Termin erforderlich" : "Termin löschen"}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="participants" className="space-y-4">
              <div className="px-4 py-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast({
                      description: "Nachrichtenfunktion wird bald verfügbar sein",
                    })
                  }
                  className="flex-1 h-9 text-xs border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 font-medium"
                >
                  <FaBullhorn className="h-3.5 w-3.5 mr-1.5" />
                  Nachricht an alle Teilnehmer senden
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateEventParticipantsPDF(managementEvent)}
                  className="h-9 text-xs border-2 border-blue-500 text-blue-700 hover:bg-blue-50 font-medium"
                  title="Teilnehmerliste als PDF herunterladen"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>

              <div className="space-y-2 px-4 pb-4 max-h-[55vh] overflow-y-auto">
                {loadingEventParticipants ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-3"></div>
                    <p className="text-sm text-gray-600 font-medium">Lade Teilnehmer...</p>
                  </div>
                ) : eventParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FaUsers className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Keine Teilnehmer in diesem Event</p>
                    <p className="text-xs text-gray-500 mt-0.5">Warte auf neue Anmeldungen</p>
                  </div>
                ) : (
                  eventParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded-lg shadow-sm bg-white hover:border-teal-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserAvatar(participant.user.id, participant.user.avatar)} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs">
                            {participant.user.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <button
                            onClick={() => {
                              setProfileModalUserId(participant.user_id)
                              setIsProfileModalOpen(true)
                            }}
                            className="text-xs font-medium text-gray-800 hover:text-teal-600 hover:underline transition-colors text-left"
                          >
                            {participant.user.username}
                          </button>
                          <span className="text-xs text-gray-500">
                            {participant.user_id === managementEvent?.creator_id ? (
                              "Admin"
                            ) : (
                              <>
                                Mitglied • Beigetreten am{" "}
                                {new Date(participant.joined_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {participant.user_id !== user?.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveParticipant(participant.user_id, "event")}
                          className="h-8 px-3 group relative hover:bg-red-600 active:scale-95 transition-all duration-150"
                        >
                          <FaUserMinus className="h-4 w-4 text-white" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="invite" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <p className="text-xs font-semibold text-teal-700">
                    {friends.length} {friends.length === 1 ? "Freund" : "Freunde"} verfügbar
                  </p>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                  {friends.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <FaUserFriends className="h-6 w-6 text-gray-400" />
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
                          <AvatarImage src={getUserAvatar(friend.id, friend.avatar)} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs">
                            {friend.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">{friend.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFriends([])}
                  className="flex-1 h-8 text-xs"
                >
                  Auswahl löschen
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    handleInviteFriends(managementEvent?.id || managementGroup?.id, managementEvent ? "event" : "group")
                  }
                  disabled={selectedFriends.length === 0}
                  className="flex-1 h-8 text-xs bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
                >
                  <FaUserPlusIcon className="mr-1.5 h-3 w-3" /> {/* Use FaUserPlusIcon */}
                  {selectedFriends.length > 0 ? `${selectedFriends.length} einladen` : "Einladen"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="polls" className="space-y-4 mt-4">
              <Tabs value={activePollTab} onValueChange={(v) => setActivePollTab(v as any)} className="w-full">
                <TabsList className="grid w-auto grid-cols-3 bg-gray-100/80 p-0.5 rounded-lg">
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

                <TabsContent value="active" className="space-y-3 mt-3">
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

                                          toast({ description: "Abstimmung wurde abgeschlossen" })
                                          if (managementGroup) loadCommunityPolls(managementGroup.id)
                                          if (managementEvent) loadCommunityPolls(managementEvent.id)
                                        } catch (error) {
                                          console.error("[v0] Error closing poll:", error)
                                          toast({
                                            description: "Fehler beim Abschließen der Abstimmung",
                                            variant: "destructive",
                                          })
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
                                const optionVotes =
                                  poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
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
                                  <InfoCircle className="h-3 w-3" />
                                  Mehrfachauswahl möglich
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-3 mt-3">
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

                                        toast({ description: "Abstimmung wurde gelöscht" })
                                        if (managementGroup) loadCommunityPolls(managementGroup.id)
                                        if (managementEvent) loadCommunityPolls(managementEvent.id)
                                      } catch (error) {
                                        console.error("[v0] Error deleting poll:", error)
                                        toast({
                                          description: "Fehler beim Löschen der Abstimmung",
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                    className="text-red-600 hover:bg-red-50 border-red-300 px-2 h-7 text-xs"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 pt-0">
                              {poll.options?.map((option: any) => {
                                const optionVotes =
                                  poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
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
                                    className={`relative rounded-lg border-2 overflow-hidden ${
                                      isWinner ? "border-yellow-500" : "border-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`absolute inset-0 transition-all duration-300 ${
                                        isWinner ? "bg-gradient-to-r from-yellow-100 to-yellow-200" : "bg-gray-100"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />

                                    <div className="relative flex items-center justify-between px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        {isWinner && <FaStar className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />}
                                        <span
                                          className={`text-xs font-medium ${isWinner ? "text-yellow-900" : "text-gray-700"}`}
                                        >
                                          {option.option_text}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-xs font-semibold ${isWinner ? "text-yellow-800" : "text-gray-600"}`}
                                        >
                                          {percentage.toFixed(0)}%
                                        </span>
                                        <span
                                          className={`text-xs min-w-[3rem] text-right ${isWinner ? "text-yellow-700" : "text-gray-500"}`}
                                        >
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

                <TabsContent value="create" className="space-y-4 mt-3">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold">Frage *</Label>
                      <Input
                        value={newPoll.question || ""}
                        onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                        placeholder="z.B. Welches Spiel sollen wir spielen?"
                        className="h-11 text-xs mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Optionen *</Label>
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            value={option || ""}
                            onChange={(e) => {
                              const newOptions = [...newPoll.options]
                              newOptions[index] = e.target.value
                              setNewPoll({ ...newPoll, options: newOptions })
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="h-11 text-xs"
                          />
                          {newPoll.options.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = newPoll.options.filter((_, i) => i !== index)
                                setNewPoll({ ...newPoll, options: newOptions })
                              }}
                              className="h-11"
                            >
                              <FaTimes className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {newPoll.options.length < 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}
                          className="w-full mt-2 text-xs"
                        >
                          <FaPlus className="h-3 w-3 mr-2" />
                          Option hinzufügen
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="allow-multiple"
                        checked={newPoll.allow_multiple_votes}
                        onCheckedChange={(checked) =>
                          setNewPoll({ ...newPoll, allow_multiple_votes: checked as boolean })
                        }
                      />
                      <Label htmlFor="allow-multiple" className="text-xs font-bold">
                        Mehrfachauswahl erlauben
                      </Label>
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Läuft ab am (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={newPoll.expires_at || ""}
                        onChange={(e) => setNewPoll({ ...newPoll, expires_at: e.target.value })}
                        className="h-11 text-xs mt-2"
                      />
                    </div>

                    <Button
                      onClick={() => createPoll(managementEvent?.id || managementGroup?.id)}
                      className="w-full bg-teal-500 hover:bg-teal-600"
                    >
                      Abstimmung erstellen
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupManagementOpen} onOpenChange={setIsGroupManagementOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg"
              >
                <Settings className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Spielgruppe verwalten</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">{managementGroup?.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={groupManagementTab} onValueChange={(v) => setGroupManagementTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <FaUsers className="h-4 w-4" />
                Mitglieder
              </TabsTrigger>
              <TabsTrigger value="invite" className="flex items-center gap-2">
                <FaUserFriends className="h-4 w-4" />
                Freunde einladen
              </TabsTrigger>
              <TabsTrigger value="polls" className="flex items-center gap-2">
                <FaPoll className="h-4 w-4" />
                Abstimmungen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              {editingGroup && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="group-name" className="text-xs font-bold">
                      Name der Spielgruppe
                    </Label>
                    <Input
                      id="group-name"
                      value={editingGroup.name || ""}
                      onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      placeholder="z.B. CATAN-Freunde Zürich"
                      className="h-11 text-xs"
                      maxLength={60}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="group-description" className="text-xs font-bold">
                      Beschreibung
                    </Label>
                    <RichTextEditor
                      value={editingGroup.description || ""}
                      onChange={(value) => setEditingGroup({ ...editingGroup, description: value })}
                      placeholder="Beschreibe deine Spielgruppe..."
                      maxLength={5000}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="group-location" className="text-xs font-bold">
                      Standort
                    </Label>
                    <AddressAutocomplete
                      label=""
                      placeholder="Location, Adresse, PLZ oder Ort eingeben..."
                      value={editingGroup.location || ""}
                      onChange={(value) => setEditingGroup({ ...editingGroup, location: value })}
                      className="h-11 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="max-members-edit" className="text-xs font-bold">
                      Max. Mitglieder
                    </Label>
                    <Input
                      id="max-members-edit"
                      type="number"
                      value={editingGroup.max_members || ""}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          max_members: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Leer lassen für unbegrenzt"
                      className="h-11 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold">Spielgruppenbilder</Label>
                    {groupImagePreviews.length === 0 ? (
                      <div
                        onClick={() => document.getElementById("group-image-edit")?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
                      >
                        <FaImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xs font-medium text-gray-700 mb-1">Klicken zum Hochladen</p>
                        <p className="text-xs text-gray-500">JPG, PNG oder WebP (max. 5MB pro Bild)</p>
                        <Input
                          id="group-image-edit"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGroupImageUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {groupImagePreviews.map((preview, index) => (
                            <div key={index} className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                              <img
                                src={preview || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupImagePreviews((prev) => prev.filter((_, i) => i !== index))
                                  setGroupImageFiles((prev) => prev.filter((_, i) => i !== index))
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <FaTimes className="h-3 w-3" />
                              </button>
                              {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                  Hauptbild
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {groupImagePreviews.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("group-image-edit")?.click()}
                            className="w-full text-xs"
                          >
                            <FaPlus className="h-3 w-3 mr-2" />
                            Weitere Bilder hinzufügen ({groupImagePreviews.length}/5)
                          </Button>
                        )}
                        <Input
                          id="group-image-edit"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGroupImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="approval-mode-edit" className="text-xs font-bold mb-2 block">
                      Wie sollen neue Mitglieder beitreten können?
                    </Label>
                    <Select
                      value={editingGroup.approval_mode}
                      onValueChange={(value: "automatic" | "manual") =>
                        setEditingGroup({ ...editingGroup, approval_mode: value })
                      }
                    >
                      <SelectTrigger className="h-11 text-xs border-gray-300 focus:border-teal-500 focus:ring-teal-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Sofortiger Beitritt</SelectItem>
                        <SelectItem value="manual">Beitritt erst nach Genehmigung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    {editingGroup.approval_mode === "automatic" ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FaCheckCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900 mb-1">Sofortiger Beitritt</p>
                            <p className="text-xs text-gray-600">
                              Interessenten können der Spielgruppe sofort beitreten, ohne auf eine Genehmigung warten zu
                              müssen.
                            </p>
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

                  <div className="flex gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsGroupManagementOpen(false)} className="flex-1">
                      Abbrechen
                    </Button>
                    <Button
                      onClick={updateGroup}
                      disabled={isUpdating}
                      className="flex-1 bg-teal-500 hover:bg-teal-600"
                    >
                      {isUpdating ? "Wird gespeichert..." : "Änderungen speichern"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="px-4 py-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast({
                      description: "Nachrichtenfunktion wird bald verfügbar sein",
                    })
                  }
                  className="flex-1 h-9 text-xs border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 font-medium"
                >
                  <FaBullhorn className="h-3.5 w-3.5 mr-1.5" />
                  Nachricht an alle Mitglieder senden
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateGroupMembersPDF(managementGroup)}
                  className="h-9 text-xs border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-medium"
                  title="Mitgliederliste als PDF herunterladen"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>

              <div className="space-y-2 px-4 pb-4 max-h-[55vh] overflow-y-auto">
                {loadingGroupMembers ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-3"></div>
                    <p className="text-sm text-gray-600 font-medium">Lade Mitglieder...</p>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FaUsers className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Keine Mitglieder in dieser Gruppe</p>
                    <p className="text-xs text-gray-500 mt-0.5">Warte auf neue Beitrittsanfragen</p>
                  </div>
                ) : (
                  groupMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded-lg shadow-sm bg-white hover:border-teal-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserAvatar(member.user?.id || "", member.user?.avatar)} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs">
                            {member.user?.name?.[0] || member.user?.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
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
                          <span className="text-gray-500 text-xs">
                            {member.user_id === managementGroup?.creator_id ? (
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
                      </div>
                      {member.user_id !== user?.id && member.user_id !== managementGroup?.creator_id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveParticipant(member.user_id, "group")}
                          className="h-8 px-3 group relative hover:bg-red-600 active:scale-95 transition-all duration-150"
                        >
                          <FaUserMinus className="h-4 w-4 text-white" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="invite" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <p className="text-xs font-semibold text-teal-700">
                    {friends.length} {friends.length === 1 ? "Freund" : "Freunde"} verfügbar
                  </p>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                  {friends.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <FaUserFriends className="h-6 w-6 text-gray-400" />
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
                          <AvatarImage src={getUserAvatar(friend.id, friend.avatar)} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs">
                            {friend.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">{friend.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFriends([])}
                  className="flex-1 h-8 text-xs"
                >
                  Auswahl löschen
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    handleInviteFriends(managementEvent?.id || managementGroup?.id, managementEvent ? "event" : "group")
                  }
                  disabled={selectedFriends.length === 0}
                  className="flex-1 h-8 text-xs bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
                >
                  <FaUserPlusIcon className="mr-1.5 h-3 w-3" /> {/* Use FaUserPlusIcon */}
                  {selectedFriends.length > 0 ? `${selectedFriends.length} einladen` : "Einladen"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="polls" className="space-y-4 mt-4">
              <Tabs value={activePollTab} onValueChange={(v) => setActivePollTab(v as any)} className="w-full">
                <TabsList className="grid w-auto grid-cols-3 bg-gray-100/80 p-0.5 rounded-lg">
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

                <TabsContent value="active" className="space-y-3 mt-3">
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

                                          toast({ description: "Abstimmung wurde abgeschlossen" })
                                          if (managementGroup) loadCommunityPolls(managementGroup.id)
                                          if (managementEvent) loadCommunityPolls(managementEvent.id)
                                        } catch (error) {
                                          console.error("[v0] Error closing poll:", error)
                                          toast({
                                            description: "Fehler beim Abschließen der Abstimmung",
                                            variant: "destructive",
                                          })
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
                                const optionVotes =
                                  poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
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
                                  <InfoCircle className="h-3 w-3" />
                                  Mehrfachauswahl möglich
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-3 mt-3">
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

                                        toast({ description: "Abstimmung wurde gelöscht" })
                                        if (managementGroup) loadCommunityPolls(managementGroup.id)
                                        if (managementEvent) loadCommunityPolls(managementEvent.id)
                                      } catch (error) {
                                        console.error("[v0] Error deleting poll:", error)
                                        toast({
                                          description: "Fehler beim Löschen der Abstimmung",
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                    className="text-red-600 hover:bg-red-50 border-red-300 px-2 h-7 text-xs"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 pt-0">
                              {poll.options?.map((option: any) => {
                                const optionVotes =
                                  poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
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
                                    className={`relative rounded-lg border-2 overflow-hidden ${
                                      isWinner ? "border-yellow-500" : "border-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`absolute inset-0 transition-all duration-300 ${
                                        isWinner ? "bg-gradient-to-r from-yellow-100 to-yellow-200" : "bg-gray-100"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />

                                    <div className="relative flex items-center justify-between px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        {isWinner && <FaStar className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />}
                                        <span
                                          className={`text-xs font-medium ${isWinner ? "text-yellow-900" : "text-gray-700"}`}
                                        >
                                          {option.option_text}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-xs font-semibold ${isWinner ? "text-yellow-800" : "text-gray-600"}`}
                                        >
                                          {percentage.toFixed(0)}%
                                        </span>
                                        <span
                                          className={`text-xs min-w-[3rem] text-right ${isWinner ? "text-yellow-700" : "text-gray-500"}`}
                                        >
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

                <TabsContent value="create" className="space-y-4 mt-3">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold">Frage *</Label>
                      <Input
                        value={newPoll.question || ""}
                        onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                        placeholder="z.B. Welches Spiel sollen wir spielen?"
                        className="h-11 text-xs mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Optionen *</Label>
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            value={option || ""}
                            onChange={(e) => {
                              const newOptions = [...newPoll.options]
                              newOptions[index] = e.target.value
                              setNewPoll({ ...newPoll, options: newOptions })
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="h-11 text-xs"
                          />
                          {newPoll.options.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = newPoll.options.filter((_, i) => i !== index)
                                setNewPoll({ ...newPoll, options: newOptions })
                              }}
                              className="h-11"
                            >
                              <FaTimes className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {newPoll.options.length < 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}
                          className="w-full mt-2 text-xs"
                        >
                          <FaPlus className="h-3 w-3 mr-2" />
                          Option hinzufügen
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="allow-multiple"
                        checked={newPoll.allow_multiple_votes}
                        onCheckedChange={(checked) =>
                          setNewPoll({ ...newPoll, allow_multiple_votes: checked as boolean })
                        }
                      />
                      <Label htmlFor="allow-multiple" className="text-xs font-bold">
                        Mehrfachauswahl erlauben
                      </Label>
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Läuft ab am (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={newPoll.expires_at || ""}
                        onChange={(e) => setNewPoll({ ...newPoll, expires_at: e.target.value })}
                        className="h-11 text-xs mt-2"
                      />
                    </div>

                    <Button
                      onClick={() => createPoll(managementEvent?.id || managementGroup?.id)}
                      className="w-full bg-teal-500 hover:bg-teal-600"
                    >
                      Abstimmung erstellen
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Membership Polls Dialog - für Spielgruppen wo User nur Mitglied ist */}
      <Dialog open={isMembershipPollsOpen} onOpenChange={setIsMembershipPollsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Abstimmungen - {membershipPollsCommunity?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Stimme bei laufenden Abstimmungen ab
            </DialogDescription>
          </DialogHeader>

          <Tabs value={membershipPollTab} onValueChange={(v) => setMembershipPollTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-0.5 rounded-lg">
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
            </TabsList>

            <TabsContent value="active" className="space-y-3 mt-3">
              {membershipPolls.filter(
                (poll) => poll.is_active && (!poll.expires_at || new Date(poll.expires_at) > new Date()),
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Keine laufenden Abstimmungen</p>
                  <p className="text-xs text-gray-500 mt-0.5">Warte auf neue Abstimmungen vom Gruppenleiter</p>
                </div>
              ) : (
                membershipPolls
                  .filter((poll) => poll.is_active && (!poll.expires_at || new Date(poll.expires_at) > new Date()))
                  .map((poll) => {
                    const totalVotes = poll.votes?.length || 0
                    const userHasVoted = membershipUserVotes[poll.id]?.length > 0

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
                            {userHasVoted && (
                              <Badge variant="default" className="bg-teal-500 text-white text-xs px-1.5 h-5">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Abgestimmt
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5 pt-0">
                          {poll.options?.map((option: any) => {
                            const optionVotes =
                              poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
                            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
                            const userVoted = membershipUserVotes[poll.id]?.includes(option.id)

                            return (
                              <button
                                key={option.id}
                                onClick={() => handleMembershipVote(poll.id, option.id)}
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
                                      <CheckCircle className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
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
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-3">
              {membershipPolls.filter(
                (poll) => !poll.is_active || (poll.expires_at && new Date(poll.expires_at) <= new Date()),
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Keine abgeschlossenen Abstimmungen</p>
                </div>
              ) : (
                membershipPolls
                  .filter((poll) => !poll.is_active || (poll.expires_at && new Date(poll.expires_at) <= new Date()))
                  .map((poll) => {
                    const totalVotes = poll.votes?.length || 0

                    return (
                      <Card key={poll.id} className="border-2 border-gray-200 bg-gray-50/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-700 leading-tight">{poll.question}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <span>
                                  {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"} insgesamt
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs px-1.5 h-5">
                              Beendet
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5 pt-0">
                          {poll.options?.map((option: any) => {
                            const optionVotes =
                              poll.votes?.filter((v: any) => v.option_id === option.id).length || 0
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
                                className={`relative rounded-lg border-2 overflow-hidden ${
                                  isWinner ? "border-yellow-500" : "border-gray-200"
                                }`}
                              >
                                <div
                                  className={`absolute inset-0 transition-all duration-300 ${
                                    isWinner ? "bg-gradient-to-r from-yellow-100 to-yellow-200" : "bg-gray-100"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />

                                <div className="relative flex items-center justify-between px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    {isWinner && <Star className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />}
                                    <span
                                      className={`text-xs font-medium ${isWinner ? "text-yellow-900" : "text-gray-700"}`}
                                    >
                                      {option.option_text}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-semibold ${isWinner ? "text-yellow-800" : "text-gray-600"}`}
                                    >
                                      {percentage.toFixed(0)}%
                                    </span>
                                    <span
                                      className={`text-xs min-w-[3rem] text-right ${isWinner ? "text-yellow-700" : "text-gray-500"}`}
                                    >
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
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Offer Management Form (uses same component as create) */}
      <CreateMarketplaceOfferForm
        isOpen={isOfferManagementOpen}
        onClose={() => {
          setIsOfferManagementOpen(false)
          setManagementOffer(null)
        }}
        onSuccess={() => {
          loadActivities()
          toast({ title: "Angebot aktualisiert", description: "Deine Änderungen wurden gespeichert." })
        }}
        editMode={true}
        editData={managementOffer}
      />

      {/* Search Ad Management Form (uses same component as create) */}
      <CreateSearchAdForm
        isOpen={isSearchAdManagementOpen}
        onClose={() => {
          setIsSearchAdManagementOpen(false)
          setManagementSearchAd(null)
        }}
        onSuccess={() => {
          loadActivities()
          toast({ title: "Suchanzeige aktualisiert", description: "Deine Änderungen wurden gespeichert." })
        }}
        editMode={true}
        editData={managementSearchAd}
      />
    </div>
  )
}
