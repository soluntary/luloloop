import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

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
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

export async function createServerClient(cookieStore?: any) {
  // If no cookieStore provided, use the default cookies() function
  let resolvedCookieStore

  if (cookieStore) {
    // Await the cookieStore if it's a promise (newer Next.js versions)
    resolvedCookieStore = await cookieStore
  } else {
    // Fallback to default cookies function
    resolvedCookieStore = await cookies()
  }

  // Additional safety check to ensure cookieStore has required methods
  if (!resolvedCookieStore || typeof resolvedCookieStore.getAll !== "function") {
    console.error("[v0] Invalid cookieStore provided to createServerClient")
    // Return a client with no-op cookie handlers to prevent crashes
    return createSupabaseServerClient(
      "https://kezntrzgpfmnmibnsrbt.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw",
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op
          },
        },
      },
    )
  }

  return createSupabaseServerClient(
    "https://kezntrzgpfmnmibnsrbt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw",
    {
      cookies: {
        getAll() {
          return resolvedCookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => resolvedCookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
