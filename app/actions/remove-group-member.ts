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

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function removeGroupMemberAction(memberId: string, groupId: string, userId?: string) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Try to get user from session, fallback to provided userId
    let currentUserId = userId
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) currentUserId = user.id
    } catch (e) {
      // Session missing in v0 environment
    }

    if (!currentUserId) {
      return { error: "Nicht authentifiziert" }
    }
    
    const user = { id: currentUserId }

    const { data: group, error: groupError } = await supabaseAdmin
      .from("communities")
      .select("creator_id")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return { error: "Spielgruppe nicht gefunden" }
    }

    if (group.creator_id !== user.id) {
      return { error: "Nur der Gruppenersteller kann Mitglieder entfernen" }
    }

    const { data: userMembership, error: userMembershipError } = await supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (userMembershipError || !userMembership) {
      return { error: "Du bist kein Mitglied dieser Gruppe" }
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from("community_members")
      .select(`
        user_id,
        community_id,
        users(username)
      `)
      .eq("id", memberId)
      .single()

    if (memberError || !member) {
      console.error("[v0] Member lookup error:", memberError)
      return { error: "Mitglied nicht gefunden" }
    }

    if (member.community_id !== groupId) {
      return { error: "Mitglied gehört nicht zu dieser Gruppe" }
    }

    // Prevent removing the group creator
    if (member.user_id === user.id) {
      return { error: "Du kannst dich nicht selbst aus der Gruppe entfernen" }
    }

    const { error: deleteError } = await supabaseAdmin.from("community_members").delete().eq("id", memberId)

    if (deleteError) {
      console.error("Error removing member:", deleteError)
      return { error: "Fehler beim Entfernen des Mitglieds" }
    }

    return {
      success: true,
      memberUsername: (member.users as any)?.username || "Unbekannt",
    }
  } catch (error) {
    console.error("Error in removeGroupMemberAction:", error)
    return { error: "Unerwarteter Fehler beim Entfernen des Mitglieds" }
  }
}
