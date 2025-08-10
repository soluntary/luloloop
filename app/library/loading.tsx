import { BookOpen } from 'lucide-react'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-teal-400">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/ludoloop-logo.png"
                alt="Ludoloop Logo"
                width={300}
                height={80}
                className="h-16 md:h-20 w-auto"
                priority
              />
            </div>
            <nav className="hidden md:flex space-x-6">
              <span className="text-gray-400 font-medium font-handwritten">Login</span>
              <span className="text-gray-400 font-medium font-handwritten">Marktplatz</span>
              <span className="text-gray-400 font-medium font-handwritten">Spielgruppen</span>
              <span className="text-gray-400 font-medium font-handwritten">Community</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Loading Content */}
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Bibliothek wird geladen...
          </h2>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
            Deine Spiele werden aus dem Regal geholt!
          </p>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Loading Skeleton for Library */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Library Shelf Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-6 shadow-lg border-4 border-amber-300 animate-pulse">
              <div className="mb-6 text-center">
                <div className="h-8 bg-amber-300 rounded w-64 mx-auto"></div>
              </div>
              <div className="space-y-8">
                {[0, 1].map((shelfIndex) => (
                  <div key={shelfIndex} className="relative">
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-600 rounded-lg"></div>
                    <div className="flex gap-2 pb-4">
                      {[1, 2, 3].map((gameIndex) => (
                        <div key={gameIndex} className="flex-shrink-0">
                          <div className="w-24 h-32 bg-gray-300 rounded-t-lg"></div>
                          <div className="w-24 h-2 bg-gray-400 rounded-b-sm"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Details Panel Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 animate-pulse">
              <div className="text-center mb-4">
                <div className="w-32 h-40 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
