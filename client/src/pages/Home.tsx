import { useState } from 'react'
import Layout from '../components/Shared/Layout'
import EventForm, { EventFormData } from '../components/CreateEvent/EventForm'
import PaymentInfoForm from '../components/CreateEvent/PaymentInfoForm'
import ParticipantsForm, { ParticipantInput } from '../components/CreateEvent/ParticipantsForm'
import ShareLinks from '../components/CreateEvent/ShareLinks'
import { api, EventResponse, PaymentInfoDto, SplitMode } from '../services/api'

const STEPS = ['Evento', 'Datos bancarios', 'Participantes', 'Compartir']

const defaultEventForm: EventFormData = {
  eventName: '',
  organizerName: '',
  splitMode: 'Even',
  totalAmount: '',
  tipPercentage: '',
}

const defaultPaymentInfo: PaymentInfoDto = {
  bankName: '',
  accountType: '',
  accountNumber: '',
  rut: '',
  holderName: '',
  email: '',
}

export default function Home() {
  const [step, setStep] = useState(0)
  const [eventForm, setEventForm] = useState<EventFormData>(defaultEventForm)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoDto>(defaultPaymentInfo)
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '', phone: '', amount: '' },
    { name: '', phone: '', amount: '' },
  ])
  const [createdEvent, setCreatedEvent] = useState<EventResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const splitMode = eventForm.splitMode as SplitMode
      const result = await api.createEvent({
        eventName: eventForm.eventName,
        organizerName: eventForm.organizerName,
        splitMode,
        totalAmount: Number(eventForm.totalAmount) || 0,
        tipPercentage: Number(eventForm.tipPercentage) || 0,
        paymentInfo,
        participants: participants.map(p => ({
          name: p.name,
          phone: p.phone || undefined,
          amount: Number(p.amount) || 0,
        })),
      })

      // Store admin code in localStorage for future visits
      localStorage.setItem(`vaquita-admin-${result.id}`, result.adminCode ?? '')

      setCreatedEvent(result)
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {step < 3 && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? 'bg-green-600 text-white' :
                  i === step ? 'bg-green-600 text-white ring-4 ring-green-200' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">{s}</p>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-6">
          {/* Landing hero */}
          <div className="text-center py-4">
            <div className="text-6xl mb-3">🐄</div>
            <h2 className="text-2xl font-bold text-gray-900">¿Hay que pagar una cuenta?</h2>
            <p className="text-gray-500 mt-2">
              Crea el evento, comparte los links y trackea quién ha pagado. Simple.
            </p>
            <p className="text-xs text-green-700 font-medium mt-3 bg-green-50 rounded-xl py-2 px-4 inline-block">
              Sin registro. Sin apps que instalar. Solo compartir un link.
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Crea tu evento</h3>
            <EventForm
              data={eventForm}
              onChange={setEventForm}
              onNext={() => setStep(1)}
            />
          </div>

          <div className="text-center text-xs text-gray-400">
            Creado por <strong>Gustavo Aguilera P.</strong>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Datos para transferencia</h3>
          <PaymentInfoForm
            data={paymentInfo}
            onChange={setPaymentInfo}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="card mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">Agrega participantes</h3>
            <p className="text-sm text-gray-500 mb-4">Máximo 50 participantes</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}
          <ParticipantsForm
            participants={participants}
            splitMode={eventForm.splitMode as SplitMode}
            totalAmount={Number(eventForm.totalAmount) || 0}
            onChange={setParticipants}
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
            loading={loading}
          />
        </div>
      )}

      {step === 3 && createdEvent && (
        <ShareLinks event={createdEvent} />
      )}
    </Layout>
  )
}
