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

export function convertMarkdownToHtml(text: string | null | undefined): string {
  if (!text) return ""

  // First strip any existing HTML tags for security
  let html = stripHtmlTags(text)

  // Convert markdown to HTML
  // Order matters: handle *** before ** and * to avoid incorrect parsing
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>") // ***text*** → bold + italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **text** → bold
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>") // *text* → italic

  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, "<br>")

  return html
}
