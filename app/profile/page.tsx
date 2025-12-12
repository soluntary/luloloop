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
  Activity,
  AlertTriangle,
  Users,
  Store,
  CalendarDays,
  UserPlus,
  Pencil,
  Search,
  UserCheck,
  UserX,
  Check,
  Trash2,
  Vote,
} from "lucide-react"
import { CgProfile } from "react-icons/cg"
import { FaBell } from "react-icons/fa"
import { IoColorPaletteOutline } from "react-icons/io5"
import { FaXTwitter, FaInstagram } from "react-icons/fa6"
import { getAddressSuggestions } from "@/lib/actions/geocoding"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

const AVATAR_STYLES = [
  { id: "avataaars", name: "Professionell", description: "Klassische Business-Avatare" },
  { id: "micah", name: "Modern", description: "Stilvolle, minimalistische Avatare" },
  { id: "lorelei", name: "Elegant", description: "Elegante, kunstvolle Avatare" },
  { id: "lorelei-neutral", name: "Klassisch", description: "Zeitlose, neutrale Avatare" },
  { id: "adventurer", name: "Spielerisch", description: "Lustige Abenteurer-Avatare" },
  { id: "croodles", name: "Verspielt", description: "Handgezeichnete, verspielte Avatare" },
  { id: "croodles-neutral", name: "Kreativ", description: "Kreative, neutrale Avatare" },
  { id: "notionists", name: "Minimalistisch", description: "Schlichte, klare Avatare" },
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

  const [activityData, setActivityData] = useState<ActivityData>({
    createdEvents: [],
    eventParticipations: [],
    friendRequests: [],
    eventJoinRequests: [],
    memberCommunities: [],
    createdCommunities: [],
    marketplaceOffers: [],
    searchAds: [],
  })
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [activityFilter, setActivityFilter] = useState<string>("all")

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
    setEditedProfile({ ...editedProfile, address })
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
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
          community:communities(id, name, image, creator_id, type, location, community_members(id))
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
        memberCommunities: memberCommunities?.filter((m) => m.community?.creator_id !== user.id) || [],
        createdCommunities: createdCommunities || [],
        marketplaceOffers: marketplaceOffers || [],
        searchAds: searchAds || [],
      })
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoadingActivities(false)
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
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-white border-2 border-teal-200">
              <TabsTrigger value="profile" className="data-[state=active]:bg-teal-100 text-xs">
                <CgProfile className="w-3 h-3 mr-1" />
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="data-[state=active]:bg-teal-100 text-xs"
                onClick={loadActivities}
              >
                <Activity className="w-3 h-3 mr-1" />
                Aktivitäten
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-teal-100 text-xs">
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
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filter Tabs */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        <Button
                          variant={activityFilter === "all" ? "default" : "outline"}
                          size="sm"
                          className={`h-6 text-[10px] ${activityFilter === "all" ? "bg-teal-600" : ""}`}
                          onClick={() => setActivityFilter("all")}
                        >
                          Alle
                        </Button>
                        <Button
                          variant={activityFilter === "events" ? "default" : "ghost"}
                          size="sm"
                          className={`h-6 text-[10px] ${activityFilter === "events" ? "bg-blue-600" : ""}`}
                          onClick={() => setActivityFilter("events")}
                        >
                          <CalendarDays className="w-3 h-3 mr-1" />
                          Events
                        </Button>
                        <Button
                          variant={activityFilter === "requests" ? "default" : "ghost"}
                          size="sm"
                          className={`h-6 text-[10px] ${activityFilter === "requests" ? "bg-purple-600" : ""}`}
                          onClick={() => setActivityFilter("requests")}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Anfragen
                        </Button>
                        <Button
                          variant={activityFilter === "groups" ? "default" : "ghost"}
                          size="sm"
                          className={`h-6 text-[10px] ${activityFilter === "groups" ? "bg-green-600" : ""}`}
                          onClick={() => setActivityFilter("groups")}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Gruppen
                        </Button>
                        <Button
                          variant={activityFilter === "market" ? "default" : "ghost"}
                          size="sm"
                          className={`h-6 text-[10px] ${activityFilter === "market" ? "bg-orange-600" : ""}`}
                          onClick={() => setActivityFilter("market")}
                        >
                          <Store className="w-3 h-3 mr-1" />
                          Markt
                        </Button>
                      </div>

                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                          {/* EVENTS SECTION */}
                          {(activityFilter === "all" || activityFilter === "events") && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Events
                              </h3>

                              {/* Created Events */}
                              {activityData.createdEvents.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Erstellte Events</p>
                                  {activityData.createdEvents.map((event) => {
                                    const instances = event.ludo_event_instances || []
                                    const sortedInstances = [...instances].sort(
                                      (a: any, b: any) =>
                                        new Date(a.instance_date).getTime() - new Date(b.instance_date).getTime(),
                                    )
                                    const participantCount = event.ludo_event_participants?.length || 0

                                    const games = event.selected_games || []
                                    let gameTitle = ""
                                    if (games.length > 0) {
                                      const firstGame = games[0]
                                      if (typeof firstGame === "string") {
                                        // Try to parse JSON string if it looks like JSON
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
                                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">{event.title}</p>
                                          <p className="text-[10px] text-gray-500">
                                            {datesDisplay}
                                            {event.location && ` • ${event.location}`}
                                            {gameTitle && ` • ${gameTitle}`}
                                            {` • ${participantCount}/${event.max_participants || "∞"} Teilnehmer`}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/events/${event.id}/edit`)
                                            }}
                                            title="Bearbeiten"
                                          >
                                            <Pencil className="w-3 h-3 text-blue-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/events/${event.id}/participants`)
                                            }}
                                            title="Teilnehmerliste"
                                          >
                                            <Users className="w-3 h-3 text-blue-600" />
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
                                            <Trash2 className="w-3 h-3 text-red-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Event Participations */}
                              {activityData.eventParticipations.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Teilnahmen</p>
                                  {activityData.eventParticipations.map((participation) => {
                                    const event = participation.event
                                    const instances = event?.ludo_event_instances || []
                                    const sortedInstances = [...instances].sort(
                                      (a: any, b: any) =>
                                        new Date(a.instance_date).getTime() - new Date(b.instance_date).getTime(),
                                    )

                                    const games = event?.selected_games || []
                                    let gameTitle = ""
                                    if (games.length > 0) {
                                      const firstGame = games[0]
                                      if (typeof firstGame === "string") {
                                        // Try to parse JSON string if it looks like JSON
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
                                        className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100/50"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">{event?.title}</p>
                                          <p className="text-[10px] text-gray-500">
                                            {datesDisplay}
                                            {event?.location && ` • ${event.location}`}
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
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {activityData.createdEvents.length === 0 &&
                                activityData.eventParticipations.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-2">Keine Events vorhanden</p>
                                )}
                            </div>
                          )}

                          {/* REQUESTS SECTION */}
                          {(activityFilter === "all" || activityFilter === "requests") && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Anfragen
                              </h3>

                              {/* Friend Requests */}
                              {activityData.friendRequests.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Freundschaftsanfragen</p>
                                  {activityData.friendRequests.map((request) => {
                                    const isSender = request.from_user_id === user?.id
                                    const otherUser = isSender ? request.to_user : request.from_user
                                    return (
                                      <div
                                        key={request.id}
                                        className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Avatar className="w-6 h-6">
                                            <AvatarImage src={otherUser?.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-[9px]">
                                              {otherUser?.name?.charAt(0) || otherUser?.username?.charAt(0) || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              {otherUser?.name || otherUser?.username}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                              {isSender ? "Gesendet" : "Erhalten"} •{" "}
                                              {new Date(request.created_at).toLocaleDateString("de-DE")}
                                            </p>
                                          </div>
                                        </div>
                                        {isSender ? (
                                          <Badge className="text-[9px] h-4 bg-yellow-100 text-yellow-700">
                                            Ausstehend
                                          </Badge>
                                        ) : (
                                          <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Annehmen">
                                              <UserCheck className="w-3 h-3 text-green-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Ablehnen">
                                              <UserX className="w-3 h-3 text-red-600" />
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
                                          <Badge className="text-[9px] h-4 bg-yellow-100 text-yellow-700">
                                            Ausstehend
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {activityData.friendRequests.length === 0 &&
                                activityData.eventJoinRequests.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-2">Keine Anfragen vorhanden</p>
                                )}
                            </div>
                          )}

                          {/* GROUPS SECTION */}
                          {(activityFilter === "all" || activityFilter === "groups") && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Spielgruppen
                              </h3>

                              {/* Created Communities */}
                              {activityData.createdCommunities.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Spielgruppen (Erstellt)</p>
                                  {activityData.createdCommunities.map((community) => {
                                    const memberCount = community.community_members?.length || 0
                                    const createdDate = new Date(community.created_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })

                                    return (
                                      <div
                                        key={community.id}
                                        className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">{community.name}</p>
                                          <p className="text-[10px] text-gray-500">
                                            Erstellt am {createdDate} • {community.location || "Kein Ort"} •{" "}
                                            {memberCount} Mitglieder
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/spielgruppen/${community.id}/edit`)
                                            }}
                                            title="Bearbeiten"
                                          >
                                            <Pencil className="w-3 h-3 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/spielgruppen/${community.id}/members`)
                                            }}
                                            title="Mitglieder"
                                          >
                                            <Users className="w-3 h-3 text-purple-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/spielgruppen/${community.id}/votings`)
                                            }}
                                            title="Abstimmungen"
                                          >
                                            <Vote className="w-3 h-3 text-purple-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Member Communities */}
                              {activityData.memberCommunities.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Spielgruppen (Mitglied)</p>
                                  {activityData.memberCommunities.map((membership) => {
                                    const community = membership.community
                                    const memberCount = community?.community_members?.length || 0
                                    const joinDate = new Date(membership.joined_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })

                                    return (
                                      <div
                                        key={membership.id}
                                        className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {community?.name}
                                          </p>
                                          <p className="text-[10px] text-gray-500">
                                            Mitglied seit {joinDate} • {community?.location || "Kein Ort"} •{" "}
                                            {memberCount} Mitglieder
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 ml-2"
                                          onClick={() => handleLeaveCommunity(membership.id)}
                                          title="Austreten"
                                        >
                                          <LogOut className="w-3 h-3 text-purple-600" />
                                        </Button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {activityData.createdCommunities.length === 0 &&
                                activityData.memberCommunities.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-2">Keine Spielgruppen vorhanden</p>
                                )}
                            </div>
                          )}

                          {/* MARKET SECTION */}
                          {(activityFilter === "all" || activityFilter === "market") && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                                <Store className="w-4 h-4" />
                                Spielehandel
                              </h3>

                              {/* Marketplace Offers */}
                              {activityData.marketplaceOffers.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Angebote</p>
                                  {activityData.marketplaceOffers.map((offer) => {
                                    const getOfferTypeLabel = (type: string) => {
                                      switch (type) {
                                        case "sell":
                                          return "Verkaufsangebot"
                                        case "rent":
                                          return "Vermietungsangebot"
                                        case "trade":
                                          return "Tauschangebot"
                                        case "lend":
                                          return "Mietangebot"
                                        default:
                                          return "Mietangebot"
                                      }
                                    }
                                    const getOfferPrefix = (type: string) => {
                                      switch (type) {
                                        case "sell":
                                          return "Verkaufe "
                                        case "rent":
                                          return "Vermiete "
                                        case "trade":
                                          return "Tausche "
                                        case "lend":
                                          return "Biete "
                                        default:
                                          return ""
                                      }
                                    }

                                    let tradeGameInfo = ""
                                    if (offer.type === "trade" && offer.description) {
                                      const match = offer.description.match(/gegen\s+(.+?)(?:\.|$|,)/i)
                                      if (match) {
                                        tradeGameInfo = ` gegen ${match[1].trim()}`
                                      }
                                    }

                                    return (
                                      <div
                                        key={offer.id}
                                        className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {offer.image && (
                                            <img
                                              src={offer.image || "/placeholder.svg"}
                                              alt=""
                                              className="w-8 h-8 rounded object-cover"
                                            />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              {getOfferPrefix(offer.type)}
                                              {offer.title}
                                              {tradeGameInfo}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                              {getOfferTypeLabel(offer.type)}
                                              {offer.price && ` • ${offer.price}`}
                                              {offer.active ? " • Aktiv" : " • Inaktiv"}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 ml-2"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/markt/${offer.id}/edit`)
                                          }}
                                          title="Bearbeiten"
                                        >
                                          <Pencil className="w-3 h-3 text-orange-600" />
                                        </Button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Search Ads */}
                              {activityData.searchAds.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 font-medium">Meine Suchanzeigen</p>
                                  {activityData.searchAds.map((ad) => {
                                    const getSearchTypeLabel = (type: string) => {
                                      switch (type) {
                                        case "buy":
                                          return "Kaufgesuch"
                                        case "rent":
                                          return "Mietgesuch"
                                        case "trade":
                                          return "Tauschgesuch"
                                        default:
                                          return "Gesuch"
                                      }
                                    }
                                    const getSearchPrefix = (type: string) => {
                                      switch (type) {
                                        case "buy":
                                          return "Suche (Kauf) "
                                        case "rent":
                                          return "Suche (Miete) "
                                        case "trade":
                                          return "Suche (Tausch) "
                                        default:
                                          return "Suche "
                                      }
                                    }
                                    return (
                                      <div
                                        key={ad.id}
                                        className="flex items-center justify-between p-2 bg-orange-50/50 rounded-lg border border-orange-100/50"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Search className="w-4 h-4 text-orange-400" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              {getSearchPrefix(ad.type)}
                                              {ad.title}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                              {getSearchTypeLabel(ad.type)}
                                              {ad.max_price && ` • bis ${ad.max_price}€`}
                                              {ad.trade_game_title && ` • biete ${ad.trade_game_title}`}
                                              {ad.rental_duration && ` • ${ad.rental_duration}`}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <Badge
                                            className={`text-[9px] h-4 ${ad.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                                          >
                                            {ad.active ? "Aktiv" : "Inaktiv"}
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              router.push(`/marketplace/search/${ad.id}/edit`)
                                            }}
                                            title="Bearbeiten"
                                          >
                                            <Pencil className="w-3 h-3 text-orange-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {activityData.marketplaceOffers.length === 0 && activityData.searchAds.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">
                                  Keine Angebote oder Suchanzeigen vorhanden
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">
                    Benachrichtigungseinstellungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">E-Mail Benachrichtigungen</p>
                      <p className="text-[10px] text-gray-500">Erhalte Updates per E-Mail</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Neue Nachrichten</p>
                      <p className="text-[10px] text-gray-500">Benachrichtigung bei neuen Nachrichten</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Spielanfragen</p>
                      <p className="text-[10px] text-gray-500">Benachrichtigung bei neuen Spielanfragen</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Marketing E-Mails</p>
                      <p className="text-[10px] text-gray-500">News und Angebote erhalten</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="font-handwritten text-teal-700 text-base">Privatsphäre-Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Profil öffentlich</p>
                      <p className="text-[10px] text-gray-500">Andere können dein Profil sehen</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Spielesammlung zeigen</p>
                      <p className="text-[10px] text-gray-500">Deine Spiele sind für andere sichtbar</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">Online-Status anzeigen</p>
                      <p className="text-[10px] text-gray-500">Andere sehen, wann du online bist</p>
                    </div>
                    <Switch />
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
