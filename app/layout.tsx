import type React from "react"
import type { Metadata } from "next"
import { Galindo, McLaren } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
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
      </head>
      <body className={mclaren.className}>
        <AuthProvider>
          <UserProvider>
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
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
