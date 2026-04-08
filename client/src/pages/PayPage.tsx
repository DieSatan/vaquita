import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Shared/Layout'
import PaymentDetails from '../components/ParticipantView/PaymentDetails'
import MarkPaidButton from '../components/ParticipantView/MarkPaidButton'
import ConsumptionTracker from '../components/ParticipantView/ConsumptionTracker'
import { api, ParticipantResponse } from '../services/api'

export default function PayPage() {
  const { token } = useParams<{ token: string }>()
  const [participant, setParticipant] = useState<ParticipantResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.getParticipant(token)
      .then(setParticipant)
      .catch(e => setError(e instanceof Error ? e.message : 'Link no válido o expirado'))
      .finally(() => setLoading(false))
  }, [token])

  // Poll every 15s while ByConsumption event is not yet locked,
  // so participants automatically see payment details when organizer locks.
  useEffect(() => {
    if (!token) return
    if (!participant) return
    if (participant.splitMode !== 'ByConsumption') return
    if (participant.isEventLocked) return

    const id = setInterval(() => {
      api.getParticipant(token)
        .then(setParticipant)
        .catch(() => { /* silently ignore poll errors */ })
    }, 15000)

    return () => clearInterval(id)
  }, [token, participant?.splitMode, participant?.isEventLocked])

  const handleMarkPaid = async () => {
    if (!token) return
    const updated = await api.markPaid(token)
    setParticipant(updated)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-4xl animate-spin">🐄</div>
            <p className="text-gray-500 mt-3">Cargando...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !participant) {
    return (
      <Layout>
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link no válido</h2>
          <p className="text-gray-500">
            {error ?? 'Este link no existe o el evento ha expirado.'}
          </p>
        </div>
      </Layout>
    )
  }

  const isConsumption = participant.splitMode === 'ByConsumption'
  const showTracker = isConsumption && !participant.isEventLocked
  const showPayment = !isConsumption || participant.isEventLocked

  return (
    <Layout>
      <div className="space-y-4">
        <div className="card">
          <p className="text-sm text-gray-500">{participant.eventName}</p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Hola, {participant.name} 👋</h2>
          {isConsumption && !participant.isEventLocked && (
            <p className="text-sm text-blue-600 mt-2">
              📝 El organizador aún no ha cerrado el registro. Agrega lo que pediste.
            </p>
          )}
          {isConsumption && participant.isEventLocked && (
            <p className="text-sm text-green-700 mt-2">
              ✅ El registro está cerrado. Tu monto final es el de abajo.
            </p>
          )}
        </div>

        {showTracker && (
          <ConsumptionTracker
            participant={participant}
            token={token!}
            onUpdate={setParticipant}
          />
        )}

        {showPayment && participant.paymentInfo && (
          <>
            <PaymentDetails
              paymentInfo={participant.paymentInfo}
              amount={participant.amount}
              eventName={participant.eventName ?? ''}
            />
            <MarkPaidButton
              status={participant.status}
              onMarkPaid={handleMarkPaid}
            />
          </>
        )}
      </div>
    </Layout>
  )
}
