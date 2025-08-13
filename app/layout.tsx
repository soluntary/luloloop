import type React from "react"
import type { Metadata } from "next"
import { Galindo, McLaren } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { GamesProvider } from "@/contexts/games-context"
import { MessagesProvider } from "@/contexts/messages-context"
import { FriendsProvider } from "@/contexts/friends-context"
import { Footer } from "@/components/footer"

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
  title: "Ludoloop - Deine Spiele-Community",
  description:
    "Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke grossartige Spiele!",
  generator: "v0.dev",
  manifest: "/manifest.json",
  keywords: ["Brettspiele", "Community", "Tauschen", "Verleihen", "Verkaufen", "Spiele"],
  authors: [{ name: "LudoLoop Team" }],
  creator: "LudoLoop",
  publisher: "LudoLoop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ludoloop.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ludoloop - Deine Spiele-Community",
    description:
      "Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke grossartige Spiele!",
    url: "https://ludoloop.vercel.app",
    siteName: "LudoLoop",
    locale: "de_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ludoloop - Deine Spiele-Community",
    description:
      "Tausche, verleihe und verkaufe deine Lieblingsspiele. Finde neue Mitspieler und entdecke grossartige Spiele!",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LudoLoop",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "LudoLoop",
    "application-name": "LudoLoop",
    "msapplication-TileColor": "#8b5cf6",
    "theme-color": "#8b5cf6",
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#8b5cf6" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="background-color" content="#ffffff" />
        <meta name="display" content="standalone" />
        <meta name="orientation" content="portrait-primary" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={mclaren.className}>
        <AuthProvider>
          <GamesProvider>
            <MessagesProvider>
              <FriendsProvider>
                <div className="min-h-screen flex flex-col">
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </FriendsProvider>
            </MessagesProvider>
          </GamesProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
