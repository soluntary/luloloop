import type React from "react"
import type { Metadata } from "next"
import { Galindo, McLaren } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
import { GamesProvider } from "@/contexts/games-context"
import { MessagesProvider } from "@/contexts/messages-context"
import { FriendsProvider } from "@/contexts/friends-context"
import { GeolocationProvider } from "@/contexts/geolocation-context"
import { LocationSearchProvider } from "@/contexts/location-search-context"
import { RequestsProvider } from "@/contexts/requests-context"
import { AvatarProvider } from "@/contexts/avatar-context"
import { ProfileSyncProvider } from "@/contexts/profile-sync-context"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { SecurityEventLogger } from "@/components/security-event-logger"
import { Toaster as SonnerToaster } from "sonner"
import { ConfirmDialogProvider } from "@/hooks/use-confirm-dialog"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

const galindo = Galindo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-galindo",
  display: "swap",
})

const mclaren = McLaren({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mclaren",
  display: "swap",
})

export const metadata: Metadata = {
  title: "LudoLoop - Deine Spiele-Community",
  description:
    "Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke grossartige Spiele!",
  generator: "v0.dev",
  manifest: "/manifest.json",
  themeColor: "#f97316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LudoLoop",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "LudoLoop",
    title: "LudoLoop - Deine Spiele-Community",
    description: "Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke grossartige Spiele!",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${galindo.variable} ${mclaren.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LudoLoop" />
      </head>
      <body className={mclaren.className}>
        <AuthProvider>
          <UserProvider>
            <AvatarProvider>
              <ProfileSyncProvider>
                <GamesProvider>
                  <MessagesProvider>
                    <FriendsProvider>
                      <GeolocationProvider>
                        <LocationSearchProvider>
                          <RequestsProvider>
                            <SecurityEventLogger>
                              <ConfirmDialogProvider>
                                <ServiceWorkerRegistration />
                                <PWAInstallPrompt />
                                <div className="flex flex-col min-h-screen">
                                  <main className="flex-1">{children}</main>
                                  <Footer />
                                </div>
                              </ConfirmDialogProvider>
                            </SecurityEventLogger>
                            <Toaster />
                            <SonnerToaster position="top-center" richColors />
                          </RequestsProvider>
                        </LocationSearchProvider>
                      </GeolocationProvider>
                    </FriendsProvider>
                  </MessagesProvider>
                </GamesProvider>
              </ProfileSyncProvider>
            </AvatarProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
