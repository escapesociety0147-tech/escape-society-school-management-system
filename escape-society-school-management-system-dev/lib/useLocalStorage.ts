import { useEffect, useRef, useState } from 'react'

const storageEventName = 'local-storage-sync'

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue)
  const [state, setState] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)
  const lastSerializedRef = useRef<string | null>(null)
  const sourceIdRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `ls_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`
  )
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        setState(JSON.parse(stored) as T)
        lastSerializedRef.current = stored
      } else {
        setState(initialRef.current)
        lastSerializedRef.current = JSON.stringify(initialRef.current)
      }
    } catch {
      setState(initialRef.current)
      try {
        lastSerializedRef.current = JSON.stringify(initialRef.current)
      } catch {
        lastSerializedRef.current = null
      }
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      const serialized = JSON.stringify(state)
      if (serialized === lastSerializedRef.current) return
      lastSerializedRef.current = serialized
      localStorage.setItem(key, serialized)
      window.dispatchEvent(
        new CustomEvent(storageEventName, {
          detail: { key, value: serialized, source: sourceIdRef.current },
        })
      )
    } catch {
      // Ignore write errors (storage full / blocked)
    }
  }, [key, state, hydrated])

  useEffect(() => {
    if (!hydrated) return
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      if (!event.newValue) return
      if (event.newValue === lastSerializedRef.current) return
      lastSerializedRef.current = event.newValue
      try {
        setState(JSON.parse(event.newValue) as T)
      } catch {
        // ignore parse errors
      }
    }
    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; value?: string; source?: string }>).detail
      if (!detail || detail.key !== key) return
      if (detail.source === sourceIdRef.current) return
      try {
        const nextValue = detail.value ?? localStorage.getItem(key)
        if (!nextValue) return
        if (nextValue === lastSerializedRef.current) return
        const currentSerialized = (() => {
          try {
            return JSON.stringify(stateRef.current)
          } catch {
            return null
          }
        })()
        if (currentSerialized && currentSerialized === nextValue) {
          lastSerializedRef.current = nextValue
          return
        }
        lastSerializedRef.current = nextValue
        setState(JSON.parse(nextValue) as T)
      } catch {
        // ignore parse errors
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener(storageEventName, handleCustom)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(storageEventName, handleCustom)
    }
  }, [hydrated, key])

  const reset = () => setState(initialRef.current)

  return [state, setState, reset, hydrated] as const
}
