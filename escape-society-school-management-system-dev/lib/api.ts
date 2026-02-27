const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Something went wrong' }))
    throw new Error(error.detail || 'Request failed')
  }
  return res.json()
}

export const auth = {
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
}

export const stats = {
  get: () => request<any>('/stats'),
}

export const students = {
  list: (school_id?: string) => request<any[]>(`/students${school_id ? `?school_id=${school_id}` : ''}`),
  get: (id: number) => request<any>(`/students/${id}`),
  create: (data: any) => request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/students/${id}`, { method: 'DELETE' }),
}

export const teachers = {
  list: (school_id?: string) => request<any[]>(`/teachers${school_id ? `?school_id=${school_id}` : ''}`),
  create: (data: any) => request<any>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/teachers/${id}`, { method: 'DELETE' }),
}

export const parents = {
  list: () => request<any[]>('/parents'),
  create: (data: any) => request<any>('/parents', { method: 'POST', body: JSON.stringify(data) }),
}

export const attendance = {
  list: (student_id?: number) => request<any[]>(`/attendance${student_id ? `?student_id=${student_id}` : ''}`),
  record: (data: any) => request<any>('/attendance', { method: 'POST', body: JSON.stringify(data) }),
}

export const results = {
  list: (student_id?: number) => request<any[]>(`/results${student_id ? `?student_id=${student_id}` : ''}`),
  create: (data: any) => request<any>('/results', { method: 'POST', body: JSON.stringify(data) }),
}

export const payments = {
  list: (student_id?: number) => request<any[]>(`/payments${student_id ? `?student_id=${student_id}` : ''}`),
  create: (data: any) => request<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),
}

export const events = {
  list: (school_id?: string) => request<any[]>(`/events${school_id ? `?school_id=${school_id}` : ''}`),
  create: (data: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/events/${id}`, { method: 'DELETE' }),
}

const api = { auth, stats, students, teachers, parents, attendance, results, payments, events }
export default api
