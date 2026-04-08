import { SplitMode } from '../../services/api'

interface EventFormData {
  eventName: string
  organizerName: string
  splitMode: SplitMode
  totalAmount: string
  tipPercentage: string
}

interface EventFormProps {
  data: EventFormData
  onChange: (data: EventFormData) => void
  onNext: () => void
}

const splitModes: { value: SplitMode; label: string; desc: string; icon: string }[] = [
  { value: 'Even', label: 'Parejo', desc: 'Se divide el total entre todos por igual', icon: '⚖️' },
  { value: 'Custom', label: 'Manual', desc: 'Tú asignas cuánto paga cada uno', icon: '✏️' },
  { value: 'ByConsumption', label: 'Por consumo', desc: 'Cada uno registra lo que pidió', icon: '🍺' },
]

export default function EventForm({ data, onChange, onNext }: EventFormProps) {
  const valid = data.eventName.trim() && data.organizerName.trim() &&
    (data.splitMode === 'ByConsumption' || Number(data.totalAmount) > 0)

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Nombre del evento *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Cumple Pedro, Asado viernes..."
          value={data.eventName}
          onChange={e => onChange({ ...data, eventName: e.target.value })}
          maxLength={100}
        />
      </div>

      <div>
        <label className="label">Tu nombre (organizador) *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Pedro García"
          value={data.organizerName}
          onChange={e => onChange({ ...data, organizerName: e.target.value })}
          maxLength={100}
        />
      </div>

      <div>
        <label className="label">¿Cómo se divide? *</label>
        <div className="grid gap-3 mt-2">
          {splitModes.map(mode => (
            <label
              key={mode.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                data.splitMode === mode.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="splitMode"
                value={mode.value}
                checked={data.splitMode === mode.value}
                onChange={() => onChange({ ...data, splitMode: mode.value })}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <div>
                <p className="font-semibold text-gray-900">{mode.icon} {mode.label}</p>
                <p className="text-sm text-gray-500">{mode.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {data.splitMode !== 'ByConsumption' && (
        <div>
          <label className="label">Total de la cuenta ($ CLP) *</label>
          <input
            type="number"
            className="input-field"
            placeholder="75000"
            min="1"
            value={data.totalAmount}
            onChange={e => onChange({ ...data, totalAmount: e.target.value })}
          />
        </div>
      )}

      {data.splitMode === 'ByConsumption' && (
        <div>
          <label className="label">% de propina (opcional)</label>
          <input
            type="number"
            className="input-field"
            placeholder="10"
            min="0"
            max="50"
            value={data.tipPercentage}
            onChange={e => onChange({ ...data, tipPercentage: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Se puede ajustar al cerrar el registro de consumo
          </p>
        </div>
      )}

      <button
        className="btn-primary w-full"
        onClick={onNext}
        disabled={!valid}
      >
        Continuar →
      </button>
    </div>
  )
}

export type { EventFormData }
