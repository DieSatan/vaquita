import { PaymentInfoDto } from '../../services/api'
import CopyButton from './CopyButton'

interface PaymentDetailsProps {
  paymentInfo: PaymentInfoDto
  amount: number
  eventName: string
}

interface FieldRowProps {
  label: string
  value: string
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
      <CopyButton text={value} />
    </div>
  )
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function PaymentDetails({ paymentInfo, amount, eventName }: PaymentDetailsProps) {
  const copyAll = () => {
    const text = [
      `Evento: ${eventName}`,
      `Monto: ${formatCLP(amount)}`,
      `Banco: ${paymentInfo.bankName}`,
      `Tipo de cuenta: ${paymentInfo.accountType}`,
      `N° de cuenta: ${paymentInfo.accountNumber}`,
      `RUT: ${paymentInfo.rut}`,
      `Nombre: ${paymentInfo.holderName}`,
      `Email: ${paymentInfo.email}`,
    ].join('\n')
    return text
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-green-700 font-medium">Tu parte es</p>
        <p className="text-4xl font-bold text-green-700 mt-1">{formatCLP(amount)}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Datos para transferir</h3>
          <CopyButton text={copyAll()} label="Copiar todo" />
        </div>

        <div className="divide-y divide-gray-100">
          <FieldRow label="Banco" value={paymentInfo.bankName} />
          <FieldRow label="Tipo de cuenta" value={paymentInfo.accountType} />
          <FieldRow label="N° de cuenta" value={paymentInfo.accountNumber} />
          <FieldRow label="RUT" value={paymentInfo.rut} />
          <FieldRow label="Nombre titular" value={paymentInfo.holderName} />
          <FieldRow label="Email" value={paymentInfo.email} />
          <FieldRow label="Monto" value={formatCLP(amount)} />
        </div>
      </div>
    </div>
  )
}
