import api from "@/lib/api"

export async function fetchUploadHistory() {
  const { data } = await api.get("/imports")
  return { uploads: normalizeUploads(data) }
}

export async function uploadImportFile(file, createUnmatched = true) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("createUnmatched", String(createUnmatched))

  const { data } = await api.post("/imports/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return data
}

function normalizeUploads(items) {
  return (items || []).map((item) => ({
    id: item._id,
    fileName: item.fileName,
    status: item.status === "completed" ? "success" : item.status === "failed" ? "failed" : item.status,
    recordCount: item.totalRecords ?? item.matchedStudents ?? 0,
    fileSizeLabel: "",
    uploadedAt: item.createdAt,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    matchedStudents: item.matchedStudents,
    unmatchedStudents: item.unmatchedStudents,
    anomaliesDetected: item.anomaliesDetected,
    uploadedBy: item.uploadedBy,
    summary: item.summary,
  }))
}

export function formatUploadTimestamp(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
