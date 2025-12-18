"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Label } from "@/components/ui/label"
import { Send, X } from "lucide-react"
import { toast } from "sonner"
import { createForumReply } from "@/app/actions/forum-replies"

interface CreateForumReplyFormProps {
  postId: string
  parentReplyId?: string | null
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function CreateForumReplyForm({
  postId,
  parentReplyId,
  userId,
  onSuccess,
  onCancel,
}: CreateForumReplyFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const validateForm = () => {
    if (!content.trim()) {
      setError("Inhalt ist erforderlich")
      return false
    }
    if (content.length < 5) {
      setError("Antwort muss mindestens 5 Zeichen lang sein")
      return false
    }
    if (content.length > 2000) {
      setError("Antwort darf maximal 2000 Zeichen lang sein")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createForumReply({
        content: content.trim(),
        post_id: postId,
        parent_reply_id: parentReplyId,
        user_id: userId,
      })

      if (result.success) {
        onSuccess()
      } else {
        toast.error(result.error || "Fehler beim Erstellen der Antwort")
      }
    } catch (error) {
      console.error("Error creating forum reply:", error)
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    if (error) {
      setError("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reply-content" className="text-sm font-medium text-gray-700">
          {parentReplyId ? "Antwort auf Kommentar" : "Deine Antwort"}
        </Label>
        <RichTextEditor
          value={content}
          onChange={handleContentChange}
          placeholder={parentReplyId ? "Schreibe eine Antwort auf diesen Kommentar..." : "Schreibe deine Antwort..."}
          className={`playful-input ${error ? "border-red-500" : ""}`}
          maxLength={2000}
          rows={3}
        />
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <X className="h-3 w-3" />
            {error}
          </p>
        )}
        <p className="text-xs text-gray-500">{content.length}/2000 Zeichen</p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-transparent"
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting || !content.trim()} className="flex-1 playful-button">
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sende...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Antworten
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
