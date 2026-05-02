export default function SHAPTable({ factors }) {
  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.impact)), 0.0001)

  return (
    <div className="bg-bg/60 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">
        Feature Contributions
      </h3>
      <p className="text-[11px] text-slate-500 mb-4">
        SHAP values — green increases BBB penetration, red decreases it
      </p>
      <div className="space-y-2.5">
        {factors.map((f) => {
          const isPositive = f.impact > 0
          const widthPct = (Math.abs(f.impact) / maxAbs) * 50
          return (
            <div key={f.feature} className="flex items-center gap-3 text-xs">
              <div className="w-20 text-slate-300 font-medium">{f.feature}</div>
              <div className="w-14 text-slate-500 font-mono tabular-nums text-right">
                {f.value}
              </div>
              <div className="flex-1 relative h-5 flex items-center">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700" />
                {isPositive ? (
                  <div
                    className="absolute left-1/2 h-3 rounded-r-sm bg-linear-to-r from-emerald-500/80 to-emerald-400"
                    style={{ width: `${widthPct}%` }}
                  />
                ) : (
                  <div
                    className="absolute right-1/2 h-3 rounded-l-sm bg-gradient-to-l from-red-500/80 to-red-400"
                    style={{ width: `${widthPct}%` }}
                  />
                )}
              </div>
              <div
                className={`w-16 font-mono tabular-nums text-right ${
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {f.impact.toFixed(3)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
