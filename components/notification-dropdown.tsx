"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, MessageCircle, Users, MessageSquare, BookOpen, Calendar, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import EventInvitationsDialog from "./event-invitations-dialog"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type:
    | "friend_request"
    | "friend_accepted"
    | "forum_reply"
    | "comment_reply"
    | "game_shelf_request"
    | "message"
    | "event_invitation"
    | "poll_created"
  title: string
  message: string
  created_at: string
  read: boolean
  data?: any
}

interface NotificationDropdownProps {
  className?: string
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { user } = useAuth() || { user: null }
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showEventInvitations, setShowEventInvitations] = useState(false)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] NotificationDropdown useEffect triggered, user:", user?.id)
    if (user) {
      console.log("[v0] User is logged in, loading notifications and setting up realtime")
      loadNotifications()
      setupRealtimeSubscription()
    } else {
      console.log("[v0] No user logged in, skipping notification setup")
    }
  }, [user])

  const setupRealtimeSubscription = async () => {
    if (!user) {
      console.log("[v0] setupRealtimeSubscription: No user, aborting")
      return
    }

    console.log("[v0] Setting up realtime subscription for user:", user.id)
    const supabase = await createClient()

    // Subscribe to INSERT events on notifications table for this user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[v0] New notification received via realtime:", payload)
          const newNotification = payload.new as Notification

          // Only add if it's unread
          if (!newNotification.read) {
            console.log("[v0] Adding new notification to state:", newNotification.title)
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            })

            // Play notification sound (optional)
            playNotificationSound()
          } else {
            console.log("[v0] Notification is already read, skipping")
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[v0] Notification updated via realtime:", payload)
          const updatedNotification = payload.new as Notification

          // If notification was marked as read, remove it from the list
          if (updatedNotification.read) {
            console.log("[v0] Notification marked as read, removing from list:", updatedNotification.id)
            setNotifications((prev) => prev.filter((n) => n.id !== updatedNotification.id))
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Realtime subscription status:", status)
      })

    console.log("[v0] Realtime subscription channel created:", channel)

    // Cleanup subscription on unmount
    return () => {
      console.log("[v0] Cleaning up realtime subscription")
      supabase.removeChannel(channel)
    }
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3")
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log("[v0] Could not play notification sound:", error)
      })
    } catch (error) {
      console.log("[v0] Error playing notification sound:", error)
    }
  }

  const loadNotifications = async () => {
    if (!user) {
      console.log("[v0] loadNotifications: No user, aborting")
      return
    }

    console.log("[v0] Loading notifications for user:", user.id)
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          created_at,
          read,
          data
        `)
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[v0] Error loading notifications:", error)
        return
      }

      console.log("[v0] Notifications loaded from database:", data?.length || 0, "notifications")
      console.log("[v0] Notification data:", data)

      const processedNotifications =
        data?.map((notification) => ({
          ...notification,
          related_id: notification.data?.related_id || null,
        })) || []

      setNotifications(processedNotifications)
      setUnreadCount(processedNotifications.length || 0)
      console.log("[v0] Notifications state updated, unread count:", processedNotifications.length)
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const supabase = await createClient()
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", user.id)

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const supabase = await createClient()
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
      case "friend_accepted":
        return <Users className="w-4 h-4 text-blue-500" />
      case "forum_reply":
      case "comment_reply":
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case "game_shelf_request":
        return <BookOpen className="w-4 h-4 text-purple-500" />
      case "message":
        return <MessageCircle className="w-4 h-4 text-orange-500" />
      case "event_invitation":
        return <Calendar className="w-4 h-4 text-teal-500" />
      case "poll_created":
        return <BarChart3 className="w-4 h-4 text-cyan-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    // Extract related_id from data if available
    const relatedId = notification.data?.related_id || notification.data?.post_id || notification.data?.thread_id

    switch (notification.type) {
      case "friend_request":
        // Go to Mitglieder page where friend requests are shown
        if (notification.data?.from_user_id) {
          window.location.href = `/ludo-mitglieder?user=${notification.data.from_user_id}`
        } else {
          window.location.href = "/ludo-mitglieder"
        }
        break
      case "friend_accepted":
        // Go to the profile of the user who accepted
        if (notification.data?.from_user_id) {
          window.location.href = `/ludo-mitglieder?user=${notification.data.from_user_id}`
        } else {
          window.location.href = "/ludo-mitglieder"
        }
        break
      case "forum_reply":
      case "comment_reply":
        if (relatedId) {
          window.location.href = `/ludo-forum/${relatedId}`
        } else if (notification.data?.forum_post_id) {
          window.location.href = `/ludo-forum/${notification.data.forum_post_id}`
        } else {
          window.location.href = "/ludo-forum"
        }
        break
      case "game_shelf_request":
        window.location.href = "/library"
        break
      case "message":
        // Navigate to messages with specific conversation if available
        if (notification.data?.conversation_id) {
          window.location.href = `/messages?conversation=${notification.data.conversation_id}`
        } else if (notification.data?.sender_id) {
          window.location.href = `/messages?user=${notification.data.sender_id}`
        } else if (notification.data?.from_user_id) {
          window.location.href = `/messages?user=${notification.data.from_user_id}`
        } else {
          window.location.href = "/messages"
        }
        break
      case "event_invitation":
        setHighlightedEventId(notification.data?.event_id || null)
        setShowEventInvitations(true)
        break
      case "poll_created":
        if (notification.data?.community_id) {
          window.location.href = `/ludo-gruppen?group=${notification.data.community_id}`
        } else {
          window.location.href = "/ludo-gruppen"
        }
        break
      default:
        // Fallback: try to use any available URL or related_id
        if (notification.data?.url) {
          window.location.href = notification.data.url
        } else if (relatedId) {
          window.location.href = `/profile/${relatedId}`
        }
        break
    }
    setIsOpen(false)
  }

  const handleInvitationUpdate = () => {
    loadNotifications()
  }

  if (!user) return null

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative p-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 transform hover:scale-105 hover:-rotate-1 transition-all ${className}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-teal-600 hover:text-teal-700"
              >
                Alle als gelesen markieren
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-left text-xs">Du bist auf dem neuesten Stand</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className="p-3 cursor-pointer hover:bg-gray-50 bg-blue-50 border-l-4 border-l-blue-500"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-900 truncate">{notification.title}</p>
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <DropdownMenuSeparator />}
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <EventInvitationsDialog
          userId={user.id}
          isOpen={showEventInvitations}
          onClose={() => {
            setShowEventInvitations(false)
            setHighlightedEventId(null)
          }}
          onUpdate={handleInvitationUpdate}
          highlightedEventId={highlightedEventId}
        />
      )}
    </>
  )
}
