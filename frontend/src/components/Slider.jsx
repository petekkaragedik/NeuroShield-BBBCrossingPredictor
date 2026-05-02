export default function Slider({ label, name, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        <span className="text-sm font-mono text-blue-300 tabular-nums">
          {Number(value).toFixed(step < 1 ? 2 : 0)}
          {unit && <span className="text-slate-500 ml-1">{unit}</span>}
        </span>
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
