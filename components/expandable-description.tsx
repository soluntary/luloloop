"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { convertMarkdownToHtml } from "@/lib/utils"

interface ExpandableDescriptionProps {
  text: string
  className?: string
}

export function ExpandableDescription({ text, className = "" }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  const htmlContent = convertMarkdownToHtml(text)

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = Number.parseInt(window.getComputedStyle(textRef.current).lineHeight)
      const height = textRef.current.scrollHeight
      const lines = Math.round(height / lineHeight)

      setShowButton(lines > 4)
    }
  }, [htmlContent])

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`text-xs text-black ${!isExpanded && showButton ? "line-clamp-2" : ""}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {showButton && (
        <Button
          variant="link"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {isExpanded ? "Weniger anzeigen" : "Alles anzeigen"}
        </Button>
      )}
    </div>
  )
}
