import { useNavigation } from '../context/NavigationContext'

export default function Header({ mode, onModeChange, currentCompound, onCompareWithCurrent, onToggleHistory, historyCount, onHome }) {
  const { canGoBack, canGoForward, backLabel, forwardLabel, goBack, goForward } = useNavigation()

  const TABS = [
    { id: 'single',  label: 'Single Compound'  },
    { id: 'batch',   label: 'Batch Screening'  },
    { id: 'compare', label: 'Compare'          },
  ]

  return (
    <header className="border-b border-slate-800/80 bg-bg/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Back / Forward */}
            <div className="flex items-center gap-1">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                title={canGoBack ? `Back to ${backLabel}` : 'No history'}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                           ${canGoBack
                             ? 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600'
                             : 'text-slate-700 cursor-not-allowed border border-slate-800/40'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                title={canGoForward ? `Forward to ${forwardLabel}` : 'No forward history'}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                           ${canGoForward
                             ? 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600'
                             : 'text-slate-700 cursor-not-allowed border border-slate-800/40'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={onHome}
              className="group flex items-center gap-4 focus:outline-none"
              title="Go to home"
            >
              <img
                src="/logo.png"
                alt="NeuroShield"
                className="h-36 w-36 object-contain mix-blend-screen -my-2
                           transition-opacity duration-200 group-hover:opacity-80"
              />
              <div className="text-left">
                <h1 className="text-3xl font-semibold text-white tracking-tight leading-none
                               transition-colors duration-200 group-hover:text-blue-300">
                  Neuro<span className="text-blue-400 group-hover:text-blue-300">Shield</span>
                </h1>
                <p className="text-sm text-slate-400 mt-2 transition-colors duration-200 group-hover:text-slate-300">
                  AI-powered Blood-Brain Barrier Permeability Predictor
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* History toggle */}
            {onToggleHistory && (
              <button
                onClick={onToggleHistory}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg
                           text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800"
                title="Session History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {historyCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white
                                   text-[9px] font-bold w-4 h-4 flex items-center justify-center
                                   rounded-full leading-none">
                    {historyCount > 9 ? '9+' : historyCount}
                  </span>
                )}
              </button>
            )}

            {/* "Compare with current" shortcut */}
            {mode === 'single' && currentCompound && onCompareWithCurrent && (
              <button
                onClick={() => onCompareWithCurrent(currentCompound)}
                className="text-sm font-medium px-3 py-2 rounded-lg
                           bg-purple-500/10 hover:bg-purple-500/20 text-purple-300
                           border border-purple-500/30 transition flex items-center gap-2"
                title={`Pre-fill compare view with ${currentCompound}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Compare with {currentCompound.length > 12 ? currentCompound.slice(0, 10) + '…' : currentCompound}
              </button>
            )}

            {/* Mode Tabs */}
            {onModeChange && (
              <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg p-1 border border-slate-800">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onModeChange(t.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      mode === t.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
