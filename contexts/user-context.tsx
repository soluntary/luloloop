"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  name: string
  email: string
  username?: string
  avatar?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: authUser } = useAuth()

  useEffect(() => {
    if (authUser) {
      // Map auth user to user context format
      setUser({
        id: authUser.id,
        name: authUser.name || authUser.username || "Unknown User",
        email: authUser.email,
        username: authUser.username,
        avatar: authUser.avatar,
      })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [authUser])

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
