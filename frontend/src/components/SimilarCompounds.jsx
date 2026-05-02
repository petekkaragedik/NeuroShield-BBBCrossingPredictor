export default function SimilarCompounds({ compounds }) {
  if (!compounds || compounds.length === 0) return null

  return (
    <div className="bg-bg/60 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">Similar Compounds</h3>
      <p className="text-[11px] text-slate-500 mb-4">
        From training database, ranked by descriptor similarity
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {compounds.map((c, i) => {
          const isPositive = c.bbb_status === 'BBB+'
          return (
            <div
              key={i}
              className="bg-panel border border-slate-800 hover:border-slate-700 transition
                         rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div
                  className="text-xs font-medium text-slate-200 truncate flex-1"
                  title={c.name}
                >
                  {c.name}
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {c.bbb_status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span>MW {c.MW}</span>
                <span className="text-slate-700">·</span>
                <span>LogP {c.LogP}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Similarity</span>
                <span className="text-[11px] font-mono text-blue-300">
                  {(c.similarity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
