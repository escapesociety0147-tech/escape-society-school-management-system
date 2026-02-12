export type TeacherClass = {
  id: number
  grade: string
  section: string
  subject: string
  room: string
  schedule: string
  students: number
  createdAt?: string
}

export type TeacherAssignment = {
  id: number
  classId: number
  title: string
  dueDate: string
  status: 'Open' | 'Closed'
  submissions: number
  total: number
  description: string
  createdAt?: string
}

export type TeacherGradeEntry = {
  id: number
  classId: number
  studentId: number
  studentName: string
  subject: string
  assignment: string
  score: number
  maxScore: number
  grade: string
  date: string
}

export type TeacherAttendanceRecord = {
  id: number
  classId: number
  date: string
  present: number
  absent: number
  note: string
  entries: {
    studentId: number
    name: string
    status: 'Present' | 'Absent'
  }[]
}

export const initialTeacherClasses: TeacherClass[] = []

export const initialTeacherAssignments: TeacherAssignment[] = []

export const initialTeacherGradebook: TeacherGradeEntry[] = []

export const initialTeacherAttendanceHistory: TeacherAttendanceRecord[] = []

export type ParentChild = {
  id: number
  name: string
  studentId: string
  grade: string
  section: string
  homeroom: string
  status: 'Active' | 'Inactive'
  attendanceRate: number
  averageGrade: number
}

export type ParentAttendanceRecord = {
  id: number
  childId: number
  date: string
  status: 'Present' | 'Absent' | 'Excused'
  note: string
  acknowledged: boolean
}

export type ParentFeeRecord = {
  id: number
  childId: number
  term: string
  amount: number
  paid: number
  dueDate: string
  status: 'Paid' | 'Partial' | 'Due'
}

export type ParentResultRecord = {
  id: number
  childId: number
  term: string
  subject: string
  score: number
  grade: string
  date: string
  teacher: string
  comment: string
  acknowledged: boolean
}

export type ParentDocument = {
  id: number
  childId: number
  title: string
  category: string
  type: string
  date: string
  status: 'Read' | 'Unread'
}

export const initialParentChildren: ParentChild[] = []

export const initialParentAttendance: ParentAttendanceRecord[] = []

export const initialParentFees: ParentFeeRecord[] = []

export const initialParentResults: ParentResultRecord[] = []

export const initialParentDocuments: ParentDocument[] = []
