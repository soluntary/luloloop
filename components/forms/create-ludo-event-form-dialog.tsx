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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 -m-6 mb-6 z-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900 mb-2">
              {event ? "Event bearbeiten" : "Neues Event erstellen"}
            </DialogTitle>
            <p className="text-xs text-gray-600">Erstelle ein Event und verbinde dich mit anderen Spiel-Enthusiasten</p>
          </DialogHeader>
        </div>
        {/* </CHANGE> */}

        <CreateLudoEventForm
          initialData={event}
          onSuccess={(eventData) => {
            onSuccess()
            onClose()
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
