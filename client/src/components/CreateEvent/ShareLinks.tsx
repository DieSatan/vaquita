import { useState } from 'react'
import { EventResponse } from '../../services/api'
import QRCode from '../Shared/QRCode'
import CopyButton from '../ParticipantView/CopyButton'

interface ShareLinksProps {
  event: EventResponse
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

function getBaseUrl() {
  return window.location.origin
}

export default function ShareLinks({ event }: ShareLinksProps) {
  const [openQR, setOpenQR] = useState<string | null>(null)
  const dashboardUrl = `${getBaseUrl()}/event/${event.id}`
  const adminCode = event.adminCode ?? ''

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-green-800 mb-1">🎉 ¡Evento creado!</h3>
        <p className="text-green-700 text-sm mb-4">
          Comparte los links individuales con cada participante.
        </p>

        <div className="bg-white border border-green-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="label text-green-800">Tu link de organizador</p>
            <p className="text-sm font-mono break-all text-gray-700">{dashboardUrl}</p>
            <CopyButton text={dashboardUrl} label="Copiar link" className="mt-1" />
          </div>

          <div className="bg-red-50 border border-red-300 rounded-lg p-3">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
              ⚠️ GUARDA ESTE CÓDIGO — NO LO PIERDAS
            </p>
            <p className="text-lg font-mono font-bold text-red-800 tracking-widest">{adminCode}</p>
            <CopyButton text={adminCode} label="Copiar código" className="mt-1" />
            <p className="text-xs text-red-600 mt-2">
              Necesitas este código para administrar el evento. Si lo pierdes, no podrás acceder al dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Links individuales</h3>
        {event.participants.map(p => {
          const payUrl = `${getBaseUrl()}/pay/${p.uniqueToken}`
          const whatsappMsg = p.phone
            ? `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${p.name}! Pasa por aquí para ver tu deuda en ${event.eventName}: ${payUrl}`)}`
            : null

          return (
            <div key={p.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-sm text-green-700 font-medium">{formatCLP(p.amount)}</p>
                </div>
                <button
                  onClick={() => setOpenQR(openQR === p.id ? null : p.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {openQR === p.id ? '↑ Cerrar QR' : '📱 Ver QR'}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <CopyButton text={payUrl} label="Copiar link" />
                {whatsappMsg && (
                  <a
                    href={whatsappMsg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 font-medium hover:text-green-900"
                  >
                    📲 Enviar por WhatsApp
                  </a>
                )}
              </div>

              {openQR === p.id && (
                <div className="border-t border-gray-100 pt-3">
                  <QRCode url={payUrl} size={160} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <a
        href={`${dashboardUrl}?code=${adminCode}`}
        className="btn-primary w-full block text-center"
      >
        Ir al Dashboard →
      </a>
    </div>
  )
}
