import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { io } from "socket.io-client"
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCheck,
  Loader2,
  Settings,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatRelativeTime } from "@/data/mockNotifications"
import {
  clearReadNotifications,
  dismissNotification,
  fetchNotificationSummary,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service"
import { cn } from "@/lib/utils"

const categoryIcons = {
  at_risk: AlertTriangle,
  attendance: CalendarCheck,
  system: Settings,
}

const categoryColors = {
  at_risk: "bg-amber-50 text-amber-700 border-amber-200/80",
  attendance: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  system: "bg-violet-50 text-violet-700 border-violet-200/80",
}

function NotificationItem({ notification, onRead, onDismiss }) {
  const Icon = categoryIcons[notification.category] || Bell

  const handleClick = async () => {
    if (!notification.read) {
      await onRead(notification.id)
    }
  }

  const content = (
    <div
      className={cn(
        "group relative flex gap-3 rounded-xl p-3 transition-colors",
        notification.read ? "bg-transparent" : "bg-violet-50/60",
        notification.action?.path && "cursor-pointer hover:bg-violet-50"
      )}
      onClick={handleClick}
      role={notification.action?.path ? "button" : undefined}
      tabIndex={notification.action?.path ? 0 : undefined}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
          categoryColors[notification.category]
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", !notification.read && "font-semibold text-slate-900")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-violet-600" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss(notification.id)
        }}
        className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-600 group-hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )

  if (notification.action?.path) {
    return <Link to={notification.action.path}>{content}</Link>
  }

  return content
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchNotificationSummary()
      setUnreadCount(data.summary?.unread ?? 0)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data.notifications ?? [])
      await loadSummary()
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [loadSummary])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open, loadNotifications])

  useEffect(() => {
    const socket = io("/", { path: "/socket.io" })

    socket.on("notification:new", () => {
      loadSummary()
      if (open) loadNotifications()
    })

    socket.on("import:completed", () => {
      loadSummary()
      if (open) loadNotifications()
    })

    return () => socket.disconnect()
  }, [open, loadSummary, loadNotifications])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleDismiss = async (id) => {
    await dismissNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await loadSummary()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleClearRead = async () => {
    await clearReadNotifications()
    setNotifications((prev) => prev.filter((n) => !n.read))
    await loadSummary()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative size-8 rounded-lg"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-0 bg-violet-600 p-0 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-violet-100/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-lg text-slate-500 hover:text-violet-700"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5" />
              </Button>
            )}
            {notifications.some((n) => n.read) && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-lg text-slate-500 hover:text-violet-700"
                onClick={handleClearRead}
                title="Clear read notifications"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[min(420px,60vh)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-violet-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="size-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No notifications</p>
              <p className="text-xs text-slate-400">You&apos;re all caught up.</p>
            </div>
          ) : (
            <div className="divide-y divide-violet-100/60 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkRead}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-violet-100/80 px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full rounded-lg text-xs text-violet-700 hover:bg-violet-50 hover:text-violet-800"
            asChild
          >
            <Link to="/admin/settings?section=notifications" onClick={() => setOpen(false)}>
              <Settings className="size-3.5" />
              Notification settings
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
