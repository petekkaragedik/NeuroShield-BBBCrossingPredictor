import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import HeroLanding from './components/HeroLanding'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import BatchScreening from './components/BatchScreening'
import StatsBar from './components/StatsBar'
import Toast from './components/Toast'
import { fetchPubChem, predict, checkHealth } from './api'

const DEFAULT_FEATURES = {
  MW: 180,
  LogP: 1.2,
  HBD: 1,
  TPSA: 63.6,
  RingCount: 1,
  RotBonds: 3,
}

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [landingExiting, setLandingExiting] = useState(false)
  const autoSearchRef = useRef(null)
  const [mode, setMode] = useState('single') // 'single' or 'batch'

  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [result, setResult] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState(null)
  const [backendOnline, setBackendOnline] = useState(false)
  const [pendingCompound, setPendingCompound] = useState(null)
  const [predictedCompound, setPredictedCompound] = useState(null)
  const [explorationTree, setExplorationTree] = useState([])
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const nextNodeIdRef = useRef(1)
  const [compoundNameOverride, setCompoundNameOverride] = useState(null)

  function handleEnterApp(compoundName = null) {
    if (compoundName) autoSearchRef.current = compoundName
    setLandingExiting(true)
    setTimeout(() => setShowLanding(false), 500)
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

  function showToast(type, message, duration) {
    setToast({ type, message, duration })
  }

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
  function handleLoadCompoundFromBatch(name, features, result) {
    setFeatures(features)
    setResult(result)
    setPredictedCompound(name)
    setPendingCompound(null)
    setMode('single')
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <StatsBar backendOnline={backendOnline} />

      {showLanding ? (
        <HeroLanding exiting={landingExiting} onEnter={handleEnterApp} />
      ) : (
        <div className="flex-1 flex flex-col
                        bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]
                        animate-app-enter">
          <Header mode={mode} onModeChange={setMode} />

          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
            {mode === 'single' ? (
              <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
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
              </div>
            ) : (
              <BatchScreening
                onSwitchToSingle={() => setMode('single')}
                onLoadCompound={handleLoadCompoundFromBatch}
              />
            )}
          </main>

          <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-600">
            NeuroShield · Trained on B3DB (7807 molecules) · Random Forest + SHAP
          </footer>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App
