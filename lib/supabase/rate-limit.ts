let isGloballyRateLimited = false
let rateLimitResetTime = 0
let rateLimitCallbacks: Array<() => void> = []

export const checkGlobalRateLimit = (): boolean => {
  const now = Date.now()
  if (isGloballyRateLimited && now < rateLimitResetTime) {
    return true
  }
  if (isGloballyRateLimited && now >= rateLimitResetTime) {
    isGloballyRateLimited = false
    // Rate limit period expired
    // Notify all components that rate limiting has ended
    rateLimitCallbacks.forEach((callback) => callback())
    rateLimitCallbacks = []
  }
  return false
}

export const setGlobalRateLimit = (): void => {
  if (!isGloballyRateLimited) {
    isGloballyRateLimited = true
    rateLimitResetTime = Date.now() + 60000 // 60 second cooldown
    // Rate limit activated
  }
}

export const onRateLimitEnd = (callback: () => void): void => {
  if (!isGloballyRateLimited) {
    callback()
  } else {
    rateLimitCallbacks.push(callback)
  }
}

export const isCurrentlyRateLimited = (): boolean => checkGlobalRateLimit()

// Wrapper for database operations with rate limiting
export const withRateLimit = async (operation: () => Promise<any>, fallback?: any): Promise<any> => {
  if (checkGlobalRateLimit()) {
    // Blocked by rate limit
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error("Rate limited")
  }

  try {
    return await operation()
  } catch (error: any) {
    if (error.message?.includes("Too Many R") || error.message?.includes("Unexpected token")) {
      setGlobalRateLimit()
      // Rate limit detected
      if (fallback !== undefined) {
        return fallback
      }
    }
    throw error
  }
}
