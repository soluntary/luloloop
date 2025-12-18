"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FaBold, FaItalic, FaListUl, FaListOl } from "react-icons/fa"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, maxLength, className }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)

  const insertMarkdown = (before: string, after = "") => {
    const textarea = document.getElementById("rich-text-area") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden ${isFocused ? "ring-1 ring-teal-500 border-teal-500" : ""} ${className}`}
    >
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("**", "**")}
          className="h-7 w-7 p-0"
          title="Fett"
        >
          <FaBold className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("*", "*")}
          className="h-7 w-7 p-0"
          title="Kursiv"
        >
          <FaItalic className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("\n- ")}
          className="h-7 w-7 p-0"
          title="Aufzählungsliste"
        >
          <FaListUl className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown("\n1. ")}
          className="h-7 w-7 p-0"
          title="Nummerierte Liste"
        >
          <FaListOl className="h-3 w-3" />
        </Button>
      </div>
      <Textarea
        id="rich-text-area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="min-h-[150px] border-0 focus-visible:ring-0 resize-none text-xs"
      />
      {maxLength && (
        <div className="bg-gray-50 border-t border-gray-200 px-3 py-1 text-xs text-gray-500 text-right">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  )
}
