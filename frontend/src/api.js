const API_BASE = 'http://localhost:5001'

export async function fetchPubChem(name) {
  const res = await fetch(`${API_BASE}/pubchem/${encodeURIComponent(name)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Compound not found')
  return data
}

export async function predict(features) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Prediction failed')
  return data
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
