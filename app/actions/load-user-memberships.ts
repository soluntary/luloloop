"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function loadUserMembershipsAction() {
  try {
    // Create client for authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] No authenticated user for memberships")
      return { data: [], error: null }
    }

    // Create admin client to bypass RLS
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Ignore
            }
          },
        },
      },
    )

    console.log("[v0] Loading user memberships for user:", user.id)

    // Use admin client to query memberships
    const { data, error } = await adminSupabase.from("community_members").select("community_id").eq("user_id", user.id)

    console.log("[v0] User memberships query result:", { data, error })

    if (error) {
      console.error("[v0] Error loading user memberships:", error)
      return { data: [], error: error.message }
    }

    const membershipIds = data?.map((m) => m.community_id) || []
    console.log("[v0] User is member of communities:", membershipIds)

    return { data: membershipIds, error: null }
  } catch (error) {
    console.error("[v0] Error in loadUserMembershipsAction:", error)
    return { data: [], error: "Failed to load user memberships" }
  }
}
