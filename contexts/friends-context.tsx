"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface Friend {
  id: number
  name: string
  email: string
  avatar: string
  status: 'pending' | 'accepted' | 'blocked'
  addedAt: string
  lastSeen: string
  gamesCount: number
  rating: number
}

interface FriendRequest {
  id: number
  fromUser: string
  toUser: string
  message: string
  timestamp: string
  status: 'pending' | 'accepted' | 'declined'
}

interface FriendsContextType {
  friends: Friend[]
  friendRequests: FriendRequest[]
  sendFriendRequest: (toUser: string, message: string) => void
  acceptFriendRequest: (requestId: number) => void
  declineFriendRequest: (requestId: number) => void
  removeFriend: (friendId: number) => void
  getFriendByName: (name: string) => Friend | undefined
  getPendingRequests: (username: string) => FriendRequest[]
  getSentRequests: (username: string) => FriendRequest[]
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

// Mock users database for demo
const mockUsers = [
  {
    id: 1,
    name: "SpieleFan42",
    email: "spielefan@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SpieleFan42",
    lastSeen: "vor 2 Stunden",
    gamesCount: 15,
    rating: 4.8
  },
  {
    id: 2,
    name: "BoardGameLover",
    email: "boardgame@example.com", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BoardGameLover",
    lastSeen: "vor 1 Tag",
    gamesCount: 23,
    rating: 4.9
  },
  {
    id: 3,
    name: "MarsExplorer",
    email: "mars@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarsExplorer", 
    lastSeen: "vor 3 Stunden",
    gamesCount: 8,
    rating: 4.7
  },
  {
    id: 4,
    name: "IslandGuardian",
    email: "island@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=IslandGuardian",
    lastSeen: "online",
    gamesCount: 12,
    rating: 4.6
  },
  {
    id: 5,
    name: "CatanMeister",
    email: "catan@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CatanMeister",
    lastSeen: "vor 5 Minuten", 
    gamesCount: 19,
    rating: 4.5
  },
  {
    id: 6,
    name: "FliesenKönig",
    email: "fliesen@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FliesenKönig",
    lastSeen: "vor 1 Stunde",
    gamesCount: 7,
    rating: 4.8
  }
]

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFriends = localStorage.getItem('ludoloop_friends')
      const savedRequests = localStorage.getItem('ludoloop_friend_requests')
      
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends))
      }
      
      if (savedRequests) {
        setFriendRequests(JSON.parse(savedRequests))
      }
      
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('ludoloop_friends', JSON.stringify(friends))
    }
  }, [friends, isLoaded])

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('ludoloop_friend_requests', JSON.stringify(friendRequests))
    }
  }, [friendRequests, isLoaded])

  const sendFriendRequest = (toUser: string, message: string) => {
    const currentUser = JSON.parse(localStorage.getItem('ludoloop_current_user') || '{}')
    
    // Check if request already exists
    const existingRequest = friendRequests.find(
      req => req.fromUser === currentUser.name && req.toUser === toUser && req.status === 'pending'
    )
    
    if (existingRequest) {
      alert('Du hast bereits eine Freundschaftsanfrage an diesen Benutzer gesendet!')
      return
    }

    const newRequest: FriendRequest = {
      id: Math.max(...friendRequests.map(r => r.id), 0) + 1,
      fromUser: currentUser.name,
      toUser,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }
    
    setFriendRequests(prev => [...prev, newRequest])
  }

  const acceptFriendRequest = (requestId: number) => {
    const request = friendRequests.find(r => r.id === requestId)
    if (!request) return

    // Find user data from mock users
    const userData = mockUsers.find(u => u.name === request.fromUser)
    if (!userData) return

    // Add to friends list
    const newFriend: Friend = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      status: 'accepted',
      addedAt: new Date().toISOString(),
      lastSeen: userData.lastSeen,
      gamesCount: userData.gamesCount,
      rating: userData.rating
    }

    setFriends(prev => [...prev, newFriend])
    
    // Update request status
    setFriendRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      )
    )
  }

  const declineFriendRequest = (requestId: number) => {
    setFriendRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'declined' } : req
      )
    )
  }

  const removeFriend = (friendId: number) => {
    setFriends(prev => prev.filter(friend => friend.id !== friendId))
  }

  const getFriendByName = (name: string) => {
    return friends.find(friend => friend.name === name)
  }

  const getPendingRequests = (username: string) => {
    return friendRequests.filter(req => req.toUser === username && req.status === 'pending')
  }

  const getSentRequests = (username: string) => {
    return friendRequests.filter(req => req.fromUser === username && req.status === 'pending')
  }

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
      getFriendByName,
      getPendingRequests,
      getSentRequests
    }}>
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendsContext)
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider')
  }
  return context
}

// Export mock users for use in other components
export { mockUsers }
