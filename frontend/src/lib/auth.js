const TOKEN_KEY = "token"
const USER_KEY = "user"

function clearStorage(storage) {
  storage.removeItem(TOKEN_KEY)
  storage.removeItem(USER_KEY)
}

export function saveAuth({ token, user, remember = true }) {
  clearStorage(localStorage)
  clearStorage(sessionStorage)

  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearAuth() {
  clearStorage(localStorage)
  clearStorage(sessionStorage)
}

export function isAuthenticated() {
  return Boolean(getToken())
}
