import { useState, useEffect } from 'react'

const MESSAGES = [
  'Querying PubChem database...',
  'Extracting molecular descriptors...',
  'Computing SHAP values...',
  'Preparing prediction...',
]

// Pentagon ring (center 80,78 radius 30) + one side-chain atom above
const ATOMS = [
  { cx: 80,  cy: 48,  r: 8,   color: '#3b82f6', delay: '0s'     }, // top — blue
  { cx: 109, cy: 67,  r: 6.5, color: '#06b6d4', delay: '0.3s'   }, // top-right — cyan
  { cx: 98,  cy: 100, r: 6.5, color: '#14b8a6', delay: '0.6s'   }, // bot-right — teal
  { cx: 62,  cy: 100, r: 6.5, color: '#10b981', delay: '0.9s'   }, // bot-left — emerald
  { cx: 51,  cy: 67,  r: 6.5, color: '#06b6d4', delay: '1.2s'   }, // top-left — cyan
  { cx: 80,  cy: 22,  r: 5,   color: '#818cf8', delay: '1.5s'   }, // side chain — indigo
]

const BONDS = [
  { x1: 80,  y1: 48,  x2: 109, y2: 67  }, // ring 1→2
  { x1: 109, y1: 67,  x2: 98,  y2: 100 }, // ring 2→3
  { x1: 98,  y1: 100, x2: 62,  y2: 100 }, // ring 3→4
  { x1: 62,  y1: 100, x2: 51,  y2: 67  }, // ring 4→5
  { x1: 51,  y1: 67,  x2: 80,  y2: 48  }, // ring 5→1 (close)
  { x1: 80,  y1: 48,  x2: 80,  y2: 22  }, // side chain
]

export default function CompoundLoadingCard() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-start animate-fade-in"
         style={{ minHeight: '348px' }}>

      {/* ── Animated molecule ── */}
      <svg viewBox="0 0 160 128" width="160" height="128" className="mb-5 mt-2">

        {/* Bonds */}
        {BONDS.map((b, i) => (
          <line key={i}
                x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
                stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
            <animate
              attributeName="stroke-opacity"
              values="0.12;0.55;0.12"
              dur="1.8s"
              begin={`${i * 0.18}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
          </line>
        ))}

        {/* Glow rings — expand outward and fade */}
        {ATOMS.map((a, i) => (
          <circle key={`glow-${i}`}
                  cx={a.cx} cy={a.cy} r={a.r}
                  fill="none" stroke={a.color} strokeWidth="1.5">
            <animate
              attributeName="r"
              values={`${a.r};${a.r * 2.8}`}
              dur="1.8s"
              begin={a.delay}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.2 0 0.8 1"
            />
            <animate
              attributeName="opacity"
              values="0.55;0"
              dur="1.8s"
              begin={a.delay}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.2 0 0.8 1"
            />
          </circle>
        ))}

        {/* Filled atoms — pulse in/out */}
        {ATOMS.map((a, i) => (
          <circle key={`atom-${i}`}
                  cx={a.cx} cy={a.cy} r={a.r}
                  fill={a.color}>
            <animate
              attributeName="r"
              values={`${a.r};${a.r * 1.45};${a.r}`}
              dur="1.8s"
              begin={a.delay}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.8s"
              begin={a.delay}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
          </circle>
        ))}
      </svg>

      {/* ── Cycling status message ── */}
      <p key={msgIdx}
         className="text-sm text-blue-300/90 font-medium text-center animate-fade-in">
        {MESSAGES[msgIdx]}
      </p>
      <p className="text-xs text-slate-600 mt-1 mb-5">via PubChem REST API</p>

      {/* ── Skeleton descriptor badges — holds vertical space ── */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-14 h-10 bg-slate-800/50 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>

    </div>
  )
}
