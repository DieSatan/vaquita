import { PaymentInfoDto } from '../../services/api'

interface PaymentInfoFormProps {
  data: PaymentInfoDto
  onChange: (data: PaymentInfoDto) => void
  onNext: () => void
  onBack: () => void
}

const BANKS = [
  'Banco Estado', 'Banco de Chile', 'BCI', 'Santander', 'Itaú', 'Scotiabank',
  'Falabella', 'Ripley', 'Security', 'Consorcio', 'BICE', 'Otro'
]

const ACCOUNT_TYPES = ['Cuenta Vista', 'Cuenta Corriente', 'Cuenta de Ahorro', 'Cuenta RUT']

function isValidRut(rut: string): boolean {
  const clean = rut.replace(/\./g, '').replace(/-/g, '')
  if (!/^\d{7,8}[0-9kK]$/.test(clean)) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1).toUpperCase()
  let sum = 0, mult = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const expected = 11 - (sum % 11)
  const expectedStr = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected)
  return dv === expectedStr
}

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return clean
  const dv = clean.slice(-1)
  const body = clean.slice(0, -1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

export default function PaymentInfoForm({ data, onChange, onNext, onBack }: PaymentInfoFormProps) {
  const rutValid = data.rut === '' || isValidRut(data.rut)
  const valid = data.bankName && data.accountType && data.accountNumber &&
    data.rut && data.holderName && data.email && rutValid

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
        💡 Estos datos serán compartidos con los participantes para que puedan hacer la transferencia.
        Están encriptados en nuestra base de datos.
      </p>

      <div>
        <label className="label">Banco *</label>
        <select
          className="input-field"
          value={data.bankName}
          onChange={e => onChange({ ...data, bankName: e.target.value })}
        >
          <option value="">Selecciona un banco</option>
          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Tipo de cuenta *</label>
        <select
          className="input-field"
          value={data.accountType}
          onChange={e => onChange({ ...data, accountType: e.target.value })}
        >
          <option value="">Selecciona tipo</option>
          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Número de cuenta *</label>
        <input
          type="text"
          className="input-field"
          placeholder="12345678"
          value={data.accountNumber}
          onChange={e => onChange({ ...data, accountNumber: e.target.value })}
          maxLength={30}
        />
      </div>

      <div>
        <label className="label">RUT *</label>
        <input
          type="text"
          className={`input-field ${!rutValid ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
          placeholder="12.345.678-9"
          value={data.rut}
          onChange={e => onChange({ ...data, rut: formatRut(e.target.value) })}
          maxLength={12}
        />
        {!rutValid && <p className="text-red-500 text-xs mt-1">RUT inválido. Formato: 12.345.678-9</p>}
      </div>

      <div>
        <label className="label">Nombre del titular *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Pedro García López"
          value={data.holderName}
          onChange={e => onChange({ ...data, holderName: e.target.value })}
          maxLength={100}
        />
      </div>

      <div>
        <label className="label">Email para la transferencia *</label>
        <input
          type="email"
          className="input-field"
          placeholder="pedro@mail.com"
          value={data.email}
          onChange={e => onChange({ ...data, email: e.target.value })}
          maxLength={100}
        />
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={onBack}>← Volver</button>
        <button className="btn-primary flex-1" onClick={onNext} disabled={!valid}>
          Continuar →
        </button>
      </div>
    </div>
  )
}
