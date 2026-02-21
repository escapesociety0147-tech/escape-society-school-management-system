import type { ReactNode } from 'react'
import StudentShell from '@/components/student/layout/StudentShell'

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>
}
