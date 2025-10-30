"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function broadcastGroupMessageAction(groupId: string, message: string) {
  try {
    console.log("[v0] broadcastGroupMessageAction called - groupId:", groupId, "message length:", message.length)

    // Authenticate user with regular client
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", !!user, "authError:", authError)

    if (authError || !user) {
      return { error: "Nicht authentifiziert" }
    }

    // Verify user is the group creator
    const { data: group, error: groupError } = await supabase
      .from("communities")
      .select("creator_id, name")
      .eq("id", groupId)
      .single()

    console.log("[v0] Group data:", group, "groupError:", groupError)

    if (groupError || !group) {
      return { error: "Spielgruppe nicht gefunden" }
    }

    if (group.creator_id !== user.id) {
      console.log("[v0] User is not the creator - creator_id:", group.creator_id, "user_id:", user.id)
      return { error: "Nur der Gruppenersteller kann Nachrichten an alle Mitglieder senden" }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not found in environment variables")
      return { error: "Server-Konfigurationsfehler: Service-Schlüssel fehlt" }
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Get all group members
    const { data: members, error: membersError } = await serviceSupabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", groupId)
      .neq("user_id", user.id) // Don't send message to the creator themselves

    console.log("[v0] Members found:", members?.length, "membersError:", membersError)

    if (membersError) {
      console.error("[v0] Error fetching group members:", membersError)
      return { error: "Fehler beim Laden der Gruppenmitglieder" }
    }

    if (!members || members.length === 0) {
      console.log("[v0] No members found in group")
      return { error: "Keine Mitglieder in der Gruppe gefunden" }
    }

    // Create message records for each member
    const messageRecords = members.map((member) => ({
      sender_id: user.id,
      recipient_id: member.user_id,
      content: message,
      context_type: "group_broadcast",
      context_id: groupId,
      context_title: group.name,
      created_at: new Date().toISOString(),
    }))

    console.log("[v0] Inserting", messageRecords.length, "message records")

    // Insert all messages
    const { error: insertError } = await serviceSupabase.from("messages").insert(messageRecords)

    if (insertError) {
      console.error("[v0] Error inserting broadcast messages:", insertError)
      return { error: "Fehler beim Senden der Nachrichten" }
    }

    console.log("[v0] Broadcast messages sent successfully to", members.length, "members")

    return {
      success: true,
      memberCount: members.length,
    }
  } catch (error) {
    console.error("[v0] Error in broadcastGroupMessageAction:", error)
    return { error: "Unerwarteter Fehler beim Senden der Nachricht" }
  }
}
