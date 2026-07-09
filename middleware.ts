import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  const userType = request.cookies.get('user_type')
  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/register/school',
    '/auth/register/teacher',
    '/auth/register/parent',
    '/auth/register/success',
    '/terms',
    '/privacy',
    '/api/auth',
  ]

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/students',
    '/parents',
    '/teachers',
    '/attendance',
    '/results',
    '/fees',
    '/reports',
    '/documents',
    '/notifications',
    '/messages',
    '/support',
    '/settings',
    '/profile',
    '/events',
    '/student',
  ]
  
  // Admin-only routes
  const adminRoutes = ['/admin']

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isTeacherRoute = path === '/teacher' || path.startsWith('/teacher/')
  const isParentRoute = path === '/parent' || path.startsWith('/parent/')
  const isStudentRoute = path === '/student' || path.startsWith('/student/')
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // Redirect to login if accessing protected route without token
  if ((isProtectedRoute || isTeacherRoute || isParentRoute || isStudentRoute || isAdminRoute) && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((path === '/auth/login' || path === '/auth/register') && token) {
    // Redirect based on user type
    if (userType?.value === 'teacher') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    } else if (userType?.value === 'parent') {
      return NextResponse.redirect(new URL('/parent/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check user type permissions
  if (token) {
    // Teachers can access only teacher routes
    if (userType?.value === 'teacher') {
      if (!isTeacherRoute) {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
    }

    // Parents can access only parent routes
    if (userType?.value === 'parent') {
      if (!isParentRoute) {
        return NextResponse.redirect(new URL('/parent/dashboard', request.url))
      }
    }

    // Students can access only student routes
    if (userType?.value === 'student') {
      if (!isStudentRoute) {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
    }

    // Regular users can't access teacher/parent/admin routes
    if (userType?.value === 'user' && (isTeacherRoute || isParentRoute || isStudentRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
