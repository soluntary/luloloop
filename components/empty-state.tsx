"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { 
  Gamepad2, 
  Users, 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  Search,
  BookOpen,
  Bell,
  Heart,
  Package
} from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  type?: "games" | "groups" | "events" | "offers" | "messages" | "search" | "notifications" | "favorites" | "generic"
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: ReactNode
}

const defaultConfigs = {
  games: {
    icon: <Gamepad2 className="w-12 h-12 text-orange-400" />,
    title: "Noch keine Spiele",
    description: "Füge dein erstes Spiel zu deiner Bibliothek hinzu und entdecke die Welt der Brettspiele!",
    actionLabel: "Spiel hinzufügen",
    actionHref: "/library"
  },
  groups: {
    icon: <Users className="w-12 h-12 text-green-500" />,
    title: "Keine Spielgruppen",
    description: "Tritt einer Spielgruppe bei oder erstelle deine eigene, um mit anderen zu spielen!",
    actionLabel: "Gruppen entdecken",
    actionHref: "/ludo-gruppen"
  },
  events: {
    icon: <Calendar className="w-12 h-12 text-purple-500" />,
    title: "Keine Events",
    description: "Erstelle ein Event oder entdecke Spieletreffs in deiner Nähe!",
    actionLabel: "Events entdecken",
    actionHref: "/ludo-events"
  },
  offers: {
    icon: <ShoppingBag className="w-12 h-12 text-amber-500" />,
    title: "Keine Angebote",
    description: "Erstelle ein Angebot oder durchstöbere den Marktplatz nach Spielen!",
    actionLabel: "Marktplatz besuchen",
    actionHref: "/marketplace"
  },
  messages: {
    icon: <MessageSquare className="w-12 h-12 text-blue-500" />,
    title: "Keine Nachrichten",
    description: "Du hast noch keine Nachrichten. Verbinde dich mit anderen Spielern!",
    actionLabel: "Mitglieder entdecken",
    actionHref: "/ludo-mitglieder"
  },
  search: {
    icon: <Search className="w-12 h-12 text-gray-400" />,
    title: "Keine Ergebnisse",
    description: "Versuche es mit anderen Suchbegriffen oder passe deine Filter an.",
    actionLabel: undefined,
    actionHref: undefined
  },
  notifications: {
    icon: <Bell className="w-12 h-12 text-teal-500" />,
    title: "Keine Benachrichtigungen",
    description: "Du bist auf dem neuesten Stand! Hier erscheinen neue Benachrichtigungen.",
    actionLabel: undefined,
    actionHref: undefined
  },
  favorites: {
    icon: <Heart className="w-12 h-12 text-red-400" />,
    title: "Keine Favoriten",
    description: "Markiere Spiele oder Angebote als Favoriten, um sie hier wiederzufinden.",
    actionLabel: "Marktplatz durchstöbern",
    actionHref: "/marketplace"
  },
  generic: {
    icon: <Package className="w-12 h-12 text-gray-400" />,
    title: "Keine Daten",
    description: "Hier gibt es noch nichts zu sehen.",
    actionLabel: undefined,
    actionHref: undefined
  }
}

export function EmptyState({
  type = "generic",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon
}: EmptyStateProps) {
  const config = defaultConfigs[type]
  
  const displayIcon = icon || config.icon
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayActionLabel = actionLabel || config.actionLabel
  const displayActionHref = actionHref || config.actionHref

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 p-4 bg-gray-50 rounded-full">
        {displayIcon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {displayDescription}
      </p>
      {(displayActionLabel && (displayActionHref || onAction)) && (
        onAction ? (
          <Button 
            onClick={onAction}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {displayActionLabel}
          </Button>
        ) : displayActionHref ? (
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href={displayActionHref}>
              {displayActionLabel}
            </Link>
          </Button>
        ) : null
      )}
    </div>
  )
}

// Compact version for inline use
export function EmptyStateInline({
  message = "Keine Daten vorhanden",
  icon
}: {
  message?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
      {icon || <Package className="w-5 h-5" />}
      <span className="text-sm">{message}</span>
    </div>
  )
}
