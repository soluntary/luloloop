"use server"

import { createClient } from "@/lib/supabase/server"

export async function addPostReaction(postId: string, emoji: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("forum_post_reactions")
    .insert({
      post_id: postId,
      user_id: user.id,
      emoji: emoji,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function removePostReaction(postId: string, emoji: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("forum_post_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getPostReactions(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("forum_post_reactions").select("*").eq("post_id", postId)

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function addReplyReaction(replyId: string, emoji: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("forum_reply_reactions")
    .insert({
      reply_id: replyId,
      user_id: user.id,
      emoji: emoji,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function removeReplyReaction(replyId: string, emoji: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("forum_reply_reactions")
    .delete()
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getReplyReactions(replyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("forum_reply_reactions").select("*").eq("reply_id", replyId)

  if (error) {
    return { error: error.message }
  }

  return { data }
}
