import { useState, useCallback, useEffect } from 'react'

const KEY = 'neuroshield_history'
const MAX = 50

function load() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(entries) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entries))
  } catch {}
}

export function useSessionHistory() {
  const [entries, setEntries] = useState(load)

  useEffect(() => {
    save(entries)
  }, [entries])

  const addEntry = useCallback((name, features, result, source = 'Single') => {
    setEntries((prev) => {
      // Deduplicate by name+source (keep latest)
      const filtered = prev.filter(
        (e) => !(e.name === name && e.source === source)
      )
      const entry = {
        id: Date.now(),
        name,
        features: { ...features },
        result: { ...result },
        source,
        timestamp: Date.now(),
      }
      return [entry, ...filtered].slice(0, MAX)
    })
  }, [])

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
  }, [])

  return { entries, addEntry, removeEntry, clearHistory }
}
