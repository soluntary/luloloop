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
  const auth = useAuth()
  const [user, setUser] = useState<User | null>(null)

  const authUser = auth?.user
  const authLoading = auth?.loading ?? true

  useEffect(() => {
    if (authUser) {
      // Map auth user to user context format
      setUser({
        id: authUser.id,
        name: authUser.username || authUser.name || "Unknown User",
        email: authUser.email,
        username: authUser.username,
        avatar: authUser.avatar,
      })
    } else {
      setUser(null)
    }
  }, [authUser])

  const loading = authLoading || (authUser && !user)

  return <UserContext.Provider value={{ user, loading: !!loading }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    return { user: null, loading: false }
  }
  return context
}
