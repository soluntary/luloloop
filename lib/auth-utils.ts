import { toast } from "@/hooks/use-toast"

/**
 * Shows a standardized login prompt toast for guests
 * @param action - The action the user was trying to perform (e.g., "eine Bewertung zu schreiben", "an einem Event teilzunehmen")
 */
export function showLoginPrompt(action: string) {
  toast({
    title: "Anmeldung erforderlich",
    description: `Du musst angemeldet sein, um ${action}`,
    variant: "destructive",
  })

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = "/login"
  }, 2000)
}

/**
 * Checks if user is authenticated and shows login prompt if not
 * @param user - The current user object (null if not authenticated)
 * @param action - The action the user was trying to perform
 * @returns true if user is authenticated, false if not
 */
export function requireAuth(user: any, action: string): boolean {
  if (!user) {
    showLoginPrompt(action)
    return false
  }
  return true
}
