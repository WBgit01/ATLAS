import api from "@/lib/api"

export async function login(credentials) {
  const { data } = await api.post("/auth/login", credentials)
  return data
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me")
  return data
}
