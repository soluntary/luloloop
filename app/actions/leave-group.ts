"use server"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const createSupabaseServerClient = () => {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Create admin client with service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function leaveGroupAction(groupId: string) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[v0] Server action - checking user:", { user: !!user, userError })

    if (userError || !user) {
      console.log("[v0] Server action - user not authenticated:", userError)
      return { error: "User not authenticated" }
    }

    console.log("[v0] Server action - leaving group:", groupId, "for user:", user.id)

    // Use admin client to bypass RLS and delete the membership
    const { error: deleteError } = await supabaseAdmin
      .from("community_members")
      .delete()
      .eq("community_id", groupId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Server action delete error:", deleteError)
      return { error: deleteError.message }
    }

    console.log("[v0] Server action - successfully left group")
    return { success: true }
  } catch (error) {
    console.error("[v0] Server action error:", error)
    return { error: "Failed to leave group" }
  }
}
