import { BookOpen } from 'lucide-react'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Image
            src="/images/ludoloop-logo.png"
            alt="Ludoloop Logo"
            width={200}
            height={50}
            className="h-12 w-auto mx-auto"
            priority
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 transform -rotate-1 font-handwritten">
          Ludoloop lädt...
        </h2>
        <p className="text-gray-600 transform rotate-1 font-handwritten">
          Deine Spiele werden vorbereitet!
        </p>
        <div className="mt-6 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
