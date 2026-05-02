import { useState } from 'react'

const SESSION_KEY = 'neuroshield_opt_expanded'

function readExpanded() {
  try { return sessionStorage.getItem(SESSION_KEY) === 'true' } catch { return false }
}
function writeExpanded(v) {
  try { sessionStorage.setItem(SESSION_KEY, String(v)) } catch {}
}

// Descriptor rules for BBB favorability
const CHECKS = [
  {
    key: 'MW', label: 'MW', unit: 'g/mol',
    fmt: (v) => `${Number(v).toFixed(0)} g/mol`,
    target: '< 400 g/mol',
    test: (v) => v > 400,
    text: (v) =>
      `Reduce molecular weight below 400 g/mol (current: ${Number(v).toFixed(0)}). Consider removing substituents or simplifying the scaffold.`,
  },
  {
    key: 'LogP', label: 'LogP', unit: '',
    fmt: (v) => Number(v).toFixed(2),
    target: '1 – 3',
    test: (v) => v < 0 || v > 5,
    text: (v) =>
      `Adjust LogP toward 1–3 range (current: ${Number(v).toFixed(2)}). Add lipophilic groups or remove polar ones.`,
  },
  {
    key: 'HBD', label: 'HBD', unit: '',
    fmt: (v) => String(v),
    target: '≤ 3',
    test: (v) => v > 3,
    text: (v) =>
      `Reduce H-bond donors below 3 (current: ${v}). Consider replacing -OH or -NH groups with non-donor bioisosteres.`,
  },
  {
    key: 'TPSA', label: 'TPSA', unit: 'Å²',
    fmt: (v) => `${Number(v).toFixed(1)} Å²`,
    target: '< 90 Å²',
    test: (v) => v > 90,
    text: (v) =>
      `Lower polar surface area below 90 Å² (current: ${Number(v).toFixed(1)}). Reduce polar functional groups or use cyclization strategies.`,
  },
  {
    key: 'RotBonds', label: 'RotBonds', unit: '',
    fmt: (v) => String(v),
    target: '≤ 8',
    test: (v) => v > 8,
    text: (v) =>
      `Decrease rotatable bonds below 8 (current: ${v}). Introduce ring constraints or reduce flexible chains.`,
  },
]

const DIFF_ROWS = [
  { key: 'MW',       label: 'MW',        fmt: (v) => `${Number(v).toFixed(0)} g/mol`, better: (ref, cur) => ref < cur },
  { key: 'LogP',     label: 'LogP',      fmt: (v) => Number(v).toFixed(2),            better: (ref, cur) => Math.abs(ref - 2) < Math.abs(cur - 2) },
  { key: 'HBD',      label: 'HBD',       fmt: (v) => String(v),                       better: (ref, cur) => ref < cur },
  { key: 'TPSA',     label: 'TPSA',      fmt: (v) => `${Number(v).toFixed(1)} Å²`,    better: (ref, cur) => ref < cur },
  { key: 'RotBonds', label: 'RotBonds',  fmt: (v) => String(v),                        better: (ref, cur) => ref <= cur },
]

function ImpactPip({ impact }) {
  const pct = Math.min(Math.abs(impact) * 400, 100) // scale: 0.25 → 100%
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span className="text-[9px] text-amber-600 uppercase tracking-wide font-semibold">Impact</span>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden" style={{ maxWidth: 72 }}>
        <div
          className="h-full rounded-full bg-amber-500/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-amber-500 font-mono">
        {impact > 0 ? '+' : ''}{impact.toFixed(3)}
      </span>
    </div>
  )
}

function NearestBBBPlus({ compound, features, onExploreCompound }) {
  if (!compound) return null

  return (
    <div className="mt-4 pt-4 border-t border-amber-500/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <span>📍</span> Nearest BBB+ compound in training data
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Modifying toward this profile may improve penetration
          </p>
        </div>
        <button
          onClick={() => onExploreCompound(compound.name)}
          className="shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-lg
                     bg-amber-500/10 hover:bg-amber-500/20 text-amber-300
                     border border-amber-500/30 transition flex items-center gap-1"
        >
          → Explore this compound
        </button>
      </div>

      <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
        {/* Compound name bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-white capitalize truncate max-w-[180px]">
            {compound.name}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-slate-500">
              {(compound.similarity * 100).toFixed(1)}% similar
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border
                             bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              BBB+
            </span>
          </div>
        </div>

        {/* Descriptor diff table */}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="text-left text-[9px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-1.5">Descriptor</th>
              <th className="text-right text-[9px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-1.5">Current</th>
              <th className="text-right text-[9px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-1.5">Reference</th>
              <th className="text-right text-[9px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-1.5">Δ</th>
            </tr>
          </thead>
          <tbody>
            {DIFF_ROWS.map(({ key, label, fmt, better }) => {
              const cur = features[key]
              const ref = compound[key]
              if (cur == null || ref == null) return null
              const delta = ref - cur
              const isGood = better(ref, cur)
              const same = Math.abs(delta) < 0.05
              return (
                <tr key={key} className="border-b border-slate-800/30 last:border-0">
                  <td className="px-3 py-1.5 font-medium text-slate-400">{label}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-slate-300">{fmt(cur)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-slate-300">{fmt(ref)}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {same ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className={isGood ? 'text-emerald-400' : 'text-red-400'}>
                        {delta > 0 ? '+' : ''}{key === 'MW' || key === 'TPSA'
                          ? delta.toFixed(0)
                          : key === 'LogP'
                          ? delta.toFixed(2)
                          : delta.toFixed(0)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OptimizationSuggestions({ result, features, onExploreCompound }) {
  const [open, setOpen] = useState(readExpanded)

  if (!result || result.probability >= 85) return null

  // Build suggestions from out-of-range descriptors
  const shapMap = {}
  if (result.contributing_factors) {
    result.contributing_factors.forEach((f) => { shapMap[f.feature] = f.impact })
  }

  const suggestions = CHECKS
    .filter(({ key, test }) => test(features[key]))
    .map((check) => ({
      ...check,
      value: features[check.key],
      shap: shapMap[check.key] ?? 0,
    }))
    // Sort by absolute SHAP impact descending
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))

  // Closest BBB+ neighbor
  const nearestBBBPlus = result.similar_compounds
    ?.filter((c) => c.bbb_status === 'BBB+')
    .sort((a, b) => b.similarity - a.similarity)[0] ?? null

  function toggle() {
    const next = !open
    setOpen(next)
    writeExpanded(next)
  }

  return (
    <div
      className="rounded-2xl border shadow-xl overflow-hidden"
      style={{
        borderColor: 'rgba(245,158,11,0.25)',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.04), transparent 50%), #0d1424',
      }}
    >
      {/* Left amber stripe */}
      <div
        className="relative"
        style={{ borderLeft: '3px solid rgba(245,158,11,0.7)' }}
      >
        {/* Collapsible header */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-5 py-4
                     text-left hover:bg-amber-500/5 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🔧</span>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                How to improve BBB penetration
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Descriptor-level suggestions based on your compound's profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {suggestions.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400
                               border border-amber-500/30 px-2 py-0.5 rounded-full">
                {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-amber-500/70 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expandable body */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? '1200px' : '0px' }}
        >
          <div className="px-5 pb-5">
            {suggestions.length === 0 ? (
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg
                              bg-amber-500/8 border border-amber-500/20 text-amber-300/80 text-xs">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  All descriptors are within favorable ranges — the model uncertainty may be due to
                  this compound being dissimilar to training data.
                </span>
              </div>
            ) : (
              <div className="space-y-0">
                {suggestions.map((s, i) => (
                  <div
                    key={s.key}
                    className={`py-3 ${i < suggestions.length - 1 ? 'border-b border-slate-800/60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Descriptor badge */}
                      <div className="shrink-0 mt-0.5">
                        <span className="inline-block text-[10px] font-bold px-2 py-1 rounded
                                         bg-amber-500/15 text-amber-400 border border-amber-500/30
                                         font-mono tracking-wide min-w-[54px] text-center">
                          {s.label}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        {/* Current → target */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-red-400">
                            {s.fmt(s.value)}
                          </span>
                          <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-xs font-mono font-semibold text-emerald-400">
                            {s.target}
                          </span>
                        </div>

                        {/* Suggestion text */}
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {s.text(s.value)}
                        </p>

                        {/* SHAP impact bar */}
                        {s.shap !== 0 && <ImpactPip impact={s.shap} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <NearestBBBPlus
              compound={nearestBBBPlus}
              features={features}
              onExploreCompound={onExploreCompound}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
