// Grouped SHAP bar chart — one cluster per descriptor, one bar per active compound.

const FEATURES = ['MW', 'LogP', 'HBD', 'TPSA', 'RingCount', 'RotBonds']

export default function CompareSHAPChart({ slots, accents }) {
  const active = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.result?.contributing_factors)

  if (active.length < 2) return null

  // Build {feature: [shap_per_compound]} mapping
  const byFeature = FEATURES.map((feat) => {
    const values = active.map(({ s }) => {
      const f = s.result.contributing_factors.find((x) => x.feature === feat)
      return f ? f.impact : 0
    })
    return { feat, values }
  })

  // Y-axis scale — symmetric around 0
  const allVals = byFeature.flatMap((g) => g.values)
  const maxAbs = Math.max(...allVals.map(Math.abs), 0.05)
  const yMax = Math.ceil(maxAbs * 100) / 100

  // SVG dimensions
  const width  = 720
  const height = 280
  const padL   = 56
  const padR   = 16
  const padT   = 24
  const padB   = 50

  const plotW = width  - padL - padR
  const plotH = height - padT - padB
  const zeroY = padT + plotH / 2
  const yScale = (v) => zeroY - (v / yMax) * (plotH / 2)

  // Bars per group
  const groupW = plotW / FEATURES.length
  const barGap = 4
  const barW = (groupW - barGap * 2 - 16) / active.length

  // Y-axis ticks
  const ticks = [-yMax, -yMax / 2, 0, yMax / 2, yMax]

  return (
    <section className="bg-panel border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          SHAP Comparison
        </h2>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {active.map(({ s, i }) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: accents[i].solid }}
              />
              <span className="text-xs text-slate-300 capitalize truncate max-w-[140px]">
                {s.compoundName}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        Per-feature SHAP impact — positive = increases BBB+, negative = decreases
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth: 600 }}
        >
          {/* Y-axis ticks + grid */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={width - padR}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke={t === 0 ? '#475569' : '#1f2937'}
                strokeWidth={t === 0 ? 1 : 0.5}
                strokeDasharray={t === 0 ? '0' : '2 3'}
              />
              <text
                x={padL - 8}
                y={yScale(t) + 3}
                textAnchor="end"
                className="fill-slate-500"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
              >
                {t === 0 ? '0' : (t > 0 ? '+' : '') + t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Grouped bars */}
          {byFeature.map((group, gi) => {
            const groupX = padL + gi * groupW + 8
            return (
              <g key={group.feat}>
                {/* Group label */}
                <text
                  x={groupX + (groupW - 16) / 2}
                  y={height - padB + 18}
                  textAnchor="middle"
                  className="fill-slate-400"
                  fontSize="11"
                  fontWeight="500"
                >
                  {group.feat}
                </text>

                {/* Bars */}
                {group.values.map((v, bi) => {
                  const x = groupX + bi * (barW + barGap)
                  const y = v >= 0 ? yScale(v) : zeroY
                  const h = Math.abs(yScale(v) - zeroY) || 1
                  const compoundIndex = active[bi].i
                  const fill = accents[compoundIndex].solid
                  const isPos = v > 0

                  return (
                    <g key={bi}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="2"
                        fill={fill}
                        opacity={isPos ? 0.9 : 0.6}
                      />
                      {Math.abs(v) > yMax * 0.15 && (
                        <text
                          x={x + barW / 2}
                          y={isPos ? y - 4 : y + h + 11}
                          textAnchor="middle"
                          className="fill-slate-300"
                          fontSize="9"
                          fontFamily="ui-monospace, monospace"
                        >
                          {(v > 0 ? '+' : '') + v.toFixed(2)}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* Y-axis label */}
          <text
            transform={`rotate(-90, 18, ${padT + plotH / 2})`}
            x={18}
            y={padT + plotH / 2}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="10"
          >
            SHAP Impact
          </text>
        </svg>
      </div>
    </section>
  )
}
