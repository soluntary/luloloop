"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

export function ExpandableText({ text, maxLength = 300, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = text.length > maxLength

  const displayText = isExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + "..."

  return (
    <div className={className}>
      <MarkdownRenderer content={displayText} />
      {shouldTruncate && (
        <Button
          variant="link"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-teal-600 hover:text-teal-700"
        >
          {isExpanded ? "Weniger anzeigen" : "Alles anzeigen"}
        </Button>
      )}
    </div>
  )
}
