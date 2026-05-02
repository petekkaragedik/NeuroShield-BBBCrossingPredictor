export default function LipinskiCheck({ features }) {
  const rules = [
    { label: 'MW ≤ 500',     value: features.MW,   threshold: 500, pass: features.MW <= 500,    unit: 'g/mol' },
    { label: 'LogP ≤ 5',     value: features.LogP, threshold: 5,   pass: features.LogP <= 5,    unit: '' },
    { label: 'H-Donors ≤ 5', value: features.HBD,  threshold: 5,   pass: features.HBD <= 5,     unit: '' },
    { label: 'TPSA ≤ 140',   value: features.TPSA, threshold: 140, pass: features.TPSA <= 140,  unit: 'Å²' },
  ]
  const passed = rules.filter((r) => r.pass).length

  return (
    <div className="bg-[#0a0f1e]/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Lipinski's Rule of Five</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Drug-likeness criteria (TPSA-adjusted for BBB)</p>
        </div>
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
          passed === 4 ? 'bg-emerald-500/15 text-emerald-400' :
          passed >= 2 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-red-500/15 text-red-400'
        }`}>
          {passed}/4 passed
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rules.map((r) => (
          <div
            key={r.label}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
              r.pass
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <span className={r.pass ? 'text-emerald-400' : 'text-red-400'}>
              {r.pass ? '✓' : '✗'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-slate-300 font-medium">{r.label}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                actual: {Number(r.value).toFixed(r.value % 1 === 0 ? 0 : 2)} {r.unit}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
