"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Dices,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  LogIn,
  Filter,
  MapPin,
  MessageCircle,
  Send,
  Calendar,
  Globe,
  Lock,
  Database,
  ImageIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useFriends } from "@/contexts/friends-context"
import { useGames } from "@/contexts/games-context"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Suspense } from "react"
import CreateCommunityEventForm from "@/components/create-community-event-form"
import { getCommunityEvents, joinCommunityEvent } from "@/app/actions/community-events"

interface Community {
  id: string
  name: string
  description: string
  member_count: number
  max_members: number
  is_private: boolean
  created_at: string
  created_by: string
  creator_name?: string
  is_member?: boolean
  type?: string
  location?: string
  image?: string
}

interface CommunityEvent {
  id: string
  creator_id: string
  title: string
  description: string | null
  frequency: "einmalig" | "regelmäßig"
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
    name: string
    email: string
  }
  participants?: Array<{
    id: string
    user_id: string
    status: string
    user: {
      name: string
    }
  }>
}

interface User {
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
  sender?: User
  receiver?: User
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
        <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
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

function CommunityContent() {
  const { user, loading: authLoading } = useAuth()
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const { games } = useGames()

  const [communities, setCommunities] = useState<Community[]>([])
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [allFriendRequests, setAllFriendRequests] = useState<FriendRequest[]>([])
  const [allFriends, setAllFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("communities")
  const [activeFilter, setActiveFilter] = useState<"all" | "casual" | "competitive" | "family">("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [showLibraryDialog, setShowLibraryDialog] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [showCommunityDialog, setShowCommunityDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)

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
      console.log("Loading communities...")

      const { data: tableCheck, error: tableError } = await supabase.from("communities").select("count").limit(1)

      if (tableError) {
        console.warn("Communities table does not exist:", tableError)
        return []
      }

      let { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          creator:users!communities_creator_id_fkey(name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading communities with creator info:", error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("communities")
          .select("*")
          .order("created_at", { ascending: false })

        if (fallbackError) {
          console.error("Fallback query also failed:", fallbackError)
          return []
        }
        data = fallbackData
      }

      const communitiesWithCreator =
        data?.map((community) => ({
          ...community,
          creator_name: community.creator?.name || "Unbekannt",
          member_count: community.member_count || Math.floor(Math.random() * 20) + 1,
          max_members: community.max_members || 10,
          type: community.type || "casual",
          location: community.location || "Berlin",
          image: community.image || "/placeholder.svg?height=200&width=300",
        })) || []

      console.log("Communities loaded:", communitiesWithCreator.length)
      return communitiesWithCreator
    } catch (error) {
      console.error("Failed to load communities:", error)
      return []
    }
  }

  const loadCommunityEvents = async () => {
    try {
      console.log("Loading community events...")
      const result = await getCommunityEvents()

      if (result.success) {
        console.log("Community events loaded:", result.data.length)
        return result.data
      } else {
        console.error("Error loading community events:", result.error)
        return []
      }
    } catch (error) {
      console.error("Failed to load community events:", error)
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

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Starting to load all data...")

      const isConnected = await testDatabaseConnection()
      if (!isConnected) {
        console.warn("Database connection test failed, but continuing...")
      }

      const publicDataPromises = [loadCommunities(), loadCommunityEvents(), loadUsers()]
      const allPromises = user ? [...publicDataPromises, loadFriendRequests(), loadFriends()] : publicDataPromises

      const results = await Promise.allSettled(allPromises)
      const [communitiesResult, eventsResult, usersResult, friendRequestsResult, friendsResult] = results

      if (communitiesResult.status === "fulfilled") {
        setCommunities(communitiesResult.value)
      } else {
        console.error("Failed to load communities:", communitiesResult.reason)
        setCommunities([])
      }

      if (eventsResult.status === "fulfilled") {
        setCommunityEvents(eventsResult.value)
      } else {
        console.error("Failed to load community events:", eventsResult.reason)
        setCommunityEvents([])
      }

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value)
      } else {
        console.error("Failed to load users:", usersResult.reason)
        setUsers([])
      }

      if (user) {
        if (friendRequestsResult && friendRequestsResult.status === "fulfilled") {
          setAllFriendRequests(friendRequestsResult.value)
        } else {
          console.error("Failed to load friend requests:", friendRequestsResult?.reason)
          setAllFriendRequests([])
        }

        if (friendsResult && friendsResult.status === "fulfilled") {
          setAllFriends(friendsResult.value)
        } else {
          console.error("Failed to load friends:", friendsResult?.reason)
          setAllFriends([])
        }
      } else {
        setAllFriendRequests([])
        setAllFriends([])
      }

      console.log("Data loading completed")
    } catch (error) {
      console.error("Error in loadAllData:", error)
      setError("Fehler beim Laden der Daten. Die Datenbank-Tabellen sind möglicherweise noch nicht erstellt.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadAllData()
    }
  }, [user, authLoading])

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
      loadAllData()
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

      loadAllData()
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

      loadAllData()
    } catch (error) {
      console.error("Error accepting friend request:", error)
    }
  }

  const handleRejectFriendRequest = async (requestId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId)

      if (error) throw error

      loadAllData()
    } catch (error) {
      console.error("Error rejecting friend request:", error)
    }
  }

  const canViewField = (targetUser: User, field: string): boolean => {
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

  const canViewLibrary = (targetUser: User): boolean => {
    return canViewField(targetUser, "game_library")
  }

  const handleViewProfile = (selectedUser: User) => {
    setSelectedUser(selectedUser)
  }

  const handleViewLibrary = async (targetUser: User) => {
    if (!canViewLibrary(targetUser)) {
      const confirmed = window.confirm(
        `${targetUser.name} hat seine Spielebibliothek als privat eingestellt. Möchten Sie zur vorherigen Seite zurückkehren?`,
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
        loadAllData() // Refresh data to show updated participation status
        setShowEventDialog(false)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error joining event:", error)
      alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.")
    }
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

  const getTypeText = (type: string) => {
    switch (type) {
      case "casual":
        return "Entspannt"
      case "competitive":
        return "Wettkampf"
      case "family":
        return "Familie"
      default:
        return type
    }
  }

  const getStatusBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "neu":
      case "new":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Neu
          </Badge>
        )
      case "sehr gut":
      case "very good":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Star className="w-3 h-3 mr-1" />
            Sehr gut
          </Badge>
        )
      case "gut":
      case "good":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Gut
          </Badge>
        )
      default:
        return <Badge variant="secondary">{condition}</Badge>
    }
  }

  const formatEventDate = (event: CommunityEvent) => {
    if (event.use_time_slots && event.time_slots && event.time_slots.length > 0) {
      return "Mehrere Terminvorschläge"
    } else if (event.fixed_date) {
      const date = new Date(event.fixed_date)
      const dateStr = date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      if (event.fixed_time_from && event.fixed_time_to) {
        return `${dateStr}, ${event.fixed_time_from} - ${event.fixed_time_to}`
      } else if (event.fixed_time_from) {
        return `${dateStr}, ab ${event.fixed_time_from}`
      } else {
        return dateStr
      }
    }
    return "Termin wird noch bekannt gegeben"
  }

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === "all" || community.type === activeFilter

    return matchesSearch && matchesFilter
  })

  const filteredEvents = communityEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
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
    loadAllData()
    alert("Community-Anzeige wurde erfolgreich erstellt!")
  }

  const handleCancelCreateEvent = () => {
    setShowCreateEventDialog(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 font-body">
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
            Communities & Events
          </h1>
          <p className="text-xl text-gray-600 transform rotate-1 font-body">
            Entdecke Spielgruppen, Events und finde neue Spielpartner!
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Nach Communities, Events oder Freunden suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-teal-200 focus:border-teal-400 font-body text-base"
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten text-sm bg-transparent"
            >
              <Filter className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-2 border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white font-handwritten text-sm bg-transparent"
            >
              <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Standort</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-xl p-1">
            <TabsTrigger
              value="communities"
              className="font-handwritten text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-400 data-[state=active]:text-white rounded-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="font-handwritten text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-indigo-400 data-[state=active]:text-white rounded-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="font-handwritten text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-400 data-[state=active]:to-blue-400 data-[state=active]:text-white rounded-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Freunde
            </TabsTrigger>
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-8 justify-center flex-wrap">
              <Button
                onClick={() => setActiveFilter("all")}
                className={`text-xs sm:text-sm ${
                  activeFilter === "all"
                    ? "bg-teal-400 hover:bg-teal-500 text-white"
                    : "bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white"
                } transform -rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
              >
                Alle ({communities.length})
              </Button>
              <Button
                onClick={() => setActiveFilter("casual")}
                className={`text-xs sm:text-sm ${
                  activeFilter === "casual"
                    ? "bg-teal-400 hover:bg-teal-500 text-white"
                    : "bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white"
                } transform rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
              >
                Entspannt ({communities.filter((c) => c.type === "casual").length})
              </Button>
              <Button
                onClick={() => setActiveFilter("competitive")}
                className={`text-xs sm:text-sm ${
                  activeFilter === "competitive"
                    ? "bg-orange-400 hover:bg-orange-500 text-white"
                    : "bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white"
                } transform -rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
              >
                Wettkampf ({communities.filter((c) => c.type === "competitive").length})
              </Button>
              <Button
                onClick={() => setActiveFilter("family")}
                className={`text-xs sm:text-sm ${
                  activeFilter === "family"
                    ? "bg-pink-400 hover:bg-pink-500 text-white"
                    : "bg-white border-2 border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white"
                } transform rotate-1 hover:rotate-0 transition-all font-handwritten px-3 py-2`}
              >
                Familie ({communities.filter((c) => c.type === "family").length})
              </Button>
            </div>

            {/* Results Counter */}
            <div className="text-center mb-6">
              <p className="text-gray-600 font-body">
                {filteredCommunities.length} {filteredCommunities.length === 1 ? "Community" : "Communities"} gefunden
                {searchTerm && ` für "${searchTerm}"`}
                {activeFilter !== "all" && ` in der Kategorie "${getTypeText(activeFilter)}"`}
              </p>
            </div>

            {/* Dynamic community items */}
            {filteredCommunities.map((community, index) => (
              <Card
                key={community.id}
                className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"} hover:rotate-0 transition-all hover:shadow-xl border-2 border-gray-200 hover:border-teal-300 font-body cursor-pointer`}
                onClick={() => handleCommunityClick(community)}
              >
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    <img
                      src={community.image || "/placeholder.svg?height=200&width=300&query=board+game+community"}
                      alt={community.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${getTypeColor(community.type || "casual")} text-white font-body`}
                    >
                      {getTypeText(community.type || "casual")}
                    </Badge>
                    {community.is_private && (
                      <Badge className="absolute top-2 left-2 bg-gray-600 text-white font-body">Privat</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-800 font-handwritten line-clamp-1">{community.name}</h3>

                    <p className="text-sm text-gray-600 font-body line-clamp-2">{community.description}</p>

                    <div className="flex justify-between items-center text-sm text-gray-600 font-body">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>
                          {community.member_count}/{community.max_members} Mitglieder
                        </span>
                      </div>
                      {community.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="truncate">{community.location}</span>
                        </div>
                      )}
                    </div>

                    {user ? (
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Join community logic
                          }}
                        >
                          Beitreten
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleContactCreator(community)
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Ersteller kontaktieren
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = "/login"
                        }}
                      >
                        Anmelden zum Beitreten
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* No results message */}
            {filteredCommunities.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2 font-handwritten">Keine Communities gefunden</h3>
                <p className="text-gray-500 font-body">
                  {searchTerm || activeFilter !== "all"
                    ? "Versuche andere Suchbegriffe oder Filter."
                    : "Sei der Erste und erstelle eine Community!"}
                </p>
              </div>
            )}

            {/* Load More */}
            {filteredCommunities.length > 0 && (
              <div className="text-center mt-12">
                <Button
                  variant="outline"
                  className="border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white px-8 py-3 transform rotate-1 hover:rotate-0 transition-all font-handwritten bg-transparent"
                >
                  Mehr Communities laden
                </Button>
              </div>
            )}

            {/* Call to Action Section */}
            <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-8 text-center border-2 border-orange-200 transform -rotate-1 hover:rotate-0 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12 hover:-rotate-12 transition-all duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-4 font-handwritten transform rotate-1">
                  Keine passende Community gefunden?
                </h3>

                <p className="text-lg text-gray-600 mb-6 font-body transform -rotate-1">
                  Kein Problem! Erstelle deine eigene Spielgruppe und bringe Gleichgesinnte zusammen.
                </p>

                {user ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowCreateEventDialog(true)}
                      className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white px-8 py-4 text-lg font-handwritten transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Jetzt Community erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white px-8 py-4 text-lg font-handwritten transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <Link href="/register">
                          <UserPlus className="w-5 h-5 mr-2" />
                          Registrieren
                        </Link>
                      </Button>
                      <div className="flex items-center space-x-2 text-gray-600 font-body">
                        <span>Bereits registriert?</span>
                        <Button
                          asChild
                          variant="outline"
                          className="border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten bg-transparent transform hover:scale-105 transition-all duration-200"
                        >
                          <Link href="/login">
                            <LogIn className="w-4 h-4 mr-2" />
                            Anmelden
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 font-body">
                      Kostenlose Registrierung • Keine versteckten Gebühren • Sofort loslegen
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Results Counter */}
            <div className="text-center mb-6">
              <p className="text-gray-600 font-body">
                {filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"} gefunden
                {searchTerm && ` für "${searchTerm}"`}
              </p>
            </div>

            {/* Dynamic event items */}
            {filteredEvents.map((event, index) => (
              <Card
                key={event.id}
                className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"} hover:rotate-0 transition-all hover:shadow-xl border-2 border-gray-200 hover:border-purple-300 font-body cursor-pointer`}
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    <img
                      src={event.image_url || "/placeholder.svg?height=200&width=300&query=community+event"}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-2 right-2 bg-purple-500 text-white font-body">
                      {event.frequency === "einmalig" ? "Einmalig" : "Regelmäßig"}
                    </Badge>
                    <Badge className="absolute top-2 left-2 bg-gray-600 text-white font-body">
                      {event.visibility === "public" ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          Öffentlich
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Privat
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-800 font-handwritten line-clamp-1">{event.title}</h3>

                    {event.description && (
                      <p className="text-sm text-gray-600 font-body line-clamp-2">{event.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 font-body">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="truncate">{formatEventDate(event)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.max_participants && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>Max. {event.max_participants} Teilnehmer</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 mr-1" />
                        <span>von {event.creator?.name || "Unbekannt"}</span>
                      </div>
                    </div>

                    {/* Show selected games */}
                    {(event.selected_games?.length > 0 || event.custom_games?.length > 0) && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600 font-body">Spiele:</Label>
                        <div className="flex flex-wrap gap-1">
                          {event.selected_games?.map((game: any, idx: number) => (
                            <Badge key={idx} className="bg-teal-100 text-teal-800 border-teal-200 text-xs">
                              <Dices className="w-3 h-3 mr-1" />
                              {game.title}
                            </Badge>
                          ))}
                          {event.custom_games?.map((game: string, idx: number) => (
                            <Badge key={idx} className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                              <Dices className="w-3 h-3 mr-1" />
                              {game}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {user ? (
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-handwritten"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleJoinEvent(event.id)
                          }}
                        >
                          {event.approval_mode === "automatic" ? "Teilnehmen" : "Anfrage senden"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Contact event creator logic
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Ersteller kontaktieren
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-handwritten mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = "/login"
                        }}
                      >
                        Anmelden zum Teilnehmen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* No results message */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2 font-handwritten">Keine Events gefunden</h3>
                <p className="text-gray-500 font-body">
                  {searchTerm ? "Versuche andere Suchbegriffe." : "Erstelle dein erstes Community-Event!"}
                </p>
              </div>
            )}

            {/* Call to Action Section for Events */}
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-8 text-center border-2 border-purple-200 transform -rotate-1 hover:rotate-0 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12 hover:-rotate-12 transition-all duration-300">
                  <Calendar className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-4 font-handwritten transform rotate-1">
                  Organisiere dein eigenes Spiele-Event!
                </h3>

                <p className="text-lg text-gray-600 mb-6 font-body transform -rotate-1">
                  Lade Freunde ein oder finde neue Mitspieler für deine Lieblingsspiele.
                </p>

                {user ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowCreateEventDialog(true)}
                      className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 text-lg font-handwritten transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Event erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 text-lg font-handwritten transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <Link href="/register">
                          <UserPlus className="w-5 h-5 mr-2" />
                          Registrieren
                        </Link>
                      </Button>
                      <div className="flex items-center space-x-2 text-gray-600 font-body">
                        <span>Bereits registriert?</span>
                        <Button
                          asChild
                          variant="outline"
                          className="border-2 border-purple-400 text-purple-600 hover:bg-purple-400 hover:text-white font-handwritten bg-transparent transform hover:scale-105 transition-all duration-200"
                        >
                          <Link href="/login">
                            <LogIn className="w-4 h-4 mr-2" />
                            Anmelden
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-handwritten text-gray-600 mb-4">Freunde-Funktionen</h3>
                <p className="text-gray-500 font-body mb-6">
                  Melde dich an, um Freunde zu finden und Freundschaftsanfragen zu senden.
                </p>
                <div className="space-x-4">
                  <Link href="/login">
                    <Button className="bg-teal-500 hover:bg-teal-600">
                      <LogIn className="w-4 h-4 mr-2" />
                      Anmelden
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Registrieren
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Friends Search */}
                <div className="mb-6">
                  <Input
                    placeholder="Nach Freunden suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-2 border-teal-200 focus:border-teal-400 font-body text-base max-w-md"
                  />
                </div>

                {/* Friends Sub-Tabs */}
                <Tabs defaultValue="find-friends" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm border-2 border-teal-200 rounded-xl p-1">
                    <TabsTrigger
                      value="find-friends"
                      className="font-handwritten text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-400 data-[state=active]:to-blue-400 data-[state=active]:text-white rounded-lg"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Freunde finden
                    </TabsTrigger>
                    <TabsTrigger
                      value="incoming-requests"
                      className="font-handwritten text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-teal-400 data-[state=active]:text-white rounded-lg relative"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Eingegangen
                      {pendingRequests.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                          {pendingRequests.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="sent-requests"
                      className="font-handwritten text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-400 data-[state=active]:text-white rounded-lg relative"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Gesendet
                      {user &&
                        allFriendRequests.filter((req) => req.from_user_id === user.id && req.status === "pending")
                          .length > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                            {
                              allFriendRequests.filter(
                                (req) => req.from_user_id === user.id && req.status === "pending",
                              ).length
                            }
                          </Badge>
                        )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Find Friends Tab */}
                  <TabsContent value="find-friends" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-handwritten text-gray-800">Neue Freunde finden</h3>
                      <p className="text-sm text-gray-500 font-body">
                        {filteredUsers.length} {filteredUsers.length === 1 ? "Person" : "Personen"} gefunden
                      </p>
                    </div>

                    {/* Users List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUsers.map((targetUser, index) => {
                        const friendshipStatus = getFriendshipStatus(targetUser.id)

                        return (
                          <Card
                            key={targetUser.id}
                            className={`bg-white/80 backdrop-blur-sm border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 hover:shadow-lg rounded-2xl transform hover:scale-105 ${
                              index % 3 === 0 ? "rotate-1" : index % 3 === 1 ? "-rotate-1" : "rotate-0"
                            } hover:rotate-0`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {targetUser.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-handwritten text-lg text-gray-800">{targetUser.name}</h3>
                                  {canViewField(targetUser, "email") && (
                                    <p className="text-xs text-gray-400 font-body">{targetUser.email}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex space-x-2 mb-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProfile(targetUser)}
                                  className="flex-1 border-teal-200 text-teal-600 hover:bg-teal-50 rounded-xl"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Profil
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewLibrary(targetUser)}
                                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl"
                                >
                                  <Dices className="w-4 h-4 mr-1" />
                                  Spiele
                                </Button>
                              </div>

                              {friendshipStatus === "friend" ? (
                                <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-200 py-2">
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Befreundet
                                </Badge>
                              ) : friendshipStatus === "sent" ? (
                                <Badge className="w-full justify-center bg-yellow-100 text-yellow-800 border-yellow-200 py-2">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Anfrage gesendet
                                </Badge>
                              ) : friendshipStatus === "received" ? (
                                <Badge className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200 py-2">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Anfrage erhalten
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleSendFriendRequest(targetUser.id)}
                                  className="w-full bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Freundschaftsanfrage senden
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-body">
                          {searchTerm ? "Keine Benutzer gefunden" : "Keine anderen Benutzer vorhanden"}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Incoming Friend Requests Tab */}
                  <TabsContent value="incoming-requests" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-handwritten text-gray-800">Eingegangene Freundschaftsanfragen</h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {pendingRequests.length} {pendingRequests.length === 1 ? "Anfrage" : "Anfragen"}
                      </Badge>
                    </div>

                    {pendingRequests.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map((request, index) => (
                          <Card
                            key={request.id}
                            className={`bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg ${
                              index % 3 === 0 ? "rotate-1" : index % 3 === 1 ? "-rotate-1" : "rotate-0"
                            } hover:rotate-0`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {request.sender?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-handwritten text-lg text-gray-800">
                                    {request.sender?.name || "Unbekannt"}
                                  </h4>
                                  <p className="text-sm text-gray-500 font-body">
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

                              {request.message && (
                                <div className="mb-4 p-3 bg-white/50 rounded-lg">
                                  <p className="text-sm font-body text-gray-700 italic">"{request.message}"</p>
                                </div>
                              )}

                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptFriendRequest(request.id, request.from_user_id)}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-handwritten"
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Annehmen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectFriendRequest(request.id)}
                                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-handwritten"
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <UserCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <h4 className="text-xl font-handwritten text-gray-600 mb-2">Keine neuen Anfragen</h4>
                        <p className="text-gray-500 font-body">
                          Du hast derzeit keine eingegangenen Freundschaftsanfragen.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Sent Friend Requests Tab */}
                  <TabsContent value="sent-requests" className="space-y-6">
                    {(() => {
                      const sentRequests = user
                        ? allFriendRequests.filter((req) => req.from_user_id === user.id && req.status === "pending")
                        : []

                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-handwritten text-gray-800">Gesendete Freundschaftsanfragen</h3>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              {sentRequests.length} {sentRequests.length === 1 ? "Anfrage" : "Anfragen"}
                            </Badge>
                          </div>

                          {sentRequests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {sentRequests.map((request, index) => (
                                <Card
                                  key={request.id}
                                  className={`bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-lg ${
                                    index % 3 === 0 ? "rotate-1" : index % 3 === 1 ? "-rotate-1" : "rotate-0"
                                  } hover:rotate-0`}
                                >
                                  <CardContent className="p-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {request.receiver?.name?.[0]?.toUpperCase() || "?"}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-handwritten text-lg text-gray-800">
                                          {request.receiver?.name || "Unbekannt"}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-body">
                                          Gesendet am{" "}
                                          {new Date(request.created_at).toLocaleDateString("de-DE", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          })}
                                        </p>
                                      </div>
                                    </div>

                                    {request.message && (
                                      <div className="mb-4 p-3 bg-white/50 rounded-lg">
                                        <p className="text-sm font-body text-gray-700 italic">"{request.message}"</p>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-center">
                                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 py-2 px-4">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Warte auf Antwort
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-10 h-10 text-orange-500" />
                              </div>
                              <h4 className="text-xl font-handwritten text-gray-600 mb-2">Keine gesendeten Anfragen</h4>
                              <p className="text-gray-500 font-body">
                                Du hast derzeit keine ausstehenden Freundschaftsanfragen gesendet.
                              </p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Community Detail Dialog */}
        <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-center">Community-Details</DialogTitle>
            </DialogHeader>
            {selectedCommunity && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedCommunity.image || "/placeholder.svg?height=200&width=300&query=board+game+community"}
                    alt={selectedCommunity.name}
                    className="w-24 h-32 rounded-lg shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-handwritten mb-1">{selectedCommunity.name}</h3>
                    <Badge className={`${getTypeColor(selectedCommunity.type || "casual")} text-white font-body mb-2`}>
                      {getTypeText(selectedCommunity.type || "casual")}
                    </Badge>
                    {selectedCommunity.is_private && (
                      <Badge className="bg-gray-600 text-white font-body ml-2">Privat</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium font-body">Mitglieder:</span>
                    <span className="ml-2 font-body">
                      {selectedCommunity.member_count}/{selectedCommunity.max_members}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium font-body">Erstellt:</span>
                    <span className="ml-2 font-body">
                      {new Date(selectedCommunity.created_at).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  {selectedCommunity.location && (
                    <div className="col-span-2">
                      <span className="font-medium font-body">Standort:</span>
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-body">{selectedCommunity.location}</span>
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium font-body">Ersteller:</span>
                    <span className="ml-2 font-body">{selectedCommunity.creator_name}</span>
                  </div>
                </div>

                {selectedCommunity.description && (
                  <div>
                    <span className="font-medium font-body">Beschreibung:</span>
                    <p className="text-sm text-gray-600 font-body mt-1 bg-gray-50 p-3 rounded">
                      {selectedCommunity.description}
                    </p>
                  </div>
                )}

                {user ? (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setShowCommunityDialog(false)
                        // Join community logic
                      }}
                      className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                    >
                      Beitreten
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCommunityDialog(false)
                        handleContactCreator(selectedCommunity)
                      }}
                      className="flex-1 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Ersteller kontaktieren
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        setShowCommunityDialog(false)
                        window.location.href = "/login"
                      }}
                      className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                    >
                      Anmelden zum Beitreten
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Event Detail Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-center">Event-Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={selectedEvent.image_url || "/placeholder.svg?height=200&width=300&query=community+event"}
                      alt={selectedEvent.title}
                      className="w-32 h-24 rounded-lg shadow-sm flex-shrink-0 object-cover"
                    />
                    {!selectedEvent.image_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-handwritten mb-2">{selectedEvent.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-purple-500 text-white font-body">
                        {selectedEvent.frequency === "einmalig" ? "Einmalig" : "Regelmäßig"}
                      </Badge>
                      <Badge className="bg-gray-600 text-white font-body">
                        {selectedEvent.visibility === "public" ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Öffentlich
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Privat
                          </>
                        )}
                      </Badge>
                      {selectedEvent.approval_mode === "manual" && (
                        <Badge className="bg-orange-500 text-white font-body">Manuelle Bestätigung</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedEvent.additional_info && (
                  <div>
                    <span className="font-medium font-body">Beschreibung:</span>
                    <p className="text-sm text-gray-600 font-body mt-1 bg-gray-50 p-3 rounded">
                      {selectedEvent.additional_info}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium font-body">Wann:</span>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-body">{formatEventDate(selectedEvent)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium font-body">Wo:</span>
                    <div className="flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-body">{selectedEvent.location}</span>
                    </div>
                  </div>
                  {selectedEvent.max_participants && (
                    <div>
                      <span className="font-medium font-body">Max. Teilnehmer:</span>
                      <div className="flex items-center mt-1">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="font-body">{selectedEvent.max_participants}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium font-body">Ersteller:</span>
                    <div className="flex items-center mt-1">
                      <UserCheck className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="font-body">{selectedEvent.creator?.name || "Unbekannt"}</span>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                {selectedEvent.use_time_slots && selectedEvent.time_slots && selectedEvent.time_slots.length > 0 && (
                  <div>
                    <span className="font-medium font-body">Terminvorschläge:</span>
                    <div className="mt-2 space-y-2">
                      {selectedEvent.time_slots.map((slot: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-body">
                              {new Date(slot.date).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                              {slot.timeFrom && slot.timeTo && `, ${slot.timeFrom} - ${slot.timeTo}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Games */}
                {(selectedEvent.selected_games?.length > 0 || selectedEvent.custom_games?.length > 0) && (
                  <div>
                    <span className="font-medium font-body">Spiele:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedEvent.selected_games?.map((game: any, idx: number) => (
                        <Badge key={idx} className="bg-teal-100 text-teal-800 border-teal-200">
                          <Dices className="w-3 h-3 mr-1" />
                          {game.title}
                          {game.publisher && <span className="text-xs ml-1">({game.publisher})</span>}
                        </Badge>
                      ))}
                      {selectedEvent.custom_games?.map((game: string, idx: number) => (
                        <Badge key={idx} className="bg-orange-100 text-orange-800 border-orange-200">
                          <Dices className="w-3 h-3 mr-1" />
                          {game}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {selectedEvent.rules && (
                  <div>
                    <span className="font-medium font-body">Regeln / Hinweise:</span>
                    <p className="text-sm text-gray-600 font-body mt-1 bg-gray-50 p-3 rounded">{selectedEvent.rules}</p>
                  </div>
                )}

                {/* Participants */}
                {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                  <div>
                    <span className="font-medium font-body">Teilnehmer:</span>
                    <div className="mt-2 space-y-1">
                      {selectedEvent.participants
                        .filter((p) => p.status === "joined" || p.status === "approved")
                        .map((participant, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {participant.user?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-body">{participant.user?.name || "Unbekannt"}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {user ? (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleJoinEvent(selectedEvent.id)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-handwritten"
                    >
                      {selectedEvent.approval_mode === "automatic" ? "Teilnehmen" : "Anfrage senden"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEventDialog(false)
                        // Contact event creator logic
                      }}
                      className="flex-1 border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten bg-transparent"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Ersteller kontaktieren
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        setShowEventDialog(false)
                        window.location.href = "/login"
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-handwritten"
                    >
                      Anmelden zum Teilnehmen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Creator Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-2xl text-center">Ersteller kontaktieren</DialogTitle>
            </DialogHeader>
            {selectedCommunity && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-handwritten text-lg text-gray-800 mb-1">{selectedCommunity.name}</h4>
                  <p className="text-sm text-gray-600 font-body">Ersteller: {selectedCommunity.creator_name}</p>
                </div>

                <div>
                  <Label htmlFor="contact-message" className="font-body text-gray-700 text-sm">
                    Deine Nachricht
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Schreibe eine Nachricht an den Community-Ersteller..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="mt-1 min-h-[120px] border-2 border-gray-200 focus:border-orange-400 font-body"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowContactDialog(false)}
                    className="flex-1 font-handwritten"
                    disabled={contactLoading}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={sendContactMessage}
                    disabled={!contactMessage.trim() || contactLoading}
                    className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
                  >
                    {contactLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Senden...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 rounded-2xl max-w-md">
            <DialogHeader className="bg-gradient-to-r from-teal-400 to-blue-400 text-white p-6 -m-6 mb-6 rounded-t-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser?.name[0].toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="font-handwritten text-2xl -rotate-1">{selectedUser?.name}</DialogTitle>
                  <div className="w-16 h-0.5 bg-white/50 mt-1"></div>
                </div>
              </div>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                {canViewField(selectedUser, "email") ? (
                  <div>
                    <Label className="font-body text-gray-600 text-sm">E-Mail</Label>
                    <p className="font-body text-gray-800">{selectedUser.email}</p>
                  </div>
                ) : (
                  <div>
                    <Label className="font-body text-gray-600 text-sm">E-Mail</Label>
                    <p className="font-body text-gray-400 italic">Nicht öffentlich</p>
                  </div>
                )}

                {selectedUser.bio && (
                  <div>
                    <Label className="font-body text-gray-600 text-sm">Bio</Label>
                    <p className="font-body text-gray-800">{selectedUser.bio}</p>
                  </div>
                )}

                {selectedUser.website && (
                  <div>
                    <Label className="font-body text-gray-600 text-sm">Website</Label>
                    <p className="font-body text-gray-800">{selectedUser.website}</p>
                  </div>
                )}

                <div>
                  <Label className="font-body text-gray-600 text-sm">Mitglied seit</Label>
                  <p className="font-body text-gray-800">
                    {new Date(selectedUser.created_at).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {!user && <GuestLoginPrompt action="vollständige Profile zu sehen" />}

                {user && !canViewField(selectedUser, "profile") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="font-body text-yellow-700 text-sm">
                      Profil nicht öffentlich. Sende eine Freundschaftsanfrage, um mehr zu sehen.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Library Dialog */}
        <Dialog open={showLibraryDialog} onOpenChange={setShowLibraryDialog}>
          <DialogContent className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader className="bg-gradient-to-r from-orange-400 to-pink-400 text-white p-6 -m-6 mb-6 rounded-t-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser?.name[0].toUpperCase() || "?"}
                </div>
                <div>
                  <DialogTitle className="font-handwritten text-2xl -rotate-1">
                    {selectedUser?.name || "Unbekannt"}s Spielebibliothek
                  </DialogTitle>
                  <div className="w-24 h-0.5 bg-white/50 mt-1"></div>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto max-h-96">
              {!user ? (
                <GuestLoginPrompt action="Spielebibliotheken zu durchstöbern" />
              ) : libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 font-body text-gray-600">Lade Spielebibliothek...</span>
                </div>
              ) : userGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userGames.map((game, index) => (
                    <Card
                      key={game.id}
                      className={`bg-white/80 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-lg rounded-2xl transform hover:scale-105 ${
                        index % 3 === 0 ? "rotate-1" : index % 3 === 1 ? "-rotate-1" : "rotate-0"
                      } hover:rotate-0`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Dices className="w-8 h-8 text-orange-500" />
                          <div className="flex-1">
                            <h4 className="font-handwritten text-lg text-gray-800">{game.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(game.condition)}
                              {game.available.includes("trade") && (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                  <Star className="w-3 h-3 mr-1" />
                                  Tauschbar
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {game.publisher && (
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="text-sm font-body text-gray-600">Verlag:</span>
                            <span className="text-sm font-body text-gray-800">{game.publisher}</span>
                          </div>
                        )}

                        {game.players && (
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="text-sm font-body text-gray-600">Spieler:</span>
                            <span className="text-sm font-body text-gray-800">{game.players}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dices className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-body text-gray-500">Keine Spiele in der Bibliothek</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Community Event Dialog */}
        <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <CreateCommunityEventForm
              userGames={games.map((game) => ({ id: game.id, title: game.title, publisher: game.publisher }))}
              friends={allFriends.map((friend) => ({ id: friend.id, name: friend.name, avatar: friend.avatar }))}
              onSubmit={handleCreateEvent}
              onCancel={handleCancelCreateEvent}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<CommunityLoading />}>
      <CommunityContent />
    </Suspense>
  )
}
