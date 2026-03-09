/**
 * auth.ts — centralised API fetch with automatic JWT refresh
 * Drop this in: escape-society-school-management-system-dev/lib/auth.ts
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}

// ── Token helpers ─────────────────────────────────────────────────────────────

function getAccessToken(): string {
  return getCookie('auth_token')
}

function getRefreshToken(): string {
  return getCookie('refresh_token')
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Treat as expired 60 seconds before actual expiry to avoid edge cases
    return payload.exp * 1000 < Date.now() + 60_000
  } catch {
    return true
  }
}

// ── Token refresh ─────────────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token — please log in again.')

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      // Refresh failed — clear tokens and redirect to login
      deleteCookie('auth_token')
      deleteCookie('refresh_token')
      if (typeof window !== 'undefined') window.location.href = '/auth/login'
      throw new Error('Session expired. Please log in again.')
    }

    const data = await res.json()
    const newToken = data.access_token
    setCookie('auth_token', newToken)
    if (data.refresh_token) setCookie('refresh_token', data.refresh_token)
    return newToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// ── Main fetch wrapper ────────────────────────────────────────────────────────

/**
 * Drop-in replacement for fetch() that:
 *  1. Attaches the current JWT automatically
 *  2. Refreshes the token if expired before sending
 *  3. Retries once with the new token if the server returns 401
 *  4. Redirects to /auth/login if refresh also fails
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  let token = getAccessToken()

  // Proactively refresh if token is about to expire
  if (token && isTokenExpired(token)) {
    token = await refreshAccessToken()
  }

  const makeRequest = async (t: string) => {
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    })
  }

  let res = await makeRequest(token)

  // If 401, try refreshing once then retry
  if (res.status === 401) {
    try {
      token = await refreshAccessToken()
      res = await makeRequest(token)
    } catch {
      // refreshAccessToken already redirects — just rethrow
      throw new Error('Session expired. Please log in again.')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }

  // Return null for 204 No Content
  if (res.status === 204) return null
  return res.json()
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function logout() {
  deleteCookie('auth_token')
  deleteCookie('refresh_token')
  if (typeof window !== 'undefined') window.location.href = '/auth/login'
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}
