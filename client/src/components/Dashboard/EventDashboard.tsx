import { useEffect, useRef, useState } from 'react'
import { api, EventResponse, EventSummaryResponse } from '../../services/api'
import ProgressBar from './ProgressBar'
import ParticipantRow from './ParticipantRow'
import LockRegistrationBtn from './LockRegistrationBtn'
import ConsumptionSummary from './ConsumptionSummary'
import CopyButton from '../ParticipantView/CopyButton'
import AddParticipantForm from './AddParticipantForm'

interface EventDashboardProps {
  event: EventResponse
  adminCode: string
  onRefresh: () => Promise<void>
}

const splitModeLabel: Record<string, string> = {
  Even: '⚖️ Parejo',
  Custom: '✏️ Manual',
  ByConsumption: '🍺 Por consumo',
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function EventDashboard({ event, adminCode, onRefresh }: EventDashboardProps) {
  const [summary, setSummary] = useState<EventSummaryResponse | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onRefreshRef = useRef(onRefresh)
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  // Auto-refresh every 30s while ByConsumption event is open
  useEffect(() => {
    if (event.splitMode !== 'ByConsumption' || event.isLocked) return
    const id = setInterval(() => onRefreshRef.current(), 30000)
    return () => clearInterval(id)
  }, [event.splitMode, event.isLocked])

  const handleConfirm = async (participantId: string) => {
    await api.confirmPayment(participantId, adminCode)
    await onRefresh()
  }

  const handleRemind = async (participantId: string): Promise<string | null> => {
    try {
      const res = await api.remind(event.id, participantId, adminCode)
      return res.whatsappUrl
    } catch { return null }
  }

  const handleLock = async (tipPct: number) => {
    await api.lockEvent(event.id, adminCode, tipPct)
    setSummary(null) // reset so next open fetches post-lock amounts
    setShowSummary(false)
    await onRefresh()
  }

  const handleLoadSummary = async () => {
    if (summary) { setShowSummary(!showSummary); return }
    const s = await api.getEventSummary(event.id, adminCode)
    setSummary(s)
    setShowSummary(true)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await api.deleteEvent(event.id, adminCode)
      window.location.href = '/'
    } finally { setDeleting(false) }
  }

  const dashboardUrl = `${window.location.origin}/event/${event.id}?code=${adminCode}`

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.eventName}</h2>
            <p className="text-gray-500 text-sm">Organiza: {event.organizerName}</p>
            <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
              {splitModeLabel[event.splitMode]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-bold text-gray-900 text-lg">{formatCLP(event.totalAmount)}</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar confirmed={event.confirmedCount} total={event.totalParticipants} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Link de este dashboard</p>
          <CopyButton text={dashboardUrl} label="Copiar" />
        </div>
        <p className="text-xs font-mono text-gray-400 break-all">{dashboardUrl}</p>
      </div>

      {event.splitMode === 'ByConsumption' && !event.isLocked && (
        <LockRegistrationBtn onLock={handleLock} />
      )}

      {event.splitMode === 'ByConsumption' && (
        <button
          onClick={handleLoadSummary}
          className="btn-secondary w-full"
        >
          {showSummary ? '↑ Ocultar desglose' : '📊 Ver desglose de consumo'}
        </button>
      )}

      {showSummary && summary && (
        <ConsumptionSummary summary={summary} />
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">
          Participantes ({event.totalParticipants})
        </h3>
        {event.participants.map(p => (
          <ParticipantRow
            key={p.id}
            participant={p}
            eventId={event.id}
            adminCode={adminCode}
            onConfirm={handleConfirm}
            onRemind={handleRemind}
          />
        ))}
        <AddParticipantForm
          eventId={event.id}
          adminCode={adminCode}
          splitMode={event.splitMode}
          onAdded={() => { onRefresh() }}
        />
      </div>

      <div className="card border-red-100 bg-red-50">
        <h4 className="text-sm font-semibold text-red-700 mb-2">Zona de peligro</h4>
        {confirmDelete && (
          <p className="text-xs text-red-700 mb-2">⚠️ ¿Seguro? Se eliminarán todos los datos del evento.</p>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger text-sm"
        >
          {deleting ? 'Eliminando...' : confirmDelete ? '¡Confirmar eliminación!' : '🗑️ Eliminar evento'}
        </button>
      </div>
    </div>
  )
}
