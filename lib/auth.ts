import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  schoolId?: string
  avatar?: string
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')
  
  if (!token) return null

  try {
    // In a real app, you would validate the token with your backend
    // Local implementation without a backend session validator.
    const userData = cookieStore.get('user_data')
    
    if (userData) {
      return JSON.parse(userData.value) as User
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    if (email && password) {
      const user: User = {
        id: email,
        email,
        name: email.split('@')[0],
        role: 'admin',
      }
      const token = `tok_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`

      return { user, token }
    }
    
    return null
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export async function logout(): Promise<void> {
  // Clear auth cookies
  const cookieStore = cookies()
  cookieStore.delete('auth_token')
  cookieStore.delete('user_data')
  cookieStore.delete('user_type')
}

export function hasPermission(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    teacher: 3,
    parent: 2,
    student: 1,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}
