import api from "@/lib/api"

export async function fetchSettings() {
  const { data } = await api.get("/reports/settings")
  return data
}

export async function saveSettings(settings) {
  const { data } = await api.put("/reports/settings", { settings })
  return data
}

export async function exportAttendanceExcel(params = {}) {
  const { data } = await api.get("/reports/attendance/excel", {
    params,
    responseType: "blob",
  })
  return data
}

export async function exportAttendancePdf(params = {}) {
  const { data } = await api.get("/reports/attendance/pdf", {
    params,
    responseType: "blob",
  })
  return data
}

export async function fetchAuditLogs(params = {}) {
  const { data } = await api.get("/reports/audit-logs", { params })
  return data
}
