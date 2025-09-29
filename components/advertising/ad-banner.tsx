"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AdData {
  id: string
  title: string
  image: string
  link: string
  company: string
}

interface AdBannerProps {
  format: "leaderboard" | "billboard" | "medium-rectangle" | "wide-skyscraper" | "skyscraper" | "halfpage"
  ads: AdData[]
  rotationInterval?: number
  className?: string
}

const formatDimensions = {
  leaderboard: { width: 728, height: 90 },
  billboard: { width: 970, height: 250 },
  "medium-rectangle": { width: 300, height: 250 },
  "wide-skyscraper": { width: 160, height: 600 },
  skyscraper: { width: 120, height: 600 },
  halfpage: { width: 300, height: 600 },
}

export function AdBanner({ format, ads, rotationInterval = 8000, className }: AdBannerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const dimensions = formatDimensions[format]
  const currentAd = ads[currentAdIndex]

  // Rotate ads automatically
  useEffect(() => {
    if (ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [ads.length, rotationInterval])

  // Handle ad click
  const handleAdClick = () => {
    if (currentAd?.link) {
      window.open(currentAd.link, "_blank", "noopener,noreferrer")
    }
  }

  if (!currentAd || !isVisible) return null

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30 border border/50 rounded-lg",
        "hover:shadow-md transition-shadow duration-200",
        className,
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        minWidth: dimensions.width,
        minHeight: dimensions.height,
      }}
    >
      {/* Ad Content */}
      <div className="w-full h-full cursor-pointer group relative" onClick={handleAdClick}>
        <img
          src={currentAd.image || "/placeholder.svg"}
          alt={currentAd.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />

        {/* Overlay with company info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">{currentAd.company}</p>
        </div>

        {/* Ad indicator */}
        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">Ad</div>
      </div>

      {/* Rotation indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-1 left-1 flex space-x-1">
          {ads.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                index === currentAdIndex ? "bg-white" : "bg-white/50",
              )}
            />
          ))}
        </div>
      )}

      {/* Close button (optional) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsVisible(false)
        }}
        className="absolute top-1 left-1 w-4 h-4 bg-black/50 text-white text-xs rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        title="Anzeige schließen"
      >
        ×
      </button>
    </div>
  )
}
