export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-bg/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-1 flex items-center">
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
      </div>
    </header>
  )
}
