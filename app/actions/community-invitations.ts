"use server"

import { createClient } from "@/lib/supabase/server"

export async function sendCommunityInvitations(communityId: string, inviteeIds: string[], message?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht authentifiziert" }
  }

  try {
    // Check if user is the creator or admin of the community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id")
      .eq("id", communityId)
      .single()

    if (communityError) throw communityError

    if (community.creator_id !== user.id) {
      return { error: "Nur der Ersteller kann Einladungen versenden" }
    }

    // Create invitations
    const invitations = inviteeIds.map((inviteeId) => ({
      community_id: communityId,
      inviter_id: user.id,
      invitee_id: inviteeId,
      message: message || null,
      status: "pending",
    }))

    const { error: insertError } = await supabase.from("community_invitations").insert(invitations)

    if (insertError) {
      console.error("Error creating invitations:", insertError)
      return { error: "Fehler beim Erstellen der Einladungen" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending community invitations:", error)
    return { error: "Fehler beim Versenden der Einladungen" }
  }
}

export async function respondToCommunityInvitation(invitationId: string, action: "accept" | "reject") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht authentifiziert" }
  }

  try {
    // Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from("community_invitations")
      .select("*, communities(name)")
      .eq("id", invitationId)
      .eq("invitee_id", user.id)
      .single()

    if (fetchError) throw fetchError

    if (!invitation) {
      return { error: "Einladung nicht gefunden" }
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from("community_invitations")
      .update({
        status: action === "accept" ? "accepted" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invitationId)

    if (updateError) throw updateError

    // If accepted, add user to community members
    if (action === "accept") {
      const { error: memberError } = await supabase.from("community_members").insert({
        community_id: invitation.community_id,
        user_id: user.id,
        role: "member",
      })

      if (memberError) {
        // If already a member, that's okay
        if (memberError.code !== "23505") {
          throw memberError
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return { error: "Fehler beim Bearbeiten der Einladung" }
  }
}

export async function getUserCommunityInvitations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht authentifiziert", data: [] }
  }

  try {
    const { data, error } = await supabase
      .from("community_invitations")
      .select(
        `
        *,
        communities(name, image),
        inviter:users!community_invitations_inviter_id_fkey(username, avatar)
      `,
      )
      .eq("invitee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error loading community invitations:", error)
    return { error: "Fehler beim Laden der Einladungen", data: [] }
  }
}
