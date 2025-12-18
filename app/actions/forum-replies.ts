"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { createNotificationIfEnabled } from "./notification-helpers"

export async function createForumReply(formData: {
  content: string
  post_id: string
  parent_reply_id?: string
  user_id: string
}) {
  try {
    console.log("[v0] createForumReply called with:", {
      post_id: formData.post_id,
      user_id: formData.user_id,
      parent_reply_id: formData.parent_reply_id,
    })

    if (!formData.content.trim() || !formData.post_id || !formData.user_id) {
      console.error("[v0] Validation failed - missing required fields")
      return { success: false, error: "Inhalt, Post-ID und User-ID sind erforderlich" }
    }

    const supabase = await createClient()

    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", formData.user_id)
      .single()

    if (userError || !userExists) {
      console.error("[v0] User validation failed:", userError)
      return { success: false, error: "Ungültige Benutzer-ID" }
    }

    console.log("[v0] User validated successfully:", formData.user_id)

    // Determine who to notify
    let notificationUserId: string | null = null
    let notificationType: "forum_reply" | "comment_reply" = "forum_reply"

    if (formData.parent_reply_id) {
      const { data: parentReply } = await supabase
        .from("forum_replies")
        .select("author_id")
        .eq("id", formData.parent_reply_id)
        .single()

      if (parentReply && parentReply.author_id !== formData.user_id) {
        notificationUserId = parentReply.author_id
        notificationType = "comment_reply"
      }
    } else {
      const { data: post } = await supabase.from("forum_posts").select("author_id").eq("id", formData.post_id).single()

      if (post && post.author_id !== formData.user_id) {
        notificationUserId = post.author_id
        notificationType = "forum_reply"
      }
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("forum_replies")
      .insert({
        content: formData.content.trim(),
        post_id: formData.post_id,
        parent_reply_id: formData.parent_reply_id || null,
        author_id: formData.user_id,
        likes_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating forum reply:", error)
      return { success: false, error: "Fehler beim Erstellen der Antwort: " + error.message }
    }

    console.log("[v0] Forum reply created successfully:", data.id)

    // Create notification if needed
    if (notificationUserId) {
      const { data: userData } = await supabase
        .from("users")
        .select("username, name")
        .eq("id", formData.user_id)
        .single()

      const authorName = userData?.username || userData?.name || "Ein Nutzer"

      await createNotificationIfEnabled(
        notificationUserId,
        notificationType,
        notificationType === "forum_reply" ? "Neue Antwort auf deinen Beitrag" : "Neue Antwort auf deinen Kommentar",
        `${authorName} hat auf ${notificationType === "forum_reply" ? "deinen Beitrag" : "deinen Kommentar"} geantwortet`,
        {
          post_id: formData.post_id,
          reply_id: data.id,
          author_id: formData.user_id,
          author_name: authorName,
        },
      )
    }

    // Increment replies count
    const { error: updateError } = await supabase.rpc("increment_post_replies", {
      post_id: formData.post_id,
    })

    if (updateError) {
      console.error("[v0] Error incrementing replies count:", updateError)
    }

    revalidatePath(`/ludo-forum/${formData.post_id}`)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception creating forum reply:", error)
    return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" }
  }
}

export async function likeForumReply(replyId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Du musst angemeldet sein" }
    }

    const { data: existingLike } = await supabase
      .from("forum_reply_likes")
      .select("id")
      .eq("reply_id", replyId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from("forum_reply_likes")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id)

      if (deleteError) {
        return { success: false, error: "Fehler beim Entfernen des Likes" }
      }

      const { error: updateError } = await supabase.rpc("decrement_reply_likes", {
        reply_id: replyId,
      })

      if (updateError) {
        console.error("Error decrementing reply likes:", updateError)
      }

      return { success: true, liked: false }
    } else {
      const { error: insertError } = await supabase.from("forum_reply_likes").insert({
        reply_id: replyId,
        user_id: user.id,
      })

      if (insertError) {
        return { success: false, error: "Fehler beim Hinzufügen des Likes" }
      }

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
