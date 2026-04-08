import { useState } from 'react'
import { PaymentStatus } from '../../services/api'

interface MarkPaidButtonProps {
  status: PaymentStatus
  onMarkPaid: () => Promise<void>
}

const statusLabels: Record<PaymentStatus, string> = {
  Pending: 'Pendiente',
  MarkedAsPaid: 'Marcado como pagado — esperando confirmación',
  Confirmed: '✓ Pago confirmado'
}

export default function MarkPaidButton({ status, onMarkPaid }: MarkPaidButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onMarkPaid()
    } finally {
      setLoading(false)
    }
  }

  if (status === 'Confirmed') {
    return (
      <div className="bg-green-50 border border-green-300 rounded-2xl p-4 text-center">
        <p className="text-green-700 font-semibold text-lg">✓ Pago confirmado</p>
        <p className="text-green-600 text-sm mt-1">El organizador confirmó tu pago. ¡Gracias!</p>
      </div>
    )
  }

  if (status === 'MarkedAsPaid') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
        <p className="text-blue-700 font-semibold">Pago marcado</p>
        <p className="text-blue-600 text-sm mt-1">Esperando confirmación del organizador</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
        <p className="text-yellow-700 text-sm">Estado: <strong>{statusLabels[status]}</strong></p>
      </div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary w-full text-lg"
      >
        {loading ? 'Marcando...' : '✅ Ya pagué'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        El organizador recibirá una notificación y confirmará tu pago
      </p>
    </div>
  )
}
