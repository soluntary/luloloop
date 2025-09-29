import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "LudoLoop Web",
  description: "LudoLoop Web Application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
