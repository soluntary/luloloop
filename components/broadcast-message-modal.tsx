"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { broadcastGroupMessageAction } from "@/app/actions/broadcast-group-message"

interface BroadcastMessageModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
}

export function BroadcastMessageModal({ isOpen, onClose, groupId, groupName }: BroadcastMessageModalProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  console.log("[v0] BroadcastMessageModal render - isOpen:", isOpen, "groupId:", groupId, "groupName:", groupName)

  const handleSend = async () => {
    console.log("[v0] handleSend called with message:", message)

    if (!message.trim()) {
      toast.error("Bitte geben Sie eine Nachricht ein.")
      return
    }

    setIsLoading(true)
    try {
      const result = await broadcastGroupMessageAction(groupId, message.trim())

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Nachricht an alle Mitglieder gesendet")
      setMessage("")
      onClose()
    } catch (error) {
      console.error("Error sending broadcast message:", error)
      toast.error("Die Nachricht konnte nicht gesendet werden.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-sm text-gray-800">Nachricht an alle Mitglieder</DialogTitle>
          <DialogDescription>Senden Sie eine Nachricht an alle Mitglieder der Gruppe "{groupName}".</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              placeholder="Geben Sie Ihre Nachricht ein..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-handwritten"
          >
            {isLoading ? (
              "Wird gesendet..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Nachricht senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
