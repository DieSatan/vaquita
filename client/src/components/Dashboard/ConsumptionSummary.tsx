import { EventSummaryResponse } from '../../services/api'

interface ConsumptionSummaryProps {
  summary: EventSummaryResponse
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function ConsumptionSummary({ summary }: ConsumptionSummaryProps) {
  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Desglose por persona</h3>
        <span className="text-sm text-gray-500">
          Total: {formatCLP(summary.totalAmount)}
          {summary.tipPercentage > 0 && ` (incl. ${summary.tipPercentage}% propina)`}
        </span>
      </div>

      <div className="space-y-3">
        {summary.participants.map(p => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">{p.name}</span>
              <span className="font-bold text-green-700">{formatCLP(p.amount)}</span>
            </div>
            {p.items.length > 0 && (
              <div className="space-y-1">
                {p.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-500">
                    <span>
                      {item.description}
                      {item.quantity > 1 && ` x${item.quantity}`}
                      {item.isShared && ` (compartido)`}
                    </span>
                    <span>{formatCLP(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            )}
            {p.items.length === 0 && (
              <p className="text-xs text-gray-400">Sin items registrados</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
