import { useState } from 'react'
import { ParticipantResponse, PaymentStatus } from '../../services/api'
import QRCode from '../Shared/QRCode'

interface ParticipantRowProps {
  participant: ParticipantResponse
  eventId: string
  adminCode: string
  onConfirm: (participantId: string) => Promise<void>
  onRemind: (participantId: string) => Promise<string | null>
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

const statusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'Pending': return <span className="badge-pending">Pendiente</span>
    case 'MarkedAsPaid': return <span className="badge-marked">Marcado como pagado</span>
    case 'Confirmed': return <span className="badge-confirmed">✓ Confirmado</span>
  }
}

export default function ParticipantRow({ participant, onConfirm, onRemind }: ParticipantRowProps) {
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(false)
  const payUrl = `${window.location.origin}/pay/${participant.uniqueToken}`

  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm(participant.id) }
    finally { setLoading(false) }
  }

  const handleRemind = async () => {
    setLoading(true)
    try {
      const url = await onRemind(participant.id)
      if (url) window.open(url, '_blank')
    } finally { setLoading(false) }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{participant.name}</p>
          <p className="text-green-700 font-bold text-lg">{formatCLP(participant.amount)}</p>
        </div>
        <div className="flex-shrink-0">
          {statusBadge(participant.status)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {participant.status === 'MarkedAsPaid' && (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary py-2 px-4 text-sm"
          >
            ✓ Confirmar pago
          </button>
        )}
        {participant.phone && participant.status !== 'Confirmed' && (
          <button
            onClick={handleRemind}
            disabled={loading}
            className="bg-green-100 hover:bg-green-200 text-green-800 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            📲 Recordar
          </button>
        )}
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          {showQR ? '↑ Cerrar QR' : '📱 QR'}
        </button>
      </div>

      {showQR && (
        <div className="border-t border-gray-100 pt-3">
          <QRCode url={payUrl} size={160} />
        </div>
      )}
    </div>
  )
}
