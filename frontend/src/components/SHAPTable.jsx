import { useState } from 'react'
import './SHAPTable.css'

const DESCRIPTOR_EXPLANATIONS = {
  MW: 'Molecular Weight — lighter molecules cross more easily',
  LogP: 'Lipophilicity — higher values favor membrane crossing',
  HBD: 'H-Bond Donors — fewer donors favor BBB penetration',
  TPSA: 'Polar Surface Area — lower values strongly favor crossing',
  RotBonds: 'Rotatable Bonds — flexibility affects permeability',
  RingCount: 'Ring structures — affects rigidity and crossing ability'
}

export default function SHAPTable({ factors }) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.impact)), 0.0001)

  // Find the top contributor (highest absolute SHAP value)
  const topContributorIndex = factors.reduce(
    (maxIdx, curr, idx, arr) =>
      Math.abs(curr.impact) > Math.abs(arr[maxIdx].impact) ? idx : maxIdx,
    0
  )

  return (
    <div className="bg-bg/60 border border-slate-800 rounded-xl p-5">
      {/* Header with title and legend */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Why did the model decide this?
          </h3>
          <p className="text-[11px] text-slate-500">
            SHAP values show each descriptor's contribution to the prediction
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium mt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-400">Increases BBB crossing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-slate-400">Decreases BBB crossing</span>
          </div>
        </div>
      </div>

      {/* SHAP rows */}
      <div className="shap-rows-container">
        {factors.map((f, idx) => {
          const isPositive = f.impact > 0
          const widthPct = (Math.abs(f.impact) / maxAbs) * 100
          const isTopContributor = idx === topContributorIndex
          const isHovered = hoveredRow === idx

          return (
            <div
              key={f.feature}
              className={`shap-row ${isTopContributor ? 'shap-row-top' : ''}`}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="shap-tooltip">
                  {DESCRIPTOR_EXPLANATIONS[f.feature] || 'Descriptor explanation'}
                  <div className="shap-tooltip-arrow" />
                </div>
              )}

              {/* Column 1: Descriptor name + TOP badge */}
              <div className="shap-col-name">
                {f.feature}
                {isTopContributor && (
                  <span className="shap-top-badge">TOP FACTOR</span>
                )}
              </div>

              {/* Column 2: Actual value */}
              <div className="shap-col-value">
                {f.value}
              </div>

              {/* Column 3: Bar chart */}
              <div className="shap-col-bar">
                {/* Background track */}
                <div className="shap-bar-track" />

                {/* Gradient bar */}
                <div
                  className={`shap-bar ${isPositive ? 'shap-bar-positive' : 'shap-bar-negative'}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              {/* Column 4: SHAP value */}
              <div className={`shap-col-impact ${isPositive ? 'shap-impact-positive' : 'shap-impact-negative'}`}>
                {isPositive ? '+' : ''}
                {f.impact.toFixed(3)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
