import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

export const isSupabaseConfigured = true

// Create a cached version of the Supabase client for Server Components
export const createClient = cache(() => {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    "https://kezntrzgpfmnmibnsrbt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
})

export function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  return createSupabaseServerClient(
    "https://kezntrzgpfmnmibnsrbt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore cookie setting errors in Server Actions
          }
        },
      },
    },
  )
}
