/**
 * Get an avatar URL for a user. Uses the provided avatar URL if available,
 * otherwise generates a stable DiceBear fallback based on the userId.
 */
export function getUserAvatar(userId: string, avatarUrl?: string | null): string {
  if (avatarUrl && avatarUrl !== "/placeholder.svg" && avatarUrl !== "/placeholder-user.jpg") {
    return avatarUrl
  }
  return `https://api.dicebear.com/7.x/croodles/svg?seed=${encodeURIComponent(userId)}`
}
