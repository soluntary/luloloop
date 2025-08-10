import { Users, BookOpen } from 'lucide-react'
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
              <span className="text-pink-600 font-bold transform rotate-1 font-handwritten">Community</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Loading Content */}
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce transform rotate-12">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Community wird geladen...
          </h2>
          <p className="text-xl text-gray-600 transform rotate-1 font-handwritten">
            Wir suchen die besten Communities für dich!
          </p>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 animate-pulse transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
