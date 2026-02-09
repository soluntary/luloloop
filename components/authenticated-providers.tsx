"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
import { GamesProvider } from "@/contexts/games-context"
import { MessagesProvider } from "@/contexts/messages-context"
import { FriendsProvider } from "@/contexts/friends-context"
import { RequestsProvider } from "@/contexts/requests-context"
import { AvatarProvider } from "@/contexts/avatar-context"
import { ProfileSyncProvider } from "@/contexts/profile-sync-context"

/**
 * Wraps data-fetching providers that should only be active when a user is logged in.
 * This prevents unnecessary Supabase queries, realtime subscriptions, and state
 * initialization for unauthenticated visitors (landing page, login, register, etc.).
 *
 * Providers that remain always-active (in layout.tsx):
 * - AuthProvider (needed to detect auth state)
 * - GeolocationProvider (used on public pages for location-based search)
 * - LocationSearchProvider (used on public pages)
 * - ConfirmDialogProvider (UI-only, no data fetching)
 */
export function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // While auth is still loading OR user is not logged in,
  // render children without data-fetching providers.
  // This prevents unnecessary Supabase queries and race conditions.
  if (loading || !user) {
    return <>{children}</>
  }

  // User is authenticated - wrap with all data providers
  return (
    <UserProvider>
      <AvatarProvider>
        <ProfileSyncProvider>
          <GamesProvider>
            <MessagesProvider>
              <FriendsProvider>
                <RequestsProvider>{children}</RequestsProvider>
              </FriendsProvider>
            </MessagesProvider>
          </GamesProvider>
        </ProfileSyncProvider>
      </AvatarProvider>
    </UserProvider>
  )
}
