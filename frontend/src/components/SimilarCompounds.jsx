import { useState } from 'react'
import './SimilarCompounds.css'

function getBiggestDescriptorDelta(compound, currentFeatures) {
  const descriptors = ['MW', 'LogP', 'HBD', 'TPSA', 'RingCount', 'RotBonds']
  let maxDelta = { descriptor: '', delta: 0, sign: '' }

  descriptors.forEach(desc => {
    if (compound[desc] !== undefined && currentFeatures[desc] !== undefined) {
      const delta = compound[desc] - currentFeatures[desc]
      if (Math.abs(delta) > Math.abs(maxDelta.delta)) {
        maxDelta = {
          descriptor: desc,
          delta: Math.abs(delta),
          sign: delta > 0 ? '+' : '-'
        }
      }
    }
  })

  return maxDelta
}

function Breadcrumbs({ breadcrumbPath, onNavigateToNode }) {
  if (breadcrumbPath.length < 2) return null

  const displayTrail = breadcrumbPath.length > 4 ? ['...', ...breadcrumbPath.slice(-3)] : breadcrumbPath
  const isEllipsis = displayTrail[0] === '...'

  return (
    <div className="breadcrumb-trail">
      {displayTrail.map((item, idx) => {
        const isLast = idx === displayTrail.length - 1
        const isTruncated = isEllipsis && idx === 0

        if (isTruncated) {
          return (
            <span key="ellipsis" className="breadcrumb-ellipsis">
              ... <span className="breadcrumb-separator">›</span>
            </span>
          )
        }

        return (
          <span key={`${item.id}-${idx}`} className="breadcrumb-item-wrapper">
            <button
              onClick={() => !isLast && onNavigateToNode(item.id)}
              className={`breadcrumb-item ${isLast ? 'breadcrumb-current' : 'breadcrumb-past'}`}
              disabled={isLast}
            >
              {item.name}
            </button>
            {!isLast && <span className="breadcrumb-separator">›</span>}
          </span>
        )
      })}
    </div>
  )
}

function SimilarityBar({ similarity }) {
  const percentage = similarity * 100
  let barClass = 'similarity-bar-gray'
  if (percentage > 40) barClass = 'similarity-bar-green'
  else if (percentage > 20) barClass = 'similarity-bar-yellow'

  return (
    <div className="similarity-bar-container">
      <div className="similarity-bar-track">
        <div className={`similarity-bar ${barClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default function SimilarCompounds({
  compounds,
  currentCompound,
  currentFeatures,
  currentBBBStatus,
  onExploreCompound,
  breadcrumbPath,
  onNavigateToNode
}) {
  const [hoveredCard, setHoveredCard] = useState(null)

  if (!compounds || compounds.length === 0) return null

  return (
    <div className="bg-bg/60 border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">
          Explore Similar Compounds
        </h3>
        <p className="text-[11px] text-slate-500">
          Click any compound to explore its BBB profile
        </p>
      </div>

      {/* Breadcrumb trail */}
      <Breadcrumbs
        breadcrumbPath={breadcrumbPath}
        onNavigateToNode={onNavigateToNode}
      />

      {/* Compound cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {compounds.map((c, i) => {
          const isPositive = c.bbb_status === 'BBB+'
          const isDifferentBBB = c.bbb_status !== currentBBBStatus
          const delta = isDifferentBBB ? getBiggestDescriptorDelta(c, currentFeatures) : null

          return (
            <div
              key={i}
              className={`similar-card ${isPositive ? 'similar-card-positive' : 'similar-card-negative'}`}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onExploreCompound(c.name)}
            >
              {/* Color-coded left border */}
              <div className={`similar-card-border ${isPositive ? 'border-positive' : 'border-negative'}`} />

              {/* Card content */}
              <div className="similar-card-content">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="text-xs font-medium text-slate-200 truncate flex-1" title={c.name}>
                    {c.name}
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {c.bbb_status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-2">
                  <span>MW {c.MW}</span>
                  <span className="text-slate-700">·</span>
                  <span>LogP {c.LogP}</span>
                </div>

                {/* Similarity section */}
                <div className="mt-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Similarity</span>
                    <span className="text-[11px] font-mono text-blue-300">
                      {(c.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <SimilarityBar similarity={c.similarity} />

                  {/* BBB delta insight */}
                  {delta && delta.delta > 0 && (
                    <div className="mt-2 text-[9px] text-slate-500 leading-tight">
                      {delta.descriptor} {delta.sign}{delta.delta.toFixed(1)} vs current
                    </div>
                  )}
                </div>

                {/* Hover explore label */}
                {hoveredCard === i && (
                  <div className="similar-card-explore">
                    → Explore
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
