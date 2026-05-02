import { useState, useEffect } from 'react'
import CompareSlot from './CompareSlot'
import CompareDescriptorTable from './CompareDescriptorTable'
import CompareSHAPChart from './CompareSHAPChart'
import CompareWinner from './CompareWinner'

// Per-slot accent colors — blue / purple / teal
const ACCENTS = [
  { solid: '#3b82f6', text: '#93c5fd', border: 'rgba(59,130,246,0.35)'  }, // blue
  { solid: '#a855f7', text: '#d8b4fe', border: 'rgba(168,85,247,0.35)'  }, // purple
  { solid: '#14b8a6', text: '#5eead4', border: 'rgba(20,184,166,0.35)'  }, // teal
]

function emptySlot(index) {
  return {
    index,
    compoundName: null,
    features: null,
    result: null,
    loading: false,
    error: null,
  }
}

export default function CompareView({ initialCompound, onConsumedInitial }) {
  const [slots, setSlots] = useState([emptySlot(0), emptySlot(1)])
  const [autoLoad, setAutoLoad] = useState({ 0: null, 1: null, 2: null })

  // If launched with "Compare with current" — preload first slot
  useEffect(() => {
    if (initialCompound) {
      setAutoLoad((prev) => ({ ...prev, 0: initialCompound }))
      onConsumedInitial?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompound])

  function updateSlot(idx, patch) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  function clearSlot(idx) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? emptySlot(idx) : s)))
    setAutoLoad((prev) => ({ ...prev, [idx]: null }))
  }

  function addThirdSlot() {
    setSlots((prev) => [...prev, emptySlot(2)])
  }

  function removeThirdSlot() {
    setSlots((prev) => prev.slice(0, 2))
    setAutoLoad((prev) => ({ ...prev, 2: null }))
  }

  const hasThird = slots.length === 3

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Compare Compounds</h1>
        <p className="text-sm text-slate-400">
          Run 2–3 compounds side-by-side to see which has the most favorable BBB profile
        </p>
      </div>

      {/* Slot grid — stacks vertically below lg */}
      <div className={`grid gap-4 ${
        hasThird
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {slots.map((s, i) => (
          <CompareSlot
            key={i}
            slot={s}
            accent={ACCENTS[i]}
            autoLoadName={autoLoad[i]}
            onUpdate={(patch) => updateSlot(i, patch)}
            onClear={() => {
              if (i === 2) removeThirdSlot()
              else clearSlot(i)
            }}
          />
        ))}
      </div>

      {/* Add-third button */}
      {!hasThird && (
        <div className="flex justify-center">
          <button
            onClick={addThirdSlot}
            className="px-5 py-2.5 rounded-lg border-2 border-dashed border-slate-700
                       text-slate-400 hover:text-teal-300 hover:border-teal-500/60
                       hover:bg-teal-500/5 transition text-sm font-medium
                       flex items-center gap-2"
          >
            <span className="text-lg leading-none">＋</span>
            Add Third Compound
          </button>
        </div>
      )}

      {/* Descriptor comparison table */}
      <CompareDescriptorTable slots={slots} accents={ACCENTS} />

      {/* SHAP grouped chart */}
      <CompareSHAPChart slots={slots} accents={ACCENTS} />

      {/* Winner card */}
      <CompareWinner slots={slots} accents={ACCENTS} />
    </div>
  )
}
