"use server"

import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function handleJoinRequestAction(requestId: string, action: "approve" | "reject") {
  try {
    // Create regular client for authentication
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

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "User not authenticated" }
    }

    // Create admin client with service role key to bypass RLS
    const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    if (action === "approve") {
      // First get the join request details
      const { data: request, error: requestError } = await adminSupabase
        .from("community_join_requests")
        .select("community_id, user_id")
        .eq("id", requestId)
        .single()

      if (requestError) {
        console.error("Error fetching join request:", requestError)
        return { error: "Failed to fetch join request" }
      }

      // Add user to community_members using admin client
      const { error: memberError } = await adminSupabase.from("community_members").insert({
        community_id: request.community_id,
        user_id: request.user_id,
        role: "member",
      })

      if (memberError) {
        console.error("Error adding member:", memberError)
        return { error: "Failed to add member to group" }
      }

      // Update the join request status
      const { error: updateError } = await adminSupabase
        .from("community_join_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) {
        console.error("Error updating join request:", updateError)
        return { error: "Failed to update join request status" }
      }

      return { success: true, message: "Join request approved successfully" }
    } else {
      // Reject the request
      const { error: updateError } = await adminSupabase
        .from("community_join_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (updateError) {
        console.error("Error updating join request:", updateError)
        return { error: "Failed to update join request status" }
      }

      return { success: true, message: "Join request rejected successfully" }
    }
  } catch (error) {
    console.error("Error handling join request:", error)
    return { error: "An unexpected error occurred" }
  }
}
