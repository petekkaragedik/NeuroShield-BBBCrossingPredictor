import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import HeroLanding from './components/HeroLanding'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import BatchScreening from './components/BatchScreening'
import CompareView from './components/compare/CompareView'
import StatsBar from './components/StatsBar'
import ToastStack, { useToast } from './components/ToastStack'
import HistorySidebar from './components/HistorySidebar'
import { useSessionHistory } from './hooks/useSessionHistory'
import { fetchPubChem, predict, checkHealth } from './api'
import { encodeSingleCompoundURL, decodeSingleCompoundURL, updateURL, getURLParams } from './utils/urlState'
import { useNavigation } from './context/NavigationContext'
import ChatSidebar from './components/ChatSidebar'

const DEFAULT_FEATURES = {
  MW: 180,
  LogP: 1.2,
  HBD: 1,
  TPSA: 63.6,
  RingCount: 1,
  RotBonds: 3,
}

function App() {
  const showToast = useToast()
  const urlLoadedRef = useRef(false)

  // Check if URL has shareable state on initial load (runs once)
  const [initialURLState] = useState(() => {
    const params = getURLParams()
    return decodeSingleCompoundURL(params)
  })

  const [showLanding, setShowLanding] = useState(!initialURLState)
  const [landingExiting, setLandingExiting] = useState(false)
  const autoSearchRef = useRef(null)
  const [mode, setMode] = useState('single') // 'single' or 'batch'

  const [features, setFeatures] = useState(initialURLState?.features || DEFAULT_FEATURES)
  const [result, setResult] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [backendOnline, setBackendOnline] = useState(false)
  const [pendingCompound, setPendingCompound] = useState(null)
  const [predictedCompound, setPredictedCompound] = useState(null)
  const [explorationTree, setExplorationTree] = useState([])
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const nextNodeIdRef = useRef(1)
  const [compoundNameOverride, setCompoundNameOverride] = useState(null)
  const [compareInitial, setCompareInitial] = useState(null)
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false)
  const { entries: historyEntries, addEntry, removeEntry, clearHistory } = useSessionHistory()
  const { push, goBack, goForward, canGoBack, clearPendingRestore, pendingRestore } = useNavigation()
  const canGoBackRef = useRef(false)
  canGoBackRef.current = canGoBack
  const escTimeRef = useRef(0)

  const MODE_LABELS = { single: 'Single Compound', batch: 'Batch Screening', compare: 'Compare' }

  function handleCompareWithCurrent(name) {
    push('Compare', { showLanding: false, mode: 'compare', features: { ...features }, result, compoundName: predictedCompound })
    setCompareInitial(name)
    setMode('compare')
  }

  function handleModeChange(newMode) {
    push(MODE_LABELS[newMode] || newMode, {
      showLanding: false,
      mode: newMode,
      features: { ...features },
      result: newMode === 'single' ? result : null,
      compoundName: newMode === 'single' ? predictedCompound : null,
    })
    setMode(newMode)
  }

  function handleEnterApp(compoundName = null) {
    push('Single Compound', { showLanding: false, mode: 'single', features: { ...features }, result: null, compoundName: null })
    if (compoundName) autoSearchRef.current = compoundName
    setLandingExiting(true)
    setTimeout(() => setShowLanding(false), 500)
  }

  function handleGoHome() {
    push('Landing', { showLanding: true })
    setShowLanding(true)
    setLandingExiting(false)
  }

  // Trigger auto-search once landing has fully exited
  useEffect(() => {
    if (!showLanding && autoSearchRef.current) {
      const name = autoSearchRef.current
      autoSearchRef.current = null
      handleSearch(name)
    }
  }, [showLanding]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    const ping = async () => {
      const ok = await checkHealth()
      if (!cancelled) setBackendOnline(ok)
    }
    ping()
    const id = setInterval(ping, 10000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Load shared result from URL on mount
  useEffect(() => {
    if (initialURLState && !urlLoadedRef.current && backendOnline) {
      urlLoadedRef.current = true

      // Set compound name if present
      if (initialURLState.compound) {
        setPredictedCompound(initialURLState.compound)
      }

      // Auto-run prediction with URL features
      ;(async () => {
        setPredicting(true)
        try {
          const data = await predict(initialURLState.features)
          setResult(data)

          if (initialURLState.compound) {
            addEntry(initialURLState.compound, initialURLState.features, data, 'Single')
            showToast('share', `📎 Loaded shared result for ${initialURLState.compound}`)
          } else {
            showToast('share', `📎 Loaded shared result`)
          }

          push(initialURLState.compound || 'Shared Result', {
            showLanding: false,
            mode: 'single',
            features: { ...initialURLState.features },
            result: { ...data },
            compoundName: initialURLState.compound || null,
          })
        } catch (err) {
          showToast('error', err.message || 'Failed to load shared result')
        } finally {
          setPredicting(false)
        }
      })()
    }
  }, [backendOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(name) {
    setSearching(true)
    try {
      const data = await fetchPubChem(name)
      setFeatures({
        MW:        Number(data.MW)        || 0,
        LogP:      Number(data.LogP)      || 0,
        HBD:       Number(data.HBD)       || 0,
        TPSA:      Number(data.TPSA)      || 0,
        RingCount: Number(data.RingCount) || 0,
        RotBonds:  Number(data.RotBonds)  || 0,
      })
      const cidPart = data.CID ? ` (CID: ${data.CID})` : ''
      showToast('success', `Found: ${name}${cidPart}`)
      setPendingCompound(name)
    } catch (err) {
      console.error('[handleSearch] caught error:', err, 'name:', err?.name, 'message:', err?.message, 'stack:', err?.stack)
      showToast('error', err.message || `"${name}" not found`)
    } finally {
      setSearching(false)
    }
  }

  async function handlePredict() {
    if (!backendOnline) {
      showToast('error', 'Backend offline — start the Flask server on port 5001')
      return
    }
    setPredicting(true)
    setResult(null)
    const compound = pendingCompound
    setPendingCompound(null)
    try {
      const data = await predict(features)
      setResult(data)
      setPredictedCompound(compound)
      if (compound) addEntry(compound, features, data, 'Single')

      // Update URL with shareable state
      const queryString = encodeSingleCompoundURL(compound, features)
      updateURL(queryString)

      // Push to navigation history
      push(compound || 'Prediction', {
        showLanding: false,
        mode: 'single',
        features: { ...features },
        result: { ...data },
        compoundName: compound,
      })

      // If this is the first prediction and no tree exists, create root node
      if (explorationTree.length === 0 && compound) {
        const rootNode = {
          id: nextNodeIdRef.current++,
          name: compound,
          features: { ...features },
          result: { ...data },
          parentId: null,
          timestamp: Date.now()
        }
        setExplorationTree([rootNode])
        setCurrentNodeId(rootNode.id)
      }
    } catch (err) {
      showToast('error', err.message || 'Prediction failed')
    } finally {
      setPredicting(false)
    }
  }

  async function handleExploreCompound(compoundName, parentNodeId = null) {
    const parentId = parentNodeId !== null ? parentNodeId : currentNodeId

    // Set compound name override for InputPanel
    setCompoundNameOverride(compoundName)

    // Mark this as an exploration (will create node after prediction completes)
    window.__exploringFromParent = parentId

    // Search for the compound
    await handleSearch(compoundName)
  }

  // Auto-predict after exploration search completes
  useEffect(() => {
    if (compoundNameOverride && pendingCompound === compoundNameOverride) {
      setCompoundNameOverride(null)
      handlePredict()
    }
  }, [pendingCompound, compoundNameOverride]) // eslint-disable-line react-hooks/exhaustive-deps

  // After prediction completes, add to tree if this was an exploration
  useEffect(() => {
    if (result && predictedCompound && window.__exploringFromParent !== undefined) {
      const parentId = window.__exploringFromParent
      delete window.__exploringFromParent

      // Check if this compound already exists in the tree
      const existingNode = explorationTree.find(n => n.name === predictedCompound)
      if (existingNode) {
        // Just navigate to existing node
        setCurrentNodeId(existingNode.id)
      } else {
        // Create new node
        const newNode = {
          id: nextNodeIdRef.current++,
          name: predictedCompound,
          features: { ...features },
          result: { ...result },
          parentId: parentId,
          timestamp: Date.now()
        }
        setExplorationTree(prev => [...prev, newNode])
        setCurrentNodeId(newNode.id)
      }
    }
  }, [result, predictedCompound]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNavigateToNode(nodeId) {
    const node = explorationTree.find(n => n.id === nodeId)
    if (!node) return

    setFeatures(node.features)
    setResult(node.result)
    setPredictedCompound(node.name)
    setCurrentNodeId(nodeId)
    setPendingCompound(null)

    const queryString = encodeSingleCompoundURL(node.name, node.features)
    updateURL(queryString)

    push(node.name, {
      showLanding: false,
      mode: 'single',
      features: { ...node.features },
      result: { ...node.result },
      compoundName: node.name,
    })
  }

  function handleResetExploration() {
    setExplorationTree([])
    setCurrentNodeId(null)
    nextNodeIdRef.current = 1
  }

  // Generate breadcrumb path from root to current node
  function getBreadcrumbPath() {
    if (!currentNodeId) return []

    const path = []
    let nodeId = currentNodeId

    while (nodeId !== null) {
      const node = explorationTree.find(n => n.id === nodeId)
      if (!node) break
      path.unshift(node)
      nodeId = node.parentId
    }

    return path
  }

  // Load compound from batch screening into single view
  function handleLoadCompoundFromBatch(name, batchFeatures, batchResult) {
    setFeatures(batchFeatures)
    setResult(batchResult)
    setPredictedCompound(name)
    setPendingCompound(null)
    addEntry(name, batchFeatures, batchResult, 'Batch')
    push(name, { showLanding: false, mode: 'single', features: { ...batchFeatures }, result: { ...batchResult }, compoundName: name })
    setMode('single')
  }

  function handleLoadFromHistory(entry, openCompare = false) {
    setFeatures(entry.features)
    setResult(entry.result)
    setPredictedCompound(entry.name)
    setPendingCompound(null)
    if (openCompare) {
      push('Compare', { showLanding: false, mode: 'compare', features: { ...entry.features }, result: { ...entry.result }, compoundName: entry.name })
      setCompareInitial(entry.name)
      setMode('compare')
    } else {
      push(entry.name, { showLanding: false, mode: 'single', features: { ...entry.features }, result: { ...entry.result }, compoundName: entry.name })
      setMode('single')
    }
  }

  // Push initial landing state once on mount
  useEffect(() => {
    push(showLanding ? 'Landing' : 'App', {
      showLanding,
      mode: 'single',
      features: { ...features },
      result: null,
      compoundName: null,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply snapshot when user navigates back/forward
  useEffect(() => {
    if (!pendingRestore) return
    clearPendingRestore()
    const { showLanding: sl, mode: m, features: f, result: r, compoundName } = pendingRestore
    if (sl) {
      setShowLanding(true)
      setLandingExiting(false)
    } else {
      setShowLanding(false)
      setMode(m || 'single')
      if (f) setFeatures(f)
      setResult(r ?? null)
      setPredictedCompound(compoundName ?? null)
      setPendingCompound(null)
      if (compoundName && f) updateURL(encodeSingleCompoundURL(compoundName, f))
    }
  }, [pendingRestore]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts: Alt+←/→ for back/forward, double-Escape for back
  useEffect(() => {
    function onKey(e) {
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); return }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goForward(); return }
      if (e.key === 'Escape') {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (!canGoBackRef.current) return
        const now = Date.now()
        if (now - escTimeRef.current < 600) {
          goBack()
          escTimeRef.current = 0
        } else {
          escTimeRef.current = now
          showToast('info', '← Press Escape again to go back')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <StatsBar backendOnline={backendOnline} />

      {showLanding ? (
        <HeroLanding exiting={landingExiting} onEnter={handleEnterApp} />
      ) : (
        <div className="flex-1 flex flex-col
                        bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]
                        animate-app-enter">
          <Header
            mode={mode}
            onModeChange={handleModeChange}
            currentCompound={predictedCompound}
            onCompareWithCurrent={handleCompareWithCurrent}
            onToggleHistory={() => setHistorySidebarOpen((o) => !o)}
            historyCount={historyEntries.length}
            onHome={handleGoHome}
          />

          <main className="flex-1 max-w-400 mx-auto w-full px-6 py-8">
            {mode === 'single' && (
              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_300px] gap-6">
                <InputPanel
                  features={features}
                  setFeatures={setFeatures}
                  onSearch={handleSearch}
                  onPredict={handlePredict}
                  searching={searching}
                  predicting={predicting}
                  pendingCompound={pendingCompound}
                  compoundNameOverride={compoundNameOverride}
                />
                <ResultsPanel
                  result={result}
                  predicting={predicting}
                  features={features}
                  compoundName={predictedCompound}
                  onExploreCompound={handleExploreCompound}
                  explorationTree={explorationTree}
                  currentNodeId={currentNodeId}
                  onNavigateToNode={handleNavigateToNode}
                  onResetExploration={handleResetExploration}
                  getBreadcrumbPath={getBreadcrumbPath}
                />
                <ChatSidebar
                  compoundName={predictedCompound}
                  features={features}
                  result={result}
                />
              </div>
            )}
            {mode === 'batch' && (
              <BatchScreening
                onSwitchToSingle={() => handleModeChange('single')}
                onLoadCompound={handleLoadCompoundFromBatch}
              />
            )}
            {mode === 'compare' && (
              <CompareView
                initialCompound={compareInitial}
                onConsumedInitial={() => setCompareInitial(null)}
              />
            )}
          </main>

          <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-600">
            NeuroShield · Trained on B3DB (7807 molecules) · Random Forest + SHAP
          </footer>
        </div>
      )}

      <HistorySidebar
        open={historySidebarOpen}
        onClose={() => setHistorySidebarOpen(false)}
        entries={historyEntries}
        onRemove={removeEntry}
        onClear={clearHistory}
        onLoad={handleLoadFromHistory}
      />

      <ToastStack />
    </div>
  )
}

export default App
