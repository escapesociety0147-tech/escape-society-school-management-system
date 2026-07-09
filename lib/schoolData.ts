export type SchoolProfile = {
  name: string
  schoolId?: string
  type?: string
  establishedYear?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  email?: string
  phone?: string
  website?: string
  academicBoard?: string
  mediumOfInstruction?: string
  totalStudents?: number
  totalTeachers?: number
  classesOffered?: string[]
}

export const initialSchoolProfile: SchoolProfile = {
  name: '',
  schoolId: '',
  type: '',
  establishedYear: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  email: '',
  phone: '',
  website: '',
  academicBoard: '',
  mediumOfInstruction: '',
  totalStudents: 0,
  totalTeachers: 0,
  classesOffered: [],
}
