import { useState } from 'react'
import { ConsumptionItemDto } from '../../services/api'

interface ItemListProps {
  items: ConsumptionItemDto[]
  onEdit: (item: ConsumptionItemDto) => void
  onDelete: (itemId: string) => Promise<void>
  participantNames: Record<string, string>
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function ItemList({ items, onEdit, onDelete, participantNames }: ItemListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId)
    try { await onDelete(itemId) }
    finally { setDeletingId(null) }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-3xl mb-2">🍽️</p>
        <p className="text-sm">Aún no has agregado items</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-xl p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{item.description}</p>
            <p className="text-sm text-gray-500">
              {formatCLP(item.unitPrice)}
              {item.quantity > 1 && ` × ${item.quantity}`}
              {' = '}<strong>{formatCLP(item.lineTotal)}</strong>
            </p>
            {item.isShared && item.sharedWithParticipantIds && (
              <p className="text-xs text-blue-600">
                Compartido con: {item.sharedWithParticipantIds.map(id => participantNames[id] ?? 'Desconocido').join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
