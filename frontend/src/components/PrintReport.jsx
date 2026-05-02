import './PrintReport.css'

// Single compound print report
export function SingleCompoundReport({ compoundName, features, result }) {
  if (!result) return null

  const lipinskiRules = [
    { label: 'MW ≤ 500', value: features.MW, threshold: 500, pass: features.MW <= 500, unit: 'g/mol' },
    { label: 'LogP ≤ 5', value: features.LogP, threshold: 5, pass: features.LogP <= 5, unit: '' },
    { label: 'H-Donors ≤ 5', value: features.HBD, threshold: 5, pass: features.HBD <= 5, unit: '' },
    { label: 'TPSA ≤ 140', value: features.TPSA, threshold: 140, pass: features.TPSA <= 140, unit: 'Å²' },
  ]
  const lipinskiPassed = lipinskiRules.filter((r) => r.pass).length

  const isPositive = result.prediction === 'BBB+'
  const isNegative = result.prediction === 'BBB-'

  // Generate optimization suggestions for BBB- compounds
  const optimizations = []
  if (isNegative) {
    if (features.MW > 400) {
      optimizations.push(`Reduce molecular weight below 400 g/mol (current: ${features.MW.toFixed(0)})`)
    }
    if (features.LogP < 0 || features.LogP > 5) {
      optimizations.push(`Adjust LogP toward 1–3 range (current: ${features.LogP.toFixed(2)})`)
    }
    if (features.HBD > 3) {
      optimizations.push(`Reduce H-bond donors below 3 (current: ${features.HBD})`)
    }
    if (features.TPSA > 90) {
      optimizations.push(`Lower polar surface area below 90 Å² (current: ${features.TPSA.toFixed(1)})`)
    }
    if (features.RotBonds > 8) {
      optimizations.push(`Decrease rotatable bonds below 8 (current: ${features.RotBonds})`)
    }
  }

  // Get confidence tier
  const getConfidenceTier = (probability) => {
    if (probability > 85 || probability < 15) return 'High Confidence'
    if (probability > 65 && probability < 85) return 'Moderate Confidence'
    if (probability > 15 && probability < 35) return 'Moderate Confidence'
    return 'Borderline'
  }

  const confidenceTier = getConfidenceTier(result.probability)

  // Get impact label for SHAP values
  const getImpactLabel = (impact) => {
    const absImpact = Math.abs(impact)
    const direction = impact > 0 ? '↑' : '↓'
    if (absImpact > 0.15) return `Strong ${direction}`
    if (absImpact > 0.08) return `Moderate ${direction}`
    return `Weak ${direction}`
  }

  // Format current date and time
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div id="print-report" className="print-report">
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          <div className="print-logo">🧠 NeuroShield</div>
        </div>
        <div className="print-header-center">
          <h1 className="print-title">Blood-Brain Barrier Permeability Report</h1>
        </div>
        <div className="print-header-right">
          <div className="print-timestamp">Generated: {dateStr} at {timeStr}</div>
        </div>
      </div>

      <div className="print-divider" />

      {/* Compound Identity Block */}
      <div className="print-section">
        <h2 className="print-compound-name">{compoundName || 'Unknown Compound'}</h2>

        {/* Descriptor values grid */}
        <div className="print-descriptors-grid">
          <div className="print-descriptor">
            <div className="print-descriptor-label">MW</div>
            <div className="print-descriptor-value">{features.MW} g/mol</div>
          </div>
          <div className="print-descriptor">
            <div className="print-descriptor-label">LogP</div>
            <div className="print-descriptor-value">{features.LogP.toFixed(2)}</div>
          </div>
          <div className="print-descriptor">
            <div className="print-descriptor-label">HBD</div>
            <div className="print-descriptor-value">{features.HBD}</div>
          </div>
          <div className="print-descriptor">
            <div className="print-descriptor-label">TPSA</div>
            <div className="print-descriptor-value">{features.TPSA} Ų</div>
          </div>
          <div className="print-descriptor">
            <div className="print-descriptor-label">Ring Count</div>
            <div className="print-descriptor-value">{features.RingCount}</div>
          </div>
          <div className="print-descriptor">
            <div className="print-descriptor-label">Rotatable Bonds</div>
            <div className="print-descriptor-value">{features.RotBonds}</div>
          </div>
        </div>
      </div>

      {/* Verdict Block */}
      <div className={`print-verdict ${isPositive ? 'positive' : isNegative ? 'negative' : 'borderline'}`}>
        <div className="print-verdict-result">
          {result.prediction} — {isPositive ? 'PENETRATES BLOOD-BRAIN BARRIER' : 'BLOCKED AT BLOOD-BRAIN BARRIER'}
        </div>
        <div className="print-verdict-probability">
          {result.probability.toFixed(1)}% probability
        </div>
        <div className="print-verdict-confidence">
          {confidenceTier}
        </div>
      </div>

      {/* SHAP Contributions Table */}
      <div className="print-section">
        <h3 className="print-section-title">Feature Contributions</h3>
        <p className="print-section-caption">Feature contributions explaining the model's prediction</p>

        <table className="print-table">
          <thead>
            <tr>
              <th>Descriptor</th>
              <th>Value</th>
              <th>SHAP Contribution</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {result.contributing_factors?.map((factor, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
                <td className="font-semibold">{factor.feature}</td>
                <td>{factor.value}</td>
                <td className={factor.impact > 0 ? 'positive-shap' : 'negative-shap'}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(3)}
                </td>
                <td>{getImpactLabel(factor.impact)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lipinski Checklist */}
      <div className="print-section">
        <h3 className="print-section-title">Lipinski's Rule of Five</h3>

        <div className="print-lipinski-grid">
          {lipinskiRules.map((rule, idx) => (
            <div key={idx} className={`print-lipinski-item ${rule.pass ? 'pass' : 'fail'}`}>
              <div className="print-lipinski-icon">{rule.pass ? '✅' : '❌'}</div>
              <div className="print-lipinski-content">
                <div className="print-lipinski-label">{rule.label}</div>
                <div className="print-lipinski-actual">
                  Actual: {Number(rule.value).toFixed(rule.value % 1 === 0 ? 0 : 2)} {rule.unit}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="print-lipinski-summary">
          Overall: {lipinskiPassed}/4 Lipinski criteria passed
        </div>
      </div>

      {/* Optimization Suggestions (BBB- only) */}
      {isNegative && optimizations.length > 0 && (
        <div className="print-section">
          <h3 className="print-section-title">Suggested Modifications to Improve BBB Penetration</h3>
          <ul className="print-optimization-list">
            {optimizations.map((opt, idx) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div className="print-footer-text">
          Generated by NeuroShield · Trained on B3DB dataset (7,807 molecules)
        </div>
        <div className="print-footer-disclaimer">
          This report is for research purposes only and does not constitute medical advice.
        </div>
        <div className="print-footer-page">Page 1 of 1</div>
      </div>
    </div>
  )
}

// Batch screening report
export function BatchReport({ results, totalScreened, bbbPlusCount, bbbMinusCount, avgProbability }) {
  if (!results || results.length === 0) return null

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  const bbbPlusPercentage = totalScreened > 0 ? ((bbbPlusCount / totalScreened) * 100).toFixed(1) : 0
  const bbbMinusPercentage = totalScreened > 0 ? ((bbbMinusCount / totalScreened) * 100).toFixed(1) : 0

  return (
    <div id="print-report-batch" className="print-report">
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          <div className="print-logo">🧠 NeuroShield</div>
        </div>
        <div className="print-header-center">
          <h1 className="print-title">Batch Screening Report</h1>
        </div>
        <div className="print-header-right">
          <div className="print-timestamp">Generated: {dateStr} at {timeStr}</div>
        </div>
      </div>

      <div className="print-divider" />

      {/* Summary Statistics */}
      <div className="print-section">
        <h3 className="print-section-title">Summary Statistics</h3>

        <div className="print-batch-stats">
          <div className="print-batch-stat">
            <div className="print-batch-stat-label">Total Screened</div>
            <div className="print-batch-stat-value">{totalScreened}</div>
          </div>
          <div className="print-batch-stat positive">
            <div className="print-batch-stat-label">BBB+ (Penetrates)</div>
            <div className="print-batch-stat-value">{bbbPlusCount}</div>
            <div className="print-batch-stat-pct">{bbbPlusPercentage}%</div>
          </div>
          <div className="print-batch-stat negative">
            <div className="print-batch-stat-label">BBB- (Blocked)</div>
            <div className="print-batch-stat-value">{bbbMinusCount}</div>
            <div className="print-batch-stat-pct">{bbbMinusPercentage}%</div>
          </div>
          <div className="print-batch-stat">
            <div className="print-batch-stat-label">Average Probability</div>
            <div className="print-batch-stat-value">{avgProbability}%</div>
          </div>
        </div>

        {/* Donut Chart (SVG) */}
        <div className="print-donut-container">
          <svg width="200" height="200" viewBox="0 0 200 200" className="print-donut-chart">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40" />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#10b981"
              strokeWidth="40"
              strokeDasharray={`${(bbbPlusPercentage / 100) * 502.4} 502.4`}
              transform="rotate(-90 100 100)"
            />
            <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#1f2937">
              {bbbPlusPercentage}%
            </text>
            <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#6b7280">
              BBB+
            </text>
          </svg>
        </div>
      </div>

      {/* Results Table */}
      <div className="print-section">
        <h3 className="print-section-title">Screening Results</h3>

        <table className="print-table print-table-batch">
          <thead>
            <tr>
              <th>Compound Name</th>
              <th>BBB Result</th>
              <th>Probability</th>
              <th>MW</th>
              <th>LogP</th>
              <th>TPSA</th>
              <th>Lipinski</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => {
              const lipinskiScore = [
                result.features.MW <= 500,
                result.features.LogP <= 5,
                result.features.HBD <= 5,
                result.features.TPSA <= 140,
              ].filter(Boolean).length

              return (
                <tr key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
                  <td className="font-semibold">{result.name}</td>
                  <td className={result.result.prediction === 'BBB+' ? 'positive-result' : 'negative-result'}>
                    {result.result.prediction}
                  </td>
                  <td>{result.result.probability.toFixed(1)}%</td>
                  <td>{result.features.MW}</td>
                  <td>{result.features.LogP}</td>
                  <td>{result.features.TPSA}</td>
                  <td>{lipinskiScore}/4 {lipinskiScore === 4 ? '✅' : '⚠️'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div className="print-footer-text">
          Generated by NeuroShield · Trained on B3DB dataset (7,807 molecules)
        </div>
        <div className="print-footer-disclaimer">
          This report is for research purposes only and does not constitute medical advice.
        </div>
        <div className="print-footer-page">Page 1 of 1</div>
      </div>
    </div>
  )
}
