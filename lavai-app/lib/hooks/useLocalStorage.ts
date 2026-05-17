'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * SSR-safe localStorage hook.
 * Falls back to `initialValue` if localStorage is not available (SSR, private mode).
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark')
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        if (e.newValue !== null) {
          setStoredValue(JSON.parse(e.newValue) as T)
        } else {
          setStoredValue(initialValue)
        }
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, initialValue])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue(prev => {
          const next = typeof value === 'function'
            ? (value as (prev: T) => T)(prev)
            : value
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next))
          }
          return next
        })
      } catch {}
    },
    [key]
  )

  return [storedValue, setValue]
}
