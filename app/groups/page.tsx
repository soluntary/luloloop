"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useFriends } from "@/contexts/friends-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Search,
  Plus,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  GamepadIcon,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  ArrowLeft,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Community {
  id: string
  name: string
  description: string
  location: string
  member_count: number
  is_private: boolean
  created_at: string
  created_by: string
  image_url?: string
}

interface Friend {
  id: string
  username: string
  email: string
  avatar_url?: string
  location?: string
  privacy_game_shelf: "public" | "friends" | "private"
  privacy_profile: "public" | "friends" | "private"
  privacy_activity: "public" | "friends" | "private"
}

interface UserGame {
  id: string
  title: string
  image_url?: string
  condition: string
  availability: string
}

interface FriendRequest {
  id: string
  requester_id: string
  requested_id: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  requester: {
    username: string
    avatar_url?: string
  }
}

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsContent />
    </ProtectedRoute>
  )
}

function GroupsContent() {
  const { user } = useAuth()
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const [communities, setCommunities] = useState<Community[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null)
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    location: "",
    is_private: false,
  })

  // Load communities and friends data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use Promise.allSettled to prevent individual failures from blocking everything
      const results = await Promise.allSettled([
        loadCommunities(),
        // Add other data loading functions here if needed
      ])

      // Check if any critical operations failed
      const communitiesResult = results[0]
      if (communitiesResult.status === "rejected") {
        console.error("Failed to load communities:", communitiesResult.reason)
        setError("Fehler beim Laden der Community-Daten")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  const loadCommunities = async () => {
    try {
      // Check if communities table exists
      const { data: tableExists } = await supabase.from("communities").select("id").limit(1)

      if (tableExists !== null) {
        const { data, error } = await supabase.from("communities").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading communities:", error)
          // Fallback to empty array instead of throwing
          setCommunities([])
        } else {
          setCommunities(data || [])
        }
      } else {
        // Table doesn't exist, use empty array
        setCommunities([])
      }
    } catch (error) {
      console.error("Error in loadCommunities:", error)
      setCommunities([])
    }
  }

  const createCommunity = async () => {
    if (!user || !newCommunity.name.trim()) return

    try {
      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: newCommunity.name,
            description: newCommunity.description,
            location: newCommunity.location,
            is_private: newCommunity.is_private,
            created_by: user.id,
            member_count: 1,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setCommunities((prev) => [data[0], ...prev])
        setNewCommunity({ name: "", description: "", location: "", is_private: false })
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error("Error creating community:", error)
      setError("Fehler beim Erstellen der Community")
    }
  }

  const handleViewProfile = async (friend: Friend) => {
    // Check if user can view this profile
    if (!canViewField(friend, "privacy_profile")) {
      alert("Dieses Profil ist privat.")
      return
    }

    setSelectedUser(friend)
  }

  const handleViewLibrary = async (friend: Friend) => {
    // Check if user can view this library
    if (!canViewField(friend, "privacy_game_shelf")) {
      const confirmed = confirm(
        "Dieser Benutzer hat sein Spieleregal als privat eingestellt. Möchten Sie trotzdem fortfahren?",
      )
      if (!confirmed) {
        return
      }
    }

    try {
      const { data, error } = await supabase.from("user_games").select("*").eq("user_id", friend.id)

      if (error) throw error

      setUserGames(data || [])
      setSelectedUser(friend)
    } catch (error) {
      console.error("Error loading user games:", error)
      setError("Fehler beim Laden der Spielebibliothek")
    }
  }

  const canViewField = (
    friend: Friend,
    field: keyof Pick<Friend, "privacy_game_shelf" | "privacy_profile" | "privacy_activity">,
  ): boolean => {
    const privacy = friend[field]

    if (privacy === "public") return true
    if (privacy === "private") return false
    if (privacy === "friends") {
      // Check if this user is a friend
      return friends.some((f) => f.id === friend.id)
    }

    return false
  }

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (friend.location && friend.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ludoloop-teal mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Community-Daten...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-galindo text-gray-800 mb-4">Community & Freunde</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verbinde dich mit anderen Spielern, tritt Communities bei und erweitere dein Netzwerk!
          </p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Suche Communities oder Freunde..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="communities" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="communities" className="font-galindo">
              Communities
            </TabsTrigger>
            <TabsTrigger value="friends" className="font-galindo">
              Freunde
            </TabsTrigger>
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-galindo text-gray-800">Communities</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-ludoloop-teal hover:bg-teal-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Community erstellen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Community erstellen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Community Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea
                        id="description"
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Beschreibe deine Community..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Standort</Label>
                      <Input
                        id="location"
                        value={newCommunity.location}
                        onChange={(e) => setNewCommunity((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Stadt, Land"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="private"
                        checked={newCommunity.is_private}
                        onCheckedChange={(checked) => setNewCommunity((prev) => ({ ...prev, is_private: checked }))}
                      />
                      <Label htmlFor="private">Private Community</Label>
                    </div>
                    <Button onClick={createCommunity} className="w-full">
                      Community erstellen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((community) => (
                <Card key={community.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-galindo text-gray-800">{community.name}</CardTitle>
                      {community.is_private ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{community.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {community.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {community.member_count} Mitglieder
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(community.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-ludoloop-pink hover:bg-pink-600 text-white">Beitreten</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCommunities.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-galindo text-gray-600 mb-2">Keine Communities gefunden</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Versuche einen anderen Suchbegriff" : "Erstelle die erste Community!"}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <div className="space-y-6">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div>
                  <h3 className="text-xl font-galindo text-gray-800 mb-4">Freundschaftsanfragen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friendRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-ludoloop-teal rounded-full flex items-center justify-center text-white font-bold">
                              {request.requester.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{request.requester.username}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => acceptFriendRequest(request.id)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Annehmen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectFriendRequest(request.id)}
                              className="flex-1"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div>
                <h3 className="text-xl font-galindo text-gray-800 mb-4">Meine Freunde ({friends.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFriends.map((friend) => (
                    <Card key={friend.id} className="card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-ludoloop-teal rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-galindo text-lg text-gray-800">{friend.username}</h4>
                            {friend.location && (
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {friend.location}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProfile(friend)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Profil
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewLibrary(friend)}
                            className="flex-1"
                          >
                            <GamepadIcon className="h-4 w-4 mr-1" />
                            Spiele
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredFriends.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-galindo text-gray-600 mb-2">Keine Freunde gefunden</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Versuche einen anderen Suchbegriff" : "Füge deine ersten Freunde hinzu!"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Profile Modal */}
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle>Profil von {selectedUser.username}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Profile Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-ludoloop-teal rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-galindo">{selectedUser.username}</h3>
                    {canViewField(selectedUser, "privacy_profile") && selectedUser.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedUser.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy Notice */}
                {!canViewField(selectedUser, "privacy_profile") && (
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-600">Profil nicht öffentlich</p>
                  </div>
                )}

                {/* Games Library */}
                {userGames.length > 0 && (
                  <div>
                    <h4 className="text-lg font-galindo mb-3">Spielebibliothek</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userGames.slice(0, 6).map((game) => (
                        <div key={game.id} className="bg-white p-3 rounded-lg border">
                          <h5 className="font-medium text-sm mb-1">{game.title}</h5>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {game.condition}
                            </Badge>
                            <span>{game.availability}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {userGames.length > 6 && (
                      <p className="text-sm text-gray-500 mt-2">und {userGames.length - 6} weitere Spiele...</p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-galindo text-gray-800 mb-4">Erweitere dein Netzwerk!</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Verbinde dich mit Gleichgesinnten, tausche Spiele aus und entdecke neue Gaming-Erlebnisse in deiner
            Community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-ludoloop-teal hover:bg-teal-600 text-white btn-playful"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Community gründen
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-ludoloop-pink text-ludoloop-pink hover:bg-ludoloop-pink hover:text-white btn-playful bg-transparent"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Freunde finden
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
