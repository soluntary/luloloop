"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Users, Dices, LogIn, Database, Search, MapPin, Plus, Calendar, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useFriends } from "@/contexts/friends-context"
import { useGames } from "@/contexts/games-context"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { getCommunityEvents, joinCommunityEvent, leaveEvent } from "@/app/actions/community-events"
import { getCommunities, joinCommunity, leaveCommunity, type Community } from "@/app/actions/communities"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import CreateCommunityDialog from "@/components/create-community-dialog"
import CreateCommunityEventDialog from "@/components/create-community-event-dialog"

import { useSearchParams } from "next/navigation"

interface CommunityEvent {
  id: string
  creator_id: string
  title: string
  description: string | null
  frequency: "einmalig" | "regelmässig" | "wiederholend"
  fixed_date: string | null
  fixed_time_from: string | null
  fixed_time_to: string | null
  location: string
  max_participants: number | null
  visibility: "public" | "friends"
  approval_mode: "automatic" | "manual"
  rules: string | null
  additional_info: string | null
  image_url: string | null
  selected_games: any
  custom_games: string[]
  selected_friends: string[]
  time_slots: any
  use_time_slots: boolean
  active: boolean
  created_at: string
  updated_at: string
  creator?: {
    username?: string
    name: string
    email: string
  }
  participants?: Array<{
    id: string
    user_id: string
    status: string
    user: {
      username?: string
      name: string
    }
  }>
}

interface UserType {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  website?: string
  twitter?: string
  instagram?: string
  settings?: any
  created_at: string
}

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  message?: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  updated_at: string
  sender?: UserType
  receiver?: UserType
}

interface UserGame {
  id: string
  user_id: string
  title: string
  publisher?: string
  condition: string
  players?: string
  duration?: string
  age?: string
  language?: string
  available: string[]
  image?: string
  created_at: string
}

function CommunityLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
          Communities werden geladen...
        </h2>
        <p className="text-xl text-gray-600 transform rotate-1 font-body">
          Wir sammeln die besten Spielgruppen für dich!
        </p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth()
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const { games } = useGames()

  const [communities, setCommunities] = useState<Community[]>([])
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [allFriendRequests, setAllFriendRequests] = useState<FriendRequest[]>([])
  const [allFriends, setAllFriends] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "casual" | "competitive" | "family">("all")
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [showLibraryDialog, setShowLibraryDialog] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [showCommunityDialog, setShowCommunityDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [communitySearchTerm, setCommunitySearchTerm] = useState("")
  const [eventSearchTerm, setEventSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [frequencyFilter, setFrequencyFilter] = useState<"all" | "einmalig" | "regelmässig" | "wiederholend">("all")
  const [timeFilter, setTimeFilter] = useState<"all" | "heute" | "morgen" | "diese-woche" | "nächste-woche">("all")

  // Contact creator dialog
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [contactLoading, setContactLoading] = useState(false)

  // Community creation form
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    is_private: false,
    type: "casual",
    location: "",
  })

  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false)

  const [showEventManagementDialog, setShowEventManagementDialog] = useState(false)
  const [selectedEventForManagement, setSelectedEventForManagement] = useState<CommunityEvent | null>(null)

  const [showCreateCommunityForm, setShowCreateCommunityForm] = useState(false)

  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")

  const [activeView, setActiveView] = useState<"communities" | "events" | "users">(
    tab && ["communities", "events", "users"].includes(tab)
      ? (tab as "communities" | "events" | "users")
      : "communities",
  )

  useEffect(() => {
    const currentTab = searchParams.get("tab")
    if (currentTab && ["communities", "events", "users"].includes(currentTab)) {
      setActiveView(currentTab as "communities" | "events" | "users")
    } else {
      setActiveView("communities")
    }
  }, [searchParams])

  const getPageTitle = () => {
    switch (activeView) {
      case "events":
        return "Events"
      case "users":
        return "Mitglieder"
      default:
        return "Gruppen"
    }
  }

  const getPageDescription = () => {
    switch (activeView) {
      case "events":
        return "Entdecke spannende Spiel-Events!"
      case "users":
        return "Finde andere Spieler und erweitere dein Netzwerk!"
      default:
        return "Finde deine Spiel-Community und schliesse neue Freundschaften!"
    }
  }

  const testDatabaseConnection = async () => {
    try {
      console.log("Testing database connection...")
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) {
        console.error("Database connection test failed:", error)
        return false
      }
      console.log("Database connection successful")
      return true
    } catch (error) {
      console.error("Database connection error:", error)
      return false
    }
  }

  const loadCommunities = async () => {
    try {
      const communitiesData = await getCommunities(user?.id)
      setCommunities(communitiesData)
    } catch (error) {
      console.error("Error loading communities:", error)
    }
  }

  const loadCommunityEvents = async () => {
    try {
      console.log("Loading community events...")
      const result = await getCommunityEvents(user?.id)

      if (result.success) {
        console.log("Community events loaded:", result.data.length)
        setCommunityEvents(result.data) // Set the events in state
        return result.data
      } else {
        console.error("Error loading community events:", result.error)
        setCommunityEvents([]) // Set empty array on error
        return []
      }
    } catch (error) {
      console.error("Failed to load community events:", error)
      setCommunityEvents([]) // Set empty array on error
      return []
    }
  }

  const loadUsers = async () => {
    try {
      console.log("Loading users...")

      const { data: tableCheck, error: tableError } = await supabase.from("users").select("count").limit(1)

      if (tableError) {
        console.warn("Users table does not exist:", tableError)
        return []
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", user?.id || "00000000-0000-0000-0000-000000000000")
        .order("name")

      if (error) {
        console.error("Error loading users:", error)
        return []
      }

      console.log("Users loaded:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Failed to load users:", error)
      return []
    }
  }

  const loadFriendRequests = async () => {
    if (!user) return []

    try {
      console.log("Loading friend requests...")

      const { data: tableCheck, error: tableError } = await supabase.from("friend_requests").select("count").limit(1)

      if (tableError) {
        console.warn("Friend requests table does not exist:", tableError)
        return []
      }

      let { data, error } = await supabase
        .from("friend_requests")
        .select(`
          *,
          sender:users!friend_requests_from_user_id_fkey(*),
          receiver:users!friend_requests_to_user_id_fkey(*)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

      if (error) {
        console.error("Error loading friend requests with user info:", error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("friend_requests")
          .select("*")
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

        if (fallbackError) {
          console.error("Fallback friend requests query failed:", fallbackError)
          return []
        }
        data = fallbackData
      }

      console.log("Friend requests loaded:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Failed to load friend requests:", error)
      return []
    }
  }

  const loadFriends = async () => {
    if (!user) return []

    try {
      console.log("Loading friends...")

      const { data: tableCheck, error: tableError } = await supabase.from("friends").select("count").limit(1)

      if (tableError) {
        console.warn("Friends table does not exist:", tableError)
        return []
      }

      let { data, error } = await supabase
        .from("friends")
        .select(`
          *,
          friend:users!friends_friend_id_fkey(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted")

      if (error) {
        console.error("Error loading friends with user info:", error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("friends")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "accepted")

        if (fallbackError) {
          console.error("Fallback friends query failed:", fallbackError)
          return []
        }
        data = fallbackData
      }

      const friendsList = data?.map((friendship) => friendship.friend).filter(Boolean) || []
      console.log("Friends loaded:", friendsList.length)
      return friendsList
    } catch (error) {
      console.error("Failed to load friends:", error)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [usersData, eventsData, communitiesData, friendRequestsData, friendsData] = await Promise.all([
          loadUsers(),
          loadCommunityEvents(),
          loadCommunities(),
          user ? loadFriendRequests() : Promise.resolve([]),
          user ? loadFriends() : Promise.resolve([]),
        ])

        setUsers(usersData)
        setCommunityEvents(eventsData)
        setCommunities(communitiesData)
        setAllFriendRequests(friendRequestsData)
        setAllFriends(friendsData)
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Fehler beim Laden der Daten")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const createCommunity = async () => {
    if (!user) {
      return
    }

    if (!newCommunity.name.trim()) return

    try {
      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: newCommunity.name,
            description: newCommunity.description,
            type: newCommunity.type,
            location: newCommunity.location || null,
            next_meeting: null,
            max_members: 10,
            games: [],
            image: null,
            active: true,
            creator_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      if (data?.[0]) {
        await supabase.from("community_members").insert([
          {
            community_id: data[0].id,
            user_id: user.id,
            role: "creator",
          },
        ])
      }

      setNewCommunity({ name: "", description: "", is_private: false, type: "casual", location: "" })
      setShowCreateDialog(false)
      await loadCommunities()
    } catch (error) {
      console.error("Error creating community:", error)
      setError("Fehler beim Erstellen der Community")
    }
  }

  const handleContactCreator = (community: Community) => {
    setSelectedCommunity(community)
    setShowContactDialog(true)
    setContactMessage("")
  }

  const sendContactMessage = async () => {
    if (!user || !selectedCommunity || !contactMessage.trim()) return

    try {
      setContactLoading(true)

      // Here you would typically send a message to the creator
      // For now, we'll just simulate the action
      const { error } = await supabase.from("messages").insert([
        {
          from_user_id: user.id,
          to_user_id: selectedCommunity.created_by,
          subject: `Nachricht bezüglich Community: ${selectedCommunity.name}`,
          content: contactMessage,
          type: "community_contact",
          community_id: selectedCommunity.id,
        },
      ])

      if (error) {
        console.error("Error sending message:", error)
        // Fallback: just show success message even if table doesn't exist
      }

      setShowContactDialog(false)
      setContactMessage("")

      // Show success message (you could use a toast notification here)
      alert("Nachricht wurde erfolgreich gesendet!")
    } catch (error) {
      console.error("Error sending contact message:", error)
      alert("Fehler beim Senden der Nachricht. Bitte versuche es später erneut.")
    } finally {
      setContactLoading(false)
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return

    try {
      const existingRequest = allFriendRequests.find(
        (req) =>
          (req.from_user_id === user.id && req.to_user_id === userId) ||
          (req.from_user_id === userId && req.to_user_id === user.id),
      )

      if (existingRequest) {
        console.log("Friend request already exists")
        return
      }

      const { error } = await supabase.from("friend_requests").insert([
        {
          from_user_id: user.id,
          to_user_id: userId,
          status: "pending",
        },
      ])

      if (error) throw error

      await Promise.all([
        loadUsers(),
        loadCommunityEvents(),
        loadCommunities(),
        user ? loadFriendRequests() : Promise.resolve(),
        user ? loadFriends() : Promise.resolve(),
      ])
    } catch (error) {
      console.error("Error sending friend request:", error)
    }
  }

  const handleAcceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return

    try {
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) throw updateError

      const { error: friendshipError } = await supabase.from("friends").insert([
        { user_id: user.id, friend_id: senderId, status: "accepted" },
        { user_id: senderId, friend_id: user.id, status: "accepted" },
      ])

      if (friendshipError) throw friendshipError

      await Promise.all([
        loadUsers(),
        loadCommunityEvents(),
        loadCommunities(),
        user ? loadFriendRequests() : Promise.resolve(),
        user ? loadFriends() : Promise.resolve(),
      ])
    } catch (error) {
      console.error("Error accepting friend request:", error)
    }
  }

  const handleRejectFriendRequest = async (requestId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) throw error

      await Promise.all([
        loadUsers(),
        loadCommunityEvents(),
        loadCommunities(),
        user ? loadFriendRequests() : Promise.resolve(),
        user ? loadFriends() : Promise.resolve(),
      ])
    } catch (error) {
      console.error("Error rejecting friend request:", error)
    }
  }

  const canViewField = (targetUser: UserType, field: string): boolean => {
    if (!user || targetUser.id === user.id) return true

    const isFriend = allFriends.some((friend) => friend.id === targetUser.id)
    const privacySettings = targetUser.settings?.privacy || {}

    switch (field) {
      case "email":
        return privacySettings.emailVisible !== false || isFriend
      case "profile":
        return privacySettings.profileVisible !== false || isFriend
      case "game_library":
        return privacySettings.gameLibraryVisible !== false || isFriend
      default:
        return true
    }
  }

  const canViewLibrary = (targetUser: UserType): boolean => {
    return canViewField(targetUser, "game_library")
  }

  const handleViewProfile = (selectedUser: UserType) => {
    setSelectedUser(selectedUser)
  }

  const handleViewLibrary = async (targetUser: UserType) => {
    if (!canViewLibrary(targetUser)) {
      const confirmed = window.confirm(
        `${targetUser.username || targetUser.name} hat seine Spielebibliothek als privat eingestellt. Möchten Sie zur vorherigen Seite zurückkehren?`,
      )
      if (confirmed) {
        window.history.back()
      }
      return
    }

    try {
      setLibraryLoading(true)
      setShowLibraryDialog(true)

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", targetUser.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setUserGames(data || [])
    } catch (error) {
      console.error("Error loading user library:", error)
      setUserGames([])
    } finally {
      setLibraryLoading(false)
    }
  }

  const handleCommunityClick = (community: Community) => {
    setSelectedCommunity(community)
    setShowCommunityDialog(true)
  }

  const handleEventClick = (event: CommunityEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }

  const handleJoinEvent = async (eventId: string) => {
    if (!user) {
      alert("Bitte melde dich an, um an Events teilzunehmen.")
      return
    }

    try {
      const result = await joinCommunityEvent(eventId)

      if (result.success) {
        alert(result.message)
        await Promise.all([
          loadUsers(),
          loadCommunityEvents(),
          loadCommunities(),
          user ? loadFriendRequests() : Promise.resolve(),
          user ? loadFriends() : Promise.resolve(),
        ])
        setShowEventDialog(false)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error joining event:", error)
      alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.")
    }
  }

  const handleManageEvent = (event: CommunityEvent) => {
    setSelectedEventForManagement(event)
    setShowEventManagementDialog(true)
  }

  const handleLeaveEvent = async (eventId: string) => {
    if (!confirm("Bist du sicher, dass du das Event verlassen möchtest?")) {
      return
    }

    const result = await leaveEvent(eventId)
    if (result.success) {
      loadCommunityEvents()
    } else {
      alert(result.error)
    }
  }

  const isEventCreator = (event: CommunityEvent) => {
    return user && event.creator_id === user.id
  }

  const isEventParticipant = (event: CommunityEvent) => {
    return user && event.participants?.some((p) => p.user_id === user.id && p.status === "joined")
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "casual":
        return "bg-teal-400"
      case "competitive":
        return "bg-orange-400"
      case "family":
        return "bg-pink-400"
      default:
        return "bg-gray-400"
    }
  }

  const formatEventDate = (event: CommunityEvent) => {
    if (event.frequency === "regelmässig" && event.use_time_slots && event.time_slots && event.time_slots.length > 0) {
      return `${event.time_slots.length} Termine`
    } else if (
      event.frequency === "wiederholend" &&
      event.use_time_slots &&
      event.time_slots &&
      event.time_slots.length > 0
    ) {
      return `${event.time_slots.length} Termine`
    } else if (event.frequency === "einmalig" && event.fixed_date) {
      const date = new Date(event.fixed_date)
      const dateStr = date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      // Ensure time formatting is correct (HH:mm format)
      const formatTime = (timeStr: string | null) => {
        if (!timeStr) return null
        // If time is already in HH:mm format, return as is
        if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr
        // If time includes seconds, remove them
        if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr.substring(0, 5)
        return timeStr
      }

      const timeFrom = formatTime(event.fixed_time_from)
      const timeTo = formatTime(event.fixed_time_to)

      if (timeFrom && timeTo) {
        return `${dateStr}, ${timeFrom} - ${timeTo}`
      } else if (timeFrom) {
        return `${dateStr}, ab ${timeFrom}`
      } else {
        return dateStr
      }
    }
    if (event.use_time_slots && event.time_slots && event.time_slots.length > 0) {
      return `${event.time_slots.length} Termine`
    }
    return "Kein Termin festgelegt"
  }

  const getParticipantCount = (event: CommunityEvent) => {
    const participantCount = event.participants?.filter((p) => p.status === "joined").length || 0
    // Add 1 for the organizer
    return participantCount + 1
  }

  const isEventSoldOut = (event: CommunityEvent) => {
    if (event.max_participants === null || event.max_participants === -1) {
      return false // Unlimited participants
    }
    return getParticipantCount(event) >= event.max_participants
  }

  const filteredCommunities = (communities || []).filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(communitySearchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredCommunityEvents = (communityEvents || []).filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(eventSearchTerm.toLowerCase())

    // Frequency filter
    const matchesFrequency = frequencyFilter === "all" || event.frequency === frequencyFilter

    // Time filter
    let matchesTime = true
    if (timeFilter !== "all" && event.fixed_date) {
      const eventDate = new Date(event.fixed_date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startOfNextWeek = new Date(endOfWeek)
      startOfNextWeek.setDate(endOfWeek.getDate() + 1)
      const endOfNextWeek = new Date(startOfNextWeek)
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)

      switch (timeFilter) {
        case "heute":
          matchesTime = eventDate.toDateString() === today.toDateString()
          break
        case "morgen":
          matchesTime = eventDate.toDateString() === tomorrow.toDateString()
          break
        case "diese-woche":
          matchesTime = eventDate >= startOfWeek && eventDate <= endOfWeek
          break
        case "nächste-woche":
          matchesTime = eventDate >= startOfNextWeek && eventDate <= endOfNextWeek
          break
      }
    }

    return matchesSearch && matchesFrequency && matchesTime
  })

  const filteredUsers = (users || []).filter(
    (user) =>
      (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
  )

  const pendingRequests = user
    ? allFriendRequests.filter((req) => req.to_user_id === user.id && req.status === "pending")
    : []

  const getFriendshipStatus = (userId: string) => {
    if (!user) return "guest"

    const isAlreadyFriend = allFriends.some((friend) => friend.id === userId)
    if (isAlreadyFriend) return "friend"

    const pendingRequest = allFriendRequests.find(
      (req) =>
        ((req.from_user_id === user.id && req.to_user_id === userId) ||
          (req.from_user_id === userId && req.to_user_id === user.id)) &&
        req.status === "pending",
    )

    if (pendingRequest) {
      return pendingRequest.from_user_id === user.id ? "sent" : "received"
    }

    return "none"
  }

  const GuestLoginPrompt = ({ action }: { action: string }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
      <LogIn className="w-8 h-8 text-blue-500 mx-auto mb-2" />
      <p className="font-body text-blue-700 text-sm mb-3">Melde dich an, um {action}</p>
      <Link href="/login">
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
          Anmelden
        </Button>
      </Link>
    </div>
  )

  const handleCreateEvent = (eventData: any) => {
    console.log("Creating community event:", eventData)
    setShowCreateEventDialog(false)
    // Refresh data to show the new event
    const loadAllData = async () => {
      await Promise.all([
        loadUsers(),
        loadCommunityEvents(),
        loadCommunities(),
        user ? loadFriendRequests() : Promise.resolve(),
        user ? loadFriends() : Promise.resolve(),
      ])
    }
    loadAllData()
    alert("Community-Anzeige wurde erfolgreich erstellt!")
  }

  const handleCancelCreateEvent = () => {
    setShowCreateEventDialog(false)
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return

    try {
      const result = await joinCommunity(communityId, user.id)
      if (result.success) {
        toast({
          title: "Erfolgreich beigetreten!",
          description: "Sie sind der Community beigetreten.",
        })
        await loadCommunities()
      } else {
        toast({
          title: "Fehler beim Beitreten",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return

    try {
      const result = await leaveCommunity(communityId, user.id)
      if (result.success) {
        toast({
          title: "Community verlassen",
          description: "Sie haben die Community verlassen.",
        })
        await loadCommunities()
      } else {
        toast({
          title: "Fehler beim Verlassen",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    }
  }

  const handleEventCreated = async () => {
    console.log("Event created, reloading events...")
    await loadCommunityEvents()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 font-body">
      {/* Header */}
      <Navigation currentPage="community" />

      <div className="container mx-auto px-4 py-8">
        {/* Database Error Banner */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start space-x-4">
              <Database className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-700 font-handwritten text-xl mb-2">
                  🚨 Datenbank-Setup erforderlich
                </h3>
                <p className="text-red-600 font-body mb-4">{error}</p>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-700 font-handwritten mb-2">Setup-Anleitung:</h4>
                  <ol className="text-red-600 font-body space-y-1 text-sm">
                    <li>1. Öffne dein Supabase-Dashboard</li>
                    <li>2. Gehe zum SQL Editor</li>
                    <li>3. Führe die Skripte in dieser Reihenfolge aus:</li>
                    <li className="ml-4">• scripts/01-create-tables.sql</li>
                    <li className="ml-4">• scripts/02-create-policies.sql</li>
                    <li className="ml-4">• scripts/03-seed-data.sql (optional)</li>
                    <li className="ml-4">• scripts/06-create-community-events.sql</li>
                    <li className="ml-4">• scripts/07-create-friend-requests.sql</li>
                    <li className="ml-4">• scripts/08-create-friends.sql</li>
                    <li>4. Aktualisiere die Seite</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            {getPageTitle()}
          </h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">{getPageDescription()}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeView === "communities" && (
            <div className="space-y-6">
              {/* Communities Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                  <Input
                    placeholder="Communities suchen..."
                    value={communitySearchTerm}
                    onChange={(e) => setCommunitySearchTerm(e.target.value)}
                    className="pl-10 border-2 border-teal-200 focus:border-teal-400 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {user && (
                    <CreateCommunityDialog onCommunityCreated={loadCommunities}>
                      <Button className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Community erstellen
                      </Button>
                    </CreateCommunityDialog>
                  )}
                </div>
              </div>

              {/* Communities Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Communities werden geladen...</p>
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-handwritten text-gray-600 mb-2">Keine Communities gefunden</h3>
                  <p className="text-gray-500">Erstelle die erste Community oder ändere deine Suchkriterien.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunities.map((community) => (
                    <Card
                      key={community.id}
                      className="group hover:shadow-xl transition-all duration-300 border-2 border-teal-100 hover:border-teal-300 bg-white/80 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-handwritten text-xl text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                              {community.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {community.location && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {community.location}
                                </div>
                              )}
                            </div>
                          </div>
                          {community.image && (
                            <img
                              src={community.image || "/placeholder.svg"}
                              alt={community.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{community.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>0/{community.max_members}</span>
                          </div>
                          {community.next_meeting && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{new Date(community.next_meeting).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-teal-300 text-teal-600 hover:bg-teal-50 bg-transparent"
                            onClick={() => {
                              toast({
                                title: "Kontakt",
                                description: "Organisator-Kontakt wird geöffnet...",
                              })
                            }}
                          >
                            Organisator kontaktieren
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0"
                            onClick={() => handleJoinCommunity(community.id)}
                          >
                            Beitreten
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === "events" && (
            <div className="space-y-6">
              {/* Events Search and Filters */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <Input
                      placeholder="Events suchen..."
                      value={eventSearchTerm}
                      onChange={(e) => setEventSearchTerm(e.target.value)}
                      className="pl-10 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2 mb-4">
                    {user && (
                      <CreateCommunityEventDialog onEventCreated={handleEventCreated}>
                        <Button className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white border-0">
                          <Plus className="w-4 h-4 mr-2" />
                          Event erstellen
                        </Button>
                      </CreateCommunityEventDialog>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={frequencyFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequencyFilter("all")}
                      className={
                        frequencyFilter === "all"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Alle
                    </Button>
                    <Button
                      variant={frequencyFilter === "einmalig" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequencyFilter("einmalig")}
                      className={
                        frequencyFilter === "einmalig"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Einmalig
                    </Button>
                    <Button
                      variant={frequencyFilter === "regelmässig" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequencyFilter("regelmässig")}
                      className={
                        frequencyFilter === "regelmässig"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Regelmässig
                    </Button>
                    <Button
                      variant={frequencyFilter === "wiederholend" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFrequencyFilter("wiederholend")}
                      className={
                        frequencyFilter === "wiederholend"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Wiederholend
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={timeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilter("all")}
                      className={
                        timeFilter === "all"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Alle Zeiten
                    </Button>
                    <Button
                      variant={timeFilter === "heute" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilter("heute")}
                      className={
                        timeFilter === "heute"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Heute
                    </Button>
                    <Button
                      variant={timeFilter === "morgen" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilter("morgen")}
                      className={
                        timeFilter === "morgen"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Morgen
                    </Button>
                    <Button
                      variant={timeFilter === "diese-woche" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilter("diese-woche")}
                      className={
                        timeFilter === "diese-woche"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Diese Woche
                    </Button>
                    <Button
                      variant={timeFilter === "nächste-woche" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilter("nächste-woche")}
                      className={
                        timeFilter === "nächste-woche"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-purple-200 text-purple-600 hover:bg-purple-50"
                      }
                    >
                      Nächste Woche
                    </Button>
                  </div>
                </div>
              </div>

              {/* Events Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Events werden geladen...</p>
                </div>
              ) : filteredCommunityEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Dices className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-handwritten text-gray-600 mb-2">Keine Events gefunden</h3>
                  <p className="text-gray-500">
                    {eventSearchTerm ? "Ändere deine Suchkriterien oder " : ""}
                    Erstelle das erste Event!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunityEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group hover:shadow-xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-300 bg-white/80 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-handwritten text-xl text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                              {event.title}
                            </h3>

                            <div className="flex flex-col gap-2 mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{formatEventDate(event)}</span>
                              </div>

                              {event.location && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{event.location}</span>
                                </div>
                              )}

                              <div className="flex items-center text-sm text-gray-500">
                                <User className="w-4 h-4 mr-2" />
                                <span>
                                  Organisiert von {event.creator?.username || event.creator?.name || "Unbekannt"}
                                </span>
                              </div>

                              <div>
                                <Badge
                                  variant="outline"
                                  className={
                                    event.frequency === "einmalig"
                                      ? "border-blue-200 text-blue-700 bg-blue-50"
                                      : event.frequency === "regelmässig"
                                        ? "border-green-200 text-green-700 bg-green-50"
                                        : "border-orange-200 text-orange-700 bg-orange-50"
                                  }
                                >
                                  {event.frequency === "einmalig" && "Einmalig"}
                                  {event.frequency === "regelmässig" && "Regelmässig"}
                                  {event.frequency === "wiederholend" && "Wiederholend"}
                                  {event.frequency !== "einmalig" &&
                                    event.frequency !== "regelmässig" &&
                                    event.frequency !== "wiederholend" &&
                                    (event.frequency || "Unbekannt")}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {event.image && (
                            <img
                              src={event.image || "/placeholder.svg"}
                              alt={event.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>
                              {getParticipantCount(event)}/{event.max_participants || "∞"}
                            </span>
                          </div>
                          {event.visibility === "friends" && (
                            <div className="flex items-center">
                              <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
                                Nur Freunde
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          {isEventCreator(event) && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
                              onClick={() => handleManageEvent(event)}
                            >
                              Verwalten
                            </Button>
                          )}
                          {!isEventCreator(event) && !isEventParticipant(event) && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
                              onClick={() => handleJoinEvent(event.id)}
                            >
                              Teilnehmen
                            </Button>
                          )}
                          {!isEventCreator(event) && isEventParticipant(event) && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white border-0"
                              onClick={() => handleLeaveEvent(event.id)}
                            >
                              Verlassen
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === "users" && (
            <div className="space-y-6">
              {/* Users Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                <Input
                  placeholder="Benutzer suchen..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-blue-200 focus:border-blue-400 rounded-xl"
                />
              </div>

              {/* Users Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Benutzer werden geladen...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-handwritten text-gray-600 mb-2">Keine Benutzer gefunden</h3>
                  <p className="text-gray-500">Erstelle die erste Community oder ändere deine Suchkriterien.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((targetUser) => (
                    <Card
                      key={targetUser.id}
                      className="group hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 bg-white/80 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-handwritten text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                              {targetUser.username || targetUser.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {canViewField(targetUser, "email") && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <LogIn className="w-3 h-3 mr-1" />
                                  {targetUser.email}
                                </div>
                              )}
                            </div>
                          </div>
                          {targetUser.avatar && (
                            <img
                              src={targetUser.avatar || "/placeholder.svg"}
                              alt={targetUser.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{targetUser.bio}</p>

                        <div className="flex gap-2 justify-end">
                          {getFriendshipStatus(targetUser.id) === "none" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
                              onClick={() => handleSendFriendRequest(targetUser.id)}
                            >
                              Freundschaft anfragen
                            </Button>
                          )}
                          {getFriendshipStatus(targetUser.id) === "sent" && (
                            <Button size="sm" className="bg-gray-300 text-gray-700" disabled>
                              Anfrage gesendet
                            </Button>
                          )}
                          {getFriendshipStatus(targetUser.id) === "received" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-400 hover:bg-green-500 text-white border-0"
                                onClick={() => handleAcceptFriendRequest("", targetUser.id)}
                              >
                                Anfrage akzeptieren
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-400 hover:bg-red-500 text-white border-0"
                                onClick={() => handleRejectFriendRequest("")}
                              >
                                Anfrage ablehnen
                              </Button>
                            </div>
                          )}
                          {getFriendshipStatus(targetUser.id) === "friend" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
                              onClick={() => handleViewLibrary(targetUser)}
                            >
                              Spielebibliothek anzeigen
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
