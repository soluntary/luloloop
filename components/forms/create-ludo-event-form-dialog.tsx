"use client"

import CreateLudoEventForm from "@/components/create-ludo-event-form-advanced"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface CreateLudoEventFormDialogProps {
  event?: any
  onClose: () => void
  onSuccess: () => void
}

export function CreateLudoEventFormDialog({ event, onClose, onSuccess }: CreateLudoEventFormDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {event ? "Event bearbeiten" : "Neues Event erstellen"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Erstelle ein Event und verbinde dich mit anderen Spiel-Enthusiasten
          </DialogDescription>
        </DialogHeader>

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
