"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase"

export interface Community {
  id: string
  name: string
  description?: string
  type: "casual" | "competitive" | "family"
  location?: string
  max_members: number
  image?: string
  creator_id: string
  created_at: string
  updated_at: string
  member_count?: number
  creator?: {
    name: string
    email: string
  }
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: "admin" | "moderator" | "member"
  joined_at: string
}

export async function createCommunity(
  communityData: {
    name: string
    description?: string
    type: "casual" | "competitive" | "family"
    location?: string
    max_members: number
    image?: string
  },
  userId: string,
): Promise<{ success: boolean; error?: string; community?: Community }> {
  try {
    const supabase = createServerClient(cookies())

    // Verify user exists
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      return { success: false, error: "Benutzer nicht gefunden" }
    }

    // Create community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        ...communityData,
        creator_id: userId,
      })
      .select(`
        *,
        creator:users!creator_id(name, email)
      `)
      .single()

    if (communityError) {
      console.error("Community creation error:", communityError)
      return { success: false, error: "Fehler beim Erstellen der Community" }
    }

    // Add creator as admin member
    const { error: memberError } = await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: userId,
      role: "admin",
    })

    if (memberError) {
      console.error("Member creation error:", memberError)
      // Don't fail the whole operation, just log the error
    }

    return {
      success: true,
      community: {
        ...community,
        member_count: 1,
      },
    }
  } catch (error) {
    console.error("Error creating community:", error)
    return { success: false, error: "Unerwarteter Fehler beim Erstellen der Community" }
  }
}

export async function getCommunities(userId?: string): Promise<Community[]> {
  try {
    const supabase = createServerClient(cookies())

    const { data: communities, error } = await supabase
      .from("communities")
      .select(`
        *,
        creator:users!creator_id(name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching communities:", error)
      return []
    }

    // Get member counts for each community
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", community.id)

        return {
          ...community,
          member_count: count || 0,
        }
      }),
    )

    return communitiesWithCounts
  } catch (error) {
    console.error("Error fetching communities:", error)
    return []
  }
}

export async function joinCommunity(
  communityId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient(cookies())

    // Check if community exists and has space
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, max_members")
      .eq("id", communityId)
      .single()

    if (communityError || !community) {
      return { success: false, error: "Community nicht gefunden" }
    }

    // Check current member count
    const { count: currentMembers } = await supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId)

    if (currentMembers && currentMembers >= community.max_members) {
      return { success: false, error: "Community ist bereits voll" }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single()

    if (existingMember) {
      return { success: false, error: "Du bist bereits Mitglied dieser Community" }
    }

    // Add user as member
    const { error: joinError } = await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: userId,
      role: "member",
    })

    if (joinError) {
      console.error("Error joining community:", joinError)
      return { success: false, error: "Fehler beim Beitreten der Community" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error joining community:", error)
    return { success: false, error: "Unerwarteter Fehler beim Beitreten der Community" }
  }
}

export async function leaveCommunity(
  communityId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient(cookies())

    // Check if user is the creator
    const { data: community } = await supabase.from("communities").select("creator_id").eq("id", communityId).single()

    if (community?.creator_id === userId) {
      return { success: false, error: "Community-Ersteller können die Community nicht verlassen" }
    }

    // Remove user from community
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error leaving community:", error)
      return { success: false, error: "Fehler beim Verlassen der Community" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error leaving community:", error)
    return { success: false, error: "Unerwarteter Fehler beim Verlassen der Community" }
  }
}
