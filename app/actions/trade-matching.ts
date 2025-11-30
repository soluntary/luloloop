"use server"

import { createClient } from "@/lib/supabase/server"
import { notifyTradeMatch, notifyTradeMatchAccepted } from "./notifications"

export interface TradeMatch {
  id: string
  user_a_id: string
  user_b_id: string
  offer_a_id: string
  offer_b_id: string
  search_ad_a_id?: string
  search_ad_b_id?: string
  match_score: number
  match_type: string
  status: string
  notified_at?: string
  created_at: string
  updated_at: string
  user_a?: {
    id: string
    name: string
    avatar: string
  }
  user_b?: {
    id: string
    name: string
    avatar: string
  }
  offer_a?: {
    id: string
    title: string
    image: string
    type: string
  }
  offer_b?: {
    id: string
    title: string
    image: string
    type: string
  }
}

/**
 * Scans for new trade matches and creates match records
 */
export async function scanForTradeMatches(): Promise<{
  success: boolean
  matchesFound: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Call the find_trade_matches function
    const { data: potentialMatches, error: matchError } = await supabase.rpc("find_trade_matches")

    if (matchError) {
      console.error("[v0] Error finding matches:", matchError)
      return { success: false, matchesFound: 0, error: matchError.message }
    }

    if (!potentialMatches || potentialMatches.length === 0) {
      return { success: true, matchesFound: 0 }
    }

    console.log("[v0] Found potential matches:", potentialMatches.length)

    // Insert new matches (ignore duplicates with ON CONFLICT)
    const matchesToInsert = potentialMatches.map((match: any) => ({
      user_a_id: match.user_a_id,
      user_b_id: match.user_b_id,
      offer_a_id: match.offer_a_id,
      offer_b_id: match.offer_b_id,
      search_ad_a_id: match.search_ad_a_id,
      search_ad_b_id: match.search_ad_b_id,
      match_score: match.match_score,
      match_type: "trade",
      status: "pending",
    }))

    const { data: insertedMatches, error: insertError } = await supabase
      .from("trade_matches")
      .upsert(matchesToInsert, { onConflict: "offer_a_id,offer_b_id", ignoreDuplicates: true })
      .select()

    if (insertError) {
      console.error("[v0] Error inserting matches:", insertError)
      return { success: false, matchesFound: 0, error: insertError.message }
    }

    if (insertedMatches && insertedMatches.length > 0) {
      for (const match of insertedMatches) {
        // Get offer details
        const { data: offerA } = await supabase
          .from("marketplace_offers")
          .select("title, user_id")
          .eq("id", match.offer_a_id)
          .single()

        const { data: offerB } = await supabase
          .from("marketplace_offers")
          .select("title, user_id")
          .eq("id", match.offer_b_id)
          .single()

        const { data: userA } = await supabase.from("users").select("name").eq("id", match.user_a_id).single()

        const { data: userB } = await supabase.from("users").select("name").eq("id", match.user_b_id).single()

        if (offerA && userB) {
          await notifyTradeMatch(match.user_a_id, match.id, offerA.title, userB.name || "Ein Benutzer")
        }

        if (offerB && userA) {
          await notifyTradeMatch(match.user_b_id, match.id, offerB.title, userA.name || "Ein Benutzer")
        }
      }
    }

    console.log("[v0] Inserted new matches:", insertedMatches?.length || 0)

    return { success: true, matchesFound: insertedMatches?.length || 0 }
  } catch (error: any) {
    console.error("[v0] Error in scanForTradeMatches:", error)
    return { success: false, matchesFound: 0, error: error.message }
  }
}

/**
 * Get all trade matches for the current user
 */
export async function getUserTradeMatches(): Promise<{
  success: boolean
  matches: TradeMatch[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, matches: [], error: "Not authenticated" }
    }

    const { data: matches, error } = await supabase
      .from("trade_matches")
      .select(
        `
        *,
        user_a:users!trade_matches_user_a_id_fkey(id, name, avatar),
        user_b:users!trade_matches_user_b_id_fkey(id, name, avatar),
        offer_a:marketplace_offers!trade_matches_offer_a_id_fkey(id, title, image, type),
        offer_b:marketplace_offers!trade_matches_offer_b_id_fkey(id, title, image, type)
      `,
      )
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching matches:", error)
      return { success: false, matches: [], error: error.message }
    }

    return { success: true, matches: matches || [] }
  } catch (error: any) {
    console.error("[v0] Error in getUserTradeMatches:", error)
    return { success: false, matches: [], error: error.message }
  }
}

/**
 * Update match status (accept/decline)
 */
export async function updateMatchStatus(
  matchId: string,
  status: "accepted" | "declined",
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get match details before updating
    const { data: match } = await supabase
      .from("trade_matches")
      .select("user_a_id, user_b_id, offer_a_id, offer_b_id")
      .eq("id", matchId)
      .single()

    const { error } = await supabase.from("trade_matches").update({ status, updated_at: new Date().toISOString() }).eq("id", matchId)

    if (error) {
      console.error("[v0] Error updating match status:", error)
      return { success: false, error: error.message }
    }

    if (status === "accepted" && match) {
      const otherUserId = user.id === match.user_a_id ? match.user_b_id : match.user_a_id
      const offerId = user.id === match.user_a_id ? match.offer_b_id : match.offer_a_id

      const { data: offer } = await supabase.from("marketplace_offers").select("title").eq("id", offerId).single()

      const { data: currentUser } = await supabase.from("users").select("name").eq("id", user.id).single()

      if (offer && currentUser) {
        await notifyTradeMatchAccepted(otherUserId, matchId, offer.title, currentUser.name || "Ein Benutzer")
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in updateMatchStatus:", error)
    return { success: false, error: error.message }
  }
}
