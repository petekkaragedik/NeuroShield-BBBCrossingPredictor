export default function Header({ mode, onModeChange }) {
  return (
    <header className="border-b border-slate-800/80 bg-bg/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="NeuroShield"
              className="h-36 w-36 object-contain mix-blend-screen -my-2"
            />
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight leading-none">
                Neuro<span className="text-blue-400">Shield</span>
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                AI-powered Blood-Brain Barrier Permeability Predictor
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          {onModeChange && (
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => onModeChange('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'single'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                Single Compound
              </button>
              <button
                onClick={() => onModeChange('batch')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'batch'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                Batch Screening
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
