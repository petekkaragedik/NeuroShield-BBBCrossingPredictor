import { useState, useEffect, useRef } from 'react'
import CompoundLoadingCard from './CompoundLoadingCard'
import Slider from './Slider'
import { fetchSuggestions } from '../api'

const SLIDER_CONFIG = [
  { name: 'MW',        label: 'Molecular Weight', min: 50,  max: 900, step: 1,   unit: 'g/mol' },
  { name: 'LogP',      label: 'LogP',             min: -5,  max: 10,  step: 0.1, unit: ''      },
  { name: 'HBD',       label: 'H-Bond Donors',    min: 0,   max: 10,  step: 1,   unit: ''      },
  { name: 'TPSA',      label: 'TPSA',             min: 0,   max: 200, step: 1,   unit: 'Å²'   },
  { name: 'RingCount', label: 'Ring Count',        min: 0,   max: 8,   step: 1,   unit: ''      },
  { name: 'RotBonds',  label: 'Rotatable Bonds',   min: 0,   max: 15,  step: 1,   unit: ''      },
]

const BADGE_CONFIG = [
  { key: 'MW',        label: 'MW',   fmt: v => Math.round(v),          unit: ''    },
  { key: 'LogP',      label: 'LogP', fmt: v => Number(v).toFixed(2),   unit: ''    },
  { key: 'HBD',       label: 'HBD',  fmt: v => v,                      unit: ''    },
  { key: 'TPSA',      label: 'TPSA', fmt: v => Number(v).toFixed(1),   unit: ' Å²' },
  { key: 'RingCount', label: 'Rings',fmt: v => v,                      unit: ''    },
  { key: 'RotBonds',  label: 'RotB', fmt: v => v,                      unit: ''    },
]

function MoleculeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 56 56">
      <path d="M28 10 L46 20 L46 36 L28 46 L10 36 L10 20 Z"
            strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="28" cy="10" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="46" cy="20" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="46" cy="36" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="28" cy="46" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="36" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="20" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function InputPanel({ features, setFeatures, onSearch, onPredict, searching, predicting, pendingCompound, compoundNameOverride }) {
  const [name, setName]                   = useState('')
  const [suggestions, setSuggestions]     = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex]     = useState(-1)
  const [showSliders, setShowSliders]     = useState(false)
  const [loadedCompound, setLoadedCompound] = useState(null)
  const [imgError, setImgError]           = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // Update name when a compound is selected from similar compounds
  useEffect(() => {
    if (compoundNameOverride) {
      setName(compoundNameOverride)
    }
  }, [compoundNameOverride])

  // Persist identity card even after prediction clears pendingCompound
  useEffect(() => {
    if (pendingCompound) {
      setLoadedCompound(pendingCompound)
      setShowSliders(false)
      setImgError(false)
    }
  }, [pendingCompound])

  // Autocomplete debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (name.trim().length < 1) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(name.trim())
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setActiveIndex(-1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [name])

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function updateFeature(key, value) {
    setFeatures(prev => ({ ...prev, [key]: value }))
  }

  function selectSuggestion(s) {
    setName(s)
    setSuggestions([])
    setShowSuggestions(false)
    onSearch(s)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (name.trim()) { setShowSuggestions(false); onSearch(name.trim()) }
  }

  function handleKeyDown(e) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIndex]) }
    else if (e.key === 'Escape') setShowSuggestions(false)
  }

  const imageUrl = loadedCompound
    ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(loadedCompound)}/PNG`
    : null

  return (
    <section className="bg-panel border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
        Compound Input
      </h2>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} className="mb-5">
        <label className="text-xs text-slate-400 mb-2 block">Search by compound name</label>
        <div className="flex gap-2" ref={wrapperRef}>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text" value={name}
              onChange={e => { setName(e.target.value); setShowSuggestions(true) }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g. aspirin, caffeine, dopamine"
              autoComplete="off"
              className="w-full bg-bg border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm
                         text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2
                         focus:ring-blue-500/20 outline-none transition"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-panel border border-slate-700
                             rounded-lg shadow-xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <li key={s} onMouseDown={() => selectSuggestion(s)}
                      className={`px-4 py-2.5 text-sm cursor-pointer capitalize transition
                        ${i === activeIndex ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" disabled={searching || !name.trim()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40
                             disabled:cursor-not-allowed text-sm font-medium text-white rounded-lg
                             transition flex items-center gap-2">
            {searching
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
              : 'Search'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Auto-fills descriptors via PubChem</p>
      </form>

      {/* ── Identity card / Loading / Empty state ── */}
      {searching ? (
        <div className="mb-5"><CompoundLoadingCard /></div>
      ) : loadedCompound ? (
        <div className="animate-fade-in mb-5">

          {/* Structure image */}
          <div className="w-44 h-44 mx-auto mb-4 rounded-xl overflow-hidden bg-white/95
                          shadow-[0_4px_28px_rgba(0,0,0,0.55)] border border-slate-600/20
                          flex items-center justify-center">
            {imgError ? (
              <MoleculeIcon className="w-16 h-16 text-slate-400" />
            ) : (
              <img
                src={imageUrl}
                alt={loadedCompound}
                className="w-full h-full object-contain p-2"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* Compound name */}
          <h3 className="text-center text-lg font-bold text-white capitalize tracking-tight mb-3">
            {loadedCompound}
          </h3>

          {/* Descriptor badge pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {BADGE_CONFIG.map(b => (
              <div key={b.key}
                   className="flex flex-col items-center px-2.5 py-1.5
                              bg-slate-800/70 border border-slate-700/50 rounded-lg min-w-12.5">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none">
                  {b.label}
                </span>
                <span className="text-sm font-semibold text-white mt-0.5 leading-tight whitespace-nowrap">
                  {b.fmt(Number(features[b.key]))}{b.unit}
                </span>
              </div>
            ))}
          </div>

          {/* Manual override toggle */}
          <button
            onClick={() => setShowSliders(v => !v)}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300
                       border border-slate-700/50 hover:border-slate-600 rounded-lg
                       transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Manual Override
            <svg className={`w-3 h-3 transition-transform duration-200 ${showSliders ? 'rotate-180' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible sliders */}
          {showSliders && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-5 animate-fade-in">
              {SLIDER_CONFIG.map(s => (
                <Slider key={s.name} {...s}
                        value={features[s.name]}
                        onChange={v => updateFeature(s.name, v)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-700/60 p-10 mb-5
                        flex flex-col items-center justify-center text-center bg-slate-800/10">
          <MoleculeIcon className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500">Search a compound above to begin</p>
          <p className="text-xs text-slate-600 mt-1">Structure and descriptors will appear here</p>
        </div>
      )}

      {/* ── Predict button — always visible ── */}
      {pendingCompound && !predicting && (
        <p className="text-xs text-center text-emerald-400 animate-pulse mb-2">
          ✓ "{pendingCompound}" loaded — click below to predict
        </p>
      )}
      <button
        onClick={onPredict}
        disabled={predicting}
        className={`w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white
                   font-semibold rounded-lg transition flex items-center justify-center gap-2
                   shadow-lg ${pendingCompound
                     ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                     : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
      >
        {predicting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
            Predicting...
          </>
        ) : pendingCompound ? (
          <>
            Predict {pendingCompound}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        ) : (
          <>
            Predict BBB Permeability
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </section>
  )
}
