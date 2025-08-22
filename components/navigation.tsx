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
  ChevronDown,
  Calendar,
  UserCheck,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"

interface NavigationProps {
  currentPage?: string
}

interface NavItem {
  href?: string
  label: string
  icon: any
  key: string
  dropdown?: {
    items: {
      href: string
      label: string
      icon: any
      key: string
    }[]
  }
}

export function Navigation({ currentPage }: NavigationProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getUnreadCount } = useMessages()

  const loggedInNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home, key: "home" },
    { href: "/library", label: "Ludothek", icon: LibraryBig, key: "library" },
    {
      label: "Community",
      icon: Users,
      key: "community",
      dropdown: {
        items: [
          { href: "/groups?tab=communities", label: "Gruppen", icon: Users, key: "groups" },
          { href: "/groups?tab=events", label: "Events", icon: Calendar, key: "events" },
          { href: "/groups?tab=users", label: "Mitglieder", icon: UserCheck, key: "members" },
        ],
      },
    },
    { href: "/marketplace", label: "Spielemarkt", icon: Store, key: "spielemarkt" },
    { href: "/messages", label: "Nachrichten", icon: MessageCircle, key: "messages" },
    { href: "/about", label: "Über uns", icon: Info, key: "about" },
  ]

  const publicNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home, key: "home" },
    { href: "/marketplace", label: "Spielemarkt", icon: Store, key: "spielemarkt" },
    {
      label: "Community",
      icon: Users,
      key: "community",
      dropdown: {
        items: [
          { href: "/groups?tab=communities", label: "Gruppen", icon: Users, key: "groups" },
          { href: "/groups?tab=events", label: "Events", icon: Calendar, key: "events" },
          { href: "/groups?tab=users", label: "Mitglieder", icon: UserCheck, key: "members" },
        ],
      },
    },
    { href: "/about", label: "Über uns", icon: Info, key: "about" },
  ]

  const navItems = user ? loggedInNavItems : publicNavItems

  const isActive = (href: string, key: string) => {
    if (currentPage) {
      return currentPage === key
    }
    return pathname === href
  }

  const isDropdownActive = (item: NavItem) => {
    if (!item.dropdown) return false
    return item.dropdown.items.some(
      (dropdownItem) =>
        isActive(dropdownItem.href, dropdownItem.key) || (item.key === "community" && pathname.startsWith("/groups")),
    )
  }

  const handleLogout = async () => {
    try {
      console.log("[v0] Logout attempt started")

      // Check if we have a valid signOut function
      if (!signOut || typeof signOut !== "function") {
        console.error("[v0] SignOut function not available")
        throw new Error("Auth session missing!")
      }

      // Check if user is actually logged in
      if (!user) {
        console.log("[v0] No user found, redirecting to login")
        window.location.href = "/login"
        return
      }

      console.log("[v0] Calling signOut function")
      await signOut()
      console.log("[v0] SignOut successful, redirecting to login")
      window.location.href = "/login"
    } catch (error) {
      console.error("[v0] Logout error:", error)
      try {
        localStorage.removeItem("supabase.auth.token")
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          const domain = supabaseUrl.split("//")[1]
          localStorage.removeItem(`sb-${domain}-auth-token`)
        }
      } catch (storageError) {
        console.error("[v0] Error clearing storage:", storageError)
      }
      window.location.href = "/login"
    }
  }

  const unreadCount = user ? getUnreadCount() : 0

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

              if (item.dropdown) {
                const active = isDropdownActive(item)

                return (
                  <DropdownMenu key={item.key}>
                    <DropdownMenuTrigger asChild>
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
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 font-body">
                      {item.dropdown.items.map((dropdownItem) => {
                        const DropdownIcon = dropdownItem.icon
                        return (
                          <DropdownMenuItem key={dropdownItem.key} asChild>
                            <Link href={dropdownItem.href} className="flex items-center space-x-2 cursor-pointer">
                              <DropdownIcon className="w-4 h-4" />
                              <span>{dropdownItem.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              // Regular navigation item
              const active = isActive(item.href!, item.key)
              return (
                <Link key={item.href} href={item.href!}>
                  <Button
                    variant="ghost"
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-base transform hover:scale-105 hover:rotate-1 ${
                      active
                        ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                        : "text-gray-700 hover:bg-teal-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.key === "messages" && unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    )}
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
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 font-handwritten text-base transform hover:scale-105 hover:-rotate-1 transition-all bg-transparent flex items-center space-x-2"
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

                if (item.dropdown) {
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="px-4 py-2 text-sm font-medium text-gray-500 font-handwritten">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </div>
                      {item.dropdown.items.map((dropdownItem) => {
                        const DropdownIcon = dropdownItem.icon
                        const active = isActive(dropdownItem.href, dropdownItem.key)

                        return (
                          <Link
                            key={dropdownItem.key}
                            href={dropdownItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Button
                              variant="ghost"
                              className={`w-full justify-start flex items-center space-x-3 px-8 py-3 rounded-lg font-handwritten text-base transform hover:scale-105 hover:rotate-1 transition-all ${
                                active
                                  ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                                  : "text-gray-700 hover:bg-teal-400 hover:text-white"
                              }`}
                            >
                              <DropdownIcon className="w-5 h-5" />
                              <span>{dropdownItem.label}</span>
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )
                }

                // Regular mobile navigation item
                const active = isActive(item.href!, item.key)
                return (
                  <Link key={item.href} href={item.href!} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`relative w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-base transform hover:scale-105 hover:rotate-1 transition-all ${
                        active
                          ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                          : "text-gray-700 hover:bg-teal-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {item.key === "messages" && unreadCount > 0 && (
                        <div className="absolute right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                      )}
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
