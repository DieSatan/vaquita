import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Layout from '../components/Shared/Layout'
import EventDashboard from '../components/Dashboard/EventDashboard'
import { api, EventResponse } from '../services/api'

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [codeInput, setCodeInput] = useState('')

  useEffect(() => {
    if (!id) return
    const codeFromUrl = searchParams.get('code')
    const codeFromStorage = localStorage.getItem(`vaquita-admin-${id}`)
    const code = codeFromUrl || codeFromStorage || ''
    setAdminCode(code)
    if (code) loadEvent(id, code)
    else setLoading(false)
  }, [id])  // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvent = useCallback(async (eventId: string, code: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getEvent(eventId, code)
      setEvent(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No autorizado')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => loadEvent(id!, adminCode), [id, adminCode, loadEvent])

  const handleCodeSubmit = () => {
    if (!id || !codeInput.trim()) return
    const code = codeInput.trim().toUpperCase()
    localStorage.setItem(`vaquita-admin-${id}`, code)
    setAdminCode(code)
    loadEvent(id, code)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-4xl animate-spin">🐄</div>
            <p className="text-gray-500 mt-3">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!adminCode || error) {
    return (
      <Layout>
        <div className="card space-y-4">
          <div className="text-center">
            <p className="text-4xl mb-3">🔐</p>
            <h2 className="text-xl font-bold text-gray-900">Ingresa el código de admin</h2>
            <p className="text-gray-500 text-sm mt-1">
              Este código te fue entregado al crear el evento
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <input
            type="text"
            className="input-field text-center tracking-widest text-lg font-mono uppercase"
            placeholder="ABCD1234"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
            maxLength={8}
          />
          <button
            className="btn-primary w-full"
            onClick={handleCodeSubmit}
            disabled={!codeInput.trim()}
          >
            Acceder al dashboard
          </button>
        </div>
      </Layout>
    )
  }

  if (!event) return null

  return (
    <Layout>
      <EventDashboard
        event={event}
        adminCode={adminCode}
        onRefresh={handleRefresh}
      />
    </Layout>
  )
}
