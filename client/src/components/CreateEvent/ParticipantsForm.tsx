import { SplitMode } from '../../services/api'

interface ParticipantInput {
  name: string
  phone: string
  amount: string
}

interface ParticipantsFormProps {
  participants: ParticipantInput[]
  splitMode: SplitMode
  totalAmount: number
  onChange: (participants: ParticipantInput[]) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function ParticipantsForm({
  participants, splitMode, totalAmount, onChange, onSubmit, onBack, loading
}: ParticipantsFormProps) {
  const perPerson = participants.length > 0 && splitMode === 'Even'
    ? Math.round(totalAmount / participants.length)
    : 0

  const customTotal = participants.reduce((s, p) => s + Number(p.amount || 0), 0)
  const customValid = splitMode !== 'Custom' || Math.abs(customTotal - totalAmount) < 1

  const addParticipant = () => {
    if (participants.length >= 50) return
    onChange([...participants, { name: '', phone: '', amount: '' }])
  }

  const removeParticipant = (idx: number) => {
    if (participants.length <= 1) return
    onChange(participants.filter((_, i) => i !== idx))
  }

  const updateParticipant = (idx: number, field: keyof ParticipantInput, value: string) => {
    onChange(participants.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  const allNamed = participants.every(p => p.name.trim())
  const valid = allNamed && customValid

  return (
    <div className="space-y-4">
      {splitMode === 'Even' && participants.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-sm text-green-700">
            Cada uno paga <strong>{formatCLP(perPerson)}</strong>
            {' '}({participants.length} personas, total {formatCLP(totalAmount)})
          </p>
        </div>
      )}

      {splitMode === 'Custom' && (
        <div className={`border rounded-xl p-3 text-center text-sm ${
          customValid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          Asignado: {formatCLP(customTotal)} / Total: {formatCLP(totalAmount)}
          {!customValid && ' — Los montos no coinciden'}
        </div>
      )}

      <div className="space-y-3">
        {participants.map((p, idx) => (
          <div key={idx} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Participante {idx + 1}</span>
              {participants.length > 1 && (
                <button
                  onClick={() => removeParticipant(idx)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Eliminar
                </button>
              )}
            </div>

            <div>
              <label className="label">Nombre *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Juan García"
                value={p.name}
                onChange={e => updateParticipant(idx, 'name', e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="label">Teléfono (opcional, para recordatorio por WhatsApp)</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+56912345678"
                value={p.phone}
                onChange={e => updateParticipant(idx, 'phone', e.target.value)}
                maxLength={20}
              />
            </div>

            {splitMode === 'Custom' && (
              <div>
                <label className="label">Monto a pagar *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min="0"
                  value={p.amount}
                  onChange={e => updateParticipant(idx, 'amount', e.target.value)}
                />
              </div>
            )}

            {splitMode === 'Even' && (
              <p className="text-sm text-gray-500">
                Monto: <strong>{formatCLP(perPerson)}</strong>
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addParticipant}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
        disabled={participants.length >= 50}
      >
        + Agregar participante
      </button>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={onBack} disabled={loading}>
          ← Volver
        </button>
        <button
          className="btn-primary flex-1"
          onClick={onSubmit}
          disabled={!valid || loading}
        >
          {loading ? 'Creando...' : '🎉 Crear evento'}
        </button>
      </div>
    </div>
  )
}

export type { ParticipantInput }
