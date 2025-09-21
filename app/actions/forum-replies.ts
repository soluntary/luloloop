"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createForumReply(formData: {
  content: string
  post_id: string
  parent_reply_id?: string
}) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Du musst angemeldet sein, um zu antworten" }
    }

    // Validate input
    if (!formData.content.trim() || !formData.post_id) {
      return { success: false, error: "Inhalt und Post-ID sind erforderlich" }
    }

    // Create the forum reply
    const { data, error } = await supabase
      .from("forum_replies")
      .insert({
        content: formData.content.trim(),
        post_id: formData.post_id,
        parent_reply_id: formData.parent_reply_id || null,
        author_id: user.id,
        likes_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating forum reply:", error)
      return { success: false, error: "Fehler beim Erstellen der Antwort" }
    }

    // Update replies count on the post
    const { error: updateError } = await supabase.rpc("increment_post_replies", {
      post_id: formData.post_id,
    })

    if (updateError) {
      console.error("Error incrementing replies count:", updateError)
    }

    revalidatePath(`/ludo-forum/${formData.post_id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Exception creating forum reply:", error)
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function likeForumReply(replyId: string) {
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
      .from("forum_reply_likes")
      .select("id")
      .eq("reply_id", replyId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("forum_reply_likes")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id)

      if (deleteError) {
        return { success: false, error: "Fehler beim Entfernen des Likes" }
      }

      // Update likes count
      const { error: updateError } = await supabase.rpc("decrement_reply_likes", {
        reply_id: replyId,
      })

      if (updateError) {
        console.error("Error decrementing reply likes:", updateError)
      }

      return { success: true, liked: false }
    } else {
      // Like
      const { error: insertError } = await supabase.from("forum_reply_likes").insert({
        reply_id: replyId,
        user_id: user.id,
      })

      if (insertError) {
        return { success: false, error: "Fehler beim Hinzufügen des Likes" }
      }

      // Update likes count
      const { error: updateError } = await supabase.rpc("increment_reply_likes", {
        reply_id: replyId,
      })

      if (updateError) {
        console.error("Error incrementing reply likes:", updateError)
      }

      return { success: true, liked: true }
    }
  } catch (error) {
    console.error("Exception liking forum reply:", error)
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}
