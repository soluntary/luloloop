"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FaHome,
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
  FaCalendarAlt,
  FaUserCheck,
  FaDice,
  FaToolbox,
} from "react-icons/fa"
import { GiMeepleCircle } from "react-icons/gi"
import { GiMeepleArmy } from "react-icons/gi"
import { LiaUsersSolid } from "react-icons/lia"
import { IoLibrary } from "react-icons/io5"
import { MdForum } from "react-icons/md"
import { RiUserCommunityFill } from "react-icons/ri"
import { GiGamepad } from "react-icons/gi"
import { useAuth } from "@/contexts/auth-context"
import { useAvatar } from "@/contexts/avatar-context"
import { NotificationBell } from "@/components/notification-bell"
import { GlobalSearch } from "@/components/global-search"

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
  const [unreadCount] = useState(0)
  const [avatarKey, setAvatarKey] = useState(0)

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatarKey((prev) => prev + 1)
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate)
    return () => window.removeEventListener("avatarUpdated", handleAvatarUpdate)
  }, [])

  const loggedInNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: FaHome, key: "home" },
    { href: "/library", label: "Spieleregal", icon: IoLibrary, key: "library" },
    {
      label: "Community",
      icon: RiUserCommunityFill,
      key: "community",
      dropdown: {
        items: [
          { href: "/ludo-gruppen", label: "Spielgruppen", icon: LiaUsersSolid, key: "ludo-gruppen" },
          { href: "/ludo-mitglieder", label: "Mitglieder", icon: FaUserCheck, key: "ludo-mitglieder" },
          { href: "/ludo-events", label: "Events", icon: FaCalendarAlt, key: "ludo-events" },
          { href: "/ludo-forum", label: "Forum", icon: MdForum, key: "ludo-forum" },
        ],
      },
    },
    { href: "/marketplace", label: "Spielehandel", icon: FaStore, key: "spielemarkt" },
    {
      label: "Spielplatz",
      icon: GiMeepleArmy,
      key: "spielplatz",
      dropdown: {
        items: [
          { href: "/spielhilfen", label: "Spielhilfen", icon: FaToolbox, key: "spielhilfen" },
          { href: "/spielarena", label: "Spielarena", icon: GiMeepleCircle, key: "spielarena" },
        ],
      },
    },
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
          { href: "/ludo-events", label: "Events & Spieletreffs", icon: FaCalendarAlt, key: "ludo-events" },
          { href: "/ludo-forum", label: "Forum", icon: MdForum, key: "ludo-forum" },
        ],
      },
    },
    { href: "/marketplace", label: "Spielemarkt", icon: FaStore, key: "spielemarkt" },
    {
      label: "Spielplatz",
      icon: FaDice,
      key: "spielplatz",
      dropdown: {
        items: [
          { href: "/spielhilfen", label: "Spielhilfen", icon: FaToolbox, key: "spielhilfen" },
          { href: "/spielarena", label: "Spielarena", icon: GiMeepleCircle, key: "spielarena" },
        ],
      },
    },
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
            pathname.startsWith("/ludo-forum"))) ||
        (item.key === "spielplatz" && (pathname.startsWith("/spielhilfen") || pathname.startsWith("/spielarena"))),
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

  const userAvatar = useMemo(() => {
    if (!user) return null
    if (user.avatar) return user.avatar
    return getAvatar(user.id, user.email)
  }, [user, avatarKey]) // Added avatarKey dependency

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
                      <button
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-sm transform hover:scale-105 hover:rotate-1 ${
                          active
                            ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                            : "text-gray-700 hover:bg-teal-400 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        <FaChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 font-body">
                      {item.dropdown.items.map((dropdownItem) => {
                        const DropdownIcon = dropdownItem.icon
                        return (
                          <DropdownMenuItem key={dropdownItem.key} asChild>
                            <Link
                              href={dropdownItem.href}
                              className="flex items-center space-x-2 cursor-pointer w-full"
                            >
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

              const active = isActive(item.href!, item.key)
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-handwritten text-sm transform hover:scale-105 hover:rotate-1 ${
                    active
                      ? "bg-teal-400 text-white shadow-lg rotate-1 border-2 border-teal-500"
                      : "text-gray-700 hover:bg-teal-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.key === "messages" && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse text-xs">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <GlobalSearch />
            {user && <NotificationBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 font-handwritten text-sm transform hover:scale-105 hover:-rotate-1 transition-all bg-transparent">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-teal-400">
                      <img
                        src={avatarSrc || "/placeholder.svg"}
                        alt={user.username || user.name}
                        className="w-full h-full object-cover"
                        key={`${avatarSrc}-${avatarKey}`}
                      />
                    </div>
                    <span className="text-gray-700 font-medium">{user.username || user.name || "Benutzer"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-sm font-body">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer w-full">
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
                <Link
                  href="/login"
                  className="border-2 border-teal-400 text-teal-800 hover:bg-teal-400 hover:text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all bg-white flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm"
                >
                  <FaSignInAlt className="w-4 h-4" />
                  <span>Anmelden</span>
                </Link>
                <Link
                  href="/register"
                  className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten transform hover:scale-105 hover:rotate-1 transition-all flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm"
                >
                  <FaUserPlus className="w-4 h-4" />
                  <span>Registrieren</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationBell />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
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
                          <Icon className="w-4 h-4 text-black" />
                          <span className="text-black">{item.label}</span>
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
                            className={`w-full flex items-center space-x-3 px-8 py-3 rounded-lg font-handwritten text-sm transform hover:scale-105 hover:rotate-1 transition-all ${
                              active
                                ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                                : "text-gray-700 hover:bg-teal-400 hover:text-white"
                            }`}
                          >
                            <DropdownIcon className="w-5 h-5" />
                            <span>{dropdownItem.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )
                }

                const active = isActive(item.href!, item.key)
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm transform hover:scale-105 hover:rotate-1 transition-all ${
                      active
                        ? "bg-teal-400 text-white rotate-1 border-2 border-teal-500 shadow-lg"
                        : "text-gray-700 hover:bg-teal-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.key === "messages" && unreadCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs ml-auto">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Mobile User Menu */}
              {user ? (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="px-4 py-2 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-400">
                      <img
                        src={avatarSrc || "/placeholder.svg"}
                        alt={user.username || user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.username || user.name || "Benutzer"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm text-gray-700 hover:bg-teal-400 hover:text-white"
                  >
                    <FaCog className="w-5 h-5" />
                    <span>Profil</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-handwritten text-sm text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="w-5 h-5" />
                    <span>Abmelden</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-2 px-4 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 border-2 border-teal-400 text-teal-800 hover:bg-teal-400 hover:text-white font-handwritten bg-transparent px-4 py-2 rounded-lg text-sm"
                  >
                    <FaSignInAlt className="w-4 h-4" />
                    <span>Anmelden</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 bg-teal-400 hover:bg-teal-500 text-white font-handwritten px-4 py-2 rounded-lg text-sm"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    <span>Registrieren</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export { Navigation }
export default Navigation
