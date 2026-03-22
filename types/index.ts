export interface Student {
  id: string
  rollNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  bloodGroup?: string
  address: string
  city: string
  state: string
  country: string
  grade: string
  section: string
  admissionDate: string
  status: 'active' | 'inactive' | 'graduated'
  photoUrl?: string
  fatherName: string
  motherName: string
  emergencyContact: string
  createdAt: string
  updatedAt: string
}

export interface Teacher {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  qualification: string
  specialization: string[]
  experience: number
  department: string
  subjects: string[]
  joiningDate: string
  status: 'active' | 'inactive' | 'on_leave'
  address: string
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checkIn?: string
  checkOut?: string
  remarks?: string
  recordedBy: string
}

export interface ExamResult {
  id: string
  studentId: string
  examId: string
  subject: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  remarks?: string
  conductedBy: string
  examDate: string
}

export interface FeePayment {
  id: string
  studentId: string
  amount: number
  dueDate: string
  paidDate?: string
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'online'
  transactionId?: string
  status: 'paid' | 'unpaid' | 'overdue'
  description: string
  createdBy: string
}

export interface School {
  id: string
  name: string
  type: string
  establishedYear: number
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  phone: string
  email: string
  website?: string
  principalName: string
  affiliationNumber?: string
  logoUrl?: string
  status: 'active' | 'inactive'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  recipientId: string
  recipientType: 'student' | 'teacher' | 'parent' | 'all'
  read: boolean
  createdAt: string
}