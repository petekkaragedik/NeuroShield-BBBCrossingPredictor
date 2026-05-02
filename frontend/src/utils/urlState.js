// URL State Management for Shareable Results

/**
 * Encode single compound state into URL query params
 */
export function encodeSingleCompoundURL(compoundName, features, mode = 'single') {
  const params = new URLSearchParams()

  if (mode !== 'single') {
    params.set('mode', mode)
  }

  if (compoundName) {
    params.set('compound', compoundName)
  }

  params.set('mw', features.MW.toString())
  params.set('logp', features.LogP.toString())
  params.set('hbd', features.HBD.toString())
  params.set('tpsa', features.TPSA.toString())
  params.set('rings', features.RingCount.toString())
  params.set('rotbonds', features.RotBonds.toString())

  return params.toString()
}

/**
 * Decode single compound state from URL query params
 */
export function decodeSingleCompoundURL(searchParams) {
  const compound = searchParams.get('compound')
  const mode = searchParams.get('mode') || 'single'

  // Check if we have the minimum required params
  if (!searchParams.has('mw') || !searchParams.has('logp')) {
    return null
  }

  const features = {
    MW: parseFloat(searchParams.get('mw')) || 0,
    LogP: parseFloat(searchParams.get('logp')) || 0,
    HBD: parseInt(searchParams.get('hbd')) || 0,
    TPSA: parseFloat(searchParams.get('tpsa')) || 0,
    RingCount: parseInt(searchParams.get('rings')) || 0,
    RotBonds: parseInt(searchParams.get('rotbonds')) || 0,
  }

  return {
    compound,
    features,
    mode
  }
}

/**
 * Encode compare mode state into URL
 */
export function encodeCompareURL(compounds) {
  const params = new URLSearchParams()
  params.set('mode', 'compare')

  compounds.forEach((comp, idx) => {
    const prefix = `c${idx + 1}`
    if (comp.name) params.set(`${prefix}`, comp.name)
    params.set(`${prefix}_mw`, comp.features.MW.toString())
    params.set(`${prefix}_logp`, comp.features.LogP.toString())
    params.set(`${prefix}_hbd`, comp.features.HBD.toString())
    params.set(`${prefix}_tpsa`, comp.features.TPSA.toString())
    params.set(`${prefix}_rings`, comp.features.RingCount.toString())
    params.set(`${prefix}_rotbonds`, comp.features.RotBonds.toString())
  })

  return params.toString()
}

/**
 * Decode compare mode state from URL
 */
export function decodeCompareURL(searchParams) {
  if (searchParams.get('mode') !== 'compare') {
    return null
  }

  const compounds = []
  let idx = 1

  // Try to decode up to 5 compounds
  while (idx <= 5 && searchParams.has(`c${idx}_mw`)) {
    const prefix = `c${idx}`
    compounds.push({
      name: searchParams.get(prefix) || null,
      features: {
        MW: parseFloat(searchParams.get(`${prefix}_mw`)) || 0,
        LogP: parseFloat(searchParams.get(`${prefix}_logp`)) || 0,
        HBD: parseInt(searchParams.get(`${prefix}_hbd`)) || 0,
        TPSA: parseFloat(searchParams.get(`${prefix}_tpsa`)) || 0,
        RingCount: parseInt(searchParams.get(`${prefix}_rings`)) || 0,
        RotBonds: parseInt(searchParams.get(`${prefix}_rotbonds`)) || 0,
      }
    })
    idx++
  }

  return compounds.length > 0 ? compounds : null
}

/**
 * Update browser URL without page reload
 */
export function updateURL(queryString) {
  const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.pushState({}, '', url)
}

/**
 * Get current URL search params
 */
export function getURLParams() {
  return new URLSearchParams(window.location.search)
}

/**
 * Copy current URL to clipboard
 */
export async function copyCurrentURLToClipboard() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    return true
  } catch (err) {
    console.error('Failed to copy URL:', err)
    return false
  }
}
