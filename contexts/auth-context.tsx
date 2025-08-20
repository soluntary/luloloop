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
  const [initialized, setInitialized] = useState(false)

  const clearInvalidSession = async () => {
    try {
      // Clear local storage auth data
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("sb-" + supabase.supabaseUrl.split("//")[1] + "-auth-token")

      // Force sign out
      await supabase.auth.signOut({ scope: "local" })

      // Reset state
      setUser(null)
      setLoading(false)

      console.log("[v0] Session cleared due to refresh token error")
    } catch (error) {
      console.error("Error clearing session:", error)
      setUser(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialized) return

    const initializeAuth = async () => {
      try {
        console.log("[v0] Initializing auth...")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Auth session error:", error)
          if (
            error.message?.includes("Invalid Refresh Token") ||
            error.message?.includes("Refresh Token Not Found") ||
            error.message?.includes("Already Used") ||
            error.message?.includes("refresh_token_not_found")
          ) {
            console.log("[v0] Detected refresh token error, clearing session aggressively")
            await clearInvalidSession()
            setInitialized(true)
            return
          }
          setUser(null)
          setLoading(false)
          setInitialized(true)
          return
        }

        if (session?.user) {
          console.log("[v0] Valid session found, loading user profile")
          await loadUserProfile(session.user)
        } else {
          console.log("[v0] No session found")
          setLoading(false)
        }

        setInitialized(true)
      } catch (error) {
        console.error("[v0] Unexpected auth initialization error:", error)
        await clearInvalidSession()
        setInitialized(true)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event, session?.user?.id)

      try {
        if (event === "SIGNED_OUT") {
          setUser(null)
          setLoading(false)
          return
        }

        if (event === "TOKEN_REFRESHED") {
          if (!session?.user) {
            console.log("[v0] Token refresh failed, clearing session")
            await clearInvalidSession()
            return
          }
        }

        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error("[v0] Error in auth state change handler:", error)
        await clearInvalidSession()
      }
    })

    return () => subscription?.unsubscribe()
  }, [initialized])

  const loadUserProfile = async (authUser: User) => {
    try {
      setLoading(true)

      const userProfile = {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        avatar: authUser.user_metadata?.avatar_url,
        bio: null,
        website: null,
        twitter: null,
        instagram: null,
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

      setUser(userProfile)
    } catch (error) {
      console.error("Error loading user profile:", error)
      try {
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        })
      } catch (fallbackError) {
        console.error("Error creating fallback user:", fallbackError)
        setUser(null)
      }
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
