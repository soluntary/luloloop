"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, MessageSquare } from "lucide-react"

interface JoinEventDialogProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (message?: string) => void
  eventTitle: string
  approvalMode: "automatic" | "manual"
  isLoading: boolean
}

export default function JoinEventDialog({
  isOpen,
  onClose,
  onJoin,
  eventTitle,
  approvalMode,
  isLoading,
}: JoinEventDialogProps) {
  const [message, setMessage] = useState("")

  const handleJoin = () => {
    if (approvalMode === "manual" && message.trim()) {
      onJoin(message.trim())
    } else {
      onJoin()
    }
    setMessage("")
    onClose()
  }

  const handleCancel = () => {
    setMessage("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Zum Event teilnehmen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Du möchtest zum Event <span className="font-medium">"{eventTitle}"</span> teilnehmen.
          </div>

          {approvalMode === "automatic" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <strong>Sofortige Teilnahme:</strong> Du nimmst direkt am Event teil.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Teilnahme mit Genehmigung:</strong> Der Organisator muss deine Anfrage genehmigen. Du erhältst
                  eine Benachrichtigung, sobald über deine Anfrage entschieden wurde.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Nachricht an den Organisator (optional)
                </label>
                <RichTextEditor
                  value={message}
                  onChange={setMessage}
                  placeholder="Erzähle dem Organisator etwas über dich oder warum du teilnehmen möchtest..."
                  className="min-h-[80px]"
                  maxLength={500}
                  rows={3}
                />
                <div className="text-xs text-gray-500">
                  Nach dem Senden wird dein Status auf "Warte auf Bestätigung" gesetzt.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent" disabled={isLoading}>
              Abbrechen
            </Button>
            <Button
              onClick={handleJoin}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {approvalMode === "automatic" ? "Teilnehmen..." : "Anfrage senden..."}
                </div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {approvalMode === "automatic" ? "Teilnehmen" : "Anfrage senden"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
