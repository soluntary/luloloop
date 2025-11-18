"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAvatar } from "@/contexts/avatar-context"
import { useGames } from "@/contexts/games-context"
import { useProfileSync } from "@/contexts/profile-sync-context"
import { updateUserProfile } from "@/app/actions/profile-sync"
import { deleteAccountAction } from "@/app/actions/delete-account"

import { toggleOfferStatus, toggleSearchAdStatus } from './actions'

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Twitter, Instagram, Upload, Shuffle, RefreshCw, Check, X, CalendarDaysIcon, Calendar, Users, Trash2, MapPin, Eye, UserX, MessageSquare, Shield, Tag, DicesIcon, Gamepad2, Edit2, BanknoteIcon, DollarSign, Building, Clock, RepeatIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast" // Assuming useToast is available
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
import { AddressAutocomplete } from "@/components/address-autocomplete"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Mail, Bell } from 'lucide-react'

// Import new form components
import { EditCommunityForm } from "@/components/edit-community-form" // Fixed import path
import { CreateLudoEventFormDialog } from "@/components/forms/create-ludo-event-form-dialog" // Assuming this handles editing as well
import { EditMarketplaceOfferForm } from "@/components/forms/edit-marketplace-offer-form"
import { EditSearchAdForm } from "@/components/forms/edit-search-ad-form"

// Import icons for toggling
import { FaPlay, FaPause } from "react-icons/fa"

export default function ProfilePage() {
  const { user, updateProfile, signOut } = useAuth()
  const { updateAvatar } = useAvatar()
  const { marketplaceOffers, deleteMarketplaceOffer, refreshData: refreshMarketplace } = useGames() // Renamed refreshData
  const { syncProfile, invalidateUserData } = useProfileSync()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast() // Initialize toast

  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingCommunity, setEditingCommunity] = useState<any>(null)

  const [userOffers, setUserOffers] = useState<any[]>([])
  const [userSearchAds, setUserSearchAds] = useState<any[]>([])
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [editingOffer, setEditingOffer] = useState<any>(null)
  const [editingSearchAd, setEditingSearchAd] = useState<any>(null)
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false)
  const [isEditSearchAdOpen, setIsEditSearchAdOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "offer" | "searchAd" | "event"; id: string } | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [createdEvents, setCreatedEvents] = useState<any[]>([])
  const [createdCommunities, setCreatedCommunities] = useState<any[]>([])

  const [participatingEvents, setParticipatingEvents] = useState<any[]>([]) // Renamed from userParticipations
  const [pendingJoinRequests, setPendingJoinRequests] = useState<any[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [tempAddress, setTempAddress] = useState("")

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    birthDate: user?.birthDate || "",
    showBirthDate: user?.showBirthDate || false,
    phone: user?.phone || "",
    address: user?.address || "",
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

  const [messageNotificationPrefs, setMessageNotificationPrefs] = useState<MessageNotificationPreferences>({
    user_id: "",
    direct_messages: { platform: true, email: true },
    game_inquiries: { platform: true, email: true },
    event_inquiries: { platform: true, email: true },
    group_inquiries: { platform: true, email: true },
    marketplace_messages: { platform: true, email: true },
    instant_notifications: true,
    daily_digest: false,
    weekly_digest: false,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    weekend_notifications: { platform: true, email: true },
  })

  const [securityNotificationPrefs, setSecurityNotificationPrefs] = useState({
    login_attempts: { platform: true, email: true },
    password_changes: { platform: true, email: true },
    email_changes: { platform: true, email: true },
    suspicious_activity: { platform: true, email: true },
    new_device_login: { platform: true, email: true },
    account_recovery: { platform: true, email: true },
    security_settings_changes: { platform: true, email: true },
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
      event_reminders: { platform: true, email: true }, // Added event reminders
      group_invites: { platform: true, email: true }, // Added group invites
    },
    privacy: {
      profile_visibility: "public",
      allow_friend_requests: true,
      allow_messages_from: "everyone",
    },
    security: {
      security_events_notifications: true,
    },
    marketing: {
      feature_announcements: { platform: true, email: true },
      game_recommendations: { platform: true, email: true },
      weekly_digest: { platform: true, email: true },
    },
    delivery: {},
  })

  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: "",
    currentPassword: "",
  })
  const [isEmailChanging, setIsEmailChanging] = useState(false)
  const [emailChangeMessage, setEmailChangeMessage] = useState("")

  // Added state for account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState<string>("adventurer")

  const joinedCommunitiesFiltered = useMemo(() => {
    return joinedCommunities.filter((membership) => membership.community?.creator_id !== user?.id)
  }, [joinedCommunities, user?.id])

  // Function to reload marketplace offers (needed for handleToggleOfferStatus)
  const loadUserMarketplaceOffers = async () => {
    if (!user?.id || !marketplaceOffers) return
    console.log("[v0] Filtering marketplace offers for user:", user.id)
    console.log("[v0] Total marketplace offers:", marketplaceOffers.length)
    const userMarketplaceOffers = marketplaceOffers.filter((offer) => offer.creator_id === user.id)
    console.log("[v0] User's marketplace offers:", userMarketplaceOffers.length)
    setUserOffers(userMarketplaceOffers)
  }

  const handleToggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const result = await toggleOfferStatus(offerId, currentStatus)

      if (result.error) {
        console.error("[v0] Error toggling offer status:", result.error)
        toast({ title: "Fehler", description: "Konnte den Status des Angebots nicht aktualisieren.", variant: "destructive" })
        return
      }

      toast({ title: "Status aktualisiert", description: currentStatus ? "Angebot pausiert" : "Angebot aktiviert." })
      await loadUserMarketplaceOffers()
    } catch (error) {
      console.error("[v0] Error in handleToggleOfferStatus:", error)
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive" })
    }
  }

  const handleToggleSearchAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const result = await toggleSearchAdStatus(adId, currentStatus)

      if (result.error) {
        console.error("[v0] Error toggling search ad status:", result.error)
        toast({ title: "Fehler", description: "Konnte den Status der Suchanzeige nicht aktualisieren.", variant: "destructive" })
        return
      }

      toast({ title: "Status aktualisiert", description: currentStatus ? "Suchanzeige pausiert" : "Suchanzeige aktiviert." })
      await loadUserSearchAds()
    } catch (error) {
      console.error("[v0] Error in handleToggleSearchAdStatus:", error)
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive" })
    }
  }

  // Function to reload search ads (needed for handleToggleSearchAdStatus)
  const loadUserSearchAds = async () => {
    if (!user?.id) return
    try {
      console.log("[v0] Loading search ads for user:", user.id)
      
      const { data: searchAds, error: searchAdsError } = await supabase
        .from("search_ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (searchAdsError) {
        console.error("[v0] Error loading search ads:", searchAdsError)
      } else {
        console.log("[v0] Search ads loaded:", searchAds?.length || 0, searchAds)
        setUserSearchAds(searchAds || [])
      }
    } catch (error) {
      console.error("[v0] Error loading user search ads:", error)
    }
  }

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
      console.log("[v0] Fetching user events for user:", user.id)

      const { data: events, error } = await supabase
        .from("ludo_events")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user events:", error)
        return
      }

      console.log("[v0] User events loaded successfully:", events?.length || 0)
      setUserEvents(events || [])
    } catch (error) {
      console.error("Error fetching user events:", error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const fetchUserActivities = async () => {
    if (!user?.id) return

    try {
      setLoadingActivities(true)
      console.log("[v0] Fetching user activities for user:", user.id)

      // Fetch created events with participant count
      const { data: eventsCreated, error: eventsCreatedError } = await supabase
        .from("ludo_events")
        .select(`
          *,
          participants:ludo_event_participants(count)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      if (eventsCreatedError) {
        console.error("Error fetching created events:", eventsCreatedError)
      } else {
        console.log("[v0] Created events loaded:", eventsCreated?.length || 0)
        setCreatedEvents(eventsCreated || [])
      }

      // Fetch events user is participating in with participant count
      const { data: participations, error: participationsError } = await supabase
        .from("ludo_event_participants")
        .select(`
          *,
          event:ludo_events!inner(
            *,
            participants:ludo_event_participants(count)
          )
        `)
        .eq("user_id", user.id)
        .neq("event.creator_id", user.id)
        .order("joined_at", { ascending: false })

      if (participationsError) {
        console.error("Error fetching participations:", participationsError)
      } else {
        console.log("[v0] Participations loaded:", participations?.length || 0)
        setParticipatingEvents(participations || [])
      }

      // Fetch pending join requests
      const { data: requests, error: requestsError } = await supabase
        .from("ludo_event_join_requests")
        .select(`
          *,
          event:ludo_events(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (requestsError) {
        console.error("Error fetching join requests:", requestsError)
      } else {
        console.log("[v0] Join requests loaded:", requests?.length || 0)
        setPendingJoinRequests(requests || [])
      }

      // Fetch created communities with member count
      const { data: communitiesCreated, error: communitiesCreatedError } = await supabase
        .from("communities")
        .select(`
          *,
          members:community_members(count)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      if (communitiesCreatedError) {
        console.error("Error fetching created communities:", communitiesCreatedError)
      } else {
        console.log("[v0] Created communities loaded:", communitiesCreated?.length || 0)
        setCreatedCommunities(communitiesCreated || [])
      }

      // Fetch communities user is a member of with member count
      const { data: communities, error: communitiesError } = await supabase
        .from("community_members")
        .select(`
          *,
          community:communities(
            *,
            members:community_members(count)
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })

      if (communitiesError) {
        console.error("Error fetching communities:", communitiesError)
      } else {
        console.log("[v0] Communities loaded:", communities?.length || 0)
        setJoinedCommunities(communities || [])
      }
    } catch (error) {
      console.error("Error fetching user activities:", error)
    } finally {
      setLoadingActivities(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadUserListings()
      fetchUserEvents()
      fetchUserActivities() // Added call to fetch activities
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && marketplaceOffers) {
      loadUserMarketplaceOffers()
    }
  }, [user?.id, marketplaceOffers])

  useEffect(() => {
    const eventChannel = supabase
      .channel("user-events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_events",
          filter: `creator_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Events changed, refreshing...")
          fetchUserActivities()
        },
      )
      .subscribe()

    const participationChannel = supabase
      .channel("user-participations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_event_participants",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Participations changed, refreshing...")
          fetchUserActivities()
        },
      )
      .subscribe()

    const requestChannel = supabase
      .channel("user-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ludo_event_join_requests",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Join requests changed, refreshing...")
          fetchUserActivities()
        },
      )
      .subscribe()

    const communityChannel = supabase
      .channel("user-communities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "communities",
          filter: `creator_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Communities changed, refreshing...")
          fetchUserActivities()
        },
      )
      .subscribe()

    const membershipChannel = supabase
      .channel("user-membership-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_members",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Community memberships changed, refreshing...")
          fetchUserActivities()
        },
      )
      .subscribe()

    const offerChannel = supabase
      .channel("user-offers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_offers",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Marketplace offers changed, refreshing...")
          loadUserMarketplaceOffers()
        },
      )
      .subscribe()

    const searchAdsChannel = supabase
      .channel("user-search-ads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "search_ads",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[v0] Search ads changed, refreshing...")
          loadUserListings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(eventChannel)
      supabase.removeChannel(participationChannel)
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(communityChannel)
      supabase.removeChannel(membershipChannel)
      supabase.removeChannel(offerChannel)
      supabase.removeChannel(searchAdsChannel)
    }
  }, [user?.id])

  useEffect(() => {
    const loadSecurityPreferences = async () => {
      try {
        const prefs = await getSecurityNotificationPreferences()
        if (prefs) {
          setSecurityNotificationPrefs((prev) => ({
            ...prev,
            ...prefs,
          }))
        }
      } catch (error) {
        console.error("[v0] Error loading security preferences:", error)
      }
    }

    const loadMessageNotificationPrefs = async () => {
      try {
        const prefs = await getMessageNotificationPreferences()
        if (prefs) {
          setMessageNotificationPrefs((prev) => ({
            ...prev,
            ...prefs,
          }))
        }
      } catch (error) {
        console.error("[v0] Error loading message notification preferences:", error)
      }
    }

    const loadComprehensivePrefs = async () => {
      try {
        const prefs = await getAllNotificationPreferences()
        setComprehensivePrefs((prev) => ({
          social: { ...prev.social, ...prefs.social },
          privacy: { ...prev.privacy, ...prefs.privacy },
          security: { ...prev.security, ...prefs.security },
          marketing: { ...prev.marketing, ...prefs.marketing },
          delivery: { ...prev.delivery, ...prefs.delivery },
        }))
      } catch (error) {
        console.error("[v0] Error loading comprehensive preferences:", error)
      }
    }

    if (user) {
      loadSecurityPreferences()
      loadMessageNotificationPrefs()
      loadComprehensivePrefs()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setProfileData((prev) => {
        // If prev.avatar differs from user.avatar and is not empty, keep prev.avatar
        // This prevents overwriting freshly uploaded avatars
        const shouldKeepCurrentAvatar = prev.avatar && prev.avatar !== user.avatar

        return {
          ...prev,
          name: user.name || "",
          username: user.username || "",
          email: user.email || "",
          birthDate: user.birthDate || "",
          showBirthDate: user.showBirthDate || false,
          phone: user.phone || "",
          address: user.address || "",
          bio: user.bio || "",
          favoriteGames: user.favoriteGames || "",
          website: user.website || "",
          twitter: user.twitter || "",
          instagram: user.instagram || "",
          avatar: shouldKeepCurrentAvatar ? prev.avatar : user.avatar || "",
        }
      })
    }
  }, [user])

  const loadUserListings = async () => {
    if (!user?.id) return

    try {
      // Load marketplace offers
      await loadUserMarketplaceOffers()

      // Load search ads
      await loadUserSearchAds() // Use the new function
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

  const handleMessageNotificationChange = async (key: string, type: "platform" | "email", value: boolean | string) => {
    try {
      const updatedSetting = {
        ...(messageNotificationPrefs[key as keyof typeof messageNotificationPrefs] as {
          platform?: boolean
          email?: boolean
          [key: string]: any
        }),
        [type]: value,
      }

      setMessageNotificationPrefs((prev) => ({
        ...prev,
        [key]: updatedSetting,
      }))

      // Only call API if it's a boolean change, otherwise it's likely for time settings
      if (typeof value === "boolean") {
        await updateMessageNotificationPreferences({ [key]: updatedSetting })
        toast({
          title: "Einstellungen gespeichert",
          description: "Deine Nachrichten-Benachrichtigungen wurden aktualisiert.",
        })
      } else {
        // For time settings, just update local state for now, potentially save later or on a general save
        console.log("Time setting updated for:", key, type, value)
        toast({
          title: "Zeit geändert",
          description: "Ruhezeit wurde aktualisiert.",
        })
      }
    } catch (error) {
      console.error(`Error updating message notification for ${key}:`, error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
      // Revert the change - this might be complex for nested objects, simplified here
      // A more robust solution would involve deep cloning or more specific revert logic
      fetchMessageNotificationPrefs() // Re-fetch to revert
    }
  }

  // Helper to re-fetch message notification preferences
  const fetchMessageNotificationPrefs = async () => {
    try {
      const prefs = await getMessageNotificationPreferences()
      if (prefs) {
        setMessageNotificationPrefs(prefs)
      }
    } catch (error) {
      console.error("Error re-fetching message notification preferences:", error)
    }
  }

  const handleSecurityNotificationChange = async (key: string, type: "platform" | "email", value: boolean) => {
    try {
      const updatedSetting = {
        ...securityNotificationPrefs[key as keyof typeof securityNotificationPrefs],
        [type]: value,
      }

      setSecurityNotificationPrefs((prev) => ({
        ...prev,
        [key]: updatedSetting,
      }))

      await updateSecurityNotificationPreferences({ [key]: updatedSetting })
      await logSecurityEvent({
        eventType: "security_settings_change",
        additionalData: { setting: key, value },
      })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Sicherheitsbenachrichtigungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error(`Error updating security notification for ${key}:`, error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
      // Revert the change
      setSecurityNotificationPrefs(securityNotificationPrefs)
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
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine sozialen Benachrichtigungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("[v0] Error updating social notifications:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleMarketingNotificationChange = async (key: string, type: "platform" | "email", value: boolean) => {
    try {
      const updatedSetting = {
        ...comprehensivePrefs.marketing[key as keyof typeof comprehensivePrefs.marketing],
        [type]: value,
      }

      setComprehensivePrefs((prev) => ({
        ...prev,
        marketing: { ...prev.marketing, [key]: updatedSetting },
      }))

      await updateMarketingNotificationPreferences({ [key]: updatedSetting })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Marketing-Benachrichtigungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("[v0] Error updating marketing notifications:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleDeliveryMethodChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, [key]: value },
      }))

      await updateDeliveryMethodPreferences({ [key]: value })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Übertragungsart-Einstellungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("[v0] Error updating delivery method:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handlePrivacySettingChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [key]: value },
      }))

      await updatePrivacySettings({ [key]: value })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Privatsphäre-Einstellungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("[v0] Error updating privacy settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleSecuritySettingChange = async (key: string, value: any) => {
    try {
      setComprehensivePrefs((prev) => ({
        ...prev,
        security: { ...prev.security, [key]: value },
      }))

      await updateSecuritySettings({ [key]: value })
      toast({
        title: "Einstellungen gespeichert",
        description: "Deine Sicherheitseinstellungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("[v0] Error updating security settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    console.log("[v0] Starting avatar upload:", { fileName: file.name, fileSize: file.size, userId: user.id })

    try {
      setIsLoading(true)

      // Create FormData for the upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      console.log("[v0] FormData created, sending to /api/upload-avatar...")

      // Upload to Vercel Blob via API route
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Upload error:", errorData)
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()
      console.log("[v0] Upload successful, new avatar URL:", url)

      console.log("[v0] Calling updateUserProfile to save avatar to database...")
      const result = await updateUserProfile(user.id, { avatar: url })

      if (!result.success) {
        console.error("[v0] Failed to save avatar to database:", result.error)
        throw new Error(result.error || "Failed to save avatar")
      }

      console.log("[v0] Avatar saved to database successfully, result:", result)

      console.log("[v0] Updating avatar cache with new URL")
      updateAvatar(user.id, url)

      console.log("[v0] Updating local state with new avatar URL")
      setProfileData((prev) => ({ ...prev, avatar: url }))

      console.log("[v0] Updating auth context")
      await updateProfile({ avatar: url })

      // Trigger platform-wide synchronization
      console.log("[v0] Broadcasting profile sync event")
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profileSync", {
            detail: { userId: user.id, changes: { avatar: url } },
          }),
        )
      }

      toast({
        title: "Erfolg",
        description: "Profilbild wurde aktualisiert",
      })

      console.log("[v0] Avatar upload complete!")
    } catch (error: any) {
      console.error("[v0] Avatar upload failed:", error)
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Hochladen des Profilbildes",
        variant: "destructive",
      })
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
        address: profileData.address,
        bio: profileData.bio,
        favoriteGames: profileData.favoriteGames,
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

        setMessage("Profil erfolgreich gespeichert")

        toast({
          title: "Profil aktualisiert",
          description: "Dein Profil wurde erfolgreich gespeichert.",
        })
        console.log("[v0] Profile updated and synchronized across platform")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("Fehler beim Aktualisieren des Profils")
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Profils.",
        variant: "destructive",
      })
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

      // Note: Supabase update user might require a password confirmation step for sensitive actions.
      // This example assumes the backend handles password verification implicitly or via another mechanism.
      // For a real-world app, you might need to send the current password to your Supabase auth function.

      const { error } = await supabase.auth.updateUser(
        { email: emailChangeData.newEmail },
        {
          emailRedirectTo: `${window.location.origin}/profile`,
        },
      )

      if (error) throw error

      setEmailChangeMessage("Bestätigungs-E-Mail gesendet! Überprüfe dein Postfach.")
      setEmailChangeData({ newEmail: "", currentPassword: "" })
      toast({
        title: "E-Mail-Änderung beantragt",
        description: "Eine Bestätigungs-E-Mail wurde an deine neue Adresse gesendet.",
      })
    } catch (error: any) {
      console.error("Error changing email:", error)
      setEmailChangeMessage(error.message || "Fehler beim Ändern der E-Mail-Adresse.")
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Ändern der E-Mail-Adresse.",
        variant: "destructive",
      })
    } finally {
      setIsEmailChanging(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Möchten Sie dieses Event wirklich löschen?")) return

    try {
      const { error } = await supabase.from("ludo_events").delete().eq("id", eventId)

      if (error) throw error

      setMessage("Event erfolgreich gelöscht!")
      toast({
        title: "Event gelöscht",
        description: "Dein Event wurde erfolgreich entfernt.",
      })
      fetchUserActivities()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Fehler",
        description: "Das Event konnte nicht gelöscht werden.",
        variant: "destructive",
      })
      setMessage("Fehler beim Löschen des Events.")
    }
  }

  const handleDeleteCommunity = async (communityId: string) => {
    if (!confirm("Möchten Sie diese Spielgruppe wirklich löschen?")) return

    try {
      const { error } = await supabase.from("communities").delete().eq("id", communityId)

      if (error) throw error

      setMessage("Spielgruppe erfolgreich gelöscht!")
      toast({
        title: "Spielgruppe gelöscht",
        description: "Deine Spielgruppe wurde erfolgreich entfernt.",
      })
      fetchUserActivities()
    } catch (error) {
      console.error("Error deleting community:", error)
      toast({
        title: "Fehler",
        description: "Die Spielgruppe konnte nicht gelöscht werden.",
        variant: "destructive",
      })
      setMessage("Fehler beim Löschen der Spielgruppe.")
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Möchten Sie dieses Angebot wirklich löschen?")) return

    try {
      const { error } = await supabase.from("marketplace_offers").delete().eq("id", offerId)

      if (error) throw error

      setMessage("Angebot erfolgreich gelöscht!")
      toast({
        title: "Angebot gelöscht",
        description: "Dein Marktplatz-Angebot wurde erfolgreich entfernt.",
      })
      refreshMarketplace()
    } catch (error) {
      console.error("Error deleting offer:", error)
      toast({
        title: "Fehler",
        description: "Das Angebot konnte nicht gelöscht werden.",
        variant: "destructive",
      })
      setMessage("Fehler beim Löschen des Angebots.")
    }
  }

  const handleDeleteSearchAd = async (adId: string) => {
    if (!confirm("Möchten Sie diese Suchanzeige wirklich löschen?")) return

    try {
      const { error } = await supabase.from("search_ads").delete().eq("id", adId)

      if (error) {
        console.error("Error deleting search ad:", error)
        throw error
      }

      setMessage("Suchanzeige erfolgreich gelöscht!")
      toast({
        title: "Suchanzeige gelöscht",
        description: "Deine Suchanzeige wurde erfolgreich entfernt.",
      })
      loadUserListings()
    } catch (error) {
      console.error("Error deleting search ad:", error)
      toast({
        title: "Fehler",
        description: "Die Suchanzeige konnte nicht gelöscht werden.",
        variant: "destructive",
      })
      setMessage("Fehler beim Löschen der Suchanzeige.")
    }
  }

  const handleEditOfferSuccess = async () => {
    await refreshMarketplace() // Use renamed function
    await loadUserListings()
  }

  const handleEditSearchAdSuccess = async () => {
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

  // Added handlers for activities
  const handleCancelJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("ludo_event_join_requests")
        .delete()
        .eq("id", requestId)
        .eq("user_id", user?.id)

      if (error) {
        console.error("Error canceling join request:", error)
        toast({
          title: "Fehler",
          description: "Die Anfrage konnte nicht storniert werden.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Erfolg",
        description: "Teilnahmeanfrage wurde storniert.",
      })
      fetchUserActivities()
    } catch (error) {
      console.error("Error canceling join request:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveEvent = async (participationId: string) => {
    // Renamed from handleCancelParticipation
    try {
      const { error } = await supabase
        .from("ludo_event_participants")
        .delete()
        .eq("id", participationId)
        .eq("user_id", user?.id)

      if (error) {
        console.error("Error leaving event:", error)
        toast({
          title: "Fehler",
          description: "Event konnte nicht verlassen werden.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Erfolg",
        description: "Du hast das Event verlassen.",
      })
      fetchUserActivities()
    } catch (error) {
      console.error("Error leaving event:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveCommunity = async (membershipId: string) => {
    try {
      const { error } = await supabase.from("community_members").delete().eq("id", membershipId).eq("user_id", user?.id)

      if (error) {
        console.error("Error leaving community:", error)
        toast({
          title: "Fehler",
          description: "Spielgruppe konnte nicht verlassen werden.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Erfolg",
        description: "Du hast die Spielgruppe verlassen.",
      })
      fetchUserActivities()
    } catch (error) {
      console.error("Error leaving community:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  // Added handler for account deletion
  const handleDeleteAccount = async () => {
    if (!user?.id) return
    if (deleteConfirmation !== "LÖSCHEN") {
      toast({ title: "Fehler", description: "Bitte gib 'LÖSCHEN' ein, um fortzufahren", variant: "destructive" })
      return
    }

    try {
      setIsDeleting(true)
      const result = await deleteAccountAction(user.id)

      if (result.success) {
        toast({ title: "Erfolg", description: "Dein Konto wurde erfolgreich gelöscht" })
        // Sign out and redirect
        if (signOut) {
          await signOut()
        }
        window.location.href = "/"
      } else {
        toast({
          title: "Fehler",
          description: result.error || "Fehler beim Löschen des Kontos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation("")
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
      <Navigation currentPage="profile" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold font-handwritten text-gray-800 mb-2">Profil</h1>
            <p className="text-gray-600 font-body text-sm md:text-sm">
              Verwalte deine Kontoinformationen und Einstellungen
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="profile" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Profil
              </TabsTrigger>
              <TabsTrigger value="activities" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Meine Aktivitäten</span>
                <span className="sm:hidden">Aktivitäten</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="textBenachrichtigungenext-xs font-medium">Benachrichtigungen</span>
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
                          size="xs"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          disabled={isLoading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Foto hochladen
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
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
                          <Label htmlFor="name" className="text-xs">
                            Vollständiger Name
                          </Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-xs">
                            Benutzername
                          </Label>
                          <Input
                            id="username"
                            name="username"
                            value={profileData.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            className="text-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Dieser Name wird auf der Plattform angezeigt und ist für andere Nutzer sichtbar.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs">
                          E-Mail-Adresse
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="text-xs"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Die E-Mail-Adresse kann im Sicherheits-Tab geändert werden.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="birthDate" className="text-xs">
                            Geburtsdatum
                          </Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={profileData.birthDate}
                            onChange={(e) => handleInputChange("birthDate", e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs">
                            Telefonnummer
                          </Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+41 XX XXX XX XX"
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Lieblingsspiele */}
                      <div className="space-y-2">
                        <Label htmlFor="favoriteGames" className="text-xs">
                          Lieblingsspiele
                        </Label>
                        <Input
                          id="favoriteGames"
                          value={profileData.favoriteGames}
                          onChange={(e) => handleInputChange("favoriteGames", e.target.value)}
                          placeholder="z.B. Catan, Azul, Wingspan"
                          className="text-xs"
                        />
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-xs">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          placeholder="Erzähle etwas über dich..."
                          className="text-xs"
                          rows={3}
                        />
                      </div>

                      {/* Social Media */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Social Media</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-xs flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Website
                            </Label>
                            <Input
                              id="website"
                              value={profileData.website}
                              onChange={(e) => handleInputChange("website", e.target.value)}
                              placeholder="https://..."
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="text-xs flex items-center gap-2">
                              <Twitter className="w-4 h-4" />
                              Twitter/X
                            </Label>
                            <Input
                              id="twitter"
                              value={profileData.twitter}
                              onChange={(e) => handleInputChange("twitter", e.target.value)}
                              placeholder="@username"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-xs flex items-center gap-2">
                              <Instagram className="w-4 h-4" />
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              value={profileData.instagram}
                              onChange={(e) => handleInputChange("instagram", e.target.value)}
                              placeholder="@username"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4">
                      <Label className="text-xs font-medium">Adresse</Label>
                      {!isEditingAddress ? (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-700">
                            {profileData.address || "Keine Adresse angegeben"}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setTempAddress(profileData.address || "")
                              setIsEditingAddress(true)
                            }}
                          >
                            Bearbeiten
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AddressAutocomplete
                            label=""
                            placeholder="Adresse eingeben..."
                            value={tempAddress}
                            onChange={(value) => setTempAddress(value)}
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                handleInputChange("address", tempAddress)
                                setIsEditingAddress(false)
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Speichern
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTempAddress(profileData.address || "")
                                setIsEditingAddress(false)
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading} className="min-w-32 text-xs">
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

            <TabsContent value="activities">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Meine Aktivitäten</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Übersicht über deine Event-Teilnahmen, Anfragen und Spielgruppen, sowie Spielemarkt-Angebote
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <Tabs defaultValue="events-participating" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6 gap-1">
                      <TabsTrigger value="events-participating" className="text-xs md:text-sm px-1">
                        <span className="text-gray-600 text-sm md:text-sm mb-0">Events (Teilnahme)</span>
                        <span className="sm:hidden">📅 Teil.</span>
                      </TabsTrigger>
                      <TabsTrigger value="events-created" className="text-xs md:text-sm px-1">
                        <span className="hidden sm:inline text-sm">Events (Erstellt)</span>
                        <span className="sm:hidden">📅 Erst.</span>
                      </TabsTrigger>
                      <TabsTrigger value="requests" className="text-xs md:text-sm px-1">
                        <span className="hidden sm:inline">Anfragen</span>
                        <span className="sm:hidden">⏳</span>
                      </TabsTrigger>
                      <TabsTrigger value="groups-joined" className="text-xs md:text-sm px-1">
                        <span className="hidden sm:inline">Gruppen (Mitglied)</span>
                        <span className="sm:hidden">👥 Mit.</span>
                      </TabsTrigger>
                      <TabsTrigger value="groups-created" className="text-xs md:text-sm px-1">
                        <span className="hidden sm:inline">Gruppen (Erstellt)</span>
                        <span className="sm:hidden">👥 Erst.</span>
                      </TabsTrigger>
                      <TabsTrigger value="marketplace" className="text-xs md:text-sm px-1">
                        <span className="hidden sm:inline">Marktplatz</span>
                        <span className="sm:hidden">🛒</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Events Participating Tab - Updated */}
                    <TabsContent value="events-participating" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-base md:text-sm">
                          Events, an denen ich teilnehme ({participatingEvents.length})
                        </h3>
                      </div>
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : participatingEvents.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">
                            Du nimmst derzeit an keinen Events teil.
                          </p>
                          <Button size="sm" onClick={() => router.push("/ludo-events")}>
                            Events entdecken
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {participatingEvents.map((participation) => (
                            <div
                              key={participation.id}
                              className="border-2 border-blue-200 rounded-xl p-3 bg-white hover:border-blue-400 transition-colors cursor-pointer"
                              onClick={() => router.push(`/ludo-events/${participation.event?.id}`)}
                            >
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-gray-900">
                                  {participation.event?.title || "Event"}
                                </h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {participation.event?.event_date // Corrected to event_date based on actual data structure
                                      ? new Date(participation.event.event_date).toLocaleDateString("de-DE", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })
                                      : "Datum nicht angegeben"}
                                    {participation.event?.event_time && ` • ${participation.event.event_time}`}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {participation.event?.location || "Kein Ort"}
                                  </span>
                                  {participation.event?.selected_games &&
                                    participation.event.selected_games.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Gamepad2 className="w-3.5 h-3.5" />
                                        {participation.event.selected_games
                                          .map((g: any) => g.title || g.name)
                                          .join(", ")}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="events-created" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        
                        <h3 className="text-sm mb-2 md:text-sm font-semibold text-foreground">
                          Events, die ich erstellt habe ({createdEvents.length})
                        </h3>
                      </div>
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                      ) : createdEvents.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">Du hast noch keine Events erstellt.</p>
                          <Button size="sm" onClick={() => router.push("/ludo-events")}>
                            Erstes Event erstellen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {createdEvents.map((event) => (
                            <div
                              key={event.id}
                              className="border-2 border-green-200 rounded-xl p-3 bg-white hover:border-green-400 transition-colors cursor-pointer"
                              onClick={() => router.push(`/ludo-events/${event.id}`)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-sm text-gray-900 flex-1">{event.title}</h4>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-blue-500 hover:text-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        console.log("[v0] Edit event button clicked, event:", event.id)
                                        setEditingEvent(event)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteEvent(event.id)
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    {event.frequency && event.frequency !== "once" ? (
                                      "Serientermine"
                                    ) : (
                                      <>
                                        {event.event_date
                                          ? new Date(event.event_date).toLocaleDateString("de-DE", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                            })
                                          : "Datum nicht angegeben"}
                                        {event.event_time && ` • ${event.event_time}`}
                                      </>
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {event.location || "Kein Ort"}
                                  </span>
                                  {event.selected_games && event.selected_games.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <DicesIcon className="w-3.5 h-3.5" />
                                      {event.selected_games.map((g: any) => g.title || g.name).join(", ")}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {event.participants?.[0]?.count || 0} Teilnehmer
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="requests" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-base md:text-sm">
                          Ausstehende Teilnahmeanfragen ({pendingJoinRequests.length})
                        </h3>
                      </div>
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                      ) : pendingJoinRequests.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm">Keine ausstehenden Anfragen.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingJoinRequests.map((request) => (
                            <div
                              key={request.id}
                              className="border-2 border-orange-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base text-orange-900 mb-2">
                                    {request.event?.title || "Event"}
                                  </h4>
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                    {request.event?.description}
                                  </p>
                                  {request.message && (
                                    <div className="flex items-start gap-2 mb-3 p-2 bg-orange-50 rounded">
                                      <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5" />
                                      <p className="text-gray-700 text-xs italic">"{request.message}"</p>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      Angefragt am{" "}
                                      {new Date(request.created_at).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Ausstehend
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2 border-t border-orange-100">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/ludo-events/${request.event?.id}`)}
                                    className="text-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancelJoinRequest(request.id)}
                                    className="text-xs"
                                  >
                                    <UserX className="w-3.5 h-3.5 mr-1" />
                                    Stornieren
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="groups-created" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-base md:text-sm">
                          Spielgruppen, die ich erstellt habe ({createdCommunities.length})
                        </h3>
                      </div>
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        </div>
                      ) : createdCommunities.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm md:text-base mb-2">
                            Du hast noch keine Spielgruppen erstellt.
                          </p>
                          <Button size="sm" onClick={() => router.push("/ludo-gruppen")}>
                            Erste Spielgruppe erstellen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {createdCommunities.map((community) => (
                            <div
                              key={community.id}
                              className="border-2 border-pink-200 rounded-xl p-3 bg-white hover:border-pink-400 transition-colors cursor-pointer"
                              onClick={() => router.push(`/ludo-gruppen/${community.id}`)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-gray-900 flex-1">{community.name}</h4>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-blue-500 hover:text-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        console.log("[v0] Edit community button clicked, community:", community.id)
                                        setEditingCommunity(community)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteCommunity(community.id)
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    {new Date(community.created_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {community.location || "Kein Ort"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {community.members?.[0]?.count || 0} Mitglied
                                    {(community.members?.[0]?.count || 0) !== 1 ? "er" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="groups-joined" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-base md:text-sm">
                          Spielgruppen, in denen ich Mitglied bin ({joinedCommunitiesFiltered.length})
                        </h3>
                      </div>
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      ) : joinedCommunitiesFiltered.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm md:text-base mb-2">
                            Du bist noch keiner Spielgruppe beigetreten.
                          </p>
                          <Button size="sm" onClick={() => router.push("/ludo-gruppen")}>
                            Spielgruppen entdecken
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {joinedCommunitiesFiltered.map((membership) => (
                            <div
                              key={membership.id}
                              className="border-2 border-purple-200 rounded-xl p-3 bg-white hover:border-purple-400 transition-colors cursor-pointer"
                              onClick={() => router.push(`/ludo-gruppen/${membership.community?.id}`)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-gray-900 flex-1 text-xs">
                                    {membership.community?.name}
                                  </h4>
                                  {membership.role === "admin" && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                      Admin
                                    </span>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleLeaveCommunity(membership.id)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                                    {new Date(membership.joined_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {membership.community?.location || "Kein Ort"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {membership.community?.members?.[0]?.count || 0} Mitglied
                                    {(membership.community?.members?.[0]?.count || 0) !== 1 ? "er" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="marketplace" className="space-y-6">
                      {/* Marketplace Offers Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-semibold text-base md:text-lg">
                            Marktplatz-Angebote ({userOffers.length})
                          </h3>
                        </div>
                        {userOffers.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 text-sm md:text-base mb-2">
                              Du hast noch keine Angebote erstellt.
                            </p>
                            <Button size="sm" onClick={() => router.push("/marketplace")}>
                              Erstes Angebot erstellen
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userOffers.map((offer) => (
                              <div
                                key={offer.id}
                                className="border-2 border-purple-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white/80"
                                onClick={() => router.push(`/marketplace?offerId=${offer.id}`)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">{offer.game_title}</h4>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      {offer.publisher && (
                                        <p className="flex items-center gap-2">
                                          <Building className="h-4 w-4" />
                                          {offer.publisher}
                                        </p>
                                      )}
                                      <p className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        {offer.offer_type === "sell" && "Verkaufen"}
                                        {offer.offer_type === "lend" && "Verleihen"}
                                        {offer.offer_type === "trade" && "Tauschen"}
                                      </p>
                                      {offer.price && (
                                        <p className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4" />
                                          {offer.price} CHF
                                        </p>
                                      )}
                                      {offer.rental_price && (
                                        <p className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4" />
                                          {offer.rental_price} CHF / Tag
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant={offer.active === false ? "default" : "outline"}
                                      size="xs"
                                      onClick={() => handleToggleOfferStatus(offer.id, offer.active !== false)}
                                      className={offer.active === false ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                                    >
                                      {offer.active === false ? (
                                        <>
                                          <FaPlay className="h-3 w-3 mr-1" />
                                          Aktivieren
                                        </>
                                      ) : (
                                        <>
                                          <FaPause className="h-3 w-3 mr-1" />
                                          Pausieren
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => {
                                        console.log("[v0] Edit offer button clicked, offer:", offer.id)
                                        setEditingOffer(offer)
                                        setIsEditOfferOpen(true)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="xs" onClick={() => handleDeleteOffer(offer.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Search Ads Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-semibold text-base md:text-lg">Suchanzeigen ({userSearchAds.length})</h3>
                        </div>
                        {userSearchAds.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 text-sm md:text-base mb-2">
                              Du hast noch keine Suchanzeigen erstellt.
                            </p>
                            <Button size="sm" onClick={() => router.push("/marketplace")}>
                              Erste Suchanzeige erstellen
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userSearchAds.map((ad) => (
                              <div
                                key={ad.id}
                                className="border-2 border-amber-200 rounded-xl p-3 bg-white hover:border-amber-400 transition-colors cursor-pointer"
                                onClick={() => router.push(`/marketplace?searchAdId=${ad.id}`)}
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-sm text-gray-900 flex-1">{ad.title}</h4>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant={ad.active === false ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleToggleSearchAdStatus(ad.id, ad.active !== false)}
                                        className={ad.active === false ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                                      >
                                        {ad.active === false ? (
                                          <>
                                            <FaPlay className="h-3 w-3 mr-1" />
                                            Aktivieren
                                          </>
                                        ) : (
                                          <>
                                            <FaPause className="h-3 w-3 mr-1" />
                                            Pausieren
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-blue-500 hover:text-blue-700"
                                        onClick={() => {
                                          console.log("[v0] Edit search ad button clicked, ad:", ad.id)
                                          setEditingSearchAd(ad)
                                          setIsEditSearchAdOpen(true)
                                        }}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteSearchAd(ad.id)
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                    {ad.publisher && (
                                      <p className="flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        {ad.publisher}
                                      </p>
                                    )}
                                    <p className="flex items-center gap-2">
                                      <Tag className="h-4 w-4" />
                                      {ad.type === "buy" ? "Gesucht zum Kaufen" : ad.type === "rent" ? "Gesucht zum Mieten" : "Gesucht zum Tauschen"}
                                    </p>
                                    {ad.type === "rent" && ad.rental_duration && (
                                      <p className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {ad.rental_duration}
                                      </p>
                                    )}
                                    {ad.type === "buy" && ad.max_price && (
                                      <p className="flex items-center gap-2">
                                        <BanknoteIcon className="h-4 w-4" />
                                        bis {ad.max_price} CHF
                                      </p>
                                    )}
                                    {ad.type === "trade" && ad.trade_game_title && (
                                      <p className="flex items-center gap-2">
                                        <RepeatIcon className="h-4 w-4" />
                                        Biete: {ad.trade_game_title}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Benachrichtigungen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Verwalte deine Benachrichtigungseinstellungen nach Kategorien
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 md:p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Soziale Benachrichtigungen */}
                    <AccordionItem value="social" className="border-2 border-teal-200 rounded-xl mb-4 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          
                          <div className="text-left">
                            <h3 className="font-semibold text-sm">Soziale Benachrichtigungen</h3>
                            <p className="text-xs text-gray-600">Freunde, Forum, Community</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Friend Requests */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Freundschaftsanfragen</Label>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Friend Accepts */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Freundschaftsannahmen</Label>
                            <p className="text-xs text-gray-600">Wenn jemand deine Anfrage annimmt</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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

                        {/* Friend Declines */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Freundschaftsablehnungen</Label>
                            <p className="text-xs text-gray-600">Wenn jemand deine Anfrage ablehnt</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Forum Replies */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Forum-Antworten</Label>
                            <p className="text-xs text-gray-600">Antworten auf deine Beiträge</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Forum Comment Replies */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Kommentar-Antworten</Label>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Shelf Access Requests */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium">Spielregal-Anfragen</Label>
                            <p className="text-xs text-gray-600">Zugangsanfragen zu deinem Spielregal</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Nachrichten-Benachrichtigungen */}
                    <AccordionItem value="messages" className="border-2 border-blue-200 rounded-xl mb-4 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          
                          <div className="text-left">
                            <h3 className="font-semibold text-sm">Nachrichten</h3>
                            <p className="text-xs text-gray-600">Direktnachrichten, Anfragen</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Direct Messages */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Direktnachrichten</Label>
                            <p className="text-xs text-gray-600">Private Nachrichten von anderen Nutzern</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Game Inquiries */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Spielanfragen</Label>
                            <p className="text-xs text-gray-600">Anfragen zu deinen Spielen</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.game_inquiries?.platform ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("game_inquiries", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.game_inquiries?.email ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("game_inquiries", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Event Inquiries */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Event-Anfragen</Label>
                            <p className="text-xs text-gray-600">Anfragen zu deinen Events</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.event_inquiries?.platform ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("event_inquiries", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.event_inquiries?.email ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("event_inquiries", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Group Inquiries */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Spielgruppen-Anfragen</Label>
                            <p className="text-xs text-gray-600">Anfragen zu deinen Spielgruppen</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.group_inquiries?.platform ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("group_inquiries", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.group_inquiries?.email ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("group_inquiries", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Marketplace Messages */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium">Marktplatz-Nachrichten</Label>
                            <p className="text-xs text-gray-600">Nachrichten zu Marktplatz-Angeboten</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.marketplace_messages?.platform ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("marketplace_messages", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={messageNotificationPrefs.marketplace_messages?.email ?? true}
                                onChange={(e) =>
                                  handleMessageNotificationChange("marketplace_messages", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Event-Benachrichtigungen */}
                    <AccordionItem value="events" className="border-2 border-purple-200 rounded-xl mb-4 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <h3 className="font-semibold text-sm">Events</h3>
                            <p className="text-xs text-gray-600">Einladungen, Updates, Erinnerungen</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Event Invitations */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Event-Einladungen</Label>
                            <p className="text-xs text-gray-600">Wenn du zu einem Event eingeladen wirst</p>
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
                              <span className="text-xs text-gray-600">In-App</span>
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
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Event Reminders */}
                        <div className="space-y-3 pb-4 border-b">
                          <div>
                            <Label className="text-xs font-medium">Event-Erinnerungen</Label>
                            <p className="text-xs text-gray-600">Erinnerungen vor Events</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={comprehensivePrefs.social.event_reminders?.platform ?? true}
                                onChange={(e) =>
                                  handleSocialNotificationChange("event_reminders", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={comprehensivePrefs.social.event_reminders?.email ?? true}
                                onChange={(e) =>
                                  handleSocialNotificationChange("event_reminders", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>

                        {/* Group Invites */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium">Spielgruppen-Einladungen</Label>
                            <p className="text-xs text-gray-600">Einladungen zu Spielgruppen</p>
                          </div>
                          <div className="flex items-center gap-6 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={comprehensivePrefs.social.group_invites?.platform ?? true}
                                onChange={(e) =>
                                  handleSocialNotificationChange("group_invites", "platform", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">In-App</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={comprehensivePrefs.social.group_invites?.email ?? true}
                                onChange={(e) =>
                                  handleSocialNotificationChange("group_invites", "email", e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-600">E-Mail</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                        <Label className="text-xs font-medium">Wer kann dein Profil sehen?</Label>
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
                              <span className="text-xs font-medium">Öffentlich</span>
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
                              <span className="text-xs font-medium">Nur Freunde</span>
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
                              <span className="text-xs font-medium">Privat</span>
                              <p className="text-xs text-gray-600">Nur du kannst dein Profil sehen</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <Label className="text-xs font-medium">Freundschaftsanfragen erlauben</Label>
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
                        <Label className="text-xs font-medium">Wer kann dir Nachrichten senden?</Label>
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
                            <span className="text-xs">Jeder</span>
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
                            <span className="text-xs">Nur Freunde</span>
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
                            <span className="text-xs">Niemand</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSubmit} disabled={isLoading} className="min-w-32 text-xs">
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
                    <CardTitle className="font-handwritten text-lg md:text-xl">Sicherheitseinstellungen</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Verwalte deine Sicherheits- und Datenschutzeinstellungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="space-y-6">
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        {/* Email Change Section */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-xs">E-Mail-Adresse ändern</h5>
                          <form onSubmit={handleEmailChange} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="newEmail" className="text-xs">
                                Neue E-Mail-Adresse
                              </Label>
                              <Input
                                id="newEmail"
                                type="email"
                                value={emailChangeData.newEmail}
                                onChange={(e) => setEmailChangeData((prev) => ({ ...prev, newEmail: e.target.value }))}
                                placeholder="neue@email.com"
                                className="text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword" className="text-xs">
                                Aktuelles Passwort bestätigen
                              </Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={emailChangeData.currentPassword}
                                onChange={(e) =>
                                  setEmailChangeData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                                className="text-xs"
                              />
                            </div>
                            <Button type="submit" disabled={isEmailChanging} className="w-full text-xs">
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
                              <Label className="text-xs font-medium">Sicherheitsereignisse</Label>
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

                    {/* Add account deletion section here */}
                    <div className="border-t pt-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2 text-xs">Konto löschen</h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Das Löschen deines Kontos ist dauerhaft und kann nicht rückgängig gemacht werden. Alle deine
                            Daten, einschliesslich Profil, Spielesammlung, Nachrichten und Aktivitäten werden permanent
                            gelöscht.
                          </p>
                        </div>

                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full md:w-auto text-white text-xs">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Konto löschen
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-red-600">Konto wirklich löschen?</DialogTitle>
                              <DialogDescription className="space-y-3 pt-2">
                                <p className="font-semibold">Diese Aktion kann nicht rückgängig gemacht werden!</p>
                                <p>Folgende Daten werden permanent gelöscht:</p>
                                <ul className="list-disc list-inside text-xs">
                                  <li>Dein Profil und alle persönlichen Informationen</li>
                                  <li>Deine Spielesammlung</li>
                                  <li>Alle Nachrichten und Konversationen</li>
                                  <li>Deine Spielgruppen und Events</li>
                                  <li>Alle Aktivitäten und Beiträge</li>
                                </ul>
                                <p className="pt-2">
                                  Bitte gib <span className="font-bold">"LÖSCHEN"</span> ein, um fortzufahren:
                                </p>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Input
                                placeholder="LÖSCHEN eingeben"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="text-center font-semibold text-xs"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowDeleteDialog(false)
                                    setDeleteConfirmation("")
                                  }}
                                  className="flex-1"
                                  disabled={isDeleting}
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteAccount}
                                  disabled={deleteConfirmation !== "LÖSCHEN" || isDeleting}
                                  className="flex-1"
                                >
                                  {isDeleting ? "Wird gelöscht..." : "Konto löschen"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSubmit} disabled={isLoading} className="min-w-32 text-xs">
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
          </Tabs>

          {/* Edit Community Dialog */}
          <Dialog open={!!editingCommunity} onOpenChange={() => setEditingCommunity(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Spielgruppe bearbeiten</DialogTitle>
              </DialogHeader>
              {editingCommunity && (
                <EditCommunityForm
                  community={editingCommunity}
                  onClose={() => setEditingCommunity(null)}
                  onSuccess={() => {
                    setEditingCommunity(null)
                    fetchUserActivities() // Changed from fetchActivities to fetchUserActivities
                    toast({
                      title: "Spielgruppe aktualisiert",
                      description: "Die Spielgruppe wurde erfolgreich aktualisiert",
                    })
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog - using CreateLudoEventFormDialog */}
          {editingEvent && (
            <CreateLudoEventFormDialog
              event={editingEvent}
              onClose={() => setEditingEvent(null)}
              onSuccess={() => {
                setEditingEvent(null)
                fetchUserEvents() // Changed from fetchUserActivities to fetchUserEvents
                toast({
                  title: "Event aktualisiert",
                  description: "Das Event wurde erfolgreich aktualisiert",
                })
              }}
            />
          )}

          {/* Edit Marketplace Offer Dialog */}
          <EditMarketplaceOfferForm
            isOpen={isEditOfferOpen}
            onClose={() => {
              setIsEditOfferOpen(false)
              setEditingOffer(null)
            }}
            onSuccess={handleEditOfferSuccess}
            offer={editingOffer}
          />

          {/* Edit Search Ad Dialog */}
          <EditSearchAdForm
            isOpen={isEditSearchAdOpen}
            onClose={() => {
              setIsEditSearchAdOpen(false)
              setEditingSearchAd(null)
            }}
            onSuccess={handleEditSearchAdSuccess}
            searchAd={editingSearchAd}
          />
        </div>
      </div>
    </div>
  )
}
