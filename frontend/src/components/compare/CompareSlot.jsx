import { useState, useEffect, useRef } from 'react'
import { fetchPubChem, predict, fetchSuggestions } from '../../api'
import Slider from '../Slider'
import MiniBrain from './MiniBrain'

const SLIDER_CONFIG = [
  { name: 'MW',        label: 'Molecular Weight', min: 50,  max: 900, step: 1,   unit: 'g/mol' },
  { name: 'LogP',      label: 'LogP',             min: -5,  max: 10,  step: 0.1, unit: ''      },
  { name: 'HBD',       label: 'H-Bond Donors',    min: 0,   max: 10,  step: 1,   unit: ''      },
  { name: 'TPSA',      label: 'TPSA',             min: 0,   max: 200, step: 1,   unit: 'Å²'   },
  { name: 'RingCount', label: 'Ring Count',        min: 0,   max: 8,   step: 1,   unit: ''      },
  { name: 'RotBonds',  label: 'Rotatable Bonds',   min: 0,   max: 15,  step: 1,   unit: ''      },
]

export default function CompareSlot({ slot, accent, onUpdate, onClear, autoLoadName }) {
  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [imgError, setImgError] = useState(false)

  const [showSliders, setShowSliders] = useState(false)
  const [localFeatures, setLocalFeatures] = useState(null)
  const [originalFeatures, setOriginalFeatures] = useState(null)
  const [repredicting, setRepredicting] = useState(false)

  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  const { compoundName, features, result, loading, error } = slot

  // Sync local features when features arrive or are cleared
  useEffect(() => {
    if (features) {
      setLocalFeatures({ ...features })
      // Only set originalFeatures once per compound (don't overwrite on re-predict)
      setOriginalFeatures(o => o === null ? { ...features } : o)
    } else {
      setLocalFeatures(null)
      setOriginalFeatures(null)
      setShowSliders(false)
    }
  }, [features]) // eslint-disable-line react-hooks/exhaustive-deps

  const isModified = localFeatures && originalFeatures &&
    SLIDER_CONFIG.some(s => localFeatures[s.name] !== originalFeatures[s.name])

  async function handleRepredict() {
    setRepredicting(true)
    try {
      const pred = await predict(localFeatures)
      onUpdate({ features: { ...localFeatures }, result: pred })
    } catch (err) {
      // surface error in slot
      onUpdate({ error: err.message || 'Prediction failed' })
    } finally {
      setRepredicting(false)
    }
  }

  function handleReset() {
    setLocalFeatures({ ...originalFeatures })
  }

  // Auto-load (used by "Compare with current" shortcut)
  useEffect(() => {
    if (autoLoadName) runFullSearch(autoLoadName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadName])

  // Autocomplete debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (name.trim().length < 1) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      const r = await fetchSuggestions(name.trim())
      setSuggestions(r)
      setShowSugg(r.length > 0)
      setActiveIdx(-1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [name])

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function runFullSearch(searchName) {
    onUpdate({ loading: true, error: null, compoundName: searchName, features: null, result: null })
    setImgError(false)
    try {
      const data = await fetchPubChem(searchName)
      const feats = {
        MW:        Number(data.MW)        || 0,
        LogP:      Number(data.LogP)      || 0,
        HBD:       Number(data.HBD)       || 0,
        TPSA:      Number(data.TPSA)      || 0,
        RingCount: Number(data.RingCount) || 0,
        RotBonds:  Number(data.RotBonds)  || 0,
      }
      const pred = await predict(feats)
      onUpdate({ loading: false, error: null, compoundName: searchName, features: feats, result: pred })
    } catch (err) {
      onUpdate({ loading: false, error: err.message || 'Lookup failed', compoundName: searchName, features: null, result: null })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setShowSugg(false)
    runFullSearch(name.trim())
    setName('')
  }

  function selectSuggestion(s) {
    setShowSugg(false)
    setName('')
    runFullSearch(s)
  }

  function onKeyDown(e) {
    if (!showSugg) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx]) }
    else if (e.key === 'Escape') setShowSugg(false)
  }

  const imageUrl = compoundName
    ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compoundName)}/PNG`
    : null
  const isPos = result?.prediction === 'BBB+'

  return (
    <div
      className="bg-panel border rounded-2xl p-5 shadow-xl flex flex-col relative overflow-hidden"
      style={{ borderColor: accent.border }}
    >
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accent.solid }} />

      {/* Slot header */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent.text }}>
            Slot {slot.index + 1}
          </span>
          {isModified && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                             bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Modified
            </span>
          )}
        </div>
        {(compoundName || result) && (
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-red-400 transition w-6 h-6 flex items-center
                       justify-center rounded-full hover:bg-red-500/10"
            title="Clear slot"
          >✕</button>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative" ref={wrapRef}>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text" value={name}
            onChange={(e) => { setName(e.target.value); setShowSugg(true) }}
            onKeyDown={onKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSugg(true)}
            placeholder="compound name..."
            autoComplete="off"
            className="w-full bg-bg border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm
                       text-white placeholder-slate-600 focus:ring-2 outline-none transition"
            style={{ '--tw-ring-color': accent.solid + '33' }}
          />
          {showSugg && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-panel border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={s} onMouseDown={() => selectSuggestion(s)}
                    className={`px-3 py-2 text-sm cursor-pointer capitalize transition ${
                      i === activeIdx ? 'text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    style={i === activeIdx ? { background: accent.solid } : {}}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-70">
        {loading ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 border-3 border-slate-800 border-t-[3px] rounded-full animate-spin-slow"
                 style={{ borderTopColor: accent.solid }} />
            <p className="text-xs text-slate-400 mt-3">Analyzing {compoundName}…</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <p className="text-xs text-slate-500 mt-1">Try another compound</p>
          </div>
        ) : result ? (
          <div className="w-full flex flex-col items-center">
            {/* 2D Structure */}
            <div className="w-full h-32 bg-white rounded-lg flex items-center justify-center
                            mb-3 overflow-hidden border border-slate-800">
              {imageUrl && !imgError ? (
                <img src={imageUrl} alt={compoundName} onError={() => setImgError(true)}
                     className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <span className="text-xs text-slate-600">no structure available</span>
              )}
            </div>

            {/* Name + verdict */}
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <h3 className="text-base font-bold text-white capitalize text-center">{compoundName}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                isPos
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}>
                {result.prediction}
              </span>
            </div>

            {/* Probability */}
            <div className="text-4xl font-bold tabular-nums mb-3"
                 style={{ color: isPos ? '#10b981' : '#ef4444' }}>
              {result.probability.toFixed(1)}%
            </div>

            <MiniBrain prediction={result.prediction} />

            <div className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">
              {result.confidence} confidence
            </div>

            {/* ── Tweak Descriptors ── */}
            <div className="w-full mt-4 border-t border-slate-800/60 pt-3">
              <button
                onClick={() => setShowSliders(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs
                           text-slate-500 hover:text-slate-300 transition-colors duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Tweak Descriptors
                <svg className={`w-3 h-3 transition-transform duration-200 ${showSliders ? 'rotate-180' : ''}`}
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSliders && localFeatures && (
                <div className="mt-3 space-y-4 animate-fade-in">
                  {SLIDER_CONFIG.map(s => (
                    <Slider
                      key={s.name}
                      {...s}
                      value={localFeatures[s.name]}
                      onChange={v => setLocalFeatures(prev => ({ ...prev, [s.name]: v }))}
                    />
                  ))}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleRepredict}
                      disabled={repredicting}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-white
                                 transition disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-1.5"
                      style={{ background: accent.solid }}
                    >
                      {repredicting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                      Re-predict
                    </button>
                    {isModified && (
                      <button
                        onClick={handleReset}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400
                                   border border-slate-700 hover:border-slate-600 hover:text-slate-300
                                   transition"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-600">
            <div className="text-3xl mb-2 opacity-40">🧪</div>
            <p className="text-xs">Search a compound to compare</p>
          </div>
        )}
      </div>
    </div>
  )
}
