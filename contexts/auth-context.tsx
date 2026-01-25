"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { checkGlobalRateLimit, withRateLimit } from "@/lib/supabase/rate-limit"
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
  signUp: (email: string, password: string, name: string, username?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>
  networkError: boolean
  retryCount: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const pendingAuthPromisesRef = useRef<Map<string, { resolve: () => void; reject: (error: any) => void }>>(new Map())
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const initializedRef = useRef(false)
  const wasAuthenticatedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  const isNetworkError = (error: any): boolean => {
    return (
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError") ||
      error?.message?.includes("fetch") ||
      error?.code === "NETWORK_ERROR" ||
      !navigator.onLine
    )
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const loadUserProfile = useCallback(async (authUser: User) => {
    const supabase = supabaseRef.current
    if (!supabase) {
      console.error("[v0] Supabase client not available")
      setLoading(false)
      return
    }

    wasAuthenticatedRef.current = true
    lastUserIdRef.current = authUser.id

    if (checkGlobalRateLimit()) {
      console.log("[v0] Rate limited, using fallback profile")
      const fallbackProfile = {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      }
      setUser(fallbackProfile)
      setLoading(false)
      return
    }

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        console.log("[v0] Loading user profile for:", authUser.id, `(attempt ${attempts + 1})`)

        const existingUser = await withRateLimit(async () => {
          const { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle()
          if (error && error.code !== "PGRST116") {
            throw error
          }
          return data
        }, null)

        let userProfile

        if (!existingUser) {
          console.log("[v0] Creating new user profile...")
          const newUserProfile = {
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            avatar: authUser.user_metadata?.avatar_url || null,
            bio: null,
            website: null,
            twitter: null,
            instagram: null,
            settings: {
              notifications: { email: true, push: true, marketing: false, security: true },
              privacy: { profileVisible: true, emailVisible: false, onlineStatus: true, allowMessages: true },
              security: { twoFactor: false, loginNotifications: true, sessionTimeout: 30 },
            },
          }

          userProfile = await withRateLimit(async () => {
            const { data: createdUser, error: createError } = await supabase
              .from("users")
              .insert([newUserProfile])
              .select()
              .single()

            if (createError) throw createError
            return createdUser
          }, newUserProfile)
        } else {
          userProfile = existingUser
        }

        console.log("[v0] User profile loaded successfully:", userProfile.name)
        setUser(userProfile)
        setLoading(false)
        setNetworkError(false)
        setRetryCount(0)
        return
      } catch (error) {
        attempts++
        console.error(`[v0] Profile loading error (attempt ${attempts}):`, error)

        if (isNetworkError(error) && attempts < maxAttempts) {
          setNetworkError(true)
          const delayMs = Math.pow(2, attempts) * 1000 // Exponential backoff
          console.log(`[v0] Network error detected, retrying in ${delayMs}ms...`)
          await delay(delayMs)
          continue
        }

        console.log("[v0] All retries failed, using fallback profile")
        const fallbackProfile = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        }

        setUser(fallbackProfile)
        setLoading(false)
        setNetworkError(true)
        setRetryCount(attempts)
        return
      }
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = supabaseRef.current
      if (!supabase) throw new Error("Supabase client not available")

      console.log("[v0] SignIn attempt started for:", email)

      if (!navigator.onLine) {
        throw new Error("No internet connection. Please check your network and try again.")
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          console.log("[v0] SignIn failed with error:", error.message)

          console.log("[v0] Security event: login_attempt failed for", email)

          if (isNetworkError(error)) {
            throw new Error("Network connection failed. Please check your internet connection and try again.")
          }

          throw error
        }

        console.log("[v0] SignIn successful, loading user profile directly...")

        if (data.session?.user) {
          console.log("[v0] Session and user available, loading profile...")
          setLoading(true)
          await loadUserProfile(data.session.user)

          console.log("[v0] Security event: login_attempt successful for", email)

          console.log("[v0] SignIn completed successfully")
        } else {
          throw new Error("No session or user data received after sign-in")
        }
      } catch (error) {
        console.error("[v0] SignIn error:", error)

        if (isNetworkError(error)) {
          throw new Error("Connection failed. Please check your internet connection and try again.")
        }

        throw error
      }
    },
    [loadUserProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, name: string, username?: string) => {
      const supabase = supabaseRef.current
      if (!supabase) throw new Error("Supabase client not available")

      console.log("[v0] Starting signup process for:", email)

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name },
          },
        })

        console.log("[v0] Signup response - user:", data?.user?.id, "session:", !!data?.session, "error:", error?.message, "code:", error?.code, "status:", error?.status)

        if (error) {
          console.error("[v0] Signup error details:", JSON.stringify(error, null, 2))

          if (error.status === 429 && error.code === "over_email_send_rate_limit") {
            throw new Error(
              "Diese E-Mail-Adresse hat das Limit für Registrierungsversuche erreicht. Bitte versuchen Sie es mit einer anderen E-Mail-Adresse oder warten Sie einige Minuten.",
            )
          }

          if (error.message?.includes("User already registered")) {
            throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.")
          }

          if (error.message?.includes("Invalid email")) {
            throw new Error("Ungültige E-Mail-Adresse.")
          }

          if (error.message?.includes("Password")) {
            throw new Error("Das Passwort entspricht nicht den Anforderungen.")
          }

          throw new Error(`Registrierung fehlgeschlagen: ${error.message}`)
        }

        console.log("[v0] Signup successful, user created:", data.user?.id)

        // Check if user was created but email confirmation is required
        if (data.user && !data.session) {
          console.log("[v0] User created but no session - email confirmation may be required")
          // Try to sign in immediately (works if email confirmation is disabled)
          try {
            await signIn(email, password)
            console.log("[v0] Auto sign-in successful after registration")
            return
          } catch (signInError: any) {
            console.log("[v0] Auto sign-in failed:", signInError.message)
            // If sign-in fails because email not confirmed, that's expected
            if (signInError.message?.includes("Email not confirmed")) {
              throw new Error("Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.")
            }
            throw new Error("Registrierung erfolgreich! Bitte versuchen Sie sich anzumelden.")
          }
        }

        // If we have both user and session, we're good
        if (data.user && data.session) {
          console.log("[v0] User created with session, loading profile...")
          setLoading(true)
          await loadUserProfile(data.user)
        }
      } catch (error: any) {
        console.error("[v0] Signup process failed:", error.message)
        throw error
      }
    },
    [signIn, loadUserProfile],
  )

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error("Supabase client not available")

    if (user) {
      console.log("[v0] Security event: logout for user", user.email)
    }

    wasAuthenticatedRef.current = false
    lastUserIdRef.current = null

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [user])

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error("Supabase client not available")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = supabaseRef.current
    if (!supabase) return { success: false, error: "Supabase client not available" }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        console.error("[v0] Password update error:", error.message)
        return { success: false, error: error.message }
      }

      console.log("[v0] Password updated successfully")
      return { success: true }
    } catch (error: any) {
      console.error("[v0] Password update exception:", error)
      return { success: false, error: error.message || "Unbekannter Fehler" }
    }
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      const supabase = supabaseRef.current
      if (!supabase) throw new Error("Supabase client not available")
      if (!user) throw new Error("No user logged in")

      try {
        console.log("[v0] Updating profile with data:", data)

        await withRateLimit(async () => {
          const updateData = {
            name: data.name !== undefined ? data.name : user.name,
            email: data.email !== undefined ? data.email : user.email,
            avatar: data.avatar !== undefined ? data.avatar : user.avatar,
            bio: data.bio !== undefined ? data.bio : user.bio,
            website: data.website !== undefined ? data.website : user.website,
            twitter: data.twitter !== undefined ? data.twitter : user.twitter,
            instagram: data.instagram !== undefined ? data.instagram : user.instagram,
            settings: data.settings !== undefined ? data.settings : user.settings,
          }

          console.log("[v0] Database update data:", updateData)

          const { error: dbError } = await supabase.from("users").update(updateData).eq("id", user.id)

          if (dbError) throw dbError
        })

        if (
          data.settings?.security &&
          JSON.stringify(data.settings.security) !== JSON.stringify(user.settings?.security)
        ) {
          console.log("[v0] Security event: security_settings_change")
        }

        const updatedUser = {
          ...user,
          ...data,
        }

        console.log("[v0] Profile updated successfully, new user state:", updatedUser)
        setUser(updatedUser)
        return true
      } catch (error) {
        console.error("Error updating profile:", error)
        throw error
      }
    },
    [user],
  )

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      supabaseRef.current = createClient()
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      setLoading(false)
      setNetworkError(true)
      return
    }

    const supabase = supabaseRef.current

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log("[v0] Auth state change:", event, session?.user?.id)

        if (event === "SIGNED_OUT") {
          console.log("[v0] Explicit sign out detected")
          wasAuthenticatedRef.current = false
          lastUserIdRef.current = null
          setUser(null)
          setLoading(false)
          setNetworkError(false)
          return
        }

        if (!session?.user) {
          if (wasAuthenticatedRef.current && lastUserIdRef.current) {
            console.log("[v0] Session temporarily null, keeping user state")
            return
          }
          setUser(null)
          setLoading(false)
          setNetworkError(false)
          return
        }

        if (event === "INITIAL_SESSION" && session?.user) {
          if (lastUserIdRef.current === session.user.id && user) {
            console.log("[v0] INITIAL_SESSION for same user, skipping reload")
            setLoading(false)
            return
          }
          setLoading(true)
          await loadUserProfile(session.user)
          return
        }

        if (event === "SIGNED_IN" && session?.user) {
          if (lastUserIdRef.current === session.user.id && user) {
            console.log("[v0] SIGNED_IN for same user, skipping reload")
            setLoading(false)
            return
          }

          pendingAuthPromisesRef.current.forEach(({ resolve }) => {
            resolve()
          })
          pendingAuthPromisesRef.current.clear()

          setLoading(true)
          await loadUserProfile(session.user)
          return
        }

        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (session?.user && lastUserIdRef.current === session.user.id) {
            console.log("[v0] Token refreshed/user updated, session still valid")
          }
          return
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        if (isNetworkError(error)) {
          setNetworkError(true)
        }
      }
    })

    let isMounted = true

    const initializeAuth = async () => {
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts && isMounted) {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (!isMounted) return

          if (error) {
            // Ignore abort errors - they're expected during unmount
            if (error.message?.includes("aborted") || error.message?.includes("signal")) {
              return
            }
            if (isNetworkError(error) && attempts < maxAttempts - 1) {
              attempts++
              await delay(1000 * attempts)
              continue
            }
            console.error("[v0] Auth session error:", error)
            setUser(null)
            setLoading(false)
            setNetworkError(true)
            return
          }

          if (session?.user) {
            await loadUserProfile(session.user)
          } else {
            if (isMounted) {
              setUser(null)
              setLoading(false)
            }
          }
          return
        } catch (error: any) {
          // Ignore abort errors - they're expected during unmount
          if (error?.message?.includes("aborted") || error?.message?.includes("signal")) {
            return
          }
          attempts++
          console.error(`Auth initialization error (attempt ${attempts}):`, error)

          if (isNetworkError(error) && attempts < maxAttempts) {
            setNetworkError(true)
            await delay(1000 * attempts)
            continue
          }

          if (isMounted) {
            setUser(null)
            setLoading(false)
            setNetworkError(true)
          }
          return
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile, user])

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    networkError,
    retryCount,
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
