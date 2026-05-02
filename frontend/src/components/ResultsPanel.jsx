import { useRef, useState } from 'react'
import BrainVisualizer from './BrainVisualizer'
import VerdictBanner from './VerdictBanner'
import SHAPTable from './SHAPTable'
import LipinskiCheck from './LipinskiCheck'
import SimilarCompounds from './SimilarCompounds'
import ExplorationTree from './ExplorationTree'
import OptimizationSuggestions from './OptimizationSuggestions'
import { SingleCompoundReport } from './PrintReport'
import { copyCurrentURLToClipboard } from '../utils/urlState'
import { useToast } from './ToastStack'

function ConfidenceBadge({ confidence }) {
  const styles = {
    High:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low:      'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${styles[confidence]}`}>
      {confidence} confidence
    </span>
  )
}

function EmptyState() {
  return (
    <div className="bg-panel border border-slate-800 border-dashed rounded-2xl p-10
                    flex flex-col items-center justify-center text-center min-h-125">
      <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-300">Awaiting prediction</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-xs">
        Enter a compound name or adjust descriptors, then click Predict to see results.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="bg-panel border border-slate-800 rounded-2xl p-10
                    flex flex-col items-center justify-center text-center min-h-125">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin-slow" />
      </div>
      <p className="text-sm text-slate-300 mt-5 font-medium">Running model inference...</p>
      <p className="text-xs text-slate-500 mt-1">Computing SHAP values and similarity scores</p>
    </div>
  )
}

export default function ResultsPanel({
  result,
  predicting,
  features,
  compoundName,
  onExploreCompound,
  explorationTree,
  currentNodeId,
  onNavigateToNode,
  onResetExploration,
  getBreadcrumbPath
}) {
  const showToast = useToast()
  const [shareLinkCopied, setShareLinkCopied] = useState(false)

  // Increment on every new result so BrainVisualizer's key changes and restarts animations
  const revisionRef = useRef(0)
  if (result) revisionRef.current += 1

  if (predicting) return <LoadingState />
  if (!result)    return <EmptyState />

  const isBorderline = Math.abs(result.probability - 50) < 15
  const breadcrumbPath = getBreadcrumbPath()
  const showExplorationTree = explorationTree.length > 1

  const handleDownloadReport = () => {
    window.print()
  }

  const handleShareResult = async () => {
    const success = await copyCurrentURLToClipboard()
    if (success) {
      setShareLinkCopied(true)
      showToast('link', 'Result link copied to clipboard')

      // Reset button text after 2 seconds
      setTimeout(() => {
        setShareLinkCopied(false)
      }, 2000)
    } else {
      showToast('error', 'Failed to copy link to clipboard')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <section className="bg-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <VerdictBanner
          probability={result.probability}
          prediction={result.prediction}
          animKey={revisionRef.current}
        />

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Prediction Result
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareResult}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                           border border-slate-700 bg-transparent
                           text-slate-300 hover:text-white hover:border-slate-600
                           transition-all duration-200 text-xs font-medium"
              >
                {shareLinkCopied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Link Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Share Result
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                           border border-slate-700 bg-transparent
                           text-slate-300 hover:text-white hover:border-slate-600
                           transition-all duration-200 text-xs font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </button>
              <ConfidenceBadge confidence={result.confidence} />
            </div>
          </div>

          {compoundName && (
            <p className="text-center text-2xl font-bold text-white uppercase tracking-widest mb-4">
              {compoundName}
            </p>
          )}

          <BrainVisualizer
            probability={result.probability}
            prediction={result.prediction}
            animKey={revisionRef.current}
          />

          {isBorderline && (
            <div className="mt-5 flex items-start gap-2 px-3 py-2.5 rounded-lg
                            bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>
                <strong>Borderline compound</strong> — wet-lab validation recommended before
                committing to a development pathway.
              </span>
            </div>
          )}
        </div>
      </section>

      <OptimizationSuggestions
        result={result}
        features={features}
        onExploreCompound={onExploreCompound}
      />

      <SHAPTable factors={result.contributing_factors} />
      <LipinskiCheck features={features} />
      <SimilarCompounds
        compounds={result.similar_compounds}
        currentCompound={compoundName}
        currentFeatures={features}
        currentBBBStatus={result.prediction}
        onExploreCompound={onExploreCompound}
        breadcrumbPath={breadcrumbPath}
        onNavigateToNode={onNavigateToNode}
      />

      {showExplorationTree && (
        <ExplorationTree
          tree={explorationTree}
          currentNodeId={currentNodeId}
          onNavigateToNode={onNavigateToNode}
          onExploreCompound={onExploreCompound}
          onResetExploration={onResetExploration}
        />
      )}

      {/* Hidden print report - shown only during print */}
      <SingleCompoundReport
        compoundName={compoundName}
        features={features}
        result={result}
      />
    </div>
  )
}
