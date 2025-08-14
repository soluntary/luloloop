"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Home,
  LibraryBig,
  UserPlus,
  LogIn,
  Users,
  Store,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Info,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface NavigationProps {
  currentPage?: string
}

export function Navigation({ currentPage }: NavigationProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth() || { user: null, signOut: null }
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation items for logged-in users
  const loggedInNavItems = [
    { href: "/", label: "Home", icon: Home, key: "home" },
    { href: "/library", label: "Bibliothek", icon: LibraryBig, key: "library" },
    { href: "/groups", label: "Community", icon: Users, key: "community" },
    { href: "/marketplace", label: "Spielemarkt", icon: Store, key: "spielemarkt" },
    { href: "/messages", label: "Nachrichten", icon: MessageCircle, key: "messages" },
    { href: "/about", label: "Über uns", icon: Info, key: "about" },
  ]

  // Navigation items for non-logged-in users
  const publicNavItems = [
    { href: "/", label: "Home", icon: Home, key: "home" },
    { href: "/marketplace", label: "Spielemarkt", icon: Store, key: "spielemarkt" },
    { href: "/groups", label: "Community", icon: Users, key: "community" },
    { href: "/about", label: "Über uns", icon: Info, key: "about" },
  ]

  const navItems = user ? loggedInNavItems : publicNavItems

  const isActive = (href: string, key: string) => {
    if (currentPage) {
      return currentPage === key
    }
    return pathname === href
  }

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
    <nav className="bg-white shadow-lg border-b-4 border-teal-400 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transform hover:scale-105 hover:rotate-1 transition-all hover:text-teal-600"
          >
            <img src="/images/ludoloop-new-logo.png" alt="LudoLoop Logo" className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.key)

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-base transform hover:scale-105 hover:rotate-1 ${
                      active
                        ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                        : "text-gray-700 hover:bg-teal-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 font-handwritten text-base transform hover:scale-105 hover:rotate-1 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-teal-400">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email) || "/placeholder.svg"}`
                        }
                        alt={user.username || user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-gray-700">{user.username || user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-body">
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
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten transform hover:scale-105 hover:-rotate-1 transition-all bg-transparent flex items-center space-x-2"
                >
                  <Link href="/login">
                    <LogIn className="w-4 h-4" />
                    <span>Anmelden</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all flex items-center space-x-2"
                >
                  <Link href="/register">
                    <UserPlus className="w-4 h-4" />
                    <span>Registrieren</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.key)

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-base transform hover:scale-105 hover:rotate-1 transition-all ${
                        active
                          ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                          : "text-gray-700 hover:bg-teal-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                {user ? (
                  <div className="space-y-2">
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-base text-gray-700 hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:rotate-1 transition-all"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-teal-400">
                          <img
                            src={
                              user.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email) || "/placeholder.svg"}`
                            }
                            alt={user.username || user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>Profil ({user.username || user.name})</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-base text-gray-700 hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:rotate-1 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Abmelden</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-teal-400 text-teal-600 hover:bg-teal-400 hover:text-white font-handwritten bg-transparent"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/login">
                        <LogIn className="w-4 h-4" />
                        Anmelden
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/register">
                        <UserPlus className="w-4 h-4" />
                        Registrieren
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
