"use client"

import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

interface DistanceBadgeProps {
  distance?: number | null
  className?: string
  showIcon?: boolean
  variant?: "default" | "secondary" | "outline"
}

export function DistanceBadge({ distance, className = "", showIcon = true, variant = "outline" }: DistanceBadgeProps) {
  if (!distance && distance !== 0) {
    return null
  }

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`
    } else if (km < 10) {
      return `${km.toFixed(1)}km`
    } else {
      return `${Math.round(km)}km`
    }
  }

  const getDistanceColor = (km: number): string => {
    if (km < 2) return "text-green-600 border-green-200 bg-green-50"
    if (km < 10) return "text-blue-600 border-blue-200 bg-blue-50"
    if (km < 50) return "text-orange-600 border-orange-200 bg-orange-50"
    return "text-gray-600 border-gray-200 bg-gray-50"
  }

  return (
    <Badge
      variant={variant}
      className={`${getDistanceColor(distance)} ${className} flex items-center gap-1 text-xs font-medium`}
    >
      {showIcon && <MapPin className="h-3 w-3" />}
      {formatDistance(distance)}
    </Badge>
  )
}
