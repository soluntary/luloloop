"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FaBell, FaCheck, FaTrash, FaExchangeAlt, FaStar, FaEnvelope, FaUserPlus, FaComments, FaBook, FaChartBar } from "react-icons/fa"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/app/actions/notifications"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    const result = await getUserNotifications()
    if (result.success) {
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead([notification.id])
    }

    // Navigate based on type
    switch (notification.type) {
      case "trade_match":
      case "trade_match_accepted":
        router.push("/marketplace")
        break
      case "ai_recommendation":
        router.push("/")
        break
      case "group_invitation":
        router.push("/ludo-gruppen")
        break
      case "event_invitation":
        router.push("/ludo-events")
        break
      case "new_message":
        router.push("/messages")
        break
      case "friend_request":
      case "friend_accepted":
        router.push("/ludo-mitglieder")
        break
      case "forum_reply":
      case "comment_reply":
        if (notification.data?.related_id) {
          router.push(`/ludo-forum/${notification.data.related_id}`)
        } else {
          router.push("/ludo-forum")
        }
        break
      case "game_shelf_request":
        router.push("/library")
        break
      case "poll_created":
        if (notification.data?.community_id) {
          router.push(`/ludo-gruppen?group=${notification.data.community_id}`)
        } else {
          router.push("/ludo-gruppen")
        }
        break
    }

    setOpen(false)
    loadNotifications()
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      toast.success("Alle Benachrichtigungen als gelesen markiert")
      loadNotifications()
    } else {
      toast.error("Fehler beim Markieren")
    }
    setLoading(false)
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    const result = await deleteNotification(notificationId)
    if (result.success) {
      toast.success("Benachrichtigung gelöscht")
      loadNotifications()
    } else {
      toast.error("Fehler beim Löschen")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trade_match":
      case "trade_match_accepted":
        return <FaExchangeAlt className="text-blue-500" />
      case "ai_recommendation":
        return <FaStar className="text-yellow-500" />
      case "new_message":
        return <FaEnvelope className="text-purple-500" />
      case "friend_request":
      case "friend_accepted":
        return <FaUserPlus className="text-green-500" />
      case "forum_reply":
      case "comment_reply":
        return <FaComments className="text-teal-500" />
      case "game_shelf_request":
        return <FaBook className="text-orange-500" />
      case "poll_created":
        return <FaChartBar className="text-indigo-500" />
      default:
        return <FaBell className="text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Gerade eben"
    if (diffMins < 60) return `vor ${diffMins}m`
    if (diffHours < 24) return `vor ${diffHours}h`
    if (diffDays < 7) return `vor ${diffDays}d`
    return date.toLocaleDateString("de-DE")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <FaBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={loading}>
              <FaCheck className="w-4 h-4 mr-1" />
              Alle gelesen
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Du bist auf dem neuesten Stand</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-4 cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3 w-full">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">{notification.title}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8"
                  onClick={(e) => handleDelete(e, notification.id)}
                >
                  <FaTrash className="w-3 h-3 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
