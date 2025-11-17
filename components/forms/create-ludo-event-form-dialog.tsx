"use client"

import CreateLudoEventForm from "@/components/create-ludo-event-form-advanced"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CreateLudoEventFormDialogProps {
  event?: any
  onClose: () => void
  onSuccess: () => void
}

export function CreateLudoEventFormDialog({ event, onClose, onSuccess }: CreateLudoEventFormDialogProps) {
  console.log("[v0] CreateLudoEventFormDialog rendered, event:", event)
  console.log("[v0] Event keys:", event ? Object.keys(event) : "event is null/undefined")
  console.log("[v0] Event title:", event?.title)
  console.log("[v0] Event date:", event?.event_date)
  // </CHANGE>

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Event bearbeiten" : "Neues Event erstellen"}</DialogTitle>
        </DialogHeader>
        <CreateLudoEventForm
          initialData={event}
          onSuccess={(eventData) => {
            onSuccess()
            onClose()
          }}
          onCancel={onClose}
        />
        {/* </CHANGE> */}
      </DialogContent>
    </Dialog>
  )
}
