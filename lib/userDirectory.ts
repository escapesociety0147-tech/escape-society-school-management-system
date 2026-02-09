import { normalizeEmail } from '@/lib/authStore'
import type { ThreadParticipant, UserRole } from '@/lib/messagesData'

export type ProfileField = {
  label: string
  value: string
}

export type UserProfileSnapshot = {
  name: string
  role: string
  email?: string
  fields: ProfileField[]
}

const safeParse = (value: string | null) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const safeParseArray = (value: string | null) => {
  const parsed = safeParse(value)
  return Array.isArray(parsed) ? parsed : []
}

const matchByEmailOrName = <T extends { email?: string; name?: string }>(
  list: T[],
  email: string,
  name: string
) => {
  if (email) {
    const match = list.find(
      (item) => normalizeEmail(item.email || '') === normalizeEmail(email)
    )
    if (match) return match
  }
  if (name) {
    return list.find((item) => (item.name || '').toLowerCase() === name.toLowerCase())
  }
  return null
}

export const resolveUserProfile = (participant: ThreadParticipant): UserProfileSnapshot | null => {
  if (typeof window === 'undefined') return null
  const role: UserRole = participant.role
  const email = participant.email || ''
  const name = participant.name || ''

  if (role === 'admin') {
    const adminProfile = safeParse(localStorage.getItem('esm_profile')) || {}
    const schoolProfile = safeParse(localStorage.getItem('esm_school_profile')) || {}
    const fields: ProfileField[] = [
      adminProfile.email || email
        ? { label: 'Email', value: adminProfile.email || email }
        : null,
      adminProfile.phone
        ? { label: 'Phone', value: adminProfile.phone }
        : null,
      schoolProfile.schoolId
        ? { label: 'School ID', value: String(schoolProfile.schoolId) }
        : null,
    ].filter(Boolean) as ProfileField[]

    return {
      name: adminProfile.name || name || 'Administrator',
      role: adminProfile.role || 'School Admin',
      email: adminProfile.email || email,
      fields,
    }
  }

  if (role === 'teacher') {
    const teachers = safeParseArray(localStorage.getItem('esm_teachers'))
    const match = matchByEmailOrName(teachers, email, name)
    const fields: ProfileField[] = [
      match?.empId ? { label: 'Employee ID', value: match.empId } : null,
      match?.department ? { label: 'Department', value: match.department } : null,
      match?.subjects?.length
        ? { label: 'Subjects', value: match.subjects.join(', ') }
        : null,
      match?.phone ? { label: 'Phone', value: match.phone } : null,
      match?.schoolId ? { label: 'School ID', value: String(match.schoolId) } : null,
    ].filter(Boolean) as ProfileField[]

    return {
      name: match?.name || name || 'Teacher',
      role: match?.department ? `${match.department} Teacher` : participant.title || 'Teacher',
      email: match?.email || email,
      fields,
    }
  }

  if (role === 'parent') {
    const parents = safeParseArray(localStorage.getItem('esm_parents'))
    const match = matchByEmailOrName(parents, email, name)
    const linkedCount = Array.isArray(match?.linkedStudentIds)
      ? match.linkedStudentIds.length
      : 0
    const fields: ProfileField[] = [
      match?.parentId ? { label: 'Parent ID', value: match.parentId } : null,
      match?.relationship ? { label: 'Relationship', value: match.relationship } : null,
      match?.phone ? { label: 'Phone', value: match.phone } : null,
      match?.schoolId ? { label: 'School ID', value: String(match.schoolId) } : null,
      { label: 'Linked Students', value: String(linkedCount) },
    ].filter(Boolean) as ProfileField[]

    return {
      name: match?.name || name || 'Parent',
      role: participant.title || 'Parent / Guardian',
      email: match?.email || email,
      fields,
    }
  }

  if (role === 'student') {
    const students = safeParseArray(localStorage.getItem('esm_students'))
    const match = matchByEmailOrName(students, email, name)
    const fields: ProfileField[] = [
      match?.studentId ? { label: 'Student ID', value: match.studentId } : null,
      match?.rollNumber ? { label: 'Roll Number', value: match.rollNumber } : null,
      match?.grade ? { label: 'Grade', value: match.grade } : null,
      match?.section ? { label: 'Section', value: match.section } : null,
      match?.contact ? { label: 'Phone', value: match.contact } : null,
      match?.schoolId ? { label: 'School ID', value: String(match.schoolId) } : null,
    ].filter(Boolean) as ProfileField[]

    return {
      name: match?.name || name || 'Student',
      role: participant.title || 'Student',
      email: match?.email || email,
      fields,
    }
  }

  return null
}
