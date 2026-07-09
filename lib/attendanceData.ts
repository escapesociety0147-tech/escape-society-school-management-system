export type AttendanceHistoryRecord = {
  id: string
  date: string
  dateISO: string
  grade: string
  section: string
  present: number
  absent: number
  attendance: Record<number, 'present' | 'absent'>
  note?: string
}

export const initialAttendanceHistory: AttendanceHistoryRecord[] = []
