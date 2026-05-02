export default function Header({ backendOnline }) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <path
                d="M17 2 L30 8 V18 C30 25 24 30 17 32 C10 30 4 25 4 18 V8 Z"
                fill="url(#logo-grad)"
                opacity="0.9"
              />
              <circle cx="17" cy="16" r="3" fill="#fff" />
              <circle cx="11" cy="13" r="1.6" fill="#fff" opacity="0.85" />
              <circle cx="23" cy="13" r="1.6" fill="#fff" opacity="0.85" />
              <circle cx="13" cy="22" r="1.6" fill="#fff" opacity="0.85" />
              <circle cx="21" cy="22" r="1.6" fill="#fff" opacity="0.85" />
              <line x1="17" y1="16" x2="11" y2="13" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
              <line x1="17" y1="16" x2="23" y2="13" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
              <line x1="17" y1="16" x2="13" y2="22" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
              <line x1="17" y1="16" x2="21" y2="22" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Neuro<span className="text-blue-400">Shield</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
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
