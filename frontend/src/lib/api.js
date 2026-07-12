import axios from "axios"
import { clearAuth, getToken } from "@/lib/auth"

const api = axios.create({
  baseURL: "/api",
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/"
      }
    }
    return Promise.reject(error)
  }
)

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toLowerCase()
  const config = {
    url: path.replace(/^\/api/, ""),
    method,
    headers: options.headers,
  }

  if (options.body) {
    config.data =
      typeof options.body === "string" ? JSON.parse(options.body) : options.body
  }

  if (options.responseType) {
    config.responseType = options.responseType
  }

  try {
    const response = await api.request(config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Request failed"
    throw new Error(message)
  }
}

export default api
