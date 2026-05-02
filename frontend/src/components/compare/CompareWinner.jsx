// Picks the winner by highest BBB probability and explains why
// based on which scored descriptors it wins on vs competitors.

const SCORED = [
  { key: 'MW',   label: 'MW',   rank: (v) => v },
  { key: 'LogP', label: 'LogP', rank: (v) => Math.abs(v - 2.0) },
  { key: 'HBD',  label: 'HBD',  rank: (v) => v },
  { key: 'TPSA', label: 'TPSA', rank: (v) => v },
]

export default function CompareWinner({ slots, accents }) {
  const ready = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.result && s.features)

  if (ready.length < 2) return null

  // Highest probability wins
  const winner = ready.reduce((best, cur) =>
    cur.s.result.probability > best.s.result.probability ? cur : best,
  ready[0])

  const others = ready.filter(({ i }) => i !== winner.i)

  // Find which scored descriptors winner is best on
  const wonOn = SCORED.filter(({ key, rank }) => {
    const winnerVal = rank(winner.s.features[key])
    return others.every(({ s }) => rank(s.features[key]) > winnerVal)
  }).map((d) => d.label)

  // Build reason string
  let reason
  if (wonOn.length === 0) {
    reason = `Highest predicted BBB+ probability despite trade-offs in descriptors`
  } else if (wonOn.length === 1) {
    reason = `Wins on ${wonOn[0]} vs competitors`
  } else if (wonOn.length === 2) {
    reason = `Wins on ${wonOn.join(' and ')} vs competitors`
  } else {
    reason = `Wins on ${wonOn.slice(0, -1).join(', ')}, and ${wonOn[wonOn.length - 1]} vs competitors`
  }

  const accent = accents[winner.i]
  const isPos = winner.s.result.prediction === 'BBB+'
  const probColor = isPos ? '#10b981' : '#ef4444'

  return (
    <section
      className="relative rounded-2xl p-6 shadow-xl border overflow-hidden"
      style={{
        borderColor: accent.solid + '66',
        background: `linear-gradient(135deg, ${accent.solid}15, transparent 60%), #111729`,
      }}
    >
      {/* Subtle accent glow on left */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1"
        style={{ background: accent.solid }}
      />

      <div className="flex items-center gap-5 flex-wrap">
        <div className="text-6xl">🏆</div>

        <div className="flex-1 min-w-[200px]">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: accent.text }}
          >
            Best BBB Candidate
          </div>
          <h2 className="text-2xl font-bold text-white capitalize mb-1">
            {winner.s.compoundName}
          </h2>
          <p className="text-sm text-slate-400">{reason}</p>
        </div>

        <div className="text-right">
          <div
            className="text-5xl font-bold tabular-nums leading-none"
            style={{ color: probColor }}
          >
            {winner.s.result.probability.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
            BBB Probability
          </div>
          <div className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            isPos
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}>
            {winner.s.result.prediction}
          </div>
        </div>
      </div>
    </section>
  )
}
