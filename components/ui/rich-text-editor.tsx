"use client"

import * as React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bold, Italic, List, ListOrdered } from "lucide-react"

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  rows?: number
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, className, maxLength, rows = 4, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const markdownToHtml = useCallback((text: string) => {
      let result = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")

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
    }, [])

    const htmlToMarkdown = useCallback((html: string) => {
      let result = html
        .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
        .replace(/<em>(.*?)<\/em>/g, "*$1*")
        .replace(/<br\s*\/?>/g, "\n")

      // Handle lists
      result = result.replace(/<ul>(.*?)<\/ul>/g, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/g, "• $1\n").trim()
      })

      result = result.replace(/<ol>(.*?)<\/ol>/g, (match, content) => {
        let counter = 1
        return content.replace(/<li>(.*?)<\/li>/g, () => `${counter++}. ${RegExp.$1}\n`).trim()
      })

      return result.trim()
    }, [])

    useEffect(() => {
      if (editorRef.current && !isUpdating) {
        const html = markdownToHtml(value)
        if (editorRef.current.innerHTML !== html) {
          editorRef.current.innerHTML = html
        }
      }
    }, [value, markdownToHtml, isUpdating])

    const applyFormat = useCallback(
      (format: string) => {
        if (!editorRef.current) return

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const selectedText = range.toString()

        if (!selectedText) return

        const commonAncestor = range.commonAncestorContainer
        const parentElement =
          commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : (commonAncestor as Element)

        let isAlreadyFormatted = false
        let formatElement: HTMLElement | null = null

        // Check for existing formatting
        switch (format) {
          case "bold":
            formatElement = parentElement?.closest("strong") as HTMLElement
            isAlreadyFormatted = !!formatElement
            break
          case "italic":
            formatElement = parentElement?.closest("em") as HTMLElement
            isAlreadyFormatted = !!formatElement
            break
          case "bullet":
            formatElement = parentElement?.closest("ul") as HTMLElement
            isAlreadyFormatted = !!formatElement
            break
          case "number":
            formatElement = parentElement?.closest("ol") as HTMLElement
            isAlreadyFormatted = !!formatElement
            break
        }

        if (isAlreadyFormatted && formatElement) {
          // Remove existing formatting
          const textContent = formatElement.textContent || ""
          const textNode = document.createTextNode(textContent)
          formatElement.parentNode?.replaceChild(textNode, formatElement)
        } else {
          // Apply new formatting
          let element: HTMLElement

          switch (format) {
            case "bold":
              element = document.createElement("strong")
              element.textContent = selectedText
              break
            case "italic":
              element = document.createElement("em")
              element.textContent = selectedText
              break
            case "bullet":
              const existingUl = editorRef.current?.querySelector("ul:last-of-type")
              if (existingUl) {
                const li = document.createElement("li")
                li.textContent = selectedText
                existingUl.appendChild(li)
                range.deleteContents()
                // Update the markdown value
                setIsUpdating(true)
                const newMarkdown = htmlToMarkdown(editorRef.current.innerHTML)
                if (!maxLength || newMarkdown.length <= maxLength) {
                  onChange(newMarkdown)
                }
                setTimeout(() => setIsUpdating(false), 0)
                return
              } else {
                const ul = document.createElement("ul")
                const li = document.createElement("li")
                li.textContent = selectedText
                ul.appendChild(li)
                element = ul
              }
              break
            case "number":
              const existingOl = editorRef.current?.querySelector("ol:last-of-type")
              if (existingOl) {
                const li = document.createElement("li")
                li.textContent = selectedText
                existingOl.appendChild(li)
                range.deleteContents()
                // Update the markdown value
                setIsUpdating(true)
                const newMarkdown = htmlToMarkdown(editorRef.current.innerHTML)
                if (!maxLength || newMarkdown.length <= maxLength) {
                  onChange(newMarkdown)
                }
                setTimeout(() => setIsUpdating(false), 0)
                return
              } else {
                const ol = document.createElement("ol")
                const numLi = document.createElement("li")
                numLi.textContent = selectedText
                ol.appendChild(numLi)
                element = ol
              }
              break
            default:
              return
          }

          range.deleteContents()
          range.insertNode(element)
        }

        // Update the markdown value
        setIsUpdating(true)
        const newMarkdown = htmlToMarkdown(editorRef.current.innerHTML)
        if (!maxLength || newMarkdown.length <= maxLength) {
          onChange(newMarkdown)
        }
        setTimeout(() => setIsUpdating(false), 0)
      },
      [onChange, maxLength, htmlToMarkdown],
    )

    const handleInput = () => {
      if (!editorRef.current) return

      setIsUpdating(true)
      const newMarkdown = htmlToMarkdown(editorRef.current.innerHTML)
      if (!maxLength || newMarkdown.length <= maxLength) {
        onChange(newMarkdown)
      }
      setTimeout(() => setIsUpdating(false), 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle Enter key for better list behavior
      if (e.key === "Enter") {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const listItem = range.startContainer.parentElement?.closest("li")
          if (listItem) {
            e.preventDefault()
            const newLi = document.createElement("li")
            newLi.innerHTML = "<br>"
            listItem.parentNode?.insertBefore(newLi, listItem.nextSibling)

            // Move cursor to new list item
            const newRange = document.createRange()
            newRange.setStart(newLi, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)

            handleInput()
          }
        }
      }
    }

    return (
      <div className={cn("space-y-2", className)}>
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat("bold")}
            className="h-8 w-8 p-0"
            title="Fett (Text markieren und klicken)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat("italic")}
            className="h-8 w-8 p-0"
            title="Kursiv (Text markieren und klicken)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat("bullet")}
            className="h-8 w-8 p-0"
            title="Aufzählungspunkt (Text markieren und klicken)"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormat("number")}
            className="h-8 w-8 p-0"
            title="Nummerierung (Text markieren und klicken)"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none text-xs",
            isFocused && "ring-2 ring-ring ring-offset-2",
            !value && "text-muted-foreground",
          )}
          style={{
            minHeight: `${rows * 1.5}rem`,
            maxHeight: `${rows * 3}rem`,
            overflowY: "auto",
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />

        {/* Character Count */}
        {maxLength && (
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxLength} Zeichen
            </span>
          </div>
        )}

        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>
    )
  },
)

RichTextEditor.displayName = "RichTextEditor"

export { RichTextEditor }
