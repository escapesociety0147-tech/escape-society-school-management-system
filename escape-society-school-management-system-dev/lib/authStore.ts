export type AuthRole = 'admin' | 'teacher' | 'parent' | 'student'

export type AuthUser = {
  id: string
  role: AuthRole
  name: string
  email: string
  password: string
  createdAt: string
}

const USERS_KEY = 'esm_users'

const safeParse = (value: string | null) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const loadUsers = (): AuthUser[] => {
  if (typeof window === 'undefined') return []
  return safeParse(localStorage.getItem(USERS_KEY)) as AuthUser[]
}

export const saveUsers = (users: AuthUser[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tok_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `usr_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const registerUser = (payload: {
  role: AuthRole
  name: string
  email: string
  password: string
}) => {
  const users = loadUsers()
  const normalizedEmail = normalizeEmail(payload.email)
  const exists = users.find((user) => normalizeEmail(user.email) === normalizedEmail)
  if (exists) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  const user: AuthUser = {
    id: generateId(),
    role: payload.role,
    name: payload.name,
    email: payload.email.trim(),
    password: payload.password,
    createdAt: new Date().toISOString(),
  }
  saveUsers([user, ...users])
  return { ok: true, user }
}

export const authenticateUser = (email: string, password: string) => {
  const users = loadUsers()
  const normalizedEmail = normalizeEmail(email)
  const match = users.find((user) => normalizeEmail(user.email) === normalizedEmail)
  if (!match) {
    return { ok: false, error: 'No account found for this email.' }
  }
  if (match.password !== password) {
    return { ok: false, error: 'Incorrect password.' }
  }
  return { ok: true, user: match }
}
