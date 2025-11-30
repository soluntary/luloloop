"use server"

import { createClient } from "@/lib/supabase/server"
import { embed, generateText } from "ai"

interface UserProfile {
  id: string
  location?: string
  latitude?: number
  longitude?: number
  favorite_games?: string
  preferred_game_types?: string
  gaming_experience?: string
  max_travel_distance?: number
}

interface GameRecommendation {
  id: string
  title: string
  category?: string
  style?: string
  players?: string
  description?: string
  score: number
  reason: string
}

interface GroupRecommendation {
  id: string
  name: string
  description?: string
  location?: string
  games?: string[]
  member_count?: number
  distance?: number
  score: number
  reason: string
}

interface EventRecommendation {
  id: string
  title: string
  description?: string
  location?: string
  selected_games?: string[]
  start_time?: string
  distance?: number
  score: number
  reason: string
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Generate embeddings for text using AI Gateway
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: "openai/text-embedding-3-small" as any,
      value: text,
    })
    return embedding
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    return []
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (normA * normB)
}

/**
 * Get AI-powered game recommendations for a user
 */
export async function getGameRecommendations(userId?: string): Promise<{
  success: boolean
  recommendations: GameRecommendation[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get user profile
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = userId || user?.id

    if (!currentUserId) {
      return { success: false, recommendations: [], error: "Not authenticated" }
    }

    // Get user's profile and library
    const { data: userProfile } = await supabase
      .from("users")
      .select("favorite_games, preferred_game_types")
      .eq("id", currentUserId)
      .single()

    const { data: userGames } = await supabase
      .from("games")
      .select("title, category, style, players")
      .eq("user_id", currentUserId)

    if (!userProfile && !userGames?.length) {
      return { success: true, recommendations: [] }
    }

    // Create user preference text for embedding
    const userPreferences = [
      userProfile?.favorite_games || "",
      userProfile?.preferred_game_types || "",
      userGames?.map((g) => `${g.title} ${g.category} ${g.style}`).join(", ") || "",
    ]
      .filter(Boolean)
      .join(". ")

    if (!userPreferences) {
      return { success: true, recommendations: [] }
    }

    // Generate user preference embedding
    const userEmbedding = await generateEmbedding(userPreferences)

    const useAI = userEmbedding.length > 0

    // Get all available games (from marketplace or library)
    const { data: allGames } = await supabase
      .from("games")
      .select("id, title, category, style, players, description")
      .neq("user_id", currentUserId)
      .limit(100)

    if (!allGames || allGames.length === 0) {
      return { success: true, recommendations: [] }
    }

    let topGames: any[] = []

    if (useAI) {
      // Calculate similarity for each game
      const scoredGames = await Promise.all(
        allGames.map(async (game) => {
          const gameText = `${game.title} ${game.category || ""} ${game.style || ""} ${game.description || ""}`.trim()
          const gameEmbedding = await generateEmbedding(gameText)
          // If game embedding fails, score is 0
          const similarity = gameEmbedding.length > 0 ? cosineSimilarity(userEmbedding, gameEmbedding) : 0

          return {
            ...game,
            score: similarity,
          }
        })
      )

      // Sort by similarity and get top 10
      topGames = scoredGames.sort((a, b) => b.score - a.score).slice(0, 10)
    } else {
      topGames = allGames.sort(() => 0.5 - Math.random()).slice(0, 10).map(g => ({ ...g, score: 0 }))
    }

    // Generate explanations using LLM
    const recommendations: GameRecommendation[] = await Promise.all(
      topGames.map(async (game) => {
        let reason = "Basierend auf deinen Interessen."
        
        if (useAI) {
          try {
            const { text } = await generateText({
              model: "openai/gpt-4o-mini",
              prompt: `Basierend auf den Spielepräferenzen eines Benutzers (${userPreferences.substring(0, 200)}), erkläre in einem kurzen Satz (max 20 Wörter) auf Deutsch, warum "${game.title}" (${game.category}, ${game.style}) gut passen würde.`,
              maxTokens: 50,
            })
            reason = text.trim()
          } catch (e) {
            // Fallback reason if LLM fails
            reason = `Ein beliebtes Spiel in der Kategorie ${game.category || "Brettspiele"}.`
          }
        } else {
           reason = `Ein beliebtes Spiel in der Kategorie ${game.category || "Brettspiele"}.`
        }

        return {
          id: game.id,
          title: game.title,
          category: game.category,
          style: game.style,
          players: game.players,
          description: game.description,
          score: Math.round(game.score * 100),
          reason: reason,
        }
      })
    )

    return { success: true, recommendations }
  } catch (error: any) {
    console.error("[v0] Error getting game recommendations:", error)
    return { success: true, recommendations: [] } 
  }
}

/**
 * Get AI-powered group recommendations for a user
 */
export async function getGroupRecommendations(userId?: string): Promise<{
  success: boolean
  recommendations: GroupRecommendation[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = userId || user?.id

    if (!currentUserId) {
      return { success: false, recommendations: [], error: "Not authenticated" }
    }

    // Get user profile with location
    const { data: userProfile } = await supabase
      .from("users")
      .select("latitude, longitude, favorite_games, preferred_game_types")
      .eq("id", currentUserId)
      .single()

    // Get user's library
    const { data: userGames } = await supabase
      .from("games")
      .select("title, category, style")
      .eq("user_id", currentUserId)

    // Create user preference embedding
    const userPreferences = [
      userProfile?.favorite_games || "",
      userProfile?.preferred_game_types || "",
      userGames?.map((g) => `${g.title} ${g.category} ${g.style}`).join(", ") || "",
    ]
      .filter(Boolean)
      .join(". ")

    const userEmbedding = userPreferences ? await generateEmbedding(userPreferences) : []
    const useAI = userEmbedding.length > 0

    // Get all active communities (excluding ones user is already in)
    const { data: userMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", currentUserId)

    const excludedIds = userMemberships?.map((m) => m.community_id) || []

    const { data: communities } = await supabase
      .from("communities")
      .select("id, name, description, location, latitude, longitude, games")
      .eq("active", true)
      .not("id", "in", `(${excludedIds.join(",") || "00000000-0000-0000-0000-000000000000"})`)
      .limit(50)

    if (!communities || communities.length === 0) {
      return { success: true, recommendations: [] }
    }

    // Calculate scores for each community
    const scoredCommunities = await Promise.all(
      communities.map(async (community) => {
        let score = 0

        // Location score (if user has location)
        let distance: number | undefined
        if (userProfile?.latitude && userProfile?.longitude && community.latitude && community.longitude) {
          distance = calculateDistance(
            userProfile.latitude,
            userProfile.longitude,
            community.latitude,
            community.longitude
          )
          const locationScore = Math.max(0, 1 - distance / 50) // 50km max distance
          score += locationScore * 0.4 // 40% weight
        }

        // Game similarity score
        if (useAI && community.games && community.games.length > 0) {
          const communityText = `${community.name} ${community.description || ""} ${community.games.join(", ")}`
          const communityEmbedding = await generateEmbedding(communityText)
          if (communityEmbedding.length > 0) {
             const similarity = cosineSimilarity(userEmbedding, communityEmbedding)
             score += similarity * 0.6 // 60% weight
          }
        } else if (!useAI) {
            score += Math.random() * 0.5
        }

        // Get member count
        const { count: memberCount } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", community.id)

        return {
          ...community,
          member_count: memberCount || 0,
          distance,
          score,
        }
      })
    )

    // Sort and get top 10
    const topCommunities = scoredCommunities.sort((a, b) => b.score - a.score).slice(0, 10)

    // Generate explanations
    const recommendations: GroupRecommendation[] = await Promise.all(
      topCommunities.map(async (community) => {
        const distanceText = community.distance ? `${community.distance.toFixed(1)}km entfernt` : ""
        const gamesText = community.games?.slice(0, 3).join(", ") || "verschiedene Spiele"
        
        let reason = `Eine aktive Spielgruppe in deiner Nähe.`

        if (useAI) {
            try {
                const { text } = await generateText({
                model: "openai/gpt-4o-mini",
                prompt: `Erkläre in einem kurzen Satz (max 20 Wörter) auf Deutsch, warum die Spielgruppe "${community.name}" (spielt ${gamesText}, ${distanceText}) für diesen Benutzer interessant sein könnte.`,
                maxTokens: 50,
                })
                reason = text.trim()
            } catch (e) {
                reason = `Spielt ${gamesText} und könnte zu dir passen.`
            }
        } else {
             reason = `Spielt ${gamesText} und könnte zu dir passen.`
        }

        return {
          id: community.id,
          name: community.name,
          description: community.description,
          location: community.location,
          games: community.games,
          member_count: community.member_count,
          distance: community.distance,
          score: Math.round(community.score * 100),
          reason: reason,
        }
      })
    )

    return { success: true, recommendations }
  } catch (error: any) {
    console.error("[v0] Error getting group recommendations:", error)
    return { success: true, recommendations: [] }
  }
}

/**
 * Get AI-powered event recommendations for a user
 */
export async function getEventRecommendations(userId?: string): Promise<{
  success: boolean
  recommendations: EventRecommendation[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = userId || user?.id

    if (!currentUserId) {
      return { success: false, recommendations: [], error: "Not authenticated" }
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("latitude, longitude, favorite_games, preferred_game_types")
      .eq("id", currentUserId)
      .single()

    // Get user's library
    const { data: userGames } = await supabase
      .from("games")
      .select("title, category, style")
      .eq("user_id", currentUserId)

    // Create user preference embedding
    const userPreferences = [
      userProfile?.favorite_games || "",
      userProfile?.preferred_game_types || "",
      userGames?.map((g) => `${g.title} ${g.category} ${g.style}`).join(", ") || "",
    ]
      .filter(Boolean)
      .join(". ")

    const userEmbedding = userPreferences ? await generateEmbedding(userPreferences) : []
    const useAI = userEmbedding.length > 0

    // Get upcoming public events (user is not already participating in)
    const { data: userParticipations } = await supabase
      .from("ludo_event_participants")
      .select("event_id")
      .eq("user_id", currentUserId)

    const excludedEventIds = userParticipations?.map((p) => p.event_id) || []

    const { data: events } = await supabase
      .from("ludo_events")
      .select("id, title, description, location, selected_games, start_time")
      .eq("is_public", true)
      .not("id", "in", `(${excludedEventIds.join(",") || "00000000-0000-0000-0000-000000000000"})`)
      .gte("first_instance_date", new Date().toISOString().split("T")[0])
      .limit(50)

    if (!events || events.length === 0) {
      return { success: true, recommendations: [] }
    }

    // Calculate scores
    const scoredEvents = await Promise.all(
      events.map(async (event) => {
        let score = 0

        // Game similarity score
        if (useAI) {
          const eventText = `${event.title} ${event.description || ""} ${event.selected_games?.join(", ") || ""}`
          const eventEmbedding = await generateEmbedding(eventText)
          if (eventEmbedding.length > 0) {
             const similarity = cosineSimilarity(userEmbedding, eventEmbedding)
             score += similarity
          }
        } else {
            score = Math.random()
        }

        return {
          ...event,
          score,
        }
      })
    )

    // Sort and get top 10
    const topEvents = scoredEvents.sort((a, b) => b.score - a.score).slice(0, 10)

    // Generate explanations
    const recommendations: EventRecommendation[] = await Promise.all(
      topEvents.map(async (event) => {
        const gamesText = event.selected_games?.slice(0, 2).join(", ") || "verschiedene Spiele"
        let reason = `Ein spannendes Event in deiner Nähe.`

        if (useAI) {
            try {
                const { text } = await generateText({
                model: "openai/gpt-4o-mini",
                prompt: `Erkläre in einem kurzen Satz (max 20 Wörter) auf Deutsch, warum das Event "${event.title}" (mit ${gamesText}) für diesen Benutzer interessant sein könnte.`,
                maxTokens: 50,
                })
                reason = text.trim()
            } catch (e) {
                reason = `Event mit ${gamesText}, das dich interessieren könnte.`
            }
        } else {
             reason = `Event mit ${gamesText}, das dich interessieren könnte.`
        }

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          selected_games: event.selected_games,
          start_time: event.start_time,
          score: Math.round(event.score * 100),
          reason: reason,
        }
      })
    )

    return { success: true, recommendations }
  } catch (error: any) {
    console.error("[v0] Error getting event recommendations:", error)
    return { success: true, recommendations: [] }
  }
}

/**
 * Get game recommendations for a specific group
 */
export async function getGroupGameRecommendations(groupId: string): Promise<{
  success: boolean
  recommendations: GameRecommendation[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get group details and members
    const { data: group } = await supabase
      .from("communities")
      .select("name, description, games")
      .eq("id", groupId)
      .single()

    if (!group) {
      return { success: false, recommendations: [], error: "Group not found" }
    }

    // Get members' games
    const { data: members } = await supabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", groupId)

    if (!members || members.length === 0) {
      return { success: true, recommendations: [] }
    }

    const memberIds = members.map((m) => m.user_id)

    const { data: memberGames } = await supabase
      .from("games")
      .select("title, category, style")
      .in("user_id", memberIds)

    // Create group preference embedding
    const groupPreferences = [
      group.name,
      group.description || "",
      group.games?.join(", ") || "",
      memberGames?.map((g) => `${g.title} ${g.category} ${g.style}`).join(", ") || "",
    ]
      .filter(Boolean)
      .join(". ")

    const groupEmbedding = await generateEmbedding(groupPreferences)

    if (groupEmbedding.length === 0) {
      return { success: false, recommendations: [], error: "Failed to generate embeddings" }
    }

    // Get available games
    const { data: allGames } = await supabase
      .from("games")
      .select("id, title, category, style, players, description")
      .limit(100)

    if (!allGames || allGames.length === 0) {
      return { success: true, recommendations: [] }
    }

    // Calculate similarity
    const scoredGames = await Promise.all(
      allGames.map(async (game) => {
        const gameText = `${game.title} ${game.category || ""} ${game.style || ""} ${game.description || ""}`.trim()
        const gameEmbedding = await generateEmbedding(gameText)
        const similarity = cosineSimilarity(groupEmbedding, gameEmbedding)

        return {
          ...game,
          score: similarity,
        }
      })
    )

    const topGames = scoredGames.sort((a, b) => b.score - a.score).slice(0, 10)

    // Generate explanations
    const recommendations: GameRecommendation[] = await Promise.all(
      topGames.map(async (game) => {
        const { text } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `Erkläre in einem kurzen Satz (max 20 Wörter) auf Deutsch, warum "${game.title}" (${game.category}, ${game.style}) gut zu der Spielgruppe "${group.name}" passen würde.`,
          maxTokens: 50,
        })

        return {
          id: game.id,
          title: game.title,
          category: game.category,
          style: game.style,
          players: game.players,
          description: game.description,
          score: Math.round(game.score * 100),
          reason: text.trim(),
        }
      })
    )

    return { success: true, recommendations }
  } catch (error: any) {
    console.error("[v0] Error getting group game recommendations:", error)
    return { success: false, recommendations: [], error: error.message }
  }
}
