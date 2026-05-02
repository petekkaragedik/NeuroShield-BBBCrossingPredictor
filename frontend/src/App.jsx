import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import HeroLanding from './components/HeroLanding'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
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

  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [result, setResult] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState(null)
  const [backendOnline, setBackendOnline] = useState(false)
  const [pendingCompound, setPendingCompound] = useState(null)
  const [predictedCompound, setPredictedCompound] = useState(null)

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
    } catch (err) {
      showToast('error', err.message || 'Prediction failed')
    } finally {
      setPredicting(false)
    }
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
          <Header />

          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
              <InputPanel
                features={features}
                setFeatures={setFeatures}
                onSearch={handleSearch}
                onPredict={handlePredict}
                searching={searching}
                predicting={predicting}
                pendingCompound={pendingCompound}
              />
              <ResultsPanel
                result={result}
                predicting={predicting}
                features={features}
                compoundName={predictedCompound}
              />
            </div>
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
