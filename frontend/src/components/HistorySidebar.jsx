import { useState, useMemo } from 'react'

function relativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const SOURCE_COLORS = {
  Single:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Batch:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Compare: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

function HistoryItem({ entry, onLoad, onRemove }) {
  const isPos = entry.result.prediction === 'BBB+'
  const prob  = entry.result.probability

  return (
    <div
      className="group relative flex flex-col gap-1.5 px-3 py-2.5 rounded-lg
                 border border-transparent hover:border-blue-500/20
                 hover:bg-blue-500/5 cursor-pointer transition-all"
      onClick={() => onLoad(entry)}
    >
      {/* Left glow on hover */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500
                      opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top row: name + badge + prob */}
      <div className="flex items-center gap-2 pr-6">
        <span className="text-sm font-medium text-white capitalize truncate flex-1">
          {entry.name}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
          isPos
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30'
        }`}>
          {entry.result.prediction}
        </span>
        <span className={`text-xs font-mono font-semibold tabular-nums ${
          isPos ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {prob.toFixed(1)}%
        </span>
      </div>

      {/* Descriptor row */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
        <span>MW {Number(entry.features.MW).toFixed(0)}</span>
        <span>LogP {Number(entry.features.LogP).toFixed(1)}</span>
        <span>HBD {entry.features.HBD}</span>
        <span>TPSA {Number(entry.features.TPSA).toFixed(0)}</span>
      </div>

      {/* Bottom row: source + time + compare button */}
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${
          SOURCE_COLORS[entry.source] || SOURCE_COLORS.Single
        }`}>
          {entry.source}
        </span>
        <span className="text-[10px] text-slate-600">{relativeTime(entry.timestamp)}</span>
        <button
          className="ml-auto text-[10px] text-slate-500 hover:text-purple-400
                     opacity-0 group-hover:opacity-100 transition px-1.5 py-0.5
                     rounded border border-transparent hover:border-purple-500/30
                     hover:bg-purple-500/10"
          onClick={(e) => { e.stopPropagation(); onLoad(entry, true) }}
          title="Open in Compare view"
        >
          → Compare
        </button>
      </div>

      {/* Remove button */}
      <button
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center
                   rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10
                   opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
        title="Remove from history"
      >
        ✕
      </button>
    </div>
  )
}

export default function HistorySidebar({ open, onClose, entries, onRemove, onClear, onLoad }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = entries
    if (filter === 'bbb+') list = list.filter((e) => e.result.prediction === 'BBB+')
    if (filter === 'bbb-') list = list.filter((e) => e.result.prediction === 'BBB-')
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(q))
    }
    return list
  }, [entries, filter, search])

  // Stats
  const total  = entries.length
  const posCount = entries.filter((e) => e.result.prediction === 'BBB+').length
  const negCount = total - posCount
  const avgProb = total
    ? (entries.reduce((s, e) => s + e.result.probability, 0) / total).toFixed(1)
    : '—'

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-40 w-[300px] flex flex-col
                   bg-[#0d1424] border-r border-slate-800
                   transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Session History</h2>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={onClear}
                className="text-[10px] text-slate-500 hover:text-red-400 transition px-1.5 py-1
                           rounded hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         text-slate-500 hover:text-white hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search compounds…"
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg
                       px-3 py-2 text-sm text-white placeholder-slate-600
                       focus:outline-none focus:border-blue-500/50 transition"
          />
        </div>

        {/* Filter toggles */}
        <div className="flex items-center gap-1.5 px-3 py-2">
          {[
            { id: 'all',  label: 'All'   },
            { id: 'bbb+', label: 'BBB+'  },
            { id: 'bbb-', label: 'BBB-'  },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
                filter === id
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-600">{filtered.length} shown</span>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 py-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center px-4">
              <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-sm text-slate-600">
                {entries.length === 0
                  ? 'No compounds screened yet'
                  : 'No matches for current filter'}
              </p>
              {entries.length === 0 && (
                <p className="text-xs text-slate-700">
                  Predictions will appear here as you screen compounds
                </p>
              )}
            </div>
          ) : (
            filtered.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onLoad={(e, compare) => {
                  onLoad(e, compare)
                  onClose()
                }}
                onRemove={onRemove}
              />
            ))
          )}
        </div>

        {/* Bottom stats strip */}
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <span className="text-slate-400">Session:</span>{' '}
            <span className="text-white font-medium">{total}</span> screened
            {' · '}
            <span className="text-emerald-400 font-medium">{posCount}</span> BBB+
            {' · '}
            <span className="text-red-400 font-medium">{negCount}</span> BBB-
            {' · '}
            Avg{' '}
            <span className="text-blue-300 font-medium">{avgProb}{total ? '%' : ''}</span>
          </p>
        </div>
      </aside>
    </>
  )
}
