import { useState } from 'react'

interface LockRegistrationBtnProps {
  onLock: (tipPercentage: number) => Promise<void>
}

export default function LockRegistrationBtn({ onLock }: LockRegistrationBtnProps) {
  const [tipPct, setTipPct] = useState('10')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLock = async () => {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    setError(null)
    try {
      await onLock(Number(tipPct) || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cerrar el registro')
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <div className="card border-orange-200 bg-orange-50 space-y-3">
      <h4 className="font-semibold text-orange-800">🔒 Cerrar registro de consumo</h4>
      <p className="text-sm text-orange-700">
        Al cerrar, los participantes no podrán agregar más items y se calcularán los montos finales.
      </p>

      <div>
        <label className="label">% de propina a prorratear</label>
        <input
          type="number"
          className="input-field"
          placeholder="10"
          min="0"
          max="50"
          value={tipPct}
          onChange={e => setTipPct(e.target.value)}
        />
      </div>

      {confirm && (
        <p className="text-sm text-red-700 font-medium">
          ⚠️ ¿Estás seguro? Esta acción no se puede deshacer.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 font-medium">❌ {error}</p>
      )}

      <button
        onClick={handleLock}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold transition-colors ${
          confirm
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-orange-600 hover:bg-orange-700 text-white'
        }`}
      >
        {loading ? 'Cerrando...' : confirm ? '¡Confirmar cierre!' : '🔒 Cerrar registro'}
      </button>
    </div>
  )
}
