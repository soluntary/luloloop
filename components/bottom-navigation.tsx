"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LibraryBig, Users, Store, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth() || { user: null }

  // Don't show bottom nav on auth pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/reset-password") {
    return null
  }

  const navItems = user
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/library", label: "Bibliothek", icon: LibraryBig },
        { href: "/groups", label: "Community", icon: Users },
        { href: "/marketplace", label: "Markt", icon: Store },
        { href: "/messages", label: "Chat", icon: MessageCircle },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/marketplace", label: "Markt", icon: Store },
        { href: "/groups", label: "Community", icon: Users },
      ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                isActive ? "text-teal-600 bg-teal-50" : "text-gray-600 hover:text-teal-600"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "text-teal-600" : ""}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
