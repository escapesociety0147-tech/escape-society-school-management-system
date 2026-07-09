export type StudentProfile = {
  id: number
  studentId?: string
  name: string
  email: string
  phone: string
  rollNumber: string
  grade: string
  section: string
  schoolId?: string
}

export const initialStudentProfile: StudentProfile = {
  id: 0,
  studentId: '',
  name: '',
  email: '',
  phone: '',
  rollNumber: '',
  grade: '',
  section: '',
  schoolId: '',
}
