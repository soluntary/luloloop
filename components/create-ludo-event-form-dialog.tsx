"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CreateLudoEventForm from "./create-ludo-event-form-advanced"
import { updateLudoEvent } from "@/app/actions/ludo-events"
import { toast } from "@/hooks/use-toast"

interface CreateLudoEventFormDialogProps {
  event: any
  onClose: () => void
  onSuccess: () => void
}

export function CreateLudoEventFormDialog({ event, onClose, onSuccess }: CreateLudoEventFormDialogProps) {
  console.log("[v0] CreateLudoEventFormDialog rendered, event:", event)
  console.log("[v0] Event keys:", event ? Object.keys(event) : "undefined")
  console.log("[v0] Event title:", event?.title)
  console.log("[v0] Event id:", event?.id)

  const handleSuccess = async (eventData: any) => {
    // Update existing event
    const {
      data: { user },
    } = await (await import("@/lib/supabase/client")).createClient().auth.getUser()

    if (!user) {
      toast({
        title: "Fehler",
        description: "Benutzer nicht authentifiziert",
        variant: "destructive",
      })
      return
    }

    const result = await updateLudoEvent(event.id, eventData, user.id)

    if (result.success) {
      onSuccess()
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Fehler beim Aktualisieren des Events",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event bearbeiten</DialogTitle>
        </DialogHeader>
        <CreateLudoEventForm initialData={event} onSuccess={handleSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}
