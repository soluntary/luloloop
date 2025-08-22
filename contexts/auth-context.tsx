"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  email: string
  name: string
  username?: string
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
  signUp: (email: string, password: string, name: string, username?: string) => Promise<void>
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
  const [mounted, setMounted] = useState(true)
  const profileLoadingRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  const clearInvalidSession = async () => {
    try {
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("sb-" + supabase.supabaseUrl.split("//")[1] + "-auth-token")

      await supabase.auth.signOut({ scope: "local" })

      if (mounted) {
        setUser(null)
        setLoading(false)
      }

      console.log("[v0] Session cleared due to refresh token error")
    } catch (error) {
      console.error("Error clearing session:", error)
      if (mounted) {
        setUser(null)
        setLoading(false)
      }
    }
  }

  const loadUserProfile = useCallback(
    async (authUser: User) => {
      if (profileLoadingRef.current || currentUserIdRef.current === authUser.id) {
        console.log("[v0] Profile already loading or loaded for this user, skipping")
        return
      }

      try {
        console.log("[v0] Loading user profile for:", authUser.id)
        profileLoadingRef.current = true
        currentUserIdRef.current = authUser.id

        if (mounted) {
          setLoading(true)
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle()

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("[v0] Error fetching user profile:", fetchError)
          throw fetchError
        }

        let userProfile

        if (!existingUser) {
          console.log("[v0] User not found in database, creating profile...")

          const newUserProfile = {
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            username: authUser.user_metadata?.username,
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

          const { data: createdUser, error: createError } = await supabase
            .from("users")
            .insert([newUserProfile])
            .select()
            .single()

          if (createError) {
            console.error("[v0] Error creating user profile:", createError)
            throw createError
          }

          userProfile = createdUser
          console.log("[v0] User profile created successfully in database")
        } else {
          userProfile = existingUser
          console.log("[v0] User profile found in database")
        }

        console.log("[v0] User profile loaded successfully:", userProfile.name)
        if (mounted) {
          setUser(userProfile)
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
        try {
          const fallbackProfile = {
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            username: authUser.user_metadata?.username,
          }

          try {
            await supabase.from("users").insert([
              {
                id: authUser.id,
                email: authUser.email || "",
                name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
                username: authUser.user_metadata?.username,
                settings: {},
              },
            ])
            console.log("[v0] Fallback user profile created in database")
          } catch (fallbackDbError) {
            console.error("[v0] Fallback database creation failed:", fallbackDbError)
          }

          if (mounted) {
            setUser(fallbackProfile)
          }
          console.log("[v0] Fallback user profile created")
        } catch (fallbackError) {
          console.error("Error creating fallback user:", fallbackError)
          if (mounted) {
            setUser(null)
          }
        }
      } finally {
        profileLoadingRef.current = false
        if (mounted) {
          setLoading(false)
        }
        console.log("[v0] User profile loading completed")
      }
    },
    [mounted],
  )

  useEffect(() => {
    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (initialized) return

    console.log("[v0] Initializing auth...")

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event, session?.user?.id)

      if (!mounted) {
        console.log("[v0] Component unmounted, skipping auth state change")
        return
      }

      try {
        if (event === "SIGNED_OUT") {
          console.log("[v0] User signed out")
          currentUserIdRef.current = null
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (event === "TOKEN_REFRESHED") {
          console.log("[v0] Token refreshed")
          if (!session?.user) {
            console.log("[v0] Token refresh failed, clearing session")
            await clearInvalidSession()
            return
          }
          if (currentUserIdRef.current === session.user.id) {
            return
          }
        }

        if (event === "SIGNED_IN") {
          console.log("[v0] User signed in successfully, loading profile...")
          if (mounted) {
            setLoading(true)
          }
        }

        if (event === "USER_UPDATED") {
          console.log("[v0] User updated event received, skipping profile reload")
          return
        }

        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          console.log("[v0] No session user found")
          currentUserIdRef.current = null
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("[v0] Error in auth state change handler:", error)
        await clearInvalidSession()
      }
    })

    const initializeAuth = async () => {
      try {
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

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          username: username,
        },
      },
    })

    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    console.log("[v0] SignIn attempt started for:", email)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] SignIn failed with error:", error.message)
      throw error
    }

    console.log("[v0] SignIn successful, waiting for auth state change...")
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
      const { error: dbError } = await supabase
        .from("users")
        .update({
          name: data.name || user.name,
          username: data.username || user.username,
          avatar: data.avatar || user.avatar,
          bio: data.bio !== undefined ? data.bio : user.bio,
          website: data.website !== undefined ? data.website : user.website,
          twitter: data.twitter !== undefined ? data.twitter : user.twitter,
          instagram: data.instagram !== undefined ? data.instagram : user.instagram,
          settings: data.settings || user.settings,
        })
        .eq("id", user.id)

      if (dbError) {
        console.error("Error updating user in database:", dbError)
        throw dbError
      }

      const updatedUser = { ...user, ...data }
      if (mounted) {
        setUser(updatedUser)
      }

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
