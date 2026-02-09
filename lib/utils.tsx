import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPostalCodeAndCity(address: string | null | undefined): string {
  if (!address) return ""

  // Address format is typically: "Street HouseNumber, PostalCode City"
  // We want to extract only: "PostalCode City"
  const parts = address.split(",")

  if (parts.length > 1) {
    // Return everything after the first comma (postal code + city)
    return parts.slice(1).join(",").trim()
  }

  // If no comma found, return the original address
  return address
}

export function stripHtmlTags(text: string | null | undefined): string {
  if (!text) return ""

  // Remove HTML tags using regex
  return text.replace(/<[^>]*>/g, "")
}

/**
 * Escapes HTML special characters to prevent XSS when inserting user content.
 * This is safer than stripHtmlTags because it preserves the text while making it inert.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Sanitizes HTML output by only allowing a strict allowlist of safe tags.
 * Removes all attributes, event handlers, and script-related content.
 */
export function sanitizeHtml(html: string): string {
  // Allowed tags that our markdown conversion produces
  const allowedTags = ["strong", "em", "br", "ul", "ol", "li", "p"]

  // Remove script/style tags and their content entirely
  let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, "")
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, "")

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*\S+/gi, "")

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, "")
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, "")

  // Only keep allowed tags (without attributes), strip everything else
  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const lowerTag = tag.toLowerCase()
    if (allowedTags.includes(lowerTag)) {
      // Return the tag without any attributes
      if (match.startsWith("</")) {
        return `</${lowerTag}>`
      }
      // Self-closing tags like <br>
      if (lowerTag === "br") return "<br>"
      return `<${lowerTag}>`
    }
    return "" // Strip disallowed tags
  })

  return sanitized
}

export function convertMarkdownToHtml(text: string | null | undefined): string {
  if (!text) return ""

  // Escape all HTML entities first to neutralize any injected HTML
  let html = escapeHtml(text)

  // Convert markdown to HTML
  // Order matters: handle *** before ** and * to avoid incorrect parsing
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>") // ***text*** → bold + italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **text** → bold
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>") // *text* → italic

  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, "<br>")

  return html
}
