import { Lock } from 'lucide-react'
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
              <span className="text-gray-400 font-medium font-handwritten">Community</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-xl border-2 border-purple-200 transform -rotate-1 animate-pulse">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <div className="h-8 bg-gray-200 rounded mb-4 w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-full mx-auto"></div>
            </div>

            {/* Form skeleton */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className="w-2 h-2 rounded-full bg-gray-200" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>

              <div className="h-12 bg-gray-200 rounded"></div>
            </div>

            <div className="mt-6 text-center">
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-8 right-8">
        <div className="bg-purple-400 text-white px-4 py-2 rounded-lg shadow-lg font-handwritten">
          Passwort-Reset wird geladen...
        </div>
      </div>
    </div>
  )
}
