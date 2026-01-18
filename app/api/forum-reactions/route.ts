import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { postId, emoji, action } = await request.json()
    
    console.log("[v0] API forum-reactions POST - action:", action, "postId:", postId, "emoji:", emoji)
    
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log("[v0] API forum-reactions - user:", user?.id, "authError:", authError?.message)
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (action === "add") {
      const { data, error } = await supabase
        .from("forum_post_reactions")
        .insert({
          post_id: postId,
          user_id: user.id,
          emoji: emoji,
        })
        .select()
        .single()

      console.log("[v0] API forum-reactions - insert result:", { data, error: error?.message })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ data })
    } else if (action === "remove") {
      const { error } = await supabase
        .from("forum_post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)

      console.log("[v0] API forum-reactions - delete result:", { error: error?.message })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] API forum-reactions - error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
