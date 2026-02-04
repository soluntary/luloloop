import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is missing. Please check environment variables.")
  }

  const cookieStore = await cookies()

  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is missing. Please check environment variables.")
  }

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
      supabaseUrl,
      supabaseAnonKey,
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
    supabaseUrl,
    supabaseAnonKey,
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
