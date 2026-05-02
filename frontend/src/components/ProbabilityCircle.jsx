export default function ProbabilityCircle({ probability, prediction }) {
  const isPositive = prediction === 'BBB+'
  const color = isPositive ? '#10b981' : '#ef4444'
  const trackColor = '#1f2937'
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (probability / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} stroke={trackColor} strokeWidth="10" fill="none" />
          <circle
            cx="80" cy="80" r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>
            {probability.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            BBB Probability
          </span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div
          className="text-lg font-semibold"
          style={{ color }}
        >
          {isPositive ? 'BBB+ Penetrates' : 'BBB− Does Not Penetrate'}
        </div>
      </div>
    </div>
  )
}
