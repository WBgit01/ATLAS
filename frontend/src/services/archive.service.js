import api from "@/lib/api"

export async function fetchArchivedStudents(params = {}) {
  const { data } = await api.get("/students/archive", { params })
  return data
}

export async function fetchArchiveSummary() {
  const { data } = await api.get("/students/archive/summary")
  return data
}
