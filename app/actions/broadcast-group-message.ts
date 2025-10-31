"use server"

import { createClient } from "@/lib/supabase/server"

export async function broadcastGroupMessageAction(groupId: string, message: string) {
  console.log("[v0] broadcastGroupMessageAction called with:", { groupId, messageLength: message.length })

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("[v0] User authentication error:", userError)
    return { error: "Nicht authentifiziert" }
  }

  console.log("[v0] Current user:", user.id)

  try {
    // Get group details and check if user is creator or admin
    const { data: group, error: groupError } = await supabase
      .from("communities")
      .select("id, name, creator_id")
      .eq("id", groupId)
      .single()

    if (groupError) {
      console.error("[v0] Error fetching group:", groupError)
      return { error: "Fehler beim Laden der Spielgruppe" }
    }

    console.log("[v0] Group found:", group.name, "Creator:", group.creator_id)

    // Check if user is creator
    const isCreator = group.creator_id === user.id
    console.log("[v0] Is user creator?", isCreator)

    // Check if user is admin
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (membershipError) {
      console.error("[v0] Error checking membership:", membershipError)
    }

    const isAdmin = membership?.role === "admin"
    console.log("[v0] Is user admin?", isAdmin, "Role:", membership?.role)

    // User must be creator or admin
    if (!isCreator && !isAdmin) {
      console.error("[v0] User is neither creator nor admin - permission denied")
      return { error: "Nur der Ersteller oder Organisatoren können Nachrichten an alle Mitglieder senden" }
    }

    console.log("[v0] User has permission - proceeding with broadcast")

    // Get all group members except the sender
    const { data: members, error: membersError } = await supabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", groupId)
      .neq("user_id", user.id)

    if (membersError) {
      console.error("[v0] Error fetching members:", membersError)
      return { error: "Fehler beim Laden der Mitglieder" }
    }

    console.log("[v0] Found", members?.length || 0, "members to send message to")

    if (!members || members.length === 0) {
      console.log("[v0] No members to send message to")
      return { error: "Keine Mitglieder zum Senden gefunden" }
    }

    // Get sender info
    const { data: senderData } = await supabase.from("users").select("username, name").eq("id", user.id).single()

    const senderName = senderData?.name || senderData?.username || "Ein Organisator"

    console.log("[v0] Sender name:", senderName)

    // Send messages to all members
    let successCount = 0
    let errorCount = 0

    for (const member of members) {
      try {
        console.log("[v0] Sending message to member:", member.user_id)

        const { error: messageError } = await supabase.from("messages").insert({
          from_user_id: user.id,
          to_user_id: member.user_id,
          message: message,
          game_title: group.name,
          offer_type: "general",
          read: false,
          created_at: new Date().toISOString(),
        })

        if (messageError) {
          console.error("[v0] Error sending message to", member.user_id, ":", messageError)
          errorCount++
        } else {
          console.log("[v0] Successfully sent message to", member.user_id)
          successCount++
        }
      } catch (error) {
        console.error("[v0] Error processing member", member.user_id, ":", error)
        errorCount++
      }
    }

    console.log("[v0] Broadcast complete - Success:", successCount, "Errors:", errorCount)

    if (successCount === 0) {
      return { error: "Fehler beim Senden der Nachrichten" }
    }

    return {
      success: true,
      message: `Nachricht erfolgreich an ${successCount} Mitglied${successCount !== 1 ? "er" : ""} gesendet${errorCount > 0 ? ` (${errorCount} Fehler)` : ""}`,
    }
  } catch (error) {
    console.error("[v0] Unexpected error in broadcastGroupMessageAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}
