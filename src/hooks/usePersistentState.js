import { useEffect, useRef, useState } from 'react'

const PREFIX = 'zull:v1:'

const read = (key, initial) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw != null) return JSON.parse(raw)
  } catch { /* ignore */ }
  return typeof initial === 'function' ? initial() : initial
}

// useState that mirrors to localStorage so data survives refresh.
// Safe on file:// (storage may throw) — falls back to in-memory.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch { /* ignore */ }
  }, [key, value])
  return [value, setValue]
}

export function clearPersisted() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
