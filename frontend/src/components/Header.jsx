export default function Header({ backendOnline }) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-1 flex items-center justify-between">
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

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'
            }`}
          />
          {backendOnline ? 'API online' : 'API offline'}
        </div>
      </div>
    </header>
  )
}
