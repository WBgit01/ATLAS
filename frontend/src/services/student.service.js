import api from "@/lib/api"

export async function fetchStudents(params = {}) {
  const { data } = await api.get("/students", { params })
  return data
}

export async function fetchStudentFilters() {
  const { data } = await api.get("/students/filters")
  return data
}

export async function fetchStudentById(studentId) {
  const { data } = await api.get(`/students/${studentId}`)
  return data
}

export async function createStudent(payload) {
  const { data } = await api.post("/students", payload)
  return data
}

export async function updateStudent(studentId, payload) {
  const { data } = await api.put(`/students/${studentId}`, payload)
  return data
}

export async function updateEnrollmentStatus(studentId, enrollmentStatus) {
  const { data } = await api.patch(`/students/${studentId}/enrollment-status`, {
    enrollmentStatus,
  })
  return data
}
