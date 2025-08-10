"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  bio?: string
  website?: string
  twitter?: string
  instagram?: string
  facebook?: string
  settings?: any
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser: User) => {
    try {
      setLoading(true)

      // Create a basic user object from auth data
      const basicUser = {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        avatar: authUser.user_metadata?.avatar_url || null,
        bio: null,
        website: null,
        twitter: null,
        instagram: null,
        facebook: null,
        settings: {
          notifications: {
            email: true,
            push: true,
            marketing: false,
            security: true,
          },
          privacy: {
            profileVisible: true,
            emailVisible: false,
            onlineStatus: true,
            allowMessages: true,
          },
          security: {
            twoFactor: false,
            loginNotifications: true,
            sessionTimeout: 30,
          },
        },
      }

      setUser(basicUser)
    } catch (error) {
      console.error("Error loading user profile:", error)
      // Fallback to basic user object
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      })
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  }

  const updateProfile = async (data: Partial<AuthUser>) => {
    if (!user) throw new Error("No user logged in")

    try {
      // Update auth metadata if name or avatar changed
      if (data.name || data.avatar) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            name: data.name || user.name,
            avatar_url: data.avatar || user.avatar,
          },
        })

        if (authError) {
          console.error("Error updating auth metadata:", authError)
          throw authError
        }
      }

      // Update local user state
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)

      return true
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
