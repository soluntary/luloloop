"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Smile } from "lucide-react"

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"]

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void
  disabled?: boolean
}

export function EmojiReactionPicker({ onSelect, disabled }: EmojiReactionPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(emoji)
              }}
              className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
