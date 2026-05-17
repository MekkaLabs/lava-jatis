'use client'

import { useState, useEffect } from 'react'

/**
 * Delays updating the returned value until after `delay` ms have elapsed
 * since the last time `value` changed.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 300)
 *   useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
