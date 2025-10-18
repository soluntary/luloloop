"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EmojiReactionPicker } from "@/components/emoji-reaction-picker"
import { addPostReaction, removePostReaction, getPostReactions } from "@/app/actions/forum-reactions"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Reaction {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

interface ForumPostReactionsProps {
  postId: string
  className?: string
}

export function ForumPostReactions({ postId, className }: ForumPostReactionsProps) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReactions()
  }, [postId])

  const loadReactions = async () => {
    const result = await getPostReactions(postId)
    if (result.data) {
      setReactions(result.data)
    }
  }

  const handleReactionToggle = async (emoji: string) => {
    if (!user) {
      toast.info("Bitte melde dich an, um zu reagieren")
      return
    }

    setLoading(true)

    // Check if user already reacted with this emoji
    const existingReaction = reactions.find((r) => r.user_id === user.id && r.emoji === emoji)

    if (existingReaction) {
      // Remove reaction
      const result = await removePostReaction(postId, emoji)
      if (result.error) {
        toast.error("Fehler beim Entfernen der Reaktion")
      } else {
        setReactions(reactions.filter((r) => r.id !== existingReaction.id))
      }
    } else {
      // Add reaction
      const result = await addPostReaction(postId, emoji)
      if (result.error) {
        toast.error("Fehler beim Hinzufügen der Reaktion")
      } else if (result.data) {
        setReactions([...reactions, result.data])
      }
    }

    setLoading(false)
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          userReacted: false,
        }
      }
      acc[reaction.emoji].count++
      if (user && reaction.user_id === user.id) {
        acc[reaction.emoji].userReacted = true
      }
      return acc
    },
    {} as Record<string, { count: number; userReacted: boolean }>,
  )

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {Object.entries(groupedReactions).map(([emoji, { count, userReacted }]) => (
        <Button
          key={emoji}
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleReactionToggle(emoji)
          }}
          disabled={loading}
          className={cn("h-8 px-2 gap-1 text-sm", userReacted && "bg-teal-50 border-teal-300 hover:bg-teal-100")}
        >
          <span className="text-base">{emoji}</span>
          <span className="text-xs">{count}</span>
        </Button>
      ))}

      <EmojiReactionPicker onSelect={handleReactionToggle} disabled={loading || !user} />
    </div>
  )
}
