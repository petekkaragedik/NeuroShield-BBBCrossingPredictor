import { useState } from 'react'
import CompoundChat from './CompoundChat'

export default function ChatSidebar({ compoundName, features, result }) {
  const [open, setOpen] = useState(true)

  return (
    // sticky top accounts for the sticky header height (~136px)
    <div className="sticky top-36 h-fit">
      <div className="bg-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

        {/* Toggle header — always visible */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3
                     hover:bg-slate-800/40 transition-colors duration-150 group"
        >
          <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Ask AI
          </span>
          {result && (
            <span className="text-[10px] text-slate-600 font-normal normal-case tracking-normal truncate max-w-[80px]">
              {compoundName}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-600 shrink-0">llama-3.1</span>
          <svg
            className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible body */}
        {open && (
          <div className="border-t border-slate-800/80 animate-fade-in">
            <CompoundChat
              compoundName={compoundName}
              features={features}
              result={result}
            />
          </div>
        )}
      </div>
    </div>
  )
}
