"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CreateCommunityEventForm from "@/components/create-community-event-form"
import { useGames } from "@/contexts/games-context"

interface CreateCommunityEventDialogProps {
  children: React.ReactNode
  onEventCreated?: () => void
}

export default function CreateCommunityEventDialog({ children, onEventCreated }: CreateCommunityEventDialogProps) {
  const [open, setOpen] = useState(false)
  const { userGames, friends } = useGames()

  const handleEventCreated = () => {
    setOpen(false)
    onEventCreated?.()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-2xl text-gray-800">Neues Community-Event erstellen</DialogTitle>
        </DialogHeader>
        <CreateCommunityEventForm
          userGames={userGames}
          friends={friends}
          onSubmit={handleEventCreated}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
