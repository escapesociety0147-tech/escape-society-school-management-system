export type ToastVariant = 'success' | 'info' | 'warning' | 'error'

export type ToastPayload = {
  title: string
  message?: string
  variant?: ToastVariant
  durationMs?: number
}

export const toastEventName = 'esm-toast'

export function pushToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(toastEventName, { detail: payload }))
}
