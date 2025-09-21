"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAvatar } from "@/contexts/avatar-context"
import { useGames } from "@/contexts/games-context"
import { useProfileSync } from "@/contexts/profile-sync-context"
import { updateUserProfile } from "@/app/actions/profile-sync"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Twitter, Instagram, Upload, Shuffle, RefreshCw, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast" // Assuming useToast is available

import {
  getSecurityNotificationPreferences,
  updateSecurityNotificationPreferences,
  logSecurityEvent,
} from "@/app/actions/security-notifications"
import { SecurityEventsDashboard } from "@/components/security-events-dashboard"
import {
  getMessageNotificationPreferences,
  updateMessageNotificationPreferences,
  type MessageNotificationPreferences,
} from "@/app/actions/message-notifications"
import {
  updateSocialNotificationPreferences,
  updateMarketingNotificationPreferences,
  updateDeliveryMethodPreferences,
  updatePrivacySettings,
  updateSecuritySettings,
  getAllNotificationPreferences,
} from "@/app/actions/comprehensive-notifications"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { updateAvatar } = useAvatar()
  const { marketplaceOffers, deleteMarketplaceOffer, refreshData } = useGames()
  const { syncProfile, invalidateUserData } = useProfileSync()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast() // Initialize toast

  const [userOffers, setUserOffers] = useState<any[]>([])
  const [userSearchAds, setUserSearchAds] = useState<any[]>([])
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [editingOffer, setEditingOffer] = useState<any>(null)
  const [editingSearchAd, setEditingSearchAd] = useState<any>(null)
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false)
  const [isEditSearchAdOpen, setIsEditSearchAdOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "offer" | "searchAd" | "event"; id: string } | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    birthDate: user?.birthDate || "",
    showBirthDate: user?.showBirthDate || false,
    phone: user?.phone || "",
    address: user?.address || "",
    street: user?.street || "",
    houseNumber: user?.house_number || user?.houseNumber || "",
    zipCode: user?.zip_code || user?.zipCode || "",
    city: user?.city || "",
    country: user?.country || "Schweiz",
    bio: user?.bio || "",
    favoriteGames: user?.favoriteGames || "",
    website: user?.website || "",
    twitter: user?.twitter || "",
    instagram: user?.instagram || "",
    avatar: user?.avatar || "",
  })

  const [settings, setSettings] = useState({
    notifications: {
      email: user?.settings?.notifications?.email ?? true,
      push: user?.settings?.notifications?.push ?? true,
      marketing: user?.settings?.notifications?.marketing ?? false,
      security: user?.settings?.notifications?.security ?? true,
      userMessages: user?.settings?.notifications?.userMessages ?? true,
      friendRequests: user?.settings?.notifications?.friendRequests ?? true,
      eventReminders: user?.settings?.notifications?.eventReminders ?? true,
      groupInvites: user?.settings?.notifications?.groupInvites ?? true,
      forumReplies: user?.settings?.notifications?.forumReplies ?? true,
      gameUpdates: user?.settings?.notifications?.gameUpdates ?? false,
      weeklyDigest: user?.settings?.notifications?.weeklyDigest ?? true,
    },
    privacy: {
      profileVisible: user?.settings?.privacy?.profileVisible ?? true,
      emailVisible: user?.settings?.privacy?.emailVisible ?? false,
      onlineStatus: user?.settings?.privacy?.onlineStatus ?? true,
      allowMessages: user?.settings?.privacy?.allowMessages ?? true,
      phoneVisible: user?.settings?.privacy?.phoneVisible ?? false,
      locationVisible: user?.settings?.privacy?.locationVisible ?? true,
      birthDateVisible: user?.settings?.privacy?.birthDateVisible ?? false,
      libraryVisibility: user?.settings?.privacy?.libraryVisibility ?? "private",
      showBio: user?.settings?.privacy?.showBio ?? true,
      showSocialMedia: user?.settings?.privacy?.showSocialMedia ?? true,
      showFavoriteGames: user?.settings?.privacy?.showFavoriteGames ?? true,
      showJoinDate: user?.settings?.privacy?.showJoinDate ?? true,
      allowFriendRequests: user?.settings?.privacy?.allowFriendRequests ?? true,
      showOnlineStatus: user?.settings?.privacy?.showOnlineStatus ?? true,
    },
    security: {
      twoFactor: user?.settings?.security?.twoFactor ?? false,
      loginNotifications: user?.settings?.security?.loginNotifications ?? true,
      sessionTimeout: user?.settings?.security?.sessionTimeout ?? 30,
    },
  })

  const [securityNotificationPrefs, setSecurityNotificationPrefs] = useState({
    login_attempts: true,
    password_changes: true,
    email_changes: true,
    suspicious_activity: true,
    new_device_login: true,
    account_recovery: true,
    security_settings_changes: true,
  })

  const [messageNotificationPrefs, setMessageNotificationPrefs] = useState<MessageNotificationPreferences>({
    user_id: "",
    direct_messages: true,
    game_inquiries: true,
    event_inquiries: true,
    group_inquiries: true,
    marketplace_messages: true,
    instant_notifications: true,
    daily_digest: false,
    weekly_digest: false,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    weekend_notifications: true,
  })

  const [comprehensivePrefs, setComprehensivePrefs] = useState({
    social: {
      friend_requests: { platform: true, email: true },
      friend_accepts: { platform: true, email: true },
      friend_declines: { platform: true, email: true },
      forum_replies: { platform: true, email: true },
      forum_comment_replies: { platform: true, email: true },
      shelf_access_requests: { platform: true, email: true },
      message_notifications: { platform: true, email: true },
      event_invitations: { platform: true, email: true },
    },
    privacy: {
      profile_visibility: "public",
      allow_friend_requests: true,
      allow_messages_from: "everyone",
    },
    security: {
      security_events_notifications: true,
    },
  })

  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: "",
    currentPassword: "",
  })
  const [isEmailChanging, setIsEmailChanging] = useState(false)
  const [emailChangeMessage, setEmailChangeMessage] = useState("")

  const supabase = createClient()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState<string>("adventurer")

  const generateAvatarPreview = async (style?: string) => {
    if (!user?.id) return

    const avatarStyles = [
      "croodles", // Playful, hand-drawn style
      "micah", // Modern male avatars
      "notionists", // Professional, clean avatars
      "avataaars", // Classic cartoon-style avatars
    ]

    const styleToUse = style || selectedAvatarStyle
    const seed = user.id + Date.now() + Math.random() // More randomness

    const avatarUrl = `https://api.dicebear.com/7.x/${styleToUse}/svg?seed=${seed}&backgroundColor=transparent&radius=50&size=200&flip=false`

    setAvatarPreview(avatarUrl)
    return avatarUrl
  }

  const generateAvatar = async () => {
    if (!avatarPreview || !user?.id) return

    try {
      setIsLoading(true)
      setProfileData((prev) => ({ ...prev, avatar: avatarPreview }))
      updateAvatar(user.id, avatarPreview)
      setAvatarPreview(null)
      setMessage("Avatar erfolgreich erstellt!")
    } catch (error) {
      console.error("Error generating avatar:", error)
      setMessage("Fehler beim Erstellen des Avatars.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserEvents = async () => {
    if (!user?.id) return

    try {
      setLoadingEvents(true)
      const { data: events, error } = await supabase
        .from("ludo_events")
        .select(`
          *,
          creator:users!creator_id (
            username,
            name,
            avatar
          )
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user events:", error)
        return
      }

      setUserEvents(events || [])
    } catch (error) {
      console.error("Error fetching user events:", error)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadUserListings()
      fetchUserEvents()
    }
  }, [user?.id])

  useEffect(() => {
    const loadSecurityPreferences = async () => {
      const result = await getSecurityNotificationPreferences()
      if (result.success && result.preferences) {
        setSecurityNotificationPrefs(result.preferences)
      }
    }

    const loadMessageNotificationPrefs = async () => {
      if (user?.id) {
        const prefs = await getMessageNotificationPreferences(user.id)
        if (prefs) {
          setMessageNotificationPrefs(prefs)
        }
      }
    }

    const loadComprehensivePrefs = async () => {
      try {
        const prefs = await getAllNotificationPreferences()
        setComprehensivePrefs(prefs)
      } catch (error) {
        console.error("[v0] Error loading comprehensive preferences:", error)
      }
    }

    if (user) {
      loadSecurityPreferences()
      loadMessageNotificationPrefs() // Call the new function
      loadComprehensivePrefs() // Load comprehensive preferences
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        birthDate: user.birthDate || "",
        showBirthDate: user.showBirthDate || false,
        phone: user.phone || "",
        address: user.address || "",
        street: user.street || "",
        houseNumber: user.house_number || user.houseNumber || "",
        zipCode: user.zip_code || user.zipCode || "",
        city: user.city || "",
        country: user.country || "Schweiz",
        bio: user.bio || "",
        favoriteGames: user.favoriteGames || "",
        website: user.website || "",
        twitter: user.twitter || "",
        instagram: user.instagram || "",
        avatar: user.avatar || "",
      }))
    }
  }, [user])

  const loadUserListings = async () => {
    if (!user?.id) return

    try {
      // Load marketplace offers
      const userMarketplaceOffers = marketplaceOffers.filter((offer) => offer.creator_id === user.id)
      setUserOffers(userMarketplaceOffers)

      // Load search ads
      const { data: searchAds, error: searchAdsError } = await supabase
        .from("search_ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (searchAdsError) {
        console.error("Error loading search ads:", searchAdsError)
      } else {
        setUserSearchAds(searchAds || [])
      }
    } catch (error) {
      console.error("Error loading user listings:", error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSettingsChange = (category: string, field: string, value: boolean | string | number) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const handleSecurityNotificationChange = async (key: string, value: boolean) => {
    const updatedPrefs = { ...securityNotificationPrefs, [key]: value }
    setSecurityNotificationPrefs(updatedPrefs)

    const result = await updateSecurityNotificationPreferences({ [key]: value })
    if (result.success) {
      // Log the security settings change
      await logSecurityEvent({
        eventType: "security_settings_change",
        additionalData: { setting: key, value },
      })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Sicherheitsbenachrichtigungen wurden aktualisiert.",
      })
    } else {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
      // Revert the change
      setSecurityNotificationPrefs(securityNotificationPrefs)
    }
  }

  const handleMessageNotificationChange = async (key: string, value: boolean | string) => {
    const updatedPrefs = { ...messageNotificationPrefs, [key]: value }
    setMessageNotificationPrefs(updatedPrefs)

    try {
      await updateMessageNotificationPreferences(updatedPrefs)
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Nachrichten-Benachrichtigungen wurden aktualisiert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
      // Revert the change
      setMessageNotificationPrefs(messageNotificationPrefs)
    }
  }

  const handleSocialNotificationChange = async (key: string, type: "platform" | "email", value: boolean) => {
    try {
      const updatedSetting = {
        ...comprehensivePrefs.social[key as keyof typeof comprehensivePrefs.social],
        [type]: value,
      }

      setComprehensivePrefs((prev) => ({
        ...prev,
        social: { ...prev.social, [key]: updatedSetting },
      }))

      await updateSocialNotificationPreferences({ [key]: updatedSetting })
      setMessage("Benachrichtigungseinstellungen erfolgreich gespeichert!")
    } catch (error) {
      console.error("[v0] Error updating social notifications:", error)
      setMessage("Fehler beim Speichern der Benachrichtigungen.")
    }
  }

  const handleMarketingNotificationChange = async (key: string, value: boolean) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        marketing: { ...prev.marketing, [key]: value },
      }))

      await updateMarketingNotificationPreferences({ [key]: value })
      setMessage("Marketing-Benachrichtigungseinstellungen erfolgreich gespeichert!")
    } catch (error) {
      console.error("[v0] Error updating marketing notifications:", error)
      setMessage("Fehler beim Speichern der Marketing-Benachrichtigungen.")
    }
  }

  const handleDeliveryMethodChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, [key]: value },
      }))

      await updateDeliveryMethodPreferences({ [key]: value })
      setMessage("Übertragungsart-Einstellungen erfolgreich gespeichert!")
    } catch (error) {
      console.error("[v0] Error updating delivery method:", error)
      setMessage("Fehler beim Speichern der Übertragungsart-Einstellungen.")
    }
  }

  const handlePrivacySettingChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [key]: value },
      }))

      await updatePrivacySettings({ [key]: value })
      setMessage("Privatsphäre-Einstellungen erfolgreich gespeichert!")
    } catch (error) {
      console.error("[v0] Error updating privacy settings:", error)
      setMessage("Fehler beim Speichern der Privatsphäre-Einstellungen.")
    }
  }

  const handleSecuritySettingChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        security: { ...prev.security, [key]: value },
      }))

      await updateSecuritySettings({ [key]: value })
      setMessage("Sicherheitseinstellungen erfolgreich gespeichert!")
    } catch (error) {
      console.error("[v0] Error updating security settings:", error)
      setMessage("Fehler beim Speichern der Sicherheitseinstellungen.")
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    console.log("[v0] Starting photo upload:", { fileName: file.name, fileSize: file.size, userId: user.id })

    try {
      setIsLoading(true)

      // Create FormData for the upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      console.log("[v0] FormData created, sending to API...")

      // Upload to Vercel Blob via API route
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Upload error:", errorData)
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()
      console.log("[v0] Upload successful, URL:", url)

      setProfileData((prev) => ({ ...prev, avatar: url }))
      updateAvatar(user.id, url)
      setMessage("Avatar erfolgreich hochgeladen!")
    } catch (error) {
      console.error("[v0] Error uploading avatar:", error)
      setMessage("Fehler beim Hochladen des Avatars.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setIsLoading(true)
      setMessage("")

      const updatedData = {
        name: profileData.name,
        username: profileData.username,
        // anzeigename: profileData.anzeigename, // This field seems to be missing in profileData state
        birth_date: profileData.birthDate,
        phone: profileData.phone,
        street: profileData.street,
        house_number: profileData.houseNumber,
        zip_code: profileData.zipCode,
        city: profileData.city,
        country: profileData.country,
        // location: profileData.location, // This field seems to be missing in profileData state
        bio: profileData.bio,
        favorite_games: profileData.favoriteGames,
        // preferred_game_types: profileData.preferredGameTypes, // This field seems to be missing in profileData state
        website: profileData.website,
        twitter: profileData.twitter,
        instagram: profileData.instagram,
        avatar: profileData.avatar,
        settings: settings,
      }

      const result = await updateUserProfile(user.id, updatedData)

      if (result.success) {
        // Update local auth context
        await updateProfile(updatedData)

        // Update avatar cache if avatar changed
        if (profileData.avatar) {
          updateAvatar(user.id, profileData.avatar)
        }

        // Trigger platform-wide synchronization
        syncProfile(user.id, result.data)

        setMessage("Profil erfolgreich aktualisiert!")
        console.log("[v0] Profile updated and synchronized across platform")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("Fehler beim Aktualisieren des Profils.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email || !emailChangeData.newEmail || !emailChangeData.currentPassword) return

    try {
      setIsEmailChanging(true)
      setEmailChangeMessage("")

      const { error } = await supabase.auth.updateUser(
        { email: emailChangeData.newEmail },
        {
          emailRedirectTo: `${window.location.origin}/profile`,
        },
      )

      if (error) throw error

      setEmailChangeMessage("Bestätigungs-E-Mail gesendet! Überprüfe dein Postfach.")
      setEmailChangeData({ newEmail: "", currentPassword: "" })
    } catch (error: any) {
      console.error("Error changing email:", error)
      setEmailChangeMessage(error.message || "Fehler beim Ändern der E-Mail-Adresse.")
    } finally {
      setIsEmailChanging(false)
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteMarketplaceOffer(offerId)
      await loadUserListings()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting offer:", error)
      alert("Fehler beim Löschen des Angebots.")
    }
  }

  const handleDeleteSearchAd = async (searchAdId: string) => {
    try {
      const { error } = await supabase.from("search_ads").delete().eq("id", searchAdId)

      if (error) {
        console.error("Error deleting search ad:", error)
        alert("Fehler beim Löschen der Suchanzeige.")
        return
      }

      await loadUserListings()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting search ad:", error)
      alert("Fehler beim Löschen der Suchanzeige.")
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("ludo_events").delete().eq("id", eventId).eq("creator_id", user?.id)

      if (error) {
        console.error("Error deleting event:", error)
        return
      }

      fetchUserEvents()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const handleEditSuccess = async () => {
    await refreshData()
    await loadUserListings()
  }

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getFrequencyText = (frequency: string, intervalType?: string) => {
    if (frequency === "weekly") return "Wöchentlich"
    if (frequency === "biweekly") return "Alle 2 Wochen"
    if (frequency === "monthly") return "Monatlich"
    if (frequency === "custom" && intervalType) return intervalType
    return frequency
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
        <Navigation currentPage="profile" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h1>
            <p className="text-gray-600 mb-6">Du musst angemeldet sein, um dein Profil zu bearbeiten.</p>
            <Button onClick={() => router.push("/auth")}>Zur Anmeldung</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="profile" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold font-handwritten text-gray-800 mb-2">Profileinstellungen</h1>
            <p className="text-gray-600 font-body text-sm md:text-base">
              Verwalte deine Kontoinformationen und Einstellungen
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
              <TabsTrigger value="profile" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Profil
              </TabsTrigger>
              <TabsTrigger value="listings" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Meine Anzeigen</span>
                <span className="sm:hidden">Anzeigen</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Meine Events</span>
                <span className="sm:hidden">Events</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Benachrichtigungen</span>
                <span className="sm:hidden">Benachr.</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Privatsphäre
              </TabsTrigger>
              <TabsTrigger value="security" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Sicherheit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Profilinformationen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Aktualisiere deine persönlichen Informationen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 md:space-y-8 p-4 md:p-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarPreview || profileData.avatar || ""} alt="Profilbild" />
                        <AvatarFallback className="text-2xl">
                          {profileData.username?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          disabled={isLoading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Foto hochladen
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAvatarPreview()}
                          disabled={isLoading}
                        >
                          <Shuffle className="w-4 h-4 mr-2" />
                          Avatar erstellen
                        </Button>
                      </div>

                      {/* Avatar Style Selection */}
                      {avatarPreview && (
                        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Avatar-Stil wählen:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {[
                              { key: "croodles", label: "Verspielt" },
                              { key: "micah", label: "Modern" },
                              { key: "notionists", label: "Professionell" },
                              { key: "avataaars", label: "Klassisch" },
                            ].map((style) => (
                              <Button
                                key={style.key}
                                type="button"
                                variant={selectedAvatarStyle === style.key ? "default" : "outline"}
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={() => {
                                  setSelectedAvatarStyle(style.key)
                                  generateAvatarPreview(style.key)
                                }}
                              >
                                {style.label}
                              </Button>
                            ))}
                          </div>

                          <div className="flex space-x-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => generateAvatarPreview()}>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Neu generieren
                            </Button>

                            <Button type="button" size="sm" onClick={generateAvatar} disabled={isLoading}>
                              <Check className="w-3 h-3 mr-1" />
                              Verwenden
                            </Button>

                            <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarPreview(null)}>
                              <X className="w-3 h-3 mr-1" />
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Basic Profile Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm md:text-base">
                            Vollständiger Name
                          </Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm md:text-base">
                            Benutzername
                          </Label>
                          <Input
                            id="username"
                            name="username"
                            value={profileData.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            className="text-sm md:text-base"
                          />
                          <p className="text-sm text-muted-foreground">
                            Dieser Name wird auf der Plattform angezeigt und ist für andere Nutzer sichtbar.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm md:text-base">
                          E-Mail-Adresse
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="text-sm md:text-base"
                          disabled
                        />
                        <p className="text-sm text-muted-foreground">
                          Die E-Mail-Adresse kann im Sicherheits-Tab geändert werden.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="birthDate" className="text-sm md:text-base">
                            Geburtsdatum
                          </Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={profileData.birthDate}
                            onChange={(e) => handleInputChange("birthDate", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm md:text-base">
                            Telefonnummer
                          </Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+41 XX XXX XX XX"
                            className="text-sm md:text-base"
                          />
                        </div>
                      </div>

                      {/* Lieblingsspiele */}
                      <div className="space-y-2">
                        <Label htmlFor="favoriteGames" className="text-sm md:text-base">
                          Lieblingsspiele
                        </Label>
                        <Input
                          id="favoriteGames"
                          value={profileData.favoriteGames}
                          onChange={(e) => handleInputChange("favoriteGames", e.target.value)}
                          placeholder="z.B. Catan, Azul, Wingspan"
                          className="text-sm md:text-base"
                        />
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm md:text-base">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          placeholder="Erzähle etwas über dich..."
                          className="text-sm md:text-base"
                          rows={3}
                        />
                      </div>

                      {/* Social Media */}
                      <div className="space-y-2">
                        <Label className="text-sm md:text-base font-medium">Social Media</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-sm md:text-base flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Website
                            </Label>
                            <Input
                              id="website"
                              value={profileData.website}
                              onChange={(e) => handleInputChange("website", e.target.value)}
                              placeholder="https://..."
                              className="text-sm md:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="text-sm md:text-base flex items-center gap-2">
                              <Twitter className="w-4 h-4" />
                              Twitter/X
                            </Label>
                            <Input
                              id="twitter"
                              value={profileData.twitter}
                              onChange={(e) => handleInputChange("twitter", e.target.value)}
                              placeholder="@username"
                              className="text-sm md:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-sm md:text-base flex items-center gap-2">
                              <Instagram className="w-4 h-4" />
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              value={profileData.instagram}
                              onChange={(e) => handleInputChange("instagram", e.target.value)}
                              placeholder="@username"
                              className="text-sm md:text-base"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-base md:text-lg">Adresse</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="street" className="text-sm md:text-base">
                            Strasse
                          </Label>
                          <Input
                            id="street"
                            value={profileData.street}
                            onChange={(e) => handleInputChange("street", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="houseNumber" className="text-sm md:text-base">
                            Hausnummer
                          </Label>
                          <Input
                            id="houseNumber"
                            value={profileData.houseNumber}
                            onChange={(e) => handleInputChange("houseNumber", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm md:text-base">
                            PLZ
                          </Label>
                          <Input
                            id="zipCode"
                            value={profileData.zipCode}
                            onChange={(e) => handleInputChange("zipCode", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm md:text-base">
                            Stadt
                          </Label>
                          <Input
                            id="city"
                            value={profileData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm md:text-base">
                            Land
                          </Label>
                          <Input
                            id="country"
                            value={profileData.country}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            className="text-sm md:text-base"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading} className="min-w-32">
                        {isLoading ? "Speichern..." : "Profil speichern"}
                      </Button>
                    </div>

                    {message && (
                      <div
                        className={`text-center p-3 rounded-md ${
                          message.includes("erfolgreich") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Benachrichtigungen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Verwalte deine Benachrichtigungseinstellungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Freundschaftsanfragen</Label>
                          <p className="text-xs text-gray-600">Benachrichtigung bei neuen Freundschaftsanfragen</p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_requests?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_requests", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_requests?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_requests", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Freundschaftsannahmen</Label>
                          <p className="text-xs text-gray-600">Benachrichtigung, wenn jemand deine Anfrage annimmt</p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_accepts?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_accepts", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_accepts?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_accepts", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Freundschaftsablehnungen</Label>
                          <p className="text-xs text-gray-600">Benachrichtigung, wenn jemand deine Anfrage ablehnt</p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_declines?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_declines", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.friend_declines?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("friend_declines", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Forum-Antworten</Label>
                          <p className="text-xs text-gray-600">Benachrichtigung bei Antworten auf deine Beiträge</p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.forum_replies?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("forum_replies", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.forum_replies?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("forum_replies", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Kommentar-Antworten</Label>
                          <p className="text-xs text-gray-600">
                            Benachrichtigung bei Antworten auf Kommentare, auf die du geantwortet hast
                          </p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.forum_comment_replies?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("forum_comment_replies", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.forum_comment_replies?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("forum_comment_replies", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Spielregal-Anfragen</Label>
                          <p className="text-xs text-gray-600">
                            Benachrichtigung bei Zugangsanfragen zu deinem Spielregal
                          </p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.shelf_access_requests?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("shelf_access_requests", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.shelf_access_requests?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("shelf_access_requests", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Nachrichten von Nutzern</Label>
                          <p className="text-xs text-gray-600">Benachrichtigung bei neuen Nachrichten</p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.message_notifications?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("message_notifications", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.message_notifications?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("message_notifications", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Event-Einladungen</Label>
                          <p className="text-xs text-gray-600">
                            Benachrichtigung, wenn du zu einem Event eingeladen wirst
                          </p>
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.event_invitations?.platform ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("event_invitations", "platform", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">In-App-Benachrichtigung</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.social.event_invitations?.email ?? true}
                              onChange={(e) =>
                                handleSocialNotificationChange("event_invitations", "email", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-600">per E-Mail</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Privatsphäre</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kontrolliere deine Privatsphäre-Einstellungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  <div className="space-y-6">
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Wer kann dein Profil sehen?</Label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value="public"
                              checked={comprehensivePrefs.privacy.profile_visibility === "public"}
                              onChange={(e) => handlePrivacySettingChange("profile_visibility", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <span className="text-sm font-medium">Öffentlich</span>
                              <p className="text-xs text-gray-600">Jeder kann dein Profil sehen</p>
                            </div>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value="friends"
                              checked={comprehensivePrefs.privacy.profile_visibility === "friends"}
                              onChange={(e) => handlePrivacySettingChange("profile_visibility", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <span className="text-sm font-medium">Nur Freunde</span>
                              <p className="text-xs text-gray-600">Nur deine Freunde können dein Profil sehen</p>
                            </div>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value="private"
                              checked={comprehensivePrefs.privacy.profile_visibility === "private"}
                              onChange={(e) => handlePrivacySettingChange("profile_visibility", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <span className="text-sm font-medium">Privat</span>
                              <p className="text-xs text-gray-600">Nur du kannst dein Profil sehen</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium">Freundschaftsanfragen erlauben</Label>
                          <p className="text-xs text-gray-600">Andere können dir Freundschaftsanfragen senden</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={comprehensivePrefs.privacy.allow_friend_requests ?? true}
                          onChange={(e) => handlePrivacySettingChange("allow_friend_requests", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium">Wer kann dir Nachrichten senden?</Label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="allowMessagesFrom"
                              value="everyone"
                              checked={comprehensivePrefs.privacy.allow_messages_from === "everyone"}
                              onChange={(e) => handlePrivacySettingChange("allow_messages_from", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Jeder</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="allowMessagesFrom"
                              value="friends"
                              checked={comprehensivePrefs.privacy.allow_messages_from === "friends"}
                              onChange={(e) => handlePrivacySettingChange("allow_messages_from", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Nur Freunde</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="allowMessagesFrom"
                              value="nobody"
                              checked={comprehensivePrefs.privacy.allow_messages_from === "nobody"}
                              onChange={(e) => handlePrivacySettingChange("allow_messages_from", e.target.value)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Niemand</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSubmit} disabled={isLoading} className="min-w-32">
                        {isLoading ? "Speichern..." : "Einstellungen speichern"}
                      </Button>
                    </div>

                    {message && (
                      <div
                        className={`text-center p-3 rounded-md ${
                          message.includes("erfolgreich") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="font-handwritten text-lg md:text-xl">Sicherheit</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Verwalte deine Sicherheitseinstellungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="space-y-6">
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        {/* Email Change Section */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-sm">E-Mail-Adresse ändern</h5>
                          <form onSubmit={handleEmailChange} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="newEmail" className="text-sm md:text-base">
                                Neue E-Mail-Adresse
                              </Label>
                              <Input
                                id="newEmail"
                                type="email"
                                value={emailChangeData.newEmail}
                                onChange={(e) => setEmailChangeData((prev) => ({ ...prev, newEmail: e.target.value }))}
                                placeholder="neue@email.com"
                                className="text-sm md:text-base"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword" className="text-sm md:text-base">
                                Aktuelles Passwort bestätigen
                              </Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={emailChangeData.currentPassword}
                                onChange={(e) =>
                                  setEmailChangeData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                                className="text-sm md:text-base"
                              />
                            </div>
                            <Button type="submit" disabled={isEmailChanging} className="w-full">
                              {isEmailChanging ? "Wird geändert..." : "E-Mail ändern"}
                            </Button>
                            {emailChangeMessage && (
                              <div
                                className={`text-center p-3 rounded-md ${
                                  emailChangeMessage.includes("gesendet")
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {emailChangeMessage}
                              </div>
                            )}
                          </form>
                        </div>

                        {/* Security Events */}
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">Sicherheitsereignisse</Label>
                              <p className="text-xs text-gray-600">
                                Benachrichtigungen über wichtige Sicherheitsereignisse
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={comprehensivePrefs.security.security_events_notifications ?? true}
                              onChange={(e) =>
                                handleSecuritySettingChange("security_events_notifications", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSubmit} disabled={isLoading} className="min-w-32">
                        {isLoading ? "Speichern..." : "Einstellungen speichern"}
                      </Button>
                    </div>

                    {message && (
                      <div
                        className={`text-center p-3 rounded-md ${
                          message.includes("erfolgreich") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <SecurityEventsDashboard />
              </div>
            </TabsContent>

            <TabsContent value="listings">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Meine Anzeigen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Verwalte deine Marktplatz-Angebote und Suchanzeigen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  <div className="space-y-6">
                    {/* Marketplace Offers */}
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-4">
                        Marktplatz-Angebote ({userOffers.length})
                      </h3>
                      {userOffers.length === 0 ? (
                        <p className="text-gray-600 text-sm md:text-base">Du hast noch keine Angebote erstellt.</p>
                      ) : (
                        <div className="grid gap-4">
                          {userOffers.map((offer) => (
                            <div key={offer.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-sm md:text-base">{offer.title}</h4>
                                  <p className="text-gray-600 text-xs md:text-sm">{offer.description}</p>
                                  <p className="text-teal-600 font-semibold text-sm md:text-base">{offer.price}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingOffer(offer)
                                      setIsEditOfferOpen(true)
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteConfirm({ type: "offer", id: offer.id })}
                                  >
                                    Löschen
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search Ads */}
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-4">Suchanzeigen ({userSearchAds.length})</h3>
                      {userSearchAds.length === 0 ? (
                        <p className="text-gray-600 text-sm md:text-base">Du hast noch keine Suchanzeigen erstellt.</p>
                      ) : (
                        <div className="grid gap-4">
                          {userSearchAds.map((searchAd) => (
                            <div key={searchAd.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-sm md:text-base">{searchAd.title}</h4>
                                  <p className="text-gray-600 text-xs md:text-sm">{searchAd.description}</p>
                                  <p className="text-purple-600 font-semibold text-sm md:text-base">
                                    Bis {searchAd.max_price}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingSearchAd(searchAd)
                                      setIsEditSearchAdOpen(true)
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteConfirm({ type: "searchAd", id: searchAd.id })}
                                  >
                                    Löschen
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Meine Events</CardTitle>
                  <CardDescription className="text-sm md:text-base">Verwalte deine erstellten Events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  {loadingEvents ? (
                    <p className="text-gray-600 text-sm md:text-base">Lade Events...</p>
                  ) : userEvents.length === 0 ? (
                    <p className="text-gray-600 text-sm md:text-base">Du hast noch keine Events erstellt.</p>
                  ) : (
                    <div className="grid gap-4">
                      {userEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm md:text-base">{event.title}</h4>
                              <p className="text-gray-600 text-xs md:text-sm">{event.description}</p>
                              <div className="flex gap-4 text-xs md:text-sm text-gray-500 mt-2">
                                <span>{formatEventDate(event.date)}</span>
                                <span>{event.time}</span>
                                <span>
                                  {event.participants_count || 0}/{event.max_participants} Teilnehmer
                                </span>
                                {event.frequency && event.frequency !== "once" && (
                                  <span>{getFrequencyText(event.frequency, event.interval_type)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => router.push(`/events/${event.id}`)}>
                                Anzeigen
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm({ type: "event", id: event.id })}
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
