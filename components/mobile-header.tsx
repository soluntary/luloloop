"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, Bell } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function MobileHeader() {
  const { user, signOut } = useAuth() || { user: null, signOut: null }
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    try {
      if (signOut && typeof signOut === "function") {
        await signOut()
      }
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/login"
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/images/ludoloop-new-logo.png" alt="LudoLoop" className="h-10 w-auto" />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-teal-400">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email) || "/placeholder.svg"}`
                        }
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    <span>Abmelden</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm" className="text-teal-600">
                <Link href="/login">Anmelden</Link>
              </Button>
              <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                <Link href="/register">Registrieren</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
