"use server"

import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function fetchGroupMembersAction(groupId: string) {
  try {
    // First, authenticate the user using the regular client
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "User not authenticated" }
    }

    // Use service role client to bypass RLS policies
    const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch group members with user details
    const { data: members, error: membersError } = await adminSupabase
      .from("community_members")
      .select(`
        *,
        users:user_id(id, username, avatar)
      `)
      .eq("community_id", groupId)
      .order("joined_at", { ascending: true })

    if (membersError) {
      console.error("Error fetching group members:", membersError)
      return { error: "Failed to fetch group members" }
    }

    return { data: members || [] }
  } catch (error) {
    console.error("Server action error:", error)
    return { error: "Internal server error" }
  }
}
