const STATS = [
  'Trained on 7,807 Molecules',
  'Random Forest + SHAP Explainability',
  'Live PubChem Integration',
]

export default function StatsBar({ backendOnline }) {
  return (
    <div className="w-full h-10 bg-[#060a14] border-b border-slate-800/60
                    flex items-center shrink-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-center gap-4">

        {STATS.map((text, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="text-xs text-slate-500 whitespace-nowrap tracking-wide">
              {text}
            </span>
            <span className="w-px h-3 bg-slate-700/70 shrink-0" />
          </div>
        ))}

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-500
                        ${backendOnline
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
                          : 'bg-red-500'}`}
          />
          <span className={`text-xs whitespace-nowrap tracking-wide transition-colors duration-500
                            ${backendOnline ? 'text-slate-500' : 'text-red-500/70'}`}>
            {backendOnline ? 'API Online' : 'API Offline'}
          </span>
        </div>

      </div>
    </div>
  )
}
