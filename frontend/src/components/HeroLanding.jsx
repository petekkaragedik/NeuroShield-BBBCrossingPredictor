const COMPOUNDS = [
  { name: 'Aspirin',   tagline: 'Anti-inflammatory · MW 180' },
  { name: 'Caffeine',  tagline: 'CNS Stimulant · MW 194'     },
  { name: 'Ibuprofen', tagline: 'NSAID · MW 206'             },
]

const USE_CASES = [
  {
    icon: '🔬',
    title: 'Medicinal Chemists',
    tagline: 'Screen BBB candidates before synthesis',
    body: 'Predict permeability from molecular descriptors in seconds — before committing to expensive wet lab synthesis. Iterate faster on your scaffold design.',
    badge: 'Single & Compare modes',
    accent: {
      border:  'rgba(59,130,246,0.45)',
      iconBg:  'rgba(59,130,246,0.15)',
      tagline: '#93c5fd',
      badge:   { bg: 'rgba(59,130,246,0.20)', text: '#93c5fd', border: 'rgba(59,130,246,0.35)' },
      shadow:  'rgba(59,130,246,0.18)',
    },
    delay: '0ms',
  },
  {
    icon: '🏥',
    title: 'Pharma R&D Teams',
    tagline: 'Reduce wet lab costs with AI pre-screening',
    body: 'Run batch screening across entire compound libraries. Export results as CSV or PDF reports for team review. Prioritize the most promising CNS candidates.',
    badge: 'Batch Screening mode',
    accent: {
      border:  'rgba(168,85,247,0.45)',
      iconBg:  'rgba(168,85,247,0.15)',
      tagline: '#d8b4fe',
      badge:   { bg: 'rgba(168,85,247,0.20)', text: '#d8b4fe', border: 'rgba(168,85,247,0.35)' },
      shadow:  'rgba(168,85,247,0.18)',
    },
    delay: '150ms',
  },
  {
    icon: '🎓',
    title: 'Academic Researchers',
    tagline: 'Explore structure-activity relationships',
    body: 'Understand exactly why a compound crosses or gets blocked using SHAP explainability. Explore compound neighborhoods with the interactive exploration tree.',
    badge: 'SHAP + Exploration Tree',
    accent: {
      border:  'rgba(20,184,166,0.45)',
      iconBg:  'rgba(20,184,166,0.15)',
      tagline: '#5eead4',
      badge:   { bg: 'rgba(20,184,166,0.20)', text: '#5eead4', border: 'rgba(20,184,166,0.35)' },
      shadow:  'rgba(20,184,166,0.18)',
    },
    delay: '300ms',
  },
]

const STATS = [
  { value: '7,807',              label: 'Molecules Trained'  },
  { value: 'Random Forest+SHAP', label: 'Model Architecture' },
  { value: 'PubChem',            label: 'API Integrated'     },
]

function UseCaseCard({ card }) {
  const { icon, title, tagline, body, badge, accent, delay } = card
  return (
    <div
      className="animate-card-slide-up flex flex-col text-left rounded-2xl p-5
                 transition-all duration-200 ease-out cursor-default
                 hover:-translate-y-1"
      style={{
        animationDelay: delay,
        background: '#111729',
        borderTop: `2px solid ${accent.border}`,
        border: `1px solid rgba(255,255,255,0.06)`,
        borderTopColor: accent.border,
        '--hover-shadow': `0 8px 32px ${accent.shadow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${accent.shadow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4 shrink-0"
        style={{ background: accent.iconBg }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>

      {/* Tagline */}
      <p className="text-xs font-medium mb-3" style={{ color: accent.tagline }}>
        {tagline}
      </p>

      {/* Body */}
      <p className="text-xs text-slate-400 leading-relaxed flex-1">{body}</p>

      {/* Badge */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <span
          className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border"
          style={{
            background: accent.badge.bg,
            color: accent.badge.text,
            borderColor: accent.badge.border,
          }}
        >
          {badge}
        </span>
      </div>
    </div>
  )
}

export default function HeroLanding({ onEnter, exiting }) {
  return (
    <div
      className={`flex-1 overflow-y-auto bg-bg relative
                  ${exiting ? 'animate-hero-exit' : 'animate-fade-in'}`}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px]
                        bg-blue-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-150px] w-[500px] h-[400px]
                        bg-blue-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-150px] w-[500px] h-[400px]
                        bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-16 max-w-5xl mx-auto">

        {/* Status badge */}
        <div className="mb-7 inline-flex items-center gap-2 px-3 py-1.5
                        bg-blue-950/60 border border-blue-800/50 rounded-full
                        text-xs text-blue-300 tracking-wide">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          B3DB Dataset · 7,807 molecules · Random Forest
        </div>

        {/* Logo */}
        <div className="mb-2">
          <img
            src="/logo.png"
            alt="NeuroShield"
            className="h-48 w-48 object-contain mix-blend-screen mx-auto"
          />
        </div>

        {/* Title */}
        <h1 className="text-6xl font-bold tracking-tight mb-3">
          <span className="bg-linear-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            NeuroShield
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-10">
          AI-powered Blood-Brain Barrier Permeability Screening
          <span className="block text-slate-500 text-base mt-0.5">for CNS Drug Discovery</span>
        </p>

        {/* Stats credibility bar */}
        <div className="flex w-full max-w-2xl bg-panel border border-slate-800/80
                        rounded-2xl overflow-hidden shadow-xl mb-10">
          {STATS.map((s, i) => (
            <div key={i}
                 className={`flex-1 py-5 px-4 text-center
                             ${i < STATS.length - 1 ? 'border-r border-slate-800/80' : ''}`}>
              <div className={`font-bold text-blue-300 leading-tight
                               ${i === 1 ? 'text-sm' : 'text-xl'}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Example compounds */}
        <div className="w-full max-w-xl mb-10">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3 text-left">
            Try an example
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COMPOUNDS.map((c) => (
              <button
                key={c.name}
                onClick={() => onEnter(c.name)}
                className="bg-panel border border-slate-800 hover:border-blue-500/60
                           hover:bg-[#162030] rounded-xl p-4 text-left transition-all
                           duration-200 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {c.name}
                  </span>
                  <svg className="w-3 h-3 text-slate-700 group-hover:text-blue-400 transition-colors"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="text-xs text-slate-500">{c.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Use-case cards */}
        <div className="w-full max-w-4xl mb-10">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-4 text-left">
            Built for every stage of CNS drug discovery
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {USE_CASES.map((card) => (
              <UseCaseCard key={card.title} card={card} />
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => onEnter(null)}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold
                     text-lg rounded-xl transition-all duration-200
                     shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:shadow-[0_0_36px_rgba(59,130,246,0.5)]
                     hover:scale-105 animate-glow-pulse"
        >
          Start Screening →
        </button>

      </div>
    </div>
  )
}
