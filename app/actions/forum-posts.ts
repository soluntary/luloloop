"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createForumPost(formData: {
  title: string
  content: string
  category_id?: string // Optional category_id
}) {
  try {
    console.log("[v0] createForumPost called with:", formData)
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - user:", user?.id, "error:", authError)

    if (authError || !user) {
      console.log("[v0] Authentication failed")
      return { success: false, error: "Du musst angemeldet sein, um einen Beitrag zu erstellen" }
    }

    // Validate input
    if (!formData.title.trim() || !formData.content.trim()) {
      console.log("[v0] Validation failed - missing title or content")
      return { success: false, error: "Titel und Inhalt sind erforderlich" }
    }

    console.log("[v0] Creating forum post for user:", user.id)

    // Create the forum post
    const { data, error } = await supabase
      .from("forum_posts")
      .insert({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category_id: formData.category_id || null, // Set to null if not provided
        author_id: user.id,
        post_type: "discussion",
        is_pinned: false,
        is_locked: false,
        views_count: 0,
        likes_count: 0,
        replies_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating forum post:", error)
      return { success: false, error: "Fehler beim Erstellen des Beitrags" }
    }

    console.log("[v0] Forum post created successfully:", data.id)
    revalidatePath("/ludo-forum")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception creating forum post:", error)
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function likeForumPost(postId: string) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Du musst angemeldet sein" }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("forum_post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("forum_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)

      if (deleteError) {
        return { success: false, error: "Fehler beim Entfernen des Likes" }
      }

      const { data: currentPost } = await supabase.from("forum_posts").select("likes_count").eq("id", postId).single()

      if (currentPost) {
        const newCount = Math.max(0, (currentPost.likes_count || 0) - 1)
        await supabase.from("forum_posts").update({ likes_count: newCount }).eq("id", postId)
      }

      return { success: true, liked: false }
    } else {
      // Like
      const { error: insertError } = await supabase.from("forum_post_likes").insert({
        post_id: postId,
        user_id: user.id,
      })

      if (insertError) {
        return { success: false, error: "Fehler beim Hinzufügen des Likes" }
      }

      const { data: currentPost } = await supabase.from("forum_posts").select("likes_count").eq("id", postId).single()

      if (currentPost) {
        const newCount = (currentPost.likes_count || 0) + 1
        await supabase.from("forum_posts").update({ likes_count: newCount }).eq("id", postId)
      }

      return { success: true, liked: true }
    }
  } catch (error) {
    console.error("Exception liking forum post:", error)
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}
