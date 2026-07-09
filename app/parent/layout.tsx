import type { ReactNode } from 'react'
import ParentShell from '@/components/parent/layout/ParentShell'

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <ParentShell>{children}</ParentShell>
}
