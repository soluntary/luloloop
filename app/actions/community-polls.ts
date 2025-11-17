"use server"

import { createClient } from "@/lib/supabase/server"

export interface PollOption {
  id: string
  option_text: string
  votes_count: number
}

export interface Poll {
  id: string
  community_id: string
  creator_id: string
  question: string
  description: string | null
  allow_multiple_votes: boolean
  expires_at: string | null
  created_at: string
  is_active: boolean
  options: PollOption[]
  user_voted: boolean
  user_votes: string[] // Array of option IDs the user voted for
  total_votes: number
}

export async function createPollAction(
  communityId: string,
  question: string,
  options: string[],
  description?: string,
  allowMultipleVotes?: boolean,
  expiresInDays?: number,
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Nicht authentifiziert" }
    }

    // Verify user is the community creator
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("creator_id, name")
      .eq("id", communityId)
      .single()

    if (communityError || !community) {
      return { error: "Spielgruppe nicht gefunden" }
    }

    if (community.creator_id !== user.id) {
      return { error: "Nur der Gruppenersteller kann Abstimmungen erstellen" }
    }

    // Validate options
    if (options.length < 2) {
      return { error: "Mindestens 2 Optionen erforderlich" }
    }

    if (options.length > 10) {
      return { error: "Maximal 10 Optionen erlaubt" }
    }

    // Calculate expiration date if provided
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expiresInDays)
      expiresAt = expireDate.toISOString()
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .insert({
        community_id: communityId,
        creator_id: user.id,
        question,
        description: description || null,
        allow_multiple_votes: allowMultipleVotes || false,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single()

    if (pollError) {
      console.error("Error creating poll:", pollError)
      return { error: "Fehler beim Erstellen der Abstimmung" }
    }

    // Create poll options
    const pollOptions = options.map((option) => ({
      poll_id: poll.id,
      option_text: option,
      votes_count: 0,
    }))

    const { error: optionsError } = await supabase.from("community_poll_options").insert(pollOptions)

    if (optionsError) {
      console.error("Error creating poll options:", optionsError)
      // Rollback: delete the poll
      await supabase.from("community_polls").delete().eq("id", poll.id)
      return { error: "Fehler beim Erstellen der Abstimmungsoptionen" }
    }

    try {
      // Get all group members except the creator
      const { data: members, error: membersError } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .neq("user_id", user.id)

      if (!membersError && members && members.length > 0) {
        // Create notifications for all members
        const notifications = members.map((member) => ({
          user_id: member.user_id,
          type: "poll_created",
          title: "Neue Abstimmung",
          message: `Eine neue Abstimmung wurde in ${community.name} erstellt: ${question}`,
          data: {
            poll_id: poll.id,
            community_id: communityId,
            community_name: community.name,
          },
          read: false,
        }))

        const { error: notificationError } = await supabase.from("notifications").insert(notifications)

        if (notificationError) {
          console.error("Error creating notifications:", notificationError)
          // Don't fail the poll creation if notifications fail
        }
      }
    } catch (notificationError) {
      console.error("Error sending poll notifications:", notificationError)
      // Don't fail the poll creation if notifications fail
    }

    return { success: true, pollId: poll.id }
  } catch (error) {
    console.error("Error in createPollAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function getCommunityPollsAction(communityId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Nicht authentifiziert" }
    }

    // Verify user is a member of the community
    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return { error: "Du bist kein Mitglied dieser Spielgruppe" }
    }

    // Fetch polls with options
    const { data: polls, error: pollsError } = await supabase
      .from("community_polls")
      .select(
        `
        *,
        community_poll_options(*)
      `,
      )
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })

    if (pollsError) {
      console.error("Error fetching polls:", pollsError)
      return { error: "Fehler beim Laden der Abstimmungen" }
    }

    console.log("[v0] Fetched polls:", polls?.length || 0)

    // Fetch user's votes for all polls
    const pollIds = polls.map((poll) => poll.id)
    const { data: userVotes } = await supabase
      .from("community_poll_votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds)
      .eq("user_id", user.id)

    // Transform data to include user vote information
    const pollsWithVotes: Poll[] = polls.map((poll) => {
      const options = poll.community_poll_options || []
      const totalVotes = options.reduce((sum, opt) => sum + (opt.votes_count || 0), 0)
      const userPollVotes = userVotes?.filter((v) => v.poll_id === poll.id) || []
      const userVoteIds = userPollVotes.map((v) => v.option_id)

      return {
        id: poll.id,
        community_id: poll.community_id,
        creator_id: poll.creator_id,
        question: poll.question,
        description: poll.description,
        allow_multiple_votes: poll.allow_multiple_votes,
        expires_at: poll.expires_at,
        created_at: poll.created_at,
        is_active: poll.is_active,
        options: options.map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          votes_count: opt.votes_count || 0,
        })),
        user_voted: userVoteIds.length > 0,
        user_votes: userVoteIds,
        total_votes: totalVotes,
      }
    })

    return { data: pollsWithVotes }
  } catch (error) {
    console.error("Error in getCommunityPollsAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function voteOnPollAction(pollId: string, optionIds: string[]) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Nicht authentifiziert" }
    }

    // Fetch poll details
    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .select("*, community_poll_options(*)")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      return { error: "Abstimmung nicht gefunden" }
    }

    // Check if poll is active
    if (!poll.is_active) {
      return { error: "Diese Abstimmung ist nicht mehr aktiv" }
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { error: "Diese Abstimmung ist abgelaufen" }
    }

    // Verify user is a member of the community
    const { data: membership } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", poll.community_id)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return { error: "Du bist kein Mitglied dieser Spielgruppe" }
    }

    // Validate option IDs
    const validOptionIds = poll.community_poll_options.map((opt: any) => opt.id)
    const invalidOptions = optionIds.filter((id) => !validOptionIds.includes(id))

    if (invalidOptions.length > 0) {
      return { error: "Ungültige Abstimmungsoption" }
    }

    // Check if multiple votes are allowed
    if (!poll.allow_multiple_votes && optionIds.length > 1) {
      return { error: "Nur eine Option kann ausgewählt werden" }
    }

    // Check if user has already voted
    const { data: existingVotes } = await supabase
      .from("community_poll_votes")
      .select("id, option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)

    // If user has already voted, remove old votes first
    if (existingVotes && existingVotes.length > 0) {
      const { error: deleteError } = await supabase
        .from("community_poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting old votes:", deleteError)
        return { error: "Fehler beim Aktualisieren der Stimme" }
      }
    }

    // Insert new votes
    const votes = optionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    }))

    const { error: voteError } = await supabase.from("community_poll_votes").insert(votes)

    if (voteError) {
      console.error("Error voting on poll:", voteError)
      return { error: "Fehler beim Abstimmen" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in voteOnPollAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function deletePollAction(pollId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Nicht authentifiziert" }
    }

    // Verify user is the poll creator
    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .select("creator_id")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      return { error: "Abstimmung nicht gefunden" }
    }

    if (poll.creator_id !== user.id) {
      return { error: "Nur der Ersteller kann diese Abstimmung löschen" }
    }

    // Delete poll (cascade will delete options and votes)
    const { error: deleteError } = await supabase.from("community_polls").delete().eq("id", pollId)

    if (deleteError) {
      console.error("Error deleting poll:", deleteError)
      return { error: "Fehler beim Löschen der Abstimmung" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deletePollAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function closePollAction(pollId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Nicht authentifiziert" }
    }

    console.log("[v0] Closing poll:", pollId)

    // Verify user is the poll creator
    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .select("creator_id")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      console.log("[v0] Poll not found:", pollId)
      return { error: "Abstimmung nicht gefunden" }
    }

    if (poll.creator_id !== user.id) {
      console.log("[v0] User is not poll creator")
      return { error: "Nur der Ersteller kann diese Abstimmung schließen" }
    }

    // Close poll by setting is_active to false
    const { error: updateError } = await supabase.from("community_polls").update({ is_active: false }).eq("id", pollId)

    if (updateError) {
      console.error("[v0] Error closing poll:", updateError)
      return { error: "Fehler beim Schließen der Abstimmung" }
    }

    console.log("[v0] Poll closed successfully:", pollId)

    return { success: true }
  } catch (error) {
    console.error("Error in closePollAction:", error)
    return { error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}
