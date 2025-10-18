"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    let result = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Process bullet points
    const lines = result.split("\n")
    const processedLines = lines.map((line) => {
      if (line.match(/^• (.+)$/)) {
        return `<li>${line.replace(/^• /, "")}</li>`
      } else if (line.match(/^(\d+)\. (.+)$/)) {
        return `<li data-number="true">${line.replace(/^(\d+)\. /, "")}</li>`
      }
      return line
    })

    result = processedLines.join("\n")

    // Wrap consecutive list items
    result = result.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      return `<ul>${match.replace(/\n/g, "")}</ul>`
    })

    result = result.replace(/(<li data-number="true">.*?<\/li>\n?)+/g, (match) => {
      const cleanMatch = match.replace(/ data-number="true"/g, "").replace(/\n/g, "")
      return `<ol>${cleanMatch}</ol>`
    })

    // Convert remaining newlines to breaks
    result = result.replace(/\n/g, "<br>")

    return result
  }, [content])

  return (
    <div
      className={cn("prose prose-sm max-w-none text-gray-600", className)}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
