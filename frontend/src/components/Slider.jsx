import { useState, useEffect } from 'react'

export default function Slider({ label, name, value, min, max, step, unit, onChange }) {
  const fmt = (v) => Number(v).toFixed(step < 1 ? 2 : 0)
  const [inputVal, setInputVal] = useState(fmt(value))

  useEffect(() => {
    setInputVal(fmt(value))
  }, [value])

  function commit(raw) {
    let num = parseFloat(raw)
    if (isNaN(num)) num = min
    num = Math.min(max, Math.max(min, num))
    onChange(num)
    setInputVal(fmt(num))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={inputVal}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-20 text-right text-sm font-mono text-blue-300 bg-[#0a0f1e] border border-slate-700
                       rounded px-2 py-0.5 outline-none focus:border-blue-500 focus:ring-1
                       focus:ring-blue-500/30 tabular-nums [appearance:textfield]
                       [&::-webkit-inner-spin-button]:appearance-none
                       [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && <span className="text-slate-500 text-sm ml-0.5">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
