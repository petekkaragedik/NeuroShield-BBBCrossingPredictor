// "Best for BBB" comparator per descriptor.
// Returns the index of the best slot, or -1 if there's a tie / no data.
function bestIndex(values, ranker) {
  const valid = values.map((v, i) => ({ v, i })).filter((x) => x.v != null)
  if (valid.length < 2) return -1
  valid.sort((a, b) => ranker(a.v) - ranker(b.v))
  if (ranker(valid[0].v) === ranker(valid[1].v)) return -1 // tie
  return valid[0].i
}

const ROWS = [
  {
    key:   'MW',
    label: 'Molecular Weight',
    unit:  'g/mol',
    fmt:   (v) => Number(v).toFixed(1),
    rank:  (v) => v,                       // lowest wins
    flag:  (v) => v > 500,                 // Lipinski
  },
  {
    key:   'LogP',
    label: 'LogP',
    unit:  '',
    fmt:   (v) => Number(v).toFixed(2),
    rank:  (v) => Math.abs(v - 2.0),       // closest to 2.0
    flag:  (v) => v > 5,
  },
  {
    key:   'HBD',
    label: 'H-Bond Donors',
    unit:  '',
    fmt:   (v) => Number(v).toFixed(0),
    rank:  (v) => v,                       // lowest wins
    flag:  (v) => v > 5,
  },
  {
    key:   'TPSA',
    label: 'TPSA',
    unit:  'Å²',
    fmt:   (v) => Number(v).toFixed(1),
    rank:  (v) => v,                       // lowest wins
    flag:  (v) => v > 140,
  },
  {
    key:   'RingCount',
    label: 'Ring Count',
    unit:  '',
    fmt:   (v) => Number(v).toFixed(0),
    rank:  null,                           // not scored
    flag:  () => false,
  },
  {
    key:   'RotBonds',
    label: 'Rotatable Bonds',
    unit:  '',
    fmt:   (v) => Number(v).toFixed(0),
    rank:  null,
    flag:  () => false,
  },
]

export default function CompareDescriptorTable({ slots, accents }) {
  const activeSlots = slots.filter((s) => s.features)
  if (activeSlots.length < 2) return null

  return (
    <section className="bg-panel border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-1">
        Descriptor Comparison
      </h2>
      <p className="text-[11px] text-slate-500 mb-4">
        Best-for-BBB values highlighted in green · Lipinski violations in red
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4 w-44">
                Descriptor
              </th>
              {slots.map((s, i) =>
                s.features ? (
                  <th key={i} className="text-left py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: accents[i].solid }}
                      />
                      <span
                        className="text-xs font-semibold capitalize truncate max-w-[120px]"
                        style={{ color: accents[i].text }}
                      >
                        {s.compoundName}
                      </span>
                    </div>
                  </th>
                ) : null
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const values = slots.map((s) => s.features?.[row.key] ?? null)
              const best = row.rank ? bestIndex(values, row.rank) : -1

              return (
                <tr key={row.key} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-3 pr-4 text-slate-300 font-medium">
                    {row.label}
                    {row.unit && <span className="text-slate-600 text-xs ml-1">({row.unit})</span>}
                  </td>
                  {slots.map((s, i) => {
                    if (!s.features) return null
                    const v = s.features[row.key]
                    const isBest = best === i
                    const flagged = row.flag(v)
                    return (
                      <td key={i} className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md
                            font-mono text-xs tabular-nums ${
                              flagged
                                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                : isBest
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-300'
                            }`}
                        >
                          {isBest && !flagged && <span className="text-emerald-400">★</span>}
                          {row.fmt(v)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
