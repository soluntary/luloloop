"use client"

import { Loader2 } from "lucide-react"

export function PageLoading({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
        {title && <p className="text-gray-600 font-medium">{title}</p>}
      </div>
    </div>
  )
}
