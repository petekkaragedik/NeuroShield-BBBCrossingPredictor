import { useEffect, useState } from 'react'

// ── Brain geometry ──────────────────────────────────────────────────────────

const BRAIN_OUTER =
  'M110,18 C145,15 178,25 195,50 C212,75 212,105 198,128 ' +
  'C184,150 162,165 140,168 C125,172 118,170 110,170 ' +
  'C102,170 95,172 80,168 C58,165 36,150 22,128 ' +
  'C8,105 8,75 25,50 C42,25 75,15 110,18 Z'

const BRAIN_STEM =
  'M97,168 C95,177 97,185 110,186 C123,185 125,177 123,168'

// Central sulcus + left/right gyri fold lines
const SULCI = [
  'M110,18 C108,85 109,142 110,170',          // interhemispheric fissure
  'M50,36  C65,27  88,26  103,36',            // L top
  'M26,73  C41,58  61,53  77,59',             // L upper
  'M18,101 C33,87  54,83  70,89',             // L middle
  'M26,131 C45,118 67,117 83,125',            // L lower
  'M170,36 C155,27 132,26 117,36',            // R top
  'M194,73 C179,58 159,53 143,59',            // R upper
  'M202,101 C187,87 166,83 150,89',           // R middle
  'M194,131 C175,118 153,117 137,125',        // R lower
]

// BBB− barrier follows inner bottom-third arc of brain
const BARRIER_PATH =
  'M28,128 C55,133 85,131 110,131 C135,131 165,133 192,128'

// BBB− particles: start inside brain, approach barrier at y≈131
const BLOCKED_PARTICLES = [
  { cx: 60,  startY: 78,  endY: 131, delay: 0.3  },
  { cx: 85,  startY: 65,  endY: 131, delay: 0.55 },
  { cx: 135, startY: 65,  endY: 131, delay: 0.8  },
  { cx: 160, startY: 78,  endY: 131, delay: 1.05 },
]

// BBB+ orbit particles (staggered around outline)
const ORBIT_DELAYS = [0, 0.7, 1.4, 2.1, 2.8]

// ── Helpers ─────────────────────────────────────────────────────────────────

function confidenceTier(prob) {
  if (prob > 85) return { label: 'High Confidence', color: '#10b981' }
  if (prob > 60) return { label: 'Borderline',      color: '#f59e0b' }
  return            { label: 'Low Confidence',       color: '#f97316' }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BrainVisualizer({ probability, prediction, animKey }) {
  const isPos     = prediction === 'BBB+'
  const accent    = isPos ? '#10b981' : '#ef4444'
  const tier      = confidenceTier(probability)

  // Unique IDs so multiple renders / re-mounts never clash
  const sweepId   = `sweep-${animKey}`
  const gradId    = `grad-${animKey}`
  const pathRefId = `bpath-${animKey}`

  return (
    <div className="flex flex-col items-center select-none">

      {/* ── Brain SVG — key forces full remount on each new result ── */}
      <svg
        key={animKey}
        viewBox="0 0 220 195"
        width="220" height="195"
        style={{ overflow: 'visible' }}
        className={isPos ? 'animate-brain-glow-green' : 'animate-brain-glow-red'}
      >
        <defs>
          {isPos && (
            <>
              {/* Gradient for the fill sweep */}
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"   stopColor="#10b981" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.12" />
              </linearGradient>

              {/* Clip path sweeps upward over 1.5 s */}
              <clipPath id={sweepId}>
                <rect x="0" width="220" y="195" height="0">
                  <animate attributeName="y"      from="195" to="0"
                           dur="1.5s" begin="0.15s" fill="freeze"
                           calcMode="spline" keySplines="0.4 0 0.2 1" />
                  <animate attributeName="height" from="0"   to="195"
                           dur="1.5s" begin="0.15s" fill="freeze"
                           calcMode="spline" keySplines="0.4 0 0.2 1" />
                </rect>
              </clipPath>
            </>
          )}
        </defs>

        {/* Brain stem */}
        <path d={BRAIN_STEM}
              fill={isPos ? '#0a2018' : '#200a0a'}
              stroke={accent} strokeWidth="1.5"
              strokeLinecap="round" opacity="0.7" />

        {/* Base brain fill — dark tinted background */}
        <path d={BRAIN_OUTER}
              fill={isPos ? '#071a11' : '#1a0707'} />

        {/* BBB+: animated green fill sweep */}
        {isPos && (
          <path d={BRAIN_OUTER}
                fill={`url(#${gradId})`}
                clipPath={`url(#${sweepId})`} />
        )}

        {/* Outer brain border */}
        <path d={BRAIN_OUTER}
              fill="none"
              stroke={accent} strokeWidth="2.2"
              strokeLinejoin="round" />

        {/* Sulci / fold lines */}
        {SULCI.map((d, i) => (
          <path key={i} d={d} fill="none"
                stroke={accent} strokeWidth="1"
                strokeLinecap="round"
                opacity={isPos ? 0.35 : 0.2} />
        ))}

        {/* ── BBB+: particles orbit the brain outline ── */}
        {isPos && (
          <>
            {/* Hidden path used as motion track */}
            <path id={pathRefId} d={BRAIN_OUTER} fill="none" stroke="none" />

            {ORBIT_DELAYS.map((delay, i) => (
              <g key={i}>
                {/* Glow halo around each particle */}
                <circle r="6" fill="#10b981" opacity="0">
                  <animateMotion dur="3.6s" begin={`${delay}s`} repeatCount="indefinite">
                    <mpath xlinkHref={`#${pathRefId}`} />
                  </animateMotion>
                  <animate attributeName="opacity"
                           values="0;0.25;0.25;0"
                           keyTimes="0;0.06;0.88;1"
                           dur="3.6s" begin={`${delay}s`}
                           repeatCount="indefinite" />
                </circle>
                {/* Solid core particle */}
                <circle r="3.2" fill="#10b981">
                  <animateMotion dur="3.6s" begin={`${delay}s`} repeatCount="indefinite">
                    <mpath xlinkHref={`#${pathRefId}`} />
                  </animateMotion>
                  <animate attributeName="opacity"
                           values="0;1;1;0"
                           keyTimes="0;0.06;0.88;1"
                           dur="3.6s" begin={`${delay}s`}
                           repeatCount="indefinite" />
                </circle>
              </g>
            ))}
          </>
        )}

        {/* ── BBB−: barrier line ── */}
        {!isPos && (
          <path d={BARRIER_PATH}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="7 4"
                opacity="0">
            {/* Fade barrier in */}
            <animate attributeName="opacity"
                     from="0" to="0.9"
                     dur="0.5s" begin="0.4s" fill="freeze" />
            {/* Then pulse the barrier */}
            <animate attributeName="stroke-opacity"
                     values="0.5;1;0.5"
                     dur="1.4s" begin="0.9s"
                     repeatCount="indefinite" />
          </path>
        )}

        {/* ── BBB−: particles blocked at the barrier ── */}
        {!isPos && BLOCKED_PARTICLES.map(({ cx, startY, endY, delay }, i) => (
          <g key={i}>
            {/* Glow halo */}
            <circle cx={cx} r="5.5" fill="#ef4444" opacity="0">
              <animate attributeName="cy"
                       from={startY} to={endY}
                       dur="1.1s" begin={`${delay}s`} fill="freeze"
                       calcMode="spline" keySplines="0.25 0.1 0.25 1" />
              <animate attributeName="opacity"
                       values="0;0.2;0.2;0"
                       keyTimes="0;0.08;0.72;1"
                       dur="1.1s" begin={`${delay}s`} fill="freeze" />
            </circle>
            {/* Solid core */}
            <circle cx={cx} r="3" fill="#ef4444" opacity="0">
              <animate attributeName="cy"
                       from={startY} to={endY}
                       dur="1.1s" begin={`${delay}s`} fill="freeze"
                       calcMode="spline" keySplines="0.25 0.1 0.25 1" />
              <animate attributeName="opacity"
                       values="0;0.95;0.95;0"
                       keyTimes="0;0.08;0.72;1"
                       dur="1.1s" begin={`${delay}s`} fill="freeze" />
            </circle>
          </g>
        ))}
      </svg>

      {/* ── Probability number ── */}
      <div className="mt-1 text-center">
        <div className="text-5xl font-bold tabular-nums tracking-tight leading-none"
             style={{ color: accent }}>
          {probability.toFixed(1)}%
        </div>
        <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 mb-3">
          BBB Probability
        </div>

        {/* Verdict */}
        <div className="text-base font-bold uppercase tracking-wide" style={{ color: accent }}>
          {isPos ? '✅ Crosses Blood-Brain Barrier' : '🚫 Blocked at Barrier'}
        </div>

        {/* Confidence tier */}
        <div className="mt-1.5 text-sm font-semibold" style={{ color: tier.color }}>
          {tier.label}
        </div>
      </div>
    </div>
  )
}
