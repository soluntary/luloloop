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
    console.log("[v0] Global rate limit period expired, resuming normal operations")
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
    console.log("[v0] Global rate limit activated, cooling down for 60 seconds")
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
    console.log("[v0] Operation blocked due to global rate limit")
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
      console.log("[v0] Rate limit detected, activating global cooldown")
      if (fallback !== undefined) {
        return fallback
      }
    }
    throw error
  }
}
