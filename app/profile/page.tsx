"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useAvatar } from "@/contexts/avatar-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  MapPin,
  Edit2,
  Save,
  LogOut,
  Shield,
  Lock,
  Globe,
  X,
  Upload,
  RefreshCw,
  AlertTriangle,
  Users,
  Store,
  Check,
  Trash2,
  Pause,
  Play,
  Edit,
  BarChart3,
  Pencil,
  Bell,
  Settings,
  CheckCircle,
  Calendar,
} from "lucide-react"
import { IoSearchCircle } from "react-icons/io5"
import { PiUserCirclePlus } from "react-icons/pi"
import { PiUserCircleGear } from "react-icons/pi"
import { PiUserCircleCheck } from "react-icons/pi"
import { RxActivityLog } from "react-icons/rx"
import { CgProfile } from "react-icons/cg"
import { FaBell } from "react-icons/fa"
import { IoColorPaletteOutline } from "react-icons/io5"
import { FaXTwitter, FaInstagram } from "react-icons/fa6"
import { getAddressSuggestions } from "@/lib/actions/geocoding"
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
import { FaUserPlus } from "react-icons/fa"
import { FaComments } from "react-icons/fa"
import { FaBook } from "react-icons/fa"
import { FaChartBar } from "react-icons/fa"
import { getUserNotifications, markAllNotificationsAsRead, deleteNotification } from "@/app/actions/notifications"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const AVATAR_STYLES = [
  {
    id: "avataaars",
    name: "Flat (Vektorstil)",
    description: "Flächiger 2D-Stil ohne Tiefenwirkung; klare Konturen, leuchtende Vollfarben.",
  },
  { id: "micah", name: "Modern", description: "Stilvolle, minimalistische Avatare" },
  { id: "lorelei", name: "Minimalistisch", description: "Einfache Avatare, wenige Farben." },
  { id: "lorelei-neutral", name: "Klassisch", description: "Zeitlose, neutrale Avatare" },
  {
    id: "adventurer",
    name: "Cartoon / Comic",
    description: "Vereinfachte, oft humorvolle Zeichnungen mit übertriebenen Figuren.",
  },
  { id: "croodles", name: "Skizziert", description: "Handgezeichnete, verspielte Avatare" },
  { id: "croodles-neutral", name: "Doodle", description: "Bewusst roh und handgezeichnet wirkend." },
  { id: "notionists", name: "Professionell", description: "Schlichte, klare Avatare" },
  { id: "open-peeps", name: "Illustriert", description: "Handgezeichnete Illustrationen" },
]

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#98D8C8",
  "#FFEAA7",
  "#DDA0DD",
  "#98C8C8", // Corrected from 98C8C8 to 98D8C8
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8B500",
  "#00CED1",
  "#FF69B4",
  "#32CD32",
  "#FF4500",
]

interface ActivityData {
  // Events created by user
  createdEvents: any[]
  // Events user participates in
  eventParticipations: any[]
  // Friend requests (sent and received)
  friendRequests: any[]
  // Event join requests (sent and received)
  eventJoinRequests: any[]
  // Communities user is member of
  memberCommunities: any[]
  // Communities created by user
  createdCommunities: any[]
  // Marketplace offers
  marketplaceOffers: any[]
  // Search ads
  searchAds: any[]
  // Communities user is member of (for new tab structure)
  communityMemberships: any[] // Added for the new structure
}

interface ActivityItem {
  id: string
  type: "event" | "friend_request" | "community" | "marketplace"
  title: string
  description: string
  timestamp: Date
  icon: any
  status?: string
}

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
      return <FaUserPlus className="text-green-500" />
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
  const { user, loading: authLoading, signOut, updateProfile } = useAuth()
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

  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState("adventurer")
  const [avatarSeed, setAvatarSeed] = useState("")
  const [avatarBgColor, setAvatarBgColor] = useState("#4ECDC4")
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null) // New state for the generated avatar URL

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [addressSearching, setAddressSearching] = useState(false) // Added state for address searching
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
      // Added for marketplace notifications
      matching_offers: 2, // Default to 'Sofort'
      offer_responses: 2,
      price_changes: 1, // Default to 'Einmal pro Woche'
      expiring_offers: 2,
      new_releases: 1, // Default to 'Einmal pro Woche'
    },
    security: {
      login_attempts: 2,
      password_changes: 2,
      new_device_login: 2,
    },
  })
  const [loadingNotifPrefs, setLoadingNotifPrefs] = useState(false)

  const [activeTab, setActiveTab] = useState("profile") // Added for nested tabs

  const [activityData, setActivityData] = useState<ActivityData>({
    createdEvents: [],
    eventParticipations: [],
    friendRequests: [],
    eventJoinRequests: [],
    memberCommunities: [],
    createdCommunities: [],
    marketplaceOffers: [],
    searchAds: [],
    communityMemberships: [], // Initialized for new structure
  })
  const [loadingActivities, setLoadingActivities] = useState(true) // Changed to true to show spinner initially

  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationPreferences, setNotificationPreferences] = useState({
    // Soziales
    friend_request_in_app: true,
    friend_request_email: true,
    friend_accepted_in_app: true,
    friend_accepted_email: false,
    friend_declined_in_app: true,
    friend_declined_email: false,

    // Spielgruppen
    group_invitation_in_app: true,
    group_invitation_email: true,
    group_join_request_in_app: true,
    group_join_request_email: true,
    group_join_accepted_in_app: true,
    group_join_accepted_email: true,
    group_join_rejected_in_app: true,
    group_join_rejected_email: false,
    group_member_joined_in_app: true,
    group_member_joined_email: false,
    group_member_left_in_app: true,
    group_member_left_email: false,
    group_poll_created_in_app: true,
    group_poll_created_email: false,

    // Events
    event_invitation_in_app: true,
    event_invitation_email: true,
    event_join_request_in_app: true,
    event_join_request_email: true,
    event_join_accepted_in_app: true,
    event_join_accepted_email: true,
    event_join_rejected_in_app: true,
    event_join_rejected_email: false,
    event_participant_joined_in_app: true,
    event_participant_joined_email: false,
    event_participant_immediate_in_app: true,
    event_participant_immediate_email: false,
    // ADDED: event participant left and event cancellation notifications
    event_participant_left_in_app: true,
    event_participant_left_email: false,
    event_cancelled_in_app: true,
    event_cancelled_email: false,

    // Forum & Kommentare
    forum_reply_in_app: true,
    forum_reply_email: true,
    forum_reaction_in_app: true,
    forum_reaction_email: false,
    comment_reply_in_app: true,
    comment_reply_email: false,

    // Nachrichten
    // REMOVED: message_group_in_app, message_group_email, message_event_in_app, message_event_email, message_search_ad_in_app, message_search_ad_email, message_offer_in_app, message_offer_email
    // (These were removed in the updates, so they are not included here)

    // Spiel-Interaktionen
    game_shelf_request_in_app: true,
    game_shelf_request_email: true,
    game_interaction_request_in_app: true,
    game_interaction_request_email: true,
    marketplace_offer_request_in_app: true,
    marketplace_offer_request_email: true,

    // System
    system_maintenance_in_app: true,
    system_maintenance_email: true,
    system_feature_in_app: true,
    system_feature_email: false,
  })
  const [notificationTab, setNotificationTab] = useState("inbox")

  const userId = user?.id // Get user ID for notification functions

  const handleToggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    console.log("DEBUG: Toggling offer status for offerId:", offerId, "currentStatus:", currentStatus)
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
    console.log("DEBUG: Deleting offer with offerId:", offerId)
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
    console.log("DEBUG: Toggling ad status for adId:", adId, "currentStatus:", currentStatus)
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
    console.log("DEBUG: Deleting ad with adId:", adId)
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
    console.log("DEBUG: Deleting community with communityId:", communityId)
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
    console.log("DEBUG: Accepting friend request with requestId:", requestId)
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
    console.log("DEBUG: Rejecting friend request with requestId:", requestId)
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

  const handleDeleteEvent = async (eventId: string) => {
    console.log("DEBUG: Deleting event with eventId:", eventId)
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
    console.log("DEBUG: Leaving community with memberId:", memberId)
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

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
        setEditedProfile(data || {})
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setProfileLoading(false)
      }
    }

    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading, supabase])

  // Load activities on component mount
  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user])

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

  useEffect(() => {
    if (showAvatarCreator) {
      const seed = avatarSeed || `${Date.now()}`
      const url = generateAvatarUrl(avatarStyle, seed, avatarBgColor)
      setCurrentAvatarUrl(url)
      setGeneratedAvatar(url) // Also set generatedAvatar for saving
    }
  }, [avatarStyle, avatarBgColor, showAvatarCreator, avatarSeed])

  const handleAvatarSave = async () => {
    console.log("DEBUG: Saving generated avatar:", generatedAvatar)
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
    } finally {
      // In this specific function, there's no explicit uploading state,
      // but if there were, it would be reset here.
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
    console.log("DEBUG: Selected address:", address)
    setEditedProfile({ ...editedProfile, address })
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
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
        .from("users")

      if (error) throw error

      setProfile(editedProfile)
      setIsEditing(false)
      toast({
        title: "Erfolg",
        description: "Profil erfolgreich gespeichert.",
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
    console.log("DEBUG: Logging out user.")
    await signOut()
    router.push("/")
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
          event_id,
          event:ludo_events(id, title, first_instance_date, start_time, location, creator_id, selected_games, frequency, ludo_event_instances(id, instance_date))
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

      // Load event join requests (for events user created + requests user sent)
      const { data: eventJoinRequests } = await supabase
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
        .or(`user_id.eq.${user.id},event.creator_id.eq.${user.id}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      const { data: memberCommunities } = await supabase
        .from("community_members")
        .select(`
          id,
          role,
          joined_at,
          community:communities(id, name, image, creator_id, type, location, community_members(id), active)
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
          max_members,
          location,
          community_members(id)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      // Load marketplace offers with trade_game_title if it exists
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
          description
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Load search ads with trade_game_title and rental_duration
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
          rental_duration
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setActivityData({
        createdEvents: createdEvents || [],
        eventParticipations: eventParticipations || [],
        friendRequests: friendRequests || [],
        eventJoinRequests: eventJoinRequests || [],
        // Filter out communities where the user is the creator for memberCommunities
        memberCommunities: memberCommunities?.filter((m) => m.community?.creator_id !== user.id) || [],
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

  // NotificationPreferenceRow component moved inside ProfilePage to use its state and handlers directly.
  const NotificationPreferenceRow = ({
    label,
    inAppKey,
    emailKey,
  }: { label: string; inAppKey: string; emailKey: string }) => {
    const isEnabledInApp = notificationPreferences[inAppKey as keyof typeof notificationPreferences]
    const isEnabledEmail = notificationPreferences[emailKey as keyof typeof notificationPreferences]

    return (
      <div className="flex items-center justify-between py-3">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <Switch
              checked={isEnabledInApp}
              onCheckedChange={(checked) => handleNotificationPreferenceChange(inAppKey, checked)}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <Switch
              checked={isEnabledEmail}
              onCheckedChange={(checked) => handleNotificationPreferenceChange(emailKey, checked)}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            />
          </div>
        </div>
      </div>
    )
  }

  const saveNotificationPref = async (category: string, key: string, value: number) => {
    if (!user) return
    try {
      console.log("[v0] Saving notification pref:", { category, key, value })

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
    console.log("DEBUG: Deleting account.")
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
                    <AvatarImage src={profile?.avatar || user.avatar} />
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
            <TabsList className="grid grid-cols-4 gap-1 bg-gray-50">
              <TabsTrigger value="profile" className="data-[state=active]:bg-teal-100 text-xs">
                <CgProfile className="w-3 h-3 mr-1" />
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="data-[state=active]:bg-teal-100 text-xs"
                // Removed onClick={loadActivities} as it's now loaded on mount
              >
                <RxActivityLog className="w-3 h-3 mr-1" />
                Meine Aktivitäten
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-teal-100 text-xs"
                onClick={loadNotificationPrefs} // Corrected from loadNotificationPreferences
              >
                <FaBell className="w-3 h-3 mr-1" />
                Benachrichtigungen
              </TabsTrigger>
              <TabsTrigger value="privacy" className="data-[state=active]:bg-teal-100 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Privatsphäre
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-teal-100 text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Sicherheit
              </TabsTrigger>
            </TabsList>

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
                        <Save className="w-3 h-3 mr-1" />
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
                            placeholder="Straße, Hausnummer, PLZ, Ort"
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
                        Events (Mitglied)
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
                                  : event?.first_instance_date && new Date(event.first_instance_date) < new Date()

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
                                datesDisplay = new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              }

                              return (
                                <div
                                  key={participation.id}
                                  className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                                  onClick={() => router.push(`/ludo-events?view=${participation.event_id}`)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {event?.title || "Unbekanntes Event"}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {datesDisplay} • {event?.location}
                                      {gameTitle && ` • ${gameTitle}`}
                                    </p>
                                  </div>
                                  <Badge
                                    className={`text-[9px] h-4 ${
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
                                  : event?.first_instance_date && new Date(event.first_instance_date) < new Date()

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
                                datesDisplay = new Date(event.first_instance_date).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              }

                              return (
                                <div
                                  key={event.id}
                                  className={`flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors ${
                                    isInactive ? "opacity-60" : ""
                                  }`}
                                  onClick={() => router.push(`/ludo-events?view=${event.id}`)}
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
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-3 text-[10px]"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/ludo-events?view=${event.id}&manage=true`)
                                      }}
                                      title="Event verwalten"
                                    >
                                      <Settings className="w-3.5 h-3.5 text-blue-600 mr-1" />
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
                                        router.push(`/ludo-gruppen?view=${community.id}&polls=true`)
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
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-3 text-[10px]"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/ludo-gruppen?view=${community.id}&manage=true`)
                                      }}
                                      title="Gruppe verwalten"
                                    >
                                      <Settings className="w-3.5 h-3.5 text-teal-600 mr-1" />
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
                                      <Avatar className="w-8 h-8 border-2 border-purple-200">
                                        <AvatarImage src={otherUser?.avatar || "/placeholder-user.jpg"} />
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
                                          <AvatarImage src={request.user?.avatar || "/placeholder.svg"} />
                                          <AvatarFallback className="text-[9px]">
                                            {request.user?.name?.charAt(0) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                          {isMyEvent
                                            ? `${request.user?.name || request.user?.username} möchte teilnehmen`
                                            : request.event?.title}
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
                                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-orange-100 transition-colors p-2 rounded-lg"
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
                                        router.push(`/edit/angebot/${offer.id}`)
                                      }}
                                      title="Bearbeiten"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-orange-600" />
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
                                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-purple-100 transition-colors p-2 rounded-lg"
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
                                        router.push(`/edit/suchanzeige/${ad.id}`)
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
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Benachrichtigungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={notificationTab} onValueChange={setNotificationTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="inbox" className="flex items-center gap-2 text-xs">
                        <Bell className="w-3 h-3" />
                        Posteingang
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <Badge variant="destructive" className="ml-1 text-[10px] px-1">
                            {notifications.filter((n) => !n.read).length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="flex items-center gap-2 text-xs">
                        <Settings className="w-3 h-3" />
                        Einstellungen
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inbox" className="space-y-3 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-gray-600">
                          {notifications.filter((n) => !n.read).length} ungelesene Benachrichtigungen
                        </p>
                        {notifications.length > 0 && (
                          <Button
                            onClick={handleMarkAllNotificationsRead}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-transparent"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Alle als gelesen
                          </Button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm text-gray-500 mb-1">Keine Benachrichtigungen</p>
                          <p className="text-xs text-gray-400">Du bist auf dem neuesten Stand!</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2 pr-3">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 rounded-lg border text-xs transition-colors ${
                                  !notification.read ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h4 className="font-semibold text-xs mb-0.5">{notification.title}</h4>
                                        <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                                        <p className="text-[10px] text-gray-400">
                                          {formatNotificationTime(notification.created_at)}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        className="flex-shrink-0 h-6 w-6"
                                      >
                                        <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 mt-4">
                      <div className="mb-3">
                        <div className="flex items-center gap-4 text-[10px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            <span>In-App</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4 pr-3">
                          {/* Soziales */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FaUserPlus className="w-4 h-4 text-green-500" />
                              <h3 className="text-sm font-semibold">Soziales</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Freundschaftsanfrage erhalten"
                                inAppKey="friend_request_in_app"
                                emailKey="friend_request_email"
                              />
                              <NotificationPreferenceRow
                                label="Freundschaftsanfrage akzeptiert"
                                inAppKey="friend_accepted_in_app"
                                emailKey="friend_accepted_email"
                              />
                              <NotificationPreferenceRow
                                label="Freundschaftsanfrage abgelehnt"
                                inAppKey="friend_declined_in_app"
                                emailKey="friend_declined_email"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Spielgruppen */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-purple-500" />
                              <h3 className="text-sm font-semibold">Spielgruppen</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Einladung zu Spielgruppe"
                                inAppKey="group_invitation_in_app"
                                emailKey="group_invitation_email"
                              />
                              <NotificationPreferenceRow
                                label="Beitrittsanfrage erhalten"
                                inAppKey="group_join_request_in_app"
                                emailKey="group_join_request_email"
                              />
                              <NotificationPreferenceRow
                                label="Beitritt akzeptiert"
                                inAppKey="group_join_accepted_in_app"
                                emailKey="group_join_accepted_email"
                              />
                              <NotificationPreferenceRow
                                label="Beitritt abgelehnt"
                                inAppKey="group_join_rejected_in_app"
                                emailKey="group_join_rejected_email"
                              />
                              <NotificationPreferenceRow
                                label="Neues Mitglied beigetreten"
                                inAppKey="group_member_joined_in_app"
                                emailKey="group_member_joined_email"
                              />
                              <NotificationPreferenceRow
                                label="Mitglied hat Gruppe verlassen"
                                inAppKey="group_member_left_in_app"
                                emailKey="group_member_left_email"
                              />
                              <NotificationPreferenceRow
                                label="Neue Abstimmung in Spielgruppen"
                                inAppKey="group_poll_created_in_app"
                                emailKey="group_poll_created_email"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Events */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <h3 className="text-sm font-semibold">Events</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Einladung zu Event"
                                inAppKey="event_invitation_in_app"
                                emailKey="event_invitation_email"
                              />
                              <NotificationPreferenceRow
                                label="Teilnahmeanfrage erhalten"
                                inAppKey="event_join_request_in_app"
                                emailKey="event_join_request_email"
                              />
                              <NotificationPreferenceRow
                                label="Teilnahme akzeptiert"
                                inAppKey="event_join_accepted_in_app"
                                emailKey="event_join_accepted_email"
                              />
                              <NotificationPreferenceRow
                                label="Teilnahme abgelehnt"
                                inAppKey="event_join_rejected_in_app"
                                emailKey="event_join_rejected_email"
                              />
                              <NotificationPreferenceRow
                                label="Neuer Teilnehmer angemeldet"
                                inAppKey="event_participant_joined_in_app"
                                emailKey="event_participant_joined_email"
                              />
                              <NotificationPreferenceRow
                                label="Teilnehmer abgemeldet"
                                inAppKey="event_participant_left_in_app"
                                emailKey="event_participant_left_email"
                              />
                              <NotificationPreferenceRow
                                label="Event abgesagt"
                                inAppKey="event_cancelled_in_app"
                                emailKey="event_cancelled_email"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Forum & Kommentare */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-teal-500" />
                              <h3 className="text-sm font-semibold">Forum & Kommentare</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Antwort auf eigenen Forumsbeitrag"
                                inAppKey="forum_reply_in_app"
                                emailKey="forum_reply_email"
                              />
                              <NotificationPreferenceRow
                                label="Reaktion auf eigenen Beitrag"
                                inAppKey="forum_reaction_in_app"
                                emailKey="forum_reaction_email"
                              />
                              <NotificationPreferenceRow
                                label="Antwort auf Kommentar"
                                inAppKey="comment_reply_in_app"
                                emailKey="comment_reply_email"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Spiel-Interaktionen */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Book className="w-4 h-4 text-orange-500" />
                              <h3 className="text-sm font-semibold">Spiel-Interaktionen</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Spielesammlung-Anfrage"
                                inAppKey="game_shelf_request_in_app"
                                emailKey="game_shelf_request_email"
                              />
                              <NotificationPreferenceRow
                                label="Spiel-Ausleihanfrage"
                                inAppKey="game_interaction_request_in_app"
                                emailKey="game_interaction_request_email"
                              />
                              <NotificationPreferenceRow
                                label="Interesse an Angebot"
                                inAppKey="marketplace_offer_request_in_app"
                                emailKey="marketplace_offer_request_email"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* System */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Bell className="w-4 h-4 text-red-500" />
                              <h3 className="text-sm font-semibold">Systembenachrichtigungen</h3>
                            </div>
                            <div className="space-y-1 text-xs">
                              <NotificationPreferenceRow
                                label="Wartungsarbeiten & Updates"
                                inAppKey="system_maintenance_in_app"
                                emailKey="system_maintenance_email"
                              />
                              <NotificationPreferenceRow
                                label="Neue Funktionen"
                                inAppKey="system_feature_in_app"
                                emailKey="system_feature_email"
                              />
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Privatsphäre-Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-xs">Profilsichtbarkeit</p>
                      <p className="text-[10px] text-gray-500">Wer kann dein Profil sehen?</p>
                    </div>
                    <Select defaultValue="public">
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Alle</SelectItem>
                        <SelectItem value="friends">Nur Freunde</SelectItem>
                        <SelectItem value="private">Niemand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-xs">Spieleregal zeigen</p>
                      <p className="text-[10px] text-gray-500">Wer kann deine Spielesammlung sehen?</p>
                    </div>
                    <Select defaultValue="public">
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Alle</SelectItem>
                        <SelectItem value="friends">Nur Freunde</SelectItem>
                        <SelectItem value="private">Niemand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-xs">Direktnachrichten erlauben</p>
                      <p className="text-[10px] text-gray-500">
                        Wer kann dir Direktnachrichten (zu Events, Spielgruppen, Angebote und Suchanzeigen) senden?
                      </p>
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Wähle eine Option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="friends">Nur Freunde</SelectItem>
                        <SelectItem value="none">Niemand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Sicherheitseinstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Passwort ändern</p>
                      <p className="text-[10px] text-gray-500">Aktualisiere dein Passwort regelmäßig</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-teal-400 text-teal-600 h-7 text-xs px-2 bg-transparent"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      Ändern
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Zwei-Faktor-Authentifizierung</p>
                      <p className="text-[10px] text-gray-500">Zusätzliche Sicherheit für dein Konto</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="border-t-2 border-red-200 pt-4 mt-4 bg-red-50 -mx-6 px-6 pb-4 -mb-4 rounded-b-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <p className="text-red-600 text-xs font-bold">Gefahrenzone</p>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-3">
                      Dies löscht dein Konto und alle damit verbundenen Daten unwiderruflich. Diese Aktion kann nicht
                      rückgängig gemacht werden.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs px-3 bg-red-600 hover:bg-red-700 text-white font-medium"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Konto endgültig löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-teal-700">Passwort ändern</DialogTitle>
            <DialogDescription className="text-xs">
              Gib dein neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs">
                Neues Passwort
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs">
                Passwort bestätigen
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                className="h-8 text-xs"
              />
            </div>
            {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-500 text-xs">{passwordSuccess}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPasswordDialog(false)
                setPasswordError("")
                setNewPassword("")
                setConfirmPassword("")
              }}
              className="h-7 text-xs"
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="h-7 text-xs bg-teal-500 hover:bg-teal-600"
            >
              {isChangingPassword ? "Wird geändert..." : "Passwort ändern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Konto löschen
            </DialogTitle>
            <DialogDescription className="text-xs">
              Diese Aktion ist unwiderruflich. Alle deine Daten, Nachrichten, Freundschaften und Spielebibliothek werden
              gelöscht.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 font-medium mb-2">Folgendes wird gelöscht:</p>
              <ul className="text-[10px] text-red-600 space-y-1 list-disc list-inside">
                <li>Dein Benutzerprofil</li>
                <li>Alle Nachrichten</li>
                <li>Alle Freundschaften</li>
                <li>Deine Spielebibliothek</li>
                <li>Alle anderen Kontodaten</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-xs">
                Gib <span className="font-bold text-red-600">LÖSCHEN</span> ein, um zu bestätigen
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="LÖSCHEN"
                className="h-8 text-xs border-red-200 focus:border-red-400"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText("")
              }}
              className="h-8 text-xs"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "LÖSCHEN"}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {isDeleting ? "Wird gelöscht..." : "Konto endgültig löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
