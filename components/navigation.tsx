"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FaHome,
  FaBook,
  FaUserPlus,
  FaSignInAlt,
  FaUsers,
  FaStore,
  FaComments,
  FaSignOutAlt,
  FaBars,
  FaCog,
  FaTimes,
  FaInfoCircle,
  FaChevronDown,
  FaCalendar,
  FaStar,
  FaUserCheck,
  FaComment,
} from "react-icons/fa"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"
import { useAvatar } from "@/contexts/avatar-context"
import NotificationDropdown from "@/components/notification-dropdown"

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

function Navigation({ currentPage }: NavigationProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth() || { user: null, signOut: null }
  const { getAvatar } = useAvatar()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getUnreadCount } = useMessages()

  const loggedInNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: FaHome, key: "home" },
    { href: "/library", label: "Ludothek", icon: FaBook, key: "library" },
    {
      label: "Community",
      icon: FaUsers,
      key: "community",
      dropdown: {
        items: [
          { href: "/ludo-gruppen", label: "Spielgruppen", icon: FaUsers, key: "ludo-gruppen" },
          { href: "/ludo-mitglieder", label: "Mitglieder", icon: FaUserCheck, key: "ludo-mitglieder" },
          { href: "/ludo-events", label: "Events", icon: FaCalendar, key: "ludo-events" },
          { href: "/ludo-forum", label: "Forum", icon: FaComment, key: "ludo-forum" },
        ],
      },
    },
    { href: "/marketplace", label: "Spielemarkt", icon: FaStore, key: "spielemarkt" },
    { href: "/messages", label: "Nachrichten", icon: FaComments, key: "messages" },
    { href: "/about", label: "Über uns", icon: FaInfoCircle, key: "about" },
  ]

  const publicNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: FaHome, key: "home" },
    {
      label: "Community",
      icon: FaUsers,
      key: "community",
      dropdown: {
        items: [
          { href: "/ludo-gruppen", label: "Spielgruppen", icon: FaUsers, key: "ludo-gruppen" },
          { href: "/ludo-mitglieder", label: "Mitglieder", icon: FaUserCheck, key: "ludo-mitglieder" },
          { href: "/ludo-events", label: "Events", icon: FaCalendar, key: "ludo-events" },
          { href: "/ludo-forum", label: "Forum", icon: FaComment, key: "ludo-forum" },
        ],
      },
    },
    { href: "/marketplace", label: "Spielemarkt", icon: FaStore, key: "spielemarkt" },
    { href: "/about", label: "Über uns", icon: FaInfoCircle, key: "about" },
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
        isActive(dropdownItem.href, dropdownItem.key) ||
        (item.key === "community" &&
          (pathname.startsWith("/ludo-gruppen") ||
            pathname.startsWith("/ludo-mitglieder") ||
            pathname.startsWith("/ludo-events") ||
            pathname.startsWith("/ludo-forum"))),
    )
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

  const unreadCount = user ? getUnreadCount() : 0

  const userAvatar = useMemo(() => {
    if (!user) return null
    // First priority: user.avatar from database
    if (user.avatar) return user.avatar
    // Second priority: cached avatar
    return getAvatar(user.id, user.email)
  }, [user])

  const avatarSrc = userAvatar || "/placeholder.svg"

  return (
    <nav className="bg-white shadow-lg border-b-4 border-teal-400 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 transform hover:scale-105 hover:rotate-1 transition-all hover:text-teal-600 -ml-2"
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
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-sm transform hover:scale-105 hover:rotate-1 ${
                          active
                            ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                            : "text-gray-700 hover:bg-teal-400 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        <FaChevronDown className="w-4 h-4" />
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
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-sm transform hover:scale-105 hover:rotate-1 ${
                      active
                        ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                        : "text-gray-700 hover:bg-teal-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.key === "messages" && unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
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
            {user && (
              <>
                <NotificationDropdown />
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 font-handwritten text-sm transform hover:scale-105 hover:-rotate-1 transition-all bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-teal-400">
                      <img
                        src={avatarSrc || "/placeholder.svg"}
                        alt={user.username || user.name}
                        className="w-full h-full object-cover"
                        key={avatarSrc}
                      />
                    </div>
                    <span className="text-gray-700 font-medium">{user.username || user.name || "Benutzer"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-sm font-body">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <FaCog className="w-4 h-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 cursor-pointer">
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Abmelden</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-2 border-teal-400 text-teal-800 hover:bg-teal-400 hover:text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all bg-white flex items-center space-x-2"
                >
                  <Link href="/login">
                    <FaSignInAlt className="w-4 h-4" />
                    <span>Anmelden</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all flex items-center space-x-2"
                >
                  <Link href="/register">
                    <FaUserPlus className="w-4 h-4" />
                    <span>Registrieren</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <>
                <NotificationDropdown className="p-1" />
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
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
                              className={`w-full justify-start flex items-center space-x-3 px-8 py-3 rounded-lg font-handwritten text-sm transform hover:scale-105 hover:rotate-1 transition-all ${
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
                      className={`relative w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm transform hover:scale-105 hover:rotate-1 transition-all ${
                        active
                          ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                          : "text-gray-700 hover:bg-teal-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {item.key === "messages" && unreadCount > 0 && (
                        <div className="absolute right-4 bg-red-500 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
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
                        className="w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:rotate-1 transition-all"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-teal-400">
                          <img
                            src={avatarSrc || "/placeholder.svg"}
                            alt={user.username || user.name}
                            className="w-full h-full object-cover"
                            key={avatarSrc}
                          />
                        </div>
                        <span>Profil ({user.username || user.name || "Benutzer"})</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full justify-start flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:rotate-1 transition-all"
                    >
                      <FaSignOutAlt className="w-5 h-5" />
                      <span>Abmelden</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-teal-400 text-teal-800 hover:bg-teal-400 hover:text-white font-handwritten bg-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/login">
                        <FaSignInAlt className="w-4 h-4" />
                        Anmelden
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/register">
                        <FaUserPlus className="w-4 h-4" />
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

export { Navigation }
export default Navigation
