const API_BASE = 'http://localhost:5001'

export async function fetchPubChem(name) {
  console.log('[fetchPubChem] called with:', JSON.stringify(name), 'length:', name.length)
  const url = `${API_BASE}/pubchem/${encodeURIComponent(name)}`
  console.log('[fetchPubChem] URL:', url)

  let res
  try {
    res = await fetch(url)
  } catch (e) {
    console.error('[fetchPubChem] network error:', e)
    throw new Error('Cannot reach backend on port 5001')
  }
  console.log('[fetchPubChem] status:', res.status, 'ok:', res.ok)

  const text = await res.text()
  console.log('[fetchPubChem] body:', text)

  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    console.error('[fetchPubChem] JSON parse failed:', e)
    throw new Error('Invalid response from backend')
  }
  if (!res.ok) throw new Error(data.error || 'Compound not found')
  return data
}

export async function predict(features) {
  console.log('[predict] features:', features)
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Prediction failed')
  return data
}

export async function fetchSuggestions(query) {
  if (!query) return []
  try {
    if (query.length < 3) {
      const res = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}`)
      if (!res.ok) return []
      return await res.json()
    }
    const res = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/json?limit=7`
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.dictionary_terms?.compound ?? []
  } catch {
    return []
  }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
