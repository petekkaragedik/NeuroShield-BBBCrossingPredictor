import { useEffect, useRef, useState } from 'react'
import { chatCompound } from '../api'

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-dot-bounce"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

// Pure content — no outer card/header. ChatSidebar owns that.
export default function CompoundChat({ compoundName, features, result }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const threadRef = useRef(null)
  const inputRef = useRef(null)

  const visible = messages.slice(-8)

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  async function submit() {
    const q = input.trim()
    if (!q || loading || !result) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const reply = await chatCompound({
        question: q,
        compoundName: compoundName || 'Unknown',
        descriptors: features,
        prediction: result.prediction,
        probability: result.probability,
        shapValues: result.contributing_factors || [],
      })
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠ ${err.message}` }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  if (!result) {
    return (
      <div className="px-4 py-8 flex flex-col items-center text-center text-slate-600 gap-2">
        <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-xs">Run a prediction first to ask questions about it.</p>
      </div>
    )
  }

  return (
    <>
      {/* Message thread */}
      {visible.length > 0 && (
        <div ref={threadRef} className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto border-b border-slate-800/80">
          {visible.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600/25 border border-violet-500/30 text-violet-100 rounded-br-sm'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-slate-800/80 border border-slate-700/60">
                <LoadingDots />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          placeholder="Why is this blocked? What should I change?"
          className="flex-1 bg-bg border border-slate-700 rounded-lg px-3 py-2 text-xs
                     text-white placeholder-slate-600 focus:border-violet-500/60
                     focus:ring-2 focus:ring-violet-500/15 outline-none transition
                     disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="shrink-0 w-8 h-8 bg-violet-600 hover:bg-violet-500
                     disabled:opacity-40 disabled:cursor-not-allowed
                     text-white rounded-lg transition flex items-center justify-center"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin-slow" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
