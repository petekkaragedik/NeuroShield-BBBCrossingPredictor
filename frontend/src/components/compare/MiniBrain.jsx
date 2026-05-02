// Static mini brain icon — colored state only, no animation
const BRAIN_OUTER =
  'M55,9 C72,8 89,12 97,25 C106,38 106,52 99,64 ' +
  'C92,75 81,82 70,84 C62,85 59,84 55,84 ' +
  'C51,84 48,85 40,84 C29,82 18,75 11,64 ' +
  'C4,52 4,38 12,25 C21,12 38,8 55,9 Z'

export default function MiniBrain({ prediction }) {
  const isPos = prediction === 'BBB+'
  const accent = isPos ? '#10b981' : '#ef4444'
  const glow = isPos ? 'rgba(16,185,129,0.55)' : 'rgba(239,68,68,0.45)'

  return (
    <svg
      viewBox="0 0 110 95"
      width="84"
      height="72"
      style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
    >
      <path d={BRAIN_OUTER} fill={isPos ? '#071a11' : '#1a0707'} />
      <path d={BRAIN_OUTER} fill="none" stroke={accent} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M55,9 C54,42 54,71 55,84" stroke={accent} strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M25,18 C32,14 44,13 51,18" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M59,18 C66,13 78,14 85,18" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M14,50 C23,46 35,45 45,48" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M65,48 C75,45 87,46 96,50" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.4" />
    </svg>
  )
}
