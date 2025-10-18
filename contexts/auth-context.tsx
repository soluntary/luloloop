"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { checkGlobalRateLimit, withRateLimit } from "@/lib/supabase/rate-limit"
import { logSecurityEvent } from "@/app/actions/security-notifications"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  email: string
  name: string
  username?: string
  anzeigename?: string
  birthDate?: string
  phone?: string
  address?: string
  location?: string
  favoriteGames?: string[]
  preferredGameTypes?: string[]
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
  networkError: boolean
  retryCount: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const pendingAuthPromisesRef = useRef<Map<string, { resolve: () => void; reject: (error: any) => void }>>(new Map())
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

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

  const loadUserProfile = useCallback(
    async (authUser: User) => {
      if (!supabase) {
        console.error("[v0] Supabase client not available")
        setLoading(false)
        return
      }

      if (checkGlobalRateLimit()) {
        console.log("[v0] Rate limited, using fallback profile")
        const fallbackProfile = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
          username: authUser.user_metadata?.username,
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
              username: authUser.user_metadata?.username,
              anzeigename: null,
              birthDate: null,
              phone: null,
              address: null,
              location: null,
              favoriteGames: [],
              preferredGameTypes: [],
              avatar: authUser.user_metadata?.avatar_url,
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
            username: authUser.user_metadata?.username,
          }

          setUser(fallbackProfile)
          setLoading(false)
          setNetworkError(true)
          setRetryCount(attempts)
          return
        }
      }
    },
    [supabase],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase client not available")

      console.log("[v0] SignIn attempt started for:", email)

      if (!navigator.onLine) {
        throw new Error("No internet connection. Please check your network and try again.")
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          console.log("[v0] SignIn failed with error:", error.message)

          try {
            await logSecurityEvent({
              eventType: "login_attempt",
              success: false,
              additionalData: {
                error: error.message,
                email: email,
                timestamp: new Date().toISOString(),
              },
            })
          } catch (logError) {
            console.error("[v0] Failed to log security event:", logError)
          }

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

          try {
            await logSecurityEvent({
              eventType: "login_attempt",
              success: true,
              additionalData: {
                loginMethod: "email_password",
                email: email,
                timestamp: new Date().toISOString(),
              },
            })
          } catch (logError) {
            console.error("[v0] Failed to log security event:", logError)
          }

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
    [supabase, loadUserProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, name: string, username?: string) => {
      if (!supabase) throw new Error("Supabase client not available")

      console.log("[v0] Starting signup process for:", email)

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name, username: username },
            emailRedirectTo: undefined, // Remove email redirect
          },
        })

        console.log("[v0] Signup response:", JSON.stringify({ data, error }))

        if (error) {
          console.error("[v0] Signup error:", error.message)

          if (error.status === 429 && error.code === "over_email_send_rate_limit") {
            throw new Error(
              "Diese E-Mail-Adresse hat das Limit für Registrierungsversuche erreicht. Bitte versuchen Sie es mit einer anderen E-Mail-Adresse oder warten Sie einige Minuten.",
            )
          }

          if (error.status === 500 && error.code === "unexpected_failure") {
            console.log("[v0] Retrying signup without email confirmation...")
            const { data: retryData, error: retryError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name: name, username: username },
              },
            })

            if (retryError) {
              console.error("[v0] Retry signup also failed:", retryError.message)
              throw new Error("Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.")
            }

            console.log("[v0] Retry signup successful:", retryData.user?.id)

            if (retryData.user) {
              console.log("[v0] User created successfully, attempting auto sign-in...")
              try {
                await signIn(email, password)
                console.log("[v0] Auto sign-in successful after registration")
                return
              } catch (signInError) {
                console.log("[v0] Auto sign-in failed, but registration was successful:", signInError)
                throw new Error("Registrierung erfolgreich! Bitte versuchen Sie sich jetzt anzumelden.")
              }
            }
            return
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

          throw new Error("Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.")
        }

        console.log("[v0] Signup successful, user created:", data.user?.id)

        if (data.user) {
          console.log("[v0] User created successfully, attempting auto sign-in...")
          try {
            await signIn(email, password)
            console.log("[v0] Auto sign-in successful after registration")
          } catch (signInError) {
            console.log("[v0] Auto sign-in failed, but registration was successful:", signInError)
            throw new Error("Registrierung erfolgreich! Bitte versuchen Sie sich jetzt anzumelden.")
          }
        }
      } catch (error: any) {
        console.error("[v0] Signup process failed:", error.message)
        throw error
      }
    },
    [supabase, signIn],
  )

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error("Supabase client not available")

    if (user) {
      try {
        await logSecurityEvent({
          eventType: "login_attempt",
          success: true,
          additionalData: {
            action: "logout",
            timestamp: new Date().toISOString(),
          },
        })
      } catch (logError) {
        console.error("[v0] Failed to log logout event:", logError)
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [supabase, user])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) throw new Error("Supabase client not available")

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    },
    [supabase],
  )

  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      if (!supabase) throw new Error("Supabase client not available")
      if (!user) throw new Error("No user logged in")

      try {
        console.log("[v0] Updating profile with data:", data)

        await withRateLimit(async () => {
          const updateData = {
            name: data.name !== undefined ? data.name : user.name,
            username: data.username !== undefined ? data.username : user.username,
            anzeigename: data.anzeigename !== undefined ? data.anzeigename : user.anzeigename,
            email: data.email !== undefined ? data.email : user.email,
            birth_date: data.birthDate !== undefined ? data.birthDate || null : user.birthDate || null,
            phone: data.phone !== undefined ? data.phone : user.phone,
            address: data.address !== undefined ? data.address : user.address,
            location: data.location !== undefined ? data.location : user.location,
            favorite_games: data.favoriteGames !== undefined ? data.favoriteGames : user.favoriteGames,
            preferred_game_types:
              data.preferredGameTypes !== undefined ? data.preferredGameTypes : user.preferredGameTypes,
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
          try {
            await logSecurityEvent({
              eventType: "security_settings_change",
              additionalData: {
                changedSettings: data.settings.security,
                timestamp: new Date().toISOString(),
              },
            })
          } catch (logError) {
            console.error("[v0] Failed to log security settings change:", logError)
          }
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
    [user, supabase],
  )

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
      console.log("[v0] Supabase client created successfully")
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      setLoading(false)
      setNetworkError(true)
    }
  }, [])

  useEffect(() => {
    if (initialized || !supabase) return

    console.log("[v0] Initializing authentication...")
    setInitialized(true)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event, session?.user?.id)
      console.log(
        "[v0] Auth state change details - Event:",
        event,
        "Session exists:",
        !!session,
        "User exists:",
        !!session?.user,
      )
      console.log("[v0] Current pending promises count:", pendingAuthPromisesRef.current.size)

      try {
        if (event === "SIGNED_OUT" || !session?.user) {
          console.log("[v0] User signed out or no session")
          setUser(null)
          setLoading(false)
          setNetworkError(false)
          return
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("[v0] User signed in, resolving pending promises...")
          console.log("[v0] About to resolve", pendingAuthPromisesRef.current.size, "pending promises")

          pendingAuthPromisesRef.current.forEach(({ resolve }, key) => {
            console.log("[v0] Resolving promise for key:", key)
            resolve()
          })

          pendingAuthPromisesRef.current.clear()
          console.log("[v0] All promises resolved and cleared")

          console.log("[v0] Loading profile...")
          setLoading(true)
          await loadUserProfile(session.user)
          console.log("[v0] Auth state update completed, user ready")
          return
        }

        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          console.log("[v0] Token refreshed or user updated")
          return
        }
      } catch (error) {
        console.error("[v0] Auth state change error:", error)
        if (isNetworkError(error)) {
          setNetworkError(true)
        }
      }
    })

    const initializeAuth = async () => {
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error) {
            if (isNetworkError(error) && attempts < maxAttempts - 1) {
              attempts++
              console.log(`[v0] Auth initialization failed, retrying... (${attempts}/${maxAttempts})`)
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
            console.log("[v0] Valid session found, loading user profile")
            await loadUserProfile(session.user)
          } else {
            console.log("[v0] No session found")
            setUser(null)
            setLoading(false)
          }
          return
        } catch (error) {
          attempts++
          console.error(`[v0] Auth initialization error (attempt ${attempts}):`, error)

          if (isNetworkError(error) && attempts < maxAttempts) {
            setNetworkError(true)
            await delay(1000 * attempts)
            continue
          }

          setUser(null)
          setLoading(false)
          setNetworkError(true)
          return
        }
      }
    }

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [initialized, loadUserProfile, supabase])

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
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
