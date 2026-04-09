import { useState } from 'react'
import { api, EventResponse, SplitMode } from '../../services/api'

interface AddParticipantFormProps {
  eventId: string
  adminCode: string
  splitMode: SplitMode
  onAdded: (updated: EventResponse) => void
}

export default function AddParticipantForm({ eventId, adminCode, splitMode, onAdded }: AddParticipantFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const updated = await api.addParticipant(eventId, adminCode, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        amount: Number(amount) || 0,
      })
      onAdded(updated)
      setName('')
      setPhone('')
      setAmount('')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar participante')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        + Agregar participante
      </button>
    )
  }

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
      <h4 className="font-medium text-blue-900 text-sm">Nuevo participante</h4>

      <div>
        <label className="label">Nombre *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre del participante"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
          autoFocus
        />
      </div>

      <div>
        <label className="label">Teléfono (opcional)</label>
        <input
          type="tel"
          className="input-field"
          placeholder="+56912345678"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={20}
        />
      </div>

      {splitMode === 'Custom' && (
        <div>
          <label className="label">Monto a pagar *</label>
          <input
            type="number"
            className="input-field"
            placeholder="15000"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-secondary flex-1 text-sm py-2">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="btn-primary flex-1 text-sm py-2"
        >
          {loading ? 'Agregando...' : '+ Agregar'}
        </button>
      </div>
    </div>
  )
}
