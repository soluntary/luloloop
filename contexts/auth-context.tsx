"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
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

function authUserFromSession(authUser: User): AuthUser {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    username: authUser.user_metadata?.username || null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const mountedRef = useRef(true)

  // Load the full profile from DB. Returns fallback from auth metadata if DB fails.
  const loadProfile = useCallback(async (authUser: User): Promise<AuthUser> => {
    const supabase = createClient()
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()
      if (data) return data as AuthUser
    } catch {
      // DB query failed
    }
    // Fallback: auth metadata (the DB trigger will create the row eventually)
    return authUserFromSession(authUser)
  }, [])

  // ---- signIn: just auth, then set user from metadata immediately, load profile in background ----
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message?.includes("Invalid login")) {
        throw new Error("E-Mail oder Passwort falsch.")
      }
      throw new Error(error.message)
    }
    if (!data.session?.user) {
      throw new Error("Anmeldung fehlgeschlagen.")
    }

    // Set user IMMEDIATELY from auth metadata so redirect happens fast
    const quickUser = authUserFromSession(data.session.user)
    setUser(quickUser)
    setLoading(false)

    // Load full profile from DB in background (username, bio, etc.)
    loadProfile(data.session.user).then((fullProfile) => {
      if (mountedRef.current) setUser(fullProfile)
    })
  }, [loadProfile])

  // ---- signUp ----
  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    username?: string,
  ): Promise<SignUpResult> => {
    const supabase = createClient()
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
        throw new Error("Diese E-Mail ist bereits registriert.")
      }
      if (msg.includes("invalid email")) {
        throw new Error("Ungueltige E-Mail-Adresse.")
      }
      if (msg.includes("password")) {
        throw new Error("Passwort muss mindestens 6 Zeichen lang sein.")
      }
      throw new Error(error.message)
    }

    if (data?.user?.identities?.length === 0) {
      throw new Error("Diese E-Mail ist bereits registriert. Bitte melde dich an.")
    }

    if (!data.user) throw new Error("Registrierung fehlgeschlagen.")

    // Got a session = auto-confirmed
    if (data.session) {
      const quickUser = authUserFromSession(data.session.user)
      setUser(quickUser)
      setLoading(false)
      loadProfile(data.session.user).then((p) => {
        if (mountedRef.current) setUser(p)
      })
      return { success: true }
    }

    // No session - try signing in (auto-confirm might be on)
    try {
      const { data: sid, error: sie } = await supabase.auth.signInWithPassword({ email, password })
      if (!sie && sid.session) {
        const quickUser = authUserFromSession(sid.session.user)
        setUser(quickUser)
        setLoading(false)
        loadProfile(sid.session.user).then((p) => {
          if (mountedRef.current) setUser(p)
        })
        return { success: true }
      }
    } catch {}

    return {
      success: true,
      needsEmailConfirmation: true,
      message: "Registrierung erfolgreich! Bitte bestaetige deine E-Mail-Adresse.",
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    setUser(null)
    setLoading(false)
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }, [])

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    const supabase = createClient()
    if (!user) throw new Error("Nicht eingeloggt")
    const { error } = await supabase.from("users").update(data).eq("id", user.id)
    if (error) throw error
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
    return true
  }, [user])

  const patchUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
  }, [])

  // ---- init: listen for auth state changes ----
  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()

    // Safety timeout
    const safety = setTimeout(() => {
      if (mountedRef.current && loading) setLoading(false)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
        clearTimeout(safety)
        return
      }

      if (event === "INITIAL_SESSION") {
        if (!session?.user) {
          setLoading(false)
          clearTimeout(safety)
          return
        }
        // Page refresh: set user from metadata immediately, load profile in bg
        const quick = authUserFromSession(session.user)
        setUser(quick)
        setLoading(false)
        clearTimeout(safety)
        loadProfile(session.user).then((p) => {
          if (mountedRef.current) setUser(p)
        })
        return
      }

      // SIGNED_IN from another tab or after email confirm
      if (event === "SIGNED_IN" && session?.user && !user) {
        const quick = authUserFromSession(session.user)
        setUser(quick)
        setLoading(false)
        loadProfile(session.user).then((p) => {
          if (mountedRef.current) setUser(p)
        })
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safety)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{
      user, loading, signUp, signIn, signOut,
      requestPasswordReset, updatePassword, updateProfile, patchUser,
      networkError, retryCount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
