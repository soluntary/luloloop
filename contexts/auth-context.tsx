"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { createUserProfile } from "@/app/actions/create-user-profile"
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
  patchUser: (data: Partial<AuthUser>) => void
  networkError: boolean
  retryCount: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Single Supabase client instance - created once at module level
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const mountedRef = useRef(true)

  // ---- helpers ----
  const fetchProfile = useCallback(async (authUser: User): Promise<AuthUser> => {
    const supabase = getSupabase()

    // 1) Try reading from DB (public SELECT, no RLS issue)
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (data) return data as AuthUser
    } catch {
      // query failed - continue
    }

    // 2) No row yet -> create via server action (admin client, bypasses RLS)
    try {
      const result = await createUserProfile({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
        username: authUser.user_metadata?.username || null,
        avatar: authUser.user_metadata?.avatar_url || null,
      })
      if (result.success && result.profile) return result.profile as AuthUser
    } catch {
      // server action failed - continue
    }

    // 3) Last resort fallback from auth metadata
    return {
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      username: authUser.user_metadata?.username || null,
    }
  }, [])

  // ---- auth methods ----

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message?.includes("Invalid login")) {
        throw new Error("E-Mail oder Passwort falsch.")
      }
      throw new Error(error.message)
    }

    // Directly load profile and set user - don't rely on onAuthStateChange
    if (data.session?.user) {
      const profile = await fetchProfile(data.session.user)
      if (mountedRef.current) {
        setUser(profile)
        setLoading(false)
      }
    }
  }, [fetchProfile])

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    username?: string,
  ): Promise<SignUpResult> => {
    const supabase = getSupabase()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } },
    })

    if (error) {
      const msg = (error.message || "").toLowerCase()
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        throw new Error("Zu viele Versuche. Bitte warte einige Minuten.")
      }
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits.")
      }
      if (msg.includes("invalid email")) {
        throw new Error("Ungueltige E-Mail-Adresse.")
      }
      if (msg.includes("password")) {
        throw new Error("Das Passwort muss mindestens 6 Zeichen lang sein.")
      }
      throw new Error(error.message)
    }

    if (data?.user?.identities?.length === 0) {
      throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits. Bitte melde dich an.")
    }

    if (!data.user) {
      throw new Error("Registrierung fehlgeschlagen.")
    }

    // If we got a session, user is auto-confirmed -> sign in directly
    if (data.session) {
      const profile = await fetchProfile(data.session.user)
      if (mountedRef.current) {
        setUser(profile)
        setLoading(false)
      }
      return { success: true }
    }

    // No session -> try signing in (works if auto-confirm is on but session wasn't returned)
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError && signInData.session) {
        const profile = await fetchProfile(signInData.session.user)
        if (mountedRef.current) {
          setUser(profile)
          setLoading(false)
        }
        return { success: true }
      }
    } catch {
      // sign in failed - email confirmation needed
    }

    return {
      success: true,
      needsEmailConfirmation: true,
      message: "Registrierung erfolgreich! Bitte bestaetige deine E-Mail-Adresse.",
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    setUser(null)
    setLoading(false)
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }, [])

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    const supabase = getSupabase()
    if (!user) throw new Error("Nicht eingeloggt")

    const { error } = await supabase.from("users").update(data).eq("id", user.id)
    if (error) throw error

    setUser((prev) => (prev ? { ...prev, ...data } : prev))
    return true
  }, [user])

  const patchUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }, [])

  // ---- initialization ----
  useEffect(() => {
    mountedRef.current = true
    const supabase = getSupabase()

    // Safety: never stay in loading state forever
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, 6000)

    // Listen for auth changes (handles page refresh, token refresh, sign out from other tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
        return
      }

      if (event === "INITIAL_SESSION") {
        if (!session?.user) {
          setUser(null)
          setLoading(false)
          clearTimeout(safetyTimeout)
          return
        }

        // Load profile for existing session (page refresh)
        try {
          const profile = await fetchProfile(session.user)
          if (mountedRef.current) {
            setUser(profile)
            setLoading(false)
          }
        } catch {
          if (mountedRef.current) setLoading(false)
        }
        clearTimeout(safetyTimeout)
        return
      }

      // For SIGNED_IN: signIn/signUp already set the user directly,
      // so we only need to handle the case where user is null (e.g. sign in from another tab)
      if (event === "SIGNED_IN" && session?.user && !user) {
        try {
          const profile = await fetchProfile(session.user)
          if (mountedRef.current) {
            setUser(profile)
            setLoading(false)
          }
        } catch {
          if (mountedRef.current) setLoading(false)
        }
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      patchUser,
      networkError,
      retryCount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
