"use client"

import { User, LogOut, UserPlus, LogIn, Menu, X, Mail } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useMessages } from "@/contexts/messages-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface NavigationProps {
  currentPage?: 'home' | 'library' | 'marketplace' | 'groups' | 'login' | 'about' | 'messages' | 'profile'
}

export function Navigation({ currentPage = 'home' }: NavigationProps) {
  const { user, signOut, loading } = useAuth()
  const { getUnreadCount } = useMessages()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      // Always redirect to home page, regardless of signOut success
      router.push('/')
    
      // Only attempt to sign out if user exists
      if (user && signOut) {
        await signOut()
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // Error is logged but doesn't prevent redirect
    }
  }

  const unreadCount = mounted && user ? getUnreadCount(user.name) : 0

  // Show loading state for user-dependent content only
  const showUserContent = mounted && !loading

  return (
    <header className="bg-white shadow-lg border-b-4 border-teal-400">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/images/ludoloop-logo.png"
              alt="Ludoloop Logo"
              width={300}
              height={80}
              className="h-16 md:h-20 w-auto"
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-8">
            {/* Centered Navigation Items */}
            <nav className="flex items-center justify-center space-x-6 lg:space-x-8 flex-1">
              <Link 
                href="/" 
                className={`font-medium font-handwritten text-sm lg:text-base ${
                  currentPage === 'home' 
                    ? 'text-blue-600 font-bold transform rotate-1' 
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                Home
              </Link>

              <Link 
                href="/marketplace" 
                className={`font-medium font-handwritten text-sm lg:text-base ${
                  currentPage === 'marketplace' 
                    ? 'text-orange-600 font-bold transform rotate-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                Marktplatz
              </Link>
              
              <Link 
                href="/groups" 
                className={`font-medium font-handwritten text-sm lg:text-base ${
                  currentPage === 'groups' 
                    ? 'text-pink-600 font-bold transform rotate-1' 
                    : 'text-gray-700 hover:text-pink-500'
                }`}
              >
                Community
              </Link>

              {showUserContent && user ? (
                <>
                  <Link 
                    href="/library" 
                    className={`font-medium font-handwritten text-sm lg:text-base ${
                      currentPage === 'library' 
                        ? 'text-teal-600 font-bold transform rotate-1' 
                        : 'text-gray-700 hover:text-teal-600'
                    }`}
                  >
                    Meine Bibliothek
                  </Link>
                  
                  <Link 
                    href="/messages" 
                    className={`font-medium font-handwritten text-sm lg:text-base relative ${
                      currentPage === 'messages' 
                        ? 'text-purple-600 font-bold transform rotate-1' 
                        : 'text-gray-700 hover:text-purple-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-handwritten">Posteingang</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <Link 
                  href="/about" 
                  className={`font-medium font-handwritten text-sm lg:text-base ${
                    currentPage === 'about' 
                      ? 'text-teal-600 font-bold transform rotate-1' 
                      : 'text-gray-700 hover:text-teal-500'
                  }`}
                >
                  Über uns
                </Link>
              )}
            </nav>

            {/* Right-aligned User Section */}
            <div className="flex items-center space-x-4">
              {showUserContent && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 font-handwritten text-sm lg:text-base p-2 hover:bg-gray-50 rounded-lg">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
                        alt={user.name}
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-teal-400 shadow-sm"
                      />
                      <span className="hidden lg:inline text-gray-700">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild className="font-body">
                      <Link href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        Profil bearbeiten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="font-body text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/login" 
                    className={`font-medium font-handwritten text-sm lg:text-base flex items-center ${
                      currentPage === 'login' 
                        ? 'text-teal-600 font-bold transform rotate-1' 
                        : 'text-gray-700 hover:text-teal-600'
                    }`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-handwritten text-sm lg:text-base transition-colors flex items-center"
                  > 
                    <UserPlus className="w-4 h-4 mr-2" />
                    Registrieren
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <Link 
                href="/" 
                className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                  currentPage === 'home' 
                    ? 'text-blue-600 font-bold bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-500 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>

              <Link 
                href="/marketplace" 
                className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                  currentPage === 'marketplace' 
                    ? 'text-orange-600 font-bold bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-500 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Marktplatz
              </Link>
              
              <Link 
                href="/groups" 
                className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                  currentPage === 'groups' 
                    ? 'text-pink-600 font-bold bg-pink-50' 
                    : 'text-gray-700 hover:text-pink-500 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Community
              </Link>

              {showUserContent && user ? (
                <>
                  <Link 
                    href="/library" 
                    className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                      currentPage === 'library' 
                        ? 'text-teal-600 font-bold bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Meine Bibliothek
                  </Link>
                  
                  <Link 
                    href="/messages" 
                    className={`font-medium font-handwritten px-3 py-2 rounded text-base flex items-center justify-between ${
                      currentPage === 'messages' 
                        ? 'text-purple-600 font-bold bg-purple-50' 
                        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>Posteingang</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/profile" 
                    className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                      currentPage === 'profile' 
                        ? 'text-purple-600 font-bold bg-purple-50' 
                        : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profil bearbeiten
                  </Link>
                </>
              ) : (
                <Link 
                  href="/about" 
                  className={`font-medium font-handwritten px-3 py-2 rounded text-base ${
                    currentPage === 'about' 
                      ? 'text-teal-600 font-bold bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-500 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Über uns
                </Link>
              )}

              {showUserContent && user ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-teal-400 shadow-sm"
                    />
                    <span className="font-handwritten font-medium text-gray-700 text-base">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-handwritten text-base"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </Button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                  <Link 
                    href="/login" 
                    className={`font-medium font-handwritten px-3 py-2 rounded text-base block flex items-center ${
                      currentPage === 'login' 
                        ? 'text-teal-600 font-bold bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-base font-handwritten block text-center transition-colors flex items-center justify-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Registrieren
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
