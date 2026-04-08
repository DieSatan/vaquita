interface ProgressBarProps {
  confirmed: number
  total: number
}

export default function ProgressBar({ confirmed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const color = pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Confirmados</span>
        <span className="font-semibold">{confirmed}/{total} ({pct}%)</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
