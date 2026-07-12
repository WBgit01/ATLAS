import { apiFetch } from "@/lib/api"
import { USE_MOCK_DATA } from "@/lib/useMockData"
import {
  mockClearReadNotifications,
  mockDismissNotification,
  mockFetchNotificationSummary,
  mockFetchNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
} from "@/data/mockApi"

export async function fetchNotifications(params = {}) {
  if (USE_MOCK_DATA) return mockFetchNotifications(params)

  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.category) query.set("category", params.category)
  if (params.unreadOnly) query.set("unreadOnly", "true")

  const qs = query.toString()
  return apiFetch(`/api/notifications${qs ? `?${qs}` : ""}`)
}

export async function fetchNotificationSummary() {
  if (USE_MOCK_DATA) return mockFetchNotificationSummary()
  return apiFetch("/api/notifications/summary")
}

export async function markNotificationRead(id) {
  if (USE_MOCK_DATA) return mockMarkNotificationRead(id)
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" })
}

export async function markAllNotificationsRead() {
  if (USE_MOCK_DATA) return mockMarkAllNotificationsRead()
  return apiFetch("/api/notifications/read-all", { method: "PATCH" })
}

export async function dismissNotification(id) {
  if (USE_MOCK_DATA) return mockDismissNotification(id)
  return apiFetch(`/api/notifications/${id}`, { method: "DELETE" })
}

export async function clearReadNotifications() {
  if (USE_MOCK_DATA) return mockClearReadNotifications()
  return apiFetch("/api/notifications/read", { method: "DELETE" })
}
