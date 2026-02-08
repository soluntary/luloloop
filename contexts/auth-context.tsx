"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { checkGlobalRateLimit, withRateLimit } from "@/lib/supabase/rate-limit"
import type { User } from "@supabase/supabase-js"

export interface AuthUser {
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

interface SignUpResult {
  success: boolean
  needsEmailConfirmation?: boolean
  message?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string, username?: string) => Promise<SignUpResult>
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
      setLoading(false)
      return
    }

    wasAuthenticatedRef.current = true
    lastUserIdRef.current = authUser.id

    if (checkGlobalRateLimit()) {
      const fallbackProfile = {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        username: authUser.user_metadata?.username || null,
      }
      setUser(fallbackProfile)
      setLoading(false)
      return
    }

    let attempts = 0
    const maxAttempts = 2

    while (attempts < maxAttempts) {
      try {
        const existingUser = await withRateLimit(async () => {
          const { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle()
          if (error && error.code !== "PGRST116") throw error
          return data
        }, null)

        let userProfile

        if (!existingUser) {
          const newUserProfile = {
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            username: authUser.user_metadata?.username || null,
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
          
          const metadataName = authUser.user_metadata?.name
          const metadataUsername = authUser.user_metadata?.username
          const needsUpdate = (!existingUser.name && metadataName) || (!existingUser.username && metadataUsername)
          
          if (needsUpdate) {
            const updateData: any = {}
            if (!existingUser.name && metadataName) updateData.name = metadataName
            if (!existingUser.username && metadataUsername) updateData.username = metadataUsername
            
            try {
              const { data: updatedUser, error: updateError } = await supabase
                .from("users")
                .update(updateData)
                .eq("id", authUser.id)
                .select()
                .single()
              if (!updateError && updatedUser) userProfile = updatedUser
            } catch {
              // Non-critical, continue with existing profile
            }
          }
        }

        setUser(userProfile)
        setLoading(false)
        setNetworkError(false)
        setRetryCount(0)
        return
      } catch (error) {
        attempts++

        if (isNetworkError(error) && attempts < maxAttempts) {
          setNetworkError(true)
          await delay(Math.pow(2, attempts) * 1000)
          continue
        }

        const fallbackProfile = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
          username: authUser.user_metadata?.username || null,
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

      if (!navigator.onLine) {
        throw new Error("No internet connection. Please check your network and try again.")
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (isNetworkError(error)) {
            throw new Error("Network connection failed. Please check your internet connection and try again.")
          }
          throw error
        }

        if (data.session?.user) {
          setLoading(true)
          await loadUserProfile(data.session.user)
        } else {
          throw new Error("No session or user data received after sign-in")
        }
      } catch (error) {
        if (isNetworkError(error)) {
          throw new Error("Connection failed. Please check your internet connection and try again.")
        }
        throw error
      }
    },
    [loadUserProfile],
  )

  const signUp = useCallback(
    async (email: string, password: string, name: string, username?: string): Promise<SignUpResult> => {
      const supabase = supabaseRef.current
      if (!supabase) throw new Error("Supabase client not available")

      let response
      try {
        response = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, username },
          },
        })
      } catch (networkErr: any) {
        throw new Error("Netzwerkfehler bei der Registrierung. Bitte überprüfen Sie Ihre Internetverbindung.")
      }

      const { data, error } = response

      if (data?.user && data?.user?.identities?.length === 0) {
        throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an.")
      }

      if (error) {
        const errMsg = (error.message || "").toLowerCase()

        if (errMsg.includes("sending") || errMsg.includes("smtp") || errMsg.includes("confirmation email")) {
          throw new Error("E-Mail-Bestätigung konnte nicht gesendet werden. Bitte kontaktieren Sie den Support.")
        }
        if (error.status === 429 || error.code === "over_email_send_rate_limit") {
          throw new Error("Zu viele Versuche. Bitte warten Sie einige Minuten.")
        }
        if (errMsg.includes("already registered") || errMsg.includes("already been registered")) {
          throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.")
        }
        if (errMsg.includes("invalid email")) {
          throw new Error("Ungültige E-Mail-Adresse.")
        }
        if (errMsg.includes("password")) {
          throw new Error("Das Passwort muss mindestens 6 Zeichen lang sein.")
        }
        throw new Error(error.message || "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.")
      }

      if (!data.user) {
        throw new Error("Registrierung fehlgeschlagen: Kein Benutzer erstellt")
      }

      if (data.user && !data.session) {
        try {
          await signIn(email, password)
          return { success: true }
        } catch {
          return { 
            success: true, 
            needsEmailConfirmation: true,
            message: "Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse."
          }
        }
      }

      if (data.user && data.session) {
        setLoading(true)
        await loadUserProfile(data.user)
        return { success: true }
      }

      return { success: true }
    },
    [signIn, loadUserProfile],
  )

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error("Supabase client not available")

    wasAuthenticatedRef.current = false
    lastUserIdRef.current = null

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

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
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Unbekannter Fehler" }
    }
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      const supabase = supabaseRef.current
      if (!supabase) throw new Error("Supabase client not available")
      if (!user) throw new Error("No user logged in")

      try {
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

          const { error: dbError } = await supabase.from("users").update(updateData).eq("id", user.id)
          if (dbError) throw dbError
        })

        const updatedUser = { ...user, ...data }
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

    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 1500)

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
      supabaseRef.current = supabase
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      setLoading(false)
      setNetworkError(true)
      clearTimeout(safetyTimeout)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_OUT") {
          wasAuthenticatedRef.current = false
          lastUserIdRef.current = null
          setUser(null)
          setLoading(false)
          setNetworkError(false)
          return
        }

        if (!session?.user) {
          if (wasAuthenticatedRef.current && lastUserIdRef.current) return
          setUser(null)
          setLoading(false)
          setNetworkError(false)
          return
        }

        if (event === "INITIAL_SESSION" && session?.user) {
          if (lastUserIdRef.current === session.user.id && user) {
            setLoading(false)
            return
          }
          setLoading(true)
          await loadUserProfile(session.user)
          return
        }

        if (event === "SIGNED_IN" && session?.user) {
          if (lastUserIdRef.current === session.user.id && user) {
            setLoading(false)
            return
          }

          pendingAuthPromisesRef.current.forEach(({ resolve }) => resolve())
          pendingAuthPromisesRef.current.clear()

          setLoading(true)
          await loadUserProfile(session.user)
          return
        }

        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return
      } catch (error) {
        console.error("Auth state change error:", error)
        setLoading(false)
        if (isNetworkError(error)) setNetworkError(true)
      }
    })

    let isMounted = true

    const initializeAuth = async () => {
      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts && isMounted) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (!isMounted) return

          if (error) {
            if (error.message?.includes("aborted") || error.message?.includes("signal")) return
            if (isNetworkError(error) && attempts < maxAttempts - 1) {
              attempts++
              await delay(1000 * attempts)
              continue
            }
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
          if (error?.message?.includes("aborted") || error?.message?.includes("signal")) return
          attempts++

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
      clearTimeout(safetyTimeout)
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
