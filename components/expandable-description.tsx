"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface ExpandableDescriptionProps {
  text: string
  className?: string
}

export function ExpandableDescription({ text, className = "" }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = Number.parseInt(window.getComputedStyle(textRef.current).lineHeight)
      const height = textRef.current.scrollHeight
      const lines = Math.round(height / lineHeight)

      // Show button only if text is more than 4 lines
      setShowButton(lines > 4)
    }
  }, [text])

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`text-gray-600 text-sm ${
          !isExpanded && showButton ? "line-clamp-2" : ""
        }`}
      >
        {text}
      </p>
      {showButton && (
        <Button
          variant="link"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-teal-600 hover:text-teal-700 font-medium"
        >
          {isExpanded ? "Weniger anzeigen" : "Alles anzeigen"}
        </Button>
      )}
    </div>
  )
}
