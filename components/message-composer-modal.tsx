"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send } from "lucide-react"
import { useMessages } from "@/contexts/messages-context"
import { toast } from "sonner"

interface MessageComposerModalProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  context: {
    title: string
    image?: string
    type: "group" | "event" | "member"
  }
}

export function MessageComposerModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  context,
}: MessageComposerModalProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { sendMessage } = useMessages()

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Bitte geben Sie eine Nachricht ein")
      return
    }

    setIsSending(true)

    try {
      await sendMessage({
        to_user_id: recipientId,
        message: message.trim(),
        game_id: null,
        game_title: context.title,
        game_image: context.image || "/placeholder.svg",
        offer_type: "general",
      })

      toast.success("Nachricht erfolgreich gesendet!")
      setMessage("")
      onClose()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Fehler beim Senden der Nachricht")
    } finally {
      setIsSending(false)
    }
  }

  const getContextLabel = () => {
    switch (context.type) {
      case "group":
        return "Spielgruppe"
      case "event":
        return "Event"
      case "member":
        return "Mitglied"
      default:
        return ""
    }
  }

  const getPlaceholderText = () => {
    switch (context.type) {
      case "group":
        return `Hallo! Ich würde sehr gerne deiner Spielgruppe "${context.title}" beitreten. Könntest du mir bitte mehr Informationen dazu geben?`
      case "event":
        return `Hallo! Ich würde sehr gerne an deinem Event "${context.title}". Könntest du mir bitte mehr Details dazu geben?`
      case "member":
        return "Hallo! Ich würde mich freuen, wenn wir uns hier vernetzen und austauschen könnten."
      default:
        return "Schreibe deine Nachricht hier..."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl text-gray-800 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-600" />
            Nachricht senden
          </DialogTitle>
          <DialogDescription>
            Sende eine Nachricht bezüglich {getContextLabel()}: "{context.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={context.image || "/placeholder.svg"} />
              <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-800">An: {recipientName}</p>
              <p className="text-xs text-gray-500">
                {getContextLabel()}: {context.title}
              </p>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Deine Nachricht</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getPlaceholderText()}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Tipp: Sei höflich und beschreibe dein Interesse</span>
              <span>{message.length}/1000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-handwritten bg-transparent"
              disabled={isSending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !message.trim()}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-handwritten"
            >
              {isSending ? (
                "Sende..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Senden
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
