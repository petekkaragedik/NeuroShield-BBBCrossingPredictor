import { useState, useEffect, useRef } from 'react'
import Slider from './Slider'
import { fetchSuggestions } from '../api'

const SLIDER_CONFIG = [
  { name: 'MW',        label: 'Molecular Weight',  min: 50,  max: 900, step: 1,    unit: 'g/mol' },
  { name: 'LogP',      label: 'LogP',              min: -5,  max: 10,  step: 0.1,  unit: '' },
  { name: 'HBD',       label: 'H-Bond Donors',     min: 0,   max: 10,  step: 1,    unit: '' },
  { name: 'TPSA',      label: 'TPSA',              min: 0,   max: 200, step: 1,    unit: 'Å²' },
  { name: 'RingCount', label: 'Ring Count',        min: 0,   max: 8,   step: 1,    unit: '' },
  { name: 'RotBonds',  label: 'Rotatable Bonds',   min: 0,   max: 15,  step: 1,    unit: '' },
]

export default function InputPanel({ features, setFeatures, onSearch, onPredict, searching, predicting, pendingCompound }) {
  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (name.trim().length < 1) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(name.trim())
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setActiveIndex(-1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [name])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateFeature(key, value) {
    setFeatures((prev) => ({ ...prev, [key]: value }))
  }

  function selectSuggestion(suggestion) {
    setName(suggestion)
    setSuggestions([])
    setShowSuggestions(false)
    onSearch(suggestion)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (name.trim()) {
      setShowSuggestions(false)
      onSearch(name.trim())
    }
  }

  function handleKeyDown(e) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <section className="bg-[#111729] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
        Compound Input
      </h2>

      <form onSubmit={handleSearch} className="mb-6">
        <label className="text-xs text-slate-400 mb-2 block">
          Search by compound name
        </label>
        <div className="flex gap-2" ref={wrapperRef}>
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setShowSuggestions(true) }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g. aspirin, caffeine, dopamine"
              autoComplete="off"
              className="w-full bg-[#0a0f1e] border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm
                         text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2
                         focus:ring-blue-500/20 outline-none transition"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-[#111729] border border-slate-700
                             rounded-lg shadow-xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    onMouseDown={() => selectSuggestion(s)}
                    className={`px-4 py-2.5 text-sm cursor-pointer capitalize transition
                      ${i === activeIndex
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={searching || !name.trim()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40
                       disabled:cursor-not-allowed text-sm font-medium text-white rounded-lg
                       transition flex items-center gap-2"
          >
            {searching ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
            ) : (
              'Search'
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Auto-fills descriptors via PubChem
        </p>
      </form>

      <div className="border-t border-slate-800 my-4" />

      <p className="text-xs text-slate-400 mb-4">Or adjust manually:</p>

      <div className="space-y-5">
        {SLIDER_CONFIG.map((s) => (
          <Slider
            key={s.name}
            {...s}
            value={features[s.name]}
            onChange={(v) => updateFeature(s.name, v)}
          />
        ))}
      </div>

      {pendingCompound && !predicting && (
        <p className="mt-4 text-xs text-center text-emerald-400 animate-pulse">
          ✓ "{pendingCompound}" loaded — click below to predict
        </p>
      )}

      <button
        onClick={onPredict}
        disabled={predicting}
        className={`w-full mt-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white
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
