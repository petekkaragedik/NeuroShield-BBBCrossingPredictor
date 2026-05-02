import { useState, useRef } from 'react'
import { fetchPubChem, predict } from '../api'
import './BatchScreening.css'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  // Skip header row if it looks like a header (contains non-compound-like text)
  const startIdx = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('compound') ? 1 : 0
  return lines.slice(startIdx)
    .map(line => line.split(',')[0].trim())
    .filter(name => name.length > 0)
}

function getLipinskiScore(features) {
  let score = 0
  if (features.MW <= 500) score++
  if (features.LogP <= 5) score++
  if (features.HBD <= 5) score++
  if (features.TPSA <= 140) score++
  return score
}

function getTopSHAPFactor(factors) {
  if (!factors || factors.length === 0) return null
  return factors.reduce((max, f) =>
    Math.abs(f.impact) > Math.abs(max.impact) ? f : max
  )
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    green: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    red: 'text-red-400 border-red-500/30 bg-red-500/10',
    slate: 'text-slate-300 border-slate-700 bg-slate-800/40'
  }

  return (
    <div className={`stat-card ${colors[color]}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="batch-progress">
      <div className="batch-progress-text">
        Screening {current} of {total} compounds...
      </div>
      <div className="batch-progress-track">
        <div
          className="batch-progress-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ExpandedRow({ result }) {
  return (
    <tr className="expanded-row">
      <td colSpan="9">
        <div className="expanded-content">
          <div className="expanded-header">SHAP Feature Contributions</div>
          <div className="expanded-shap-grid">
            {result.contributing_factors?.map((f, idx) => {
              const isPositive = f.impact > 0
              return (
                <div key={idx} className="expanded-shap-item">
                  <div className="expanded-shap-feature">{f.feature}</div>
                  <div className="expanded-shap-value">{f.value}</div>
                  <div className={`expanded-shap-impact ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{f.impact.toFixed(3)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function BatchScreening({ onSwitchToSingle, onLoadCompound }) {
  const [inputMode, setInputMode] = useState('paste') // 'paste' or 'csv'
  const [compoundsText, setCompoundsText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [currentProcessing, setCurrentProcessing] = useState(0)
  const [filter, setFilter] = useState('all') // 'all', 'bbb+', 'bbb-'
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [expandedRow, setExpandedRow] = useState(null)
  const fileInputRef = useRef(null)

  const compoundNames = compoundsText
    .split('\n')
    .map(line => line.trim())
    .filter(name => name.length > 0)

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const names = parseCSV(text)
      setCompoundsText(names.join('\n'))
      setInputMode('paste')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        const names = parseCSV(text)
        setCompoundsText(names.join('\n'))
        setInputMode('paste')
      }
      reader.readAsText(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const runBatchScreening = async () => {
    if (compoundNames.length === 0) return

    setProcessing(true)
    setResults([])
    setCurrentProcessing(0)

    for (let i = 0; i < compoundNames.length; i++) {
      const name = compoundNames[i]
      setCurrentProcessing(i + 1)

      // Add pending result
      setResults(prev => [...prev, {
        name,
        status: 'fetching',
        timestamp: Date.now()
      }])

      try {
        // Fetch from PubChem
        const pubchemData = await fetchPubChem(name)
        const features = {
          MW: Number(pubchemData.MW) || 0,
          LogP: Number(pubchemData.LogP) || 0,
          HBD: Number(pubchemData.HBD) || 0,
          TPSA: Number(pubchemData.TPSA) || 0,
          RingCount: Number(pubchemData.RingCount) || 0,
          RotBonds: Number(pubchemData.RotBonds) || 0,
        }

        // Run prediction
        const predictionData = await predict(features)

        // Update result
        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            name,
            status: 'complete',
            features,
            result: predictionData,
            lipinskiScore: getLipinskiScore(features),
            topFactor: getTopSHAPFactor(predictionData.contributing_factors),
            timestamp: Date.now()
          } : r
        ))

      } catch (err) {
        // Mark as not found
        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            name,
            status: 'not-found',
            error: err.message,
            timestamp: Date.now()
          } : r
        ))
      }

      // Small delay to not overwhelm the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setProcessing(false)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleViewCompound = (result) => {
    onLoadCompound(result.name, result.features, result.result)
    onSwitchToSingle()
  }

  const downloadCSV = () => {
    const headers = ['Compound Name', 'BBB Result', 'Probability', 'MW', 'LogP', 'TPSA', 'Lipinski Score', 'Top SHAP Factor']
    const rows = completedResults.map(r => [
      r.name,
      r.result.prediction,
      r.result.probability.toFixed(1),
      r.features.MW,
      r.features.LogP,
      r.features.TPSA,
      `${r.lipinskiScore}/4`,
      r.topFactor ? `${r.topFactor.feature} (${r.topFactor.impact > 0 ? '+' : ''}${r.topFactor.impact.toFixed(3)})` : 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neuroshield_batch_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    window.print()
  }

  // Filter and sort results
  const completedResults = results.filter(r => r.status === 'complete')

  let filteredResults = completedResults
  if (filter === 'bbb+') filteredResults = completedResults.filter(r => r.result.prediction === 'BBB+')
  if (filter === 'bbb-') filteredResults = completedResults.filter(r => r.result.prediction === 'BBB-')

  if (sortColumn) {
    filteredResults = [...filteredResults].sort((a, b) => {
      let aVal, bVal

      switch (sortColumn) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'bbb':
          aVal = a.result.prediction
          bVal = b.result.prediction
          break
        case 'probability':
          aVal = a.result.probability
          bVal = b.result.probability
          break
        case 'mw':
          aVal = a.features.MW
          bVal = b.features.MW
          break
        case 'logp':
          aVal = a.features.LogP
          bVal = b.features.LogP
          break
        case 'tpsa':
          aVal = a.features.TPSA
          bVal = b.features.TPSA
          break
        case 'lipinski':
          aVal = a.lipinskiScore
          bVal = b.lipinskiScore
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Calculate stats
  const totalScreened = completedResults.length
  const bbbPlusCount = completedResults.filter(r => r.result.prediction === 'BBB+').length
  const bbbMinusCount = completedResults.filter(r => r.result.prediction === 'BBB-').length
  const avgProbability = totalScreened > 0
    ? (completedResults.reduce((sum, r) => sum + r.result.probability, 0) / totalScreened).toFixed(1)
    : 0

  return (
    <div className="batch-screening">
      {!processing && results.length === 0 ? (
        <div className="batch-input-section">
          <div className="batch-input-header">
            <h2 className="text-xl font-semibold text-slate-200">Batch Screening</h2>
            <p className="text-sm text-slate-400 mt-1">
              Screen multiple compounds at once for BBB permeability
            </p>
          </div>

          {/* Input Mode Toggle */}
          <div className="batch-input-mode-toggle">
            <button
              onClick={() => setInputMode('paste')}
              className={`mode-toggle-btn ${inputMode === 'paste' ? 'active' : ''}`}
            >
              Paste compounds
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`mode-toggle-btn ${inputMode === 'csv' ? 'active' : ''}`}
            >
              Upload CSV
            </button>
          </div>

          {inputMode === 'paste' ? (
            <div className="batch-input-container">
              <textarea
                value={compoundsText}
                onChange={(e) => setCompoundsText(e.target.value)}
                placeholder="Aspirin&#10;Caffeine&#10;Ibuprofen&#10;Donepezil&#10;..."
                className="batch-textarea"
                rows={12}
              />
              <div className="batch-compound-count">
                {compoundNames.length} compound{compoundNames.length !== 1 ? 's' : ''} detected
              </div>
            </div>
          ) : (
            <div
              className="batch-csv-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="batch-csv-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="batch-csv-text">Drop CSV here or click to upload</div>
              <div className="batch-csv-subtext">First column should contain compound names</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          <button
            onClick={runBatchScreening}
            disabled={compoundNames.length === 0}
            className="batch-run-btn"
          >
            Run Batch Screening →
          </button>
        </div>
      ) : (
        <div className="batch-results-section">
          {/* Progress Bar */}
          {processing && (
            <ProgressBar current={currentProcessing} total={compoundNames.length} />
          )}

          {/* Stats */}
          {completedResults.length > 0 && (
            <div className="batch-stats">
              <StatCard label="Total Screened" value={totalScreened} color="slate" />
              <StatCard label="BBB+ Count" value={bbbPlusCount} color="green" />
              <StatCard label="BBB- Count" value={bbbMinusCount} color="red" />
              <StatCard label="Avg Probability" value={`${avgProbability}%`} color="blue" />
            </div>
          )}

          {/* Filter and Export */}
          {completedResults.length > 0 && (
            <div className="batch-controls">
              <div className="batch-filters">
                <button
                  onClick={() => setFilter('all')}
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                  Show All
                </button>
                <button
                  onClick={() => setFilter('bbb+')}
                  className={`filter-btn ${filter === 'bbb+' ? 'active' : ''}`}
                >
                  BBB+ Only
                </button>
                <button
                  onClick={() => setFilter('bbb-')}
                  className={`filter-btn ${filter === 'bbb-' ? 'active' : ''}`}
                >
                  BBB- Only
                </button>
              </div>

              <div className="batch-export">
                <button onClick={downloadCSV} className="export-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </button>
                <button onClick={downloadPDF} className="export-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="batch-table-container">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Compound Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('bbb')}>
                      BBB Result {sortColumn === 'bbb' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('probability')}>
                      Probability {sortColumn === 'probability' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('mw')}>
                      MW {sortColumn === 'mw' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('logp')}>
                      LogP {sortColumn === 'logp' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('tpsa')}>
                      TPSA {sortColumn === 'tpsa' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('lipinski')}>
                      Lipinski {sortColumn === 'lipinski' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Top SHAP Factor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, idx) => {
                    const isPositive = result.result.prediction === 'BBB+'
                    const isExpanded = expandedRow === idx

                    return (
                      <>
                        <tr
                          key={idx}
                          className={`batch-table-row ${idx % 2 === 0 ? 'even' : 'odd'}`}
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                        >
                          <td className="font-medium text-slate-200">{result.name}</td>
                          <td>
                            <span className={`bbb-badge ${isPositive ? 'bbb-positive' : 'bbb-negative'}`}>
                              {result.result.prediction}
                            </span>
                          </td>
                          <td>
                            <div className="probability-cell">
                              <div className="probability-bar-container">
                                <div
                                  className={`probability-bar ${isPositive ? 'positive' : 'negative'}`}
                                  style={{ width: `${result.result.probability}%` }}
                                />
                              </div>
                              <span className="probability-text">{result.result.probability.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>{result.features.MW}</td>
                          <td>{result.features.LogP}</td>
                          <td>{result.features.TPSA}</td>
                          <td>
                            <span className={`lipinski-badge ${result.lipinskiScore === 4 ? 'pass' : 'warn'}`}>
                              {result.lipinskiScore}/4 {result.lipinskiScore === 4 ? '✅' : '⚠️'}
                            </span>
                          </td>
                          <td>
                            {result.topFactor && (
                              <span className={result.topFactor.impact > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {result.topFactor.feature} ({result.topFactor.impact > 0 ? '+' : ''}{result.topFactor.impact.toFixed(3)})
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewCompound(result)
                              }}
                              className="view-btn"
                            >
                              → View
                            </button>
                          </td>
                        </tr>
                        {isExpanded && <ExpandedRow result={result.result} />}
                      </>
                    )
                  })}

                  {/* Show pending/processing rows */}
                  {results.filter(r => r.status !== 'complete').map((result, idx) => (
                    <tr key={`pending-${idx}`} className="batch-table-row pending">
                      <td className="font-medium text-slate-400">{result.name}</td>
                      <td colSpan="8">
                        {result.status === 'fetching' && '🔄 Fetching...'}
                        {result.status === 'not-found' && '❌ Not found'}
                        {result.status === 'pending' && '⏳ Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reset Button */}
          {!processing && (
            <button
              onClick={() => {
                setResults([])
                setCompoundsText('')
                setCurrentProcessing(0)
              }}
              className="batch-reset-btn"
            >
              ← New Batch Screening
            </button>
          )}
        </div>
      )}
    </div>
  )
}
