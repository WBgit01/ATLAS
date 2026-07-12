import api from "@/lib/api"

export async function fetchDashboardAnalytics(params = {}) {
  const { data } = await api.get("/analytics/dashboard", { params })
  return data
}

export async function fetchAttendanceRecords(params = {}) {
  const { data } = await api.get("/analytics/records", { params })
  return data
}
